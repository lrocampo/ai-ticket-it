import { beforeEach, describe, expect, test } from "@jest/globals"
import CompraService from "../../../src/services/CompraService.js"
import crearRepositorios from "../../../src/repositories/crearRepositorios.js"
import {
  EntityNotFound,
  NoAutorizado,
} from "../../../src/errors/ApplicationErrors.js"
import { DomainRuleError } from "../../../src/domain/errors/DomainErrors.js"
import { EstadoCompra } from "../../../src/domain/enums/EstadoCompra.js"
import { HOY, evento, tipoEntrada, usuario } from "../../fixtures.js"

describe("CompraService", () => {
  let repositorios
  let service
  let compradora
  let organizador
  let ajeno
  let recital
  let tipo

  beforeEach(() => {
    repositorios = crearRepositorios()
    service = new CompraService(repositorios.compras, repositorios.eventos)
    compradora = repositorios.usuarios.guardar(usuario("Compradora"))
    organizador = repositorios.usuarios.guardar(usuario("Organizador"))
    ajeno = repositorios.usuarios.guardar(usuario("Ajeno"))
    recital = repositorios.eventos.guardar(
      evento({ organizador, tiposEntrada: [tipoEntrada({ cupo: 5 })] }),
    )
    tipo = recital.tiposEntrada[0]
  })

  const comprar = (cantidad = 2, quien = compradora) =>
    service.crear(
      quien,
      { eventoId: recital.id, tipoEntradaId: tipo.id, cantidad },
      HOY,
    )

  describe("crear", () => {
    test("reserva cupo sobre el mismo evento del catálogo", () => {
      const compra = comprar(2)

      expect(compra.id).toEqual(expect.any(String))
      expect(compra.evento).toBe(recital)
      expect(
        repositorios.eventos.porId(recital.id).tiposEntrada[0].disponibles(),
      ).toBe(3)
      expect(service.mias(compradora)).toEqual([compra])
    })

    test("sin cupo falla y no guarda ni reserva nada", () => {
      expect(() => comprar(6)).toThrow(DomainRuleError)

      expect(tipo.disponibles()).toBe(5)
      expect(service.mias(compradora)).toEqual([])
    })

    test("falla con evento o tipo de entrada inexistentes", () => {
      expect(() =>
        service.crear(compradora, {
          eventoId: "999",
          tipoEntradaId: tipo.id,
          cantidad: 1,
        }),
      ).toThrow(EntityNotFound)
      expect(() =>
        service.crear(compradora, {
          eventoId: recital.id,
          tipoEntradaId: "otro",
          cantidad: 1,
        }),
      ).toThrow(EntityNotFound)
    })
  })

  describe("límite por usuario", () => {
    let concurrido
    const comprarEntradas = (cantidad, quien = compradora) =>
      service.crear(
        quien,
        {
          eventoId: concurrido.id,
          tipoEntradaId: concurrido.tiposEntrada[0].id,
          cantidad,
        },
        HOY,
      )

    beforeEach(() => {
      concurrido = repositorios.eventos.guardar(
        evento({
          organizador,
          limitePorUsuario: 4,
          tiposEntrada: [
            tipoEntrada({ cupo: 50 }),
            tipoEntrada({ nombre: "VIP", cupo: 50 }),
          ],
        }),
      )
    })

    test("dos compras que juntas lo superan: falla la segunda y no reserva", () => {
      comprarEntradas(3)

      expect(() => comprarEntradas(2)).toThrow(DomainRuleError)
      expect(concurrido.tiposEntrada[0].disponibles()).toBe(47)
      expect(service.mias(compradora)).toHaveLength(1)
    })

    test("cuenta todos los tipos de entrada del evento", () => {
      comprarEntradas(3)

      expect(() =>
        service.crear(
          compradora,
          {
            eventoId: concurrido.id,
            tipoEntradaId: concurrido.tiposEntrada[1].id,
            cantidad: 2,
          },
          HOY,
        ),
      ).toThrow(DomainRuleError)
    })

    test("es por usuario", () => {
      comprarEntradas(4)

      expect(comprarEntradas(4, ajeno).cantidad).toBe(4)
    })

    test("después de cancelar, el usuario puede volver a comprar", () => {
      const compra = comprarEntradas(4)
      expect(() => comprarEntradas(1)).toThrow(DomainRuleError)

      service.cancelar(compradora, compra.id, HOY)

      expect(comprarEntradas(4).cantidad).toBe(4)
    })
  })

  test("cancelar libera el cupo en el catálogo", () => {
    const compra = comprar(2)

    service.cancelar(compradora, compra.id, HOY)

    expect(compra.estado).toBe(EstadoCompra.CANCELADA)
    expect(tipo.disponibles()).toBe(5)
  })

  test("porId la ven el comprador y el organizador, nadie más", () => {
    const compra = comprar()

    expect(service.porId(compradora, compra.id)).toBe(compra)
    expect(service.porId(organizador, compra.id)).toBe(compra)
    expect(() => service.porId(ajeno, compra.id)).toThrow(NoAutorizado)
    expect(() => service.porId(compradora, "999")).toThrow(EntityNotFound)
  })

  test("mias devuelve solo las compras del usuario", () => {
    const mia = comprar(1)
    comprar(1, ajeno)

    expect(service.mias(compradora)).toEqual([mia])
  })

  describe("autorización de cada acción", () => {
    const confirmada = () => {
      const compra = comprar()
      service.confirmarPago(compradora, compra.id, HOY)
      return compra
    }
    const cancelada = () => {
      const compra = confirmada()
      service.cancelar(compradora, compra.id, HOY)
      return compra
    }
    const utilizada = () => {
      const compra = confirmada()
      service.utilizar(organizador, compra.id, HOY)
      return compra
    }

    test.each([
      ["confirmarPago", () => comprar(), "compradora"],
      ["cancelar", () => comprar(), "compradora"],
      ["utilizar", confirmada, "organizador"],
      ["reembolsar", cancelada, "organizador"],
    ])("%s solo la puede pedir %s", (accion, preparar, permitido) => {
      const compra = preparar()
      const estado = compra.estado
      const noPermitidos = {
        compradora: [organizador, ajeno],
        organizador: [compradora, ajeno],
      }[permitido]

      for (const quien of noPermitidos) {
        expect(() => service[accion](quien, compra.id, HOY)).toThrow(
          NoAutorizado,
        )
        expect(compra.estado).toBe(estado)
      }

      service[accion]({ compradora, organizador }[permitido], compra.id, HOY)
      expect(compra.estado).not.toBe(estado)
    })

    test("enviarMensaje lo pueden las dos partes y nadie más", () => {
      const compra = comprar()

      service.enviarMensaje(compradora, compra.id, "Hola", HOY)
      service.enviarMensaje(organizador, compra.id, "Hola!", HOY)
      expect(() =>
        service.enviarMensaje(ajeno, compra.id, "Hola", HOY),
      ).toThrow(NoAutorizado)

      expect(compra.mensajes).toHaveLength(2)
    })

    test("resenar solo lo puede el comprador y la reseña queda en la compra", () => {
      const compra = utilizada()
      const resena = { puntuacion: 5, detalle: "Excelente" }

      expect(() =>
        service.resenar(organizador, compra.id, resena, HOY),
      ).toThrow(NoAutorizado)
      expect(() => service.resenar(ajeno, compra.id, resena, HOY)).toThrow(
        NoAutorizado,
      )

      service.resenar(compradora, compra.id, resena, HOY)

      expect(service.porId(compradora, compra.id).resena).toMatchObject({
        ...resena,
        id: compra.id,
        comprador: compradora,
      })
    })
  })
})
