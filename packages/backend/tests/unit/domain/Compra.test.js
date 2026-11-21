import { beforeEach, describe, expect, test } from "@jest/globals"
import Compra from "../../../src/domain/Compra.js"
import { EstadoCompra } from "../../../src/domain/enums/EstadoCompra.js"
import {
  DomainRuleError,
  DomainValidationError,
} from "../../../src/domain/errors/DomainErrors.js"
import crearRepositorios from "../../../src/repositories/crearRepositorios.js"
import { sumarDias } from "../../../src/utils/fechas.js"
import { HOY, evento, usuario } from "../../fixtures.js"

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } =
  EstadoCompra

describe("Compra", () => {
  let comprador
  let organizador
  let tercero
  let recital
  let tipo

  beforeEach(() => {
    const { usuarios } = crearRepositorios()
    comprador = usuarios.guardar(usuario("Compradora"))
    organizador = usuarios.guardar(usuario("Organizador"))
    tercero = usuarios.guardar(usuario("Tercero"))
    recital = evento({ organizador })
    tipo = recital.tiposEntrada[0]
  })

  const comprar = (cantidad = 2) =>
    new Compra({ comprador, evento: recital, tipoEntrada: tipo, cantidad }, HOY)

  const llevarA = {
    [PENDIENTE]: () => comprar(),
    [CONFIRMADA]: () => {
      const compra = comprar()
      compra.confirmarPago(comprador, HOY)
      return compra
    },
    [UTILIZADA]: () => {
      const compra = llevarA[CONFIRMADA]()
      compra.utilizar(organizador, HOY)
      return compra
    },
    [CANCELADA]: () => {
      const compra = llevarA[CONFIRMADA]()
      compra.cancelar(comprador, HOY)
      return compra
    },
    [REEMBOLSADA]: () => {
      const compra = llevarA[CANCELADA]()
      compra.reembolsar(organizador, HOY)
      return compra
    },
  }

  describe("al crearse", () => {
    test("nace PENDIENTE, reserva cupo y calcula el total", () => {
      const compra = comprar(3)

      expect(compra.estado).toBe(PENDIENTE)
      expect(compra.total).toBe(3000)
      expect(tipo.disponibles()).toBe(7)
      expect(compra.historial.map((c) => c.estado)).toEqual([PENDIENTE])
      expect(compra.historial[0].quien).toBe(comprador)
    })

    test.each([0, -1, 1.5, 1e300])("rechaza la cantidad %p", (cantidad) => {
      expect(() => comprar(cantidad)).toThrow(DomainValidationError)
      expect(tipo.disponibles()).toBe(10)
    })

    test("falla sin cupo y no reserva nada", () => {
      recital = evento({ organizador, limitePorUsuario: 20 })
      tipo = recital.tiposEntrada[0]

      expect(() => comprar(11)).toThrow("No hay cupo")
      expect(tipo.disponibles()).toBe(10)
    })

    test("falla si supera el límite por usuario y no reserva cupo", () => {
      expect(() => comprar(7)).toThrow(DomainRuleError)
      expect(() => comprar(7)).toThrow("Hasta 6 entradas por persona")
      expect(tipo.disponibles()).toBe(10)
    })

    test("cuenta las entradas que el comprador ya tenía", () => {
      const compraConPrevias = (cantidad, entradasPrevias) =>
        new Compra(
          {
            comprador,
            evento: recital,
            tipoEntrada: tipo,
            cantidad,
            entradasPrevias,
          },
          HOY,
        )

      expect(() => compraConPrevias(3, 4)).toThrow("ya tenés 4")
      expect(tipo.disponibles()).toBe(10)
      expect(compraConPrevias(2, 4).cantidad).toBe(2)
    })

    test("el límite lo decide cada evento", () => {
      recital = evento({ organizador, limitePorUsuario: 1 })
      tipo = recital.tiposEntrada[0]

      expect(() => comprar(2)).toThrow(DomainRuleError)
      expect(comprar(1).cantidad).toBe(1)
    })

    test("el organizador no puede comprar su propio evento", () => {
      expect(
        () =>
          new Compra(
            {
              comprador: organizador,
              evento: recital,
              tipoEntrada: tipo,
              cantidad: 1,
            },
            HOY,
          ),
      ).toThrow(DomainRuleError)
      expect(tipo.disponibles()).toBe(10)
    })

    test("falla si el evento ya ocurrió", () => {
      expect(
        () =>
          new Compra(
            { comprador, evento: recital, tipoEntrada: tipo, cantidad: 1 },
            sumarDias(HOY, 11),
          ),
      ).toThrow(DomainRuleError)
    })
  })

  describe("retieneEntradas", () => {
    test.each([
      [PENDIENTE, true],
      [CONFIRMADA, true],
      [UTILIZADA, true],
      [CANCELADA, false],
      [REEMBOLSADA, false],
    ])("en %s es %s", (estado, retiene) => {
      expect(llevarA[estado]().retieneEntradas()).toBe(retiene)
    })
  })

  describe("creada", () => {
    test("es la fecha del primer cambio de estado", () => {
      const compra = comprar()
      compra.confirmarPago(comprador, sumarDias(HOY, 1))

      expect(compra.creada).toEqual(HOY)
    })
  })

  describe("transiciones válidas", () => {
    test.each([
      ["confirmarPago", PENDIENTE, CONFIRMADA],
      ["utilizar", CONFIRMADA, UTILIZADA],
      ["cancelar", PENDIENTE, CANCELADA],
      ["cancelar", CONFIRMADA, CANCELADA],
      ["reembolsar", CANCELADA, REEMBOLSADA],
    ])(
      "%s lleva de %s a %s y lo registra en el historial",
      (accion, desde, hacia) => {
        const compra = llevarA[desde]()
        const quien = usuario("Quien")

        compra[accion](quien, sumarDias(HOY, 1))

        expect(compra.estado).toBe(hacia)
        const ultimo = compra.historial.at(-1)
        expect(ultimo.estado).toBe(hacia)
        expect(ultimo.quien).toBe(quien)
        expect(ultimo.fechaHora).toEqual(sumarDias(HOY, 1))
      },
    )

    test("cancelar libera el cupo reservado", () => {
      const compra = llevarA[CONFIRMADA]()
      expect(tipo.disponibles()).toBe(8)

      compra.cancelar(comprador, HOY)

      expect(tipo.disponibles()).toBe(10)
    })
  })

  describe("transiciones inválidas", () => {
    test.each([
      ["confirmarPago", CONFIRMADA],
      ["confirmarPago", UTILIZADA],
      ["confirmarPago", CANCELADA],
      ["confirmarPago", REEMBOLSADA],
      ["utilizar", PENDIENTE],
      ["utilizar", UTILIZADA],
      ["utilizar", CANCELADA],
      ["utilizar", REEMBOLSADA],
      ["cancelar", UTILIZADA],
      ["cancelar", CANCELADA],
      ["cancelar", REEMBOLSADA],
      ["reembolsar", PENDIENTE],
      ["reembolsar", CONFIRMADA],
      ["reembolsar", UTILIZADA],
      ["reembolsar", REEMBOLSADA],
    ])(
      "%s desde %s lanza DomainRuleError y no cambia nada",
      (accion, desde) => {
        const compra = llevarA[desde]()
        const historial = [...compra.historial]
        const disponibles = tipo.disponibles()

        expect(() => compra[accion](comprador, HOY)).toThrow(DomainRuleError)

        expect(compra.estado).toBe(desde)
        expect(compra.historial).toEqual(historial)
        expect(tipo.disponibles()).toBe(disponibles)
      },
    )

    test("no se cancela si el evento ya ocurrió", () => {
      const compra = llevarA[CONFIRMADA]()

      expect(() => compra.cancelar(comprador, sumarDias(HOY, 11))).toThrow(
        DomainRuleError,
      )
      expect(compra.estado).toBe(CONFIRMADA)
      expect(tipo.disponibles()).toBe(8)
    })

    test("no se reembolsa una compra cancelada que nunca se pagó", () => {
      const compra = comprar()
      compra.cancelar(comprador, HOY)

      expect(() => compra.reembolsar(organizador, HOY)).toThrow(DomainRuleError)
      expect(compra.estado).toBe(CANCELADA)
    })
  })

  describe("derivados", () => {
    test("diasParaElEvento solo cuando está CONFIRMADA y el evento no ocurrió", () => {
      expect(comprar().diasParaElEvento(HOY)).toBeNull()
      expect(llevarA[CONFIRMADA]().diasParaElEvento(HOY)).toBe(10)
      expect(llevarA[UTILIZADA]().diasParaElEvento(HOY)).toBeNull()
      expect(
        llevarA[CONFIRMADA]().diasParaElEvento(sumarDias(HOY, 13)),
      ).toBeNull()
    })
  })

  describe("accionesPara", () => {
    test.each([
      [PENDIENTE, ["confirmarPago", "cancelar"], []],
      [CONFIRMADA, ["cancelar"], ["utilizar"]],
      [UTILIZADA, ["resenar"], []],
      [CANCELADA, [], ["reembolsar"]],
      [REEMBOLSADA, [], []],
    ])(
      "en %s el comprador ve %j, el organizador %j y un tercero nada",
      (estado, delComprador, delOrganizador) => {
        const compra = llevarA[estado]()

        expect(compra.accionesPara(comprador, HOY)).toEqual(delComprador)
        expect(compra.accionesPara(organizador, HOY)).toEqual(delOrganizador)
        expect(compra.accionesPara(tercero, HOY)).toEqual([])
      },
    )

    test("cancelar desaparece cuando el evento ya ocurrió", () => {
      const compra = llevarA[CONFIRMADA]()

      expect(compra.accionesPara(comprador, sumarDias(HOY, 11))).toEqual([])
    })

    test("reembolsar aparece solo si la compra pasó por CONFIRMADA", () => {
      const compra = comprar()
      compra.cancelar(comprador, HOY)

      expect(compra.accionesPara(organizador, HOY)).toEqual([])
    })

    test("resenar desaparece después de reseñar", () => {
      const compra = llevarA[UTILIZADA]()
      compra.resenar(4, "Muy bueno", HOY)

      expect(compra.accionesPara(comprador, HOY)).toEqual([])
    })
  })

  describe("motivoDeNoAutorizado", () => {
    test("no tiene motivo cuando pide quien corresponde", () => {
      const compra = comprar()

      expect(compra.motivoDeNoAutorizado(comprador, "cancelar")).toBeNull()
      expect(compra.motivoDeNoAutorizado(organizador, "utilizar")).toBeNull()
    })

    test("explica quién puede cuando pide otro, sin mirar el estado", () => {
      const compra = comprar()

      expect(compra.motivoDeNoAutorizado(tercero, "confirmarPago")).toBe(
        "Solo el comprador puede confirmar el pago de esta compra.",
      )
      expect(compra.motivoDeNoAutorizado(comprador, "utilizar")).toBe(
        "Solo el organizador puede utilizar esta compra.",
      )
    })
  })

  describe("reseña", () => {
    test("solo una compra utilizada puede reseñarse", () => {
      expect(() => comprar().resenar(5, "Genial", HOY)).toThrow(DomainRuleError)
      expect(() => llevarA[CONFIRMADA]().resenar(5, "Genial", HOY)).toThrow(
        DomainRuleError,
      )
    })

    test("crea la reseña con comprador y evento, y después no admite otra", () => {
      const compra = llevarA[UTILIZADA]()

      const resena = compra.resenar(4, "Muy bueno", sumarDias(HOY, 1))

      expect(compra.resena).toBe(resena)
      expect(resena.comprador).toBe(comprador)
      expect(resena.evento).toBe(recital)
      expect(resena.puntuacion).toBe(4)
      expect(() => compra.resenar(5, "Otra vez", sumarDias(HOY, 2))).toThrow(
        DomainRuleError,
      )
      expect(compra.resena).toBe(resena)
    })

    test.each([0, 6, 3.5])("rechaza la puntuación %p", (puntuacion) => {
      const compra = llevarA[UTILIZADA]()

      expect(() => compra.resenar(puntuacion, "Comentario", HOY)).toThrow(
        DomainValidationError,
      )
      expect(compra.resena).toBeNull()
    })

    test.each(["", "   ", undefined])("rechaza el detalle %p", (detalle) => {
      const compra = llevarA[UTILIZADA]()

      expect(() => compra.resenar(4, detalle, HOY)).toThrow(
        DomainValidationError,
      )
      expect(compra.resena).toBeNull()
    })
  })

  describe("mensajes", () => {
    test("comprador y organizador pueden escribir, con id y fecha", () => {
      const compra = comprar()

      compra.enviarMensaje(comprador, "¿Hay estacionamiento?", HOY)
      compra.enviarMensaje(organizador, "Sí, en la esquina.", sumarDias(HOY, 1))

      expect(compra.mensajes.map((m) => [m.id, m.usuario, m.texto])).toEqual([
        ["1", comprador, "¿Hay estacionamiento?"],
        ["2", organizador, "Sí, en la esquina."],
      ])
    })

    test("alguien ajeno a la compra no puede escribir", () => {
      const compra = comprar()

      expect(() => compra.enviarMensaje(usuario("Ajeno"), "Hola", HOY)).toThrow(
        DomainRuleError,
      )
      expect(compra.mensajes).toEqual([])
    })

    test("un mensaje vacío no se guarda", () => {
      const compra = comprar()

      expect(() => compra.enviarMensaje(comprador, "   ", HOY)).toThrow(
        DomainValidationError,
      )
      expect(compra.mensajes).toEqual([])
    })
  })
})
