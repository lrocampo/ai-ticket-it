import { beforeEach, describe, expect, test } from "@jest/globals"
import EventoService from "../../../src/services/EventoService.js"
import CompraService from "../../../src/services/CompraService.js"
import crearRepositorios from "../../../src/repositories/crearRepositorios.js"
import {
  EntityNotFound,
  NoAutorizado,
} from "../../../src/errors/ApplicationErrors.js"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"
import { sumarDias } from "../../../src/utils/fechas.js"
import { HOY, categoria, usuario } from "../../fixtures.js"

describe("EventoService", () => {
  let repositorios
  let service
  let compras
  let ana
  let beto
  let carla
  let recitales
  let teatro

  const crear = (organizador, datos) =>
    service.crear(
      organizador,
      {
        descripcion: "",
        categoriaId: recitales.id,
        fecha: sumarDias(HOY, 10),
        tiposEntrada: [{ nombre: "General", precio: 1000, cupo: 100 }],
        ...datos,
      },
      HOY,
    )

  const nombres = (eventos) => eventos.map((evento) => evento.nombre)

  beforeEach(() => {
    repositorios = crearRepositorios()
    service = new EventoService(
      repositorios.eventos,
      repositorios.categorias,
      repositorios.compras,
    )
    compras = new CompraService(repositorios.compras, repositorios.eventos)
    ana = repositorios.usuarios.guardar(usuario("Ana"))
    beto = repositorios.usuarios.guardar(usuario("Beto"))
    carla = repositorios.usuarios.guardar(usuario("Carla"))
    recitales = repositorios.categorias.guardar(categoria("Recitales"))
    teatro = repositorios.categorias.guardar(categoria("Teatro"))
  })

  describe("crear", () => {
    test("guarda el evento con el organizador que pide y le da ids a los tipos", () => {
      const evento = crear(ana, {
        nombre: "Recital",
        tiposEntrada: [
          { nombre: "General", precio: 1000, cupo: 100 },
          { nombre: "VIP", precio: 3000, cupo: 10 },
        ],
      })

      expect(evento.organizador).toBe(ana)
      expect(evento.categoria).toBe(recitales)
      expect(evento.tiposEntrada.map((t) => t.id)).toEqual([
        `${evento.id}-1`,
        `${evento.id}-2`,
      ])
      expect(service.porId(evento.id)).toBe(evento)
    })

    test("falla con una categoría inexistente", () => {
      expect(() =>
        crear(ana, { nombre: "Recital", categoriaId: "999" }),
      ).toThrow(EntityNotFound)
    })

    test("falla con fecha pasada sin guardar nada", () => {
      expect(() =>
        crear(ana, { nombre: "Recital", fecha: sumarDias(HOY, -1) }),
      ).toThrow(DomainValidationError)
      expect(service.buscar()).toEqual([])
    })
  })

  describe("buscar", () => {
    beforeEach(() => {
      crear(ana, {
        nombre: "Recital de Fito Páez",
        descripcion: "Piano y canciones",
        fecha: sumarDias(HOY, 30),
        tiposEntrada: [{ nombre: "Campo", precio: 8000, cupo: 10 }],
      })
      crear(beto, {
        nombre: "Obra: La Nona",
        descripcion: "Comedia clásica",
        categoriaId: teatro.id,
        fecha: sumarDias(HOY, 5),
        tiposEntrada: [
          { nombre: "Platea", precio: 5000, cupo: 10 },
          { nombre: "Pullman", precio: 2000, cupo: 10 },
        ],
      })
      crear(carla, {
        nombre: "Jam de jazz",
        descripcion: "Músicos invitados tocan el piano",
        fecha: sumarDias(HOY, 15),
        tiposEntrada: [{ nombre: "General", precio: 3000, cupo: 10 }],
      })
    })

    test("por texto, sin importar tildes ni mayúsculas, en nombre o descripción", () => {
      expect(nombres(service.buscar({ texto: "fito paez" }))).toEqual([
        "Recital de Fito Páez",
      ])
      expect(nombres(service.buscar({ texto: "PIANO" }))).toEqual([
        "Jam de jazz",
        "Recital de Fito Páez",
      ])
      expect(service.buscar({ texto: "ópera" })).toEqual([])
    })

    test("por categoría", () => {
      expect(nombres(service.buscar({ categoriaId: teatro.id }, HOY))).toEqual([
        "Obra: La Nona",
      ])
    })

    test("deja afuera los eventos que ya ocurrieron", () => {
      expect(nombres(service.buscar({}, sumarDias(HOY, 10)))).toEqual([
        "Jam de jazz",
        "Recital de Fito Páez",
      ])
    })

    test("por fecha ascendente por defecto", () => {
      expect(nombres(service.buscar({}, HOY))).toEqual([
        "Obra: La Nona",
        "Jam de jazz",
        "Recital de Fito Páez",
      ])
    })

    test("por precio desde, ascendente", () => {
      expect(nombres(service.buscar({ orden: "precio" }, HOY))).toEqual([
        "Obra: La Nona",
        "Jam de jazz",
        "Recital de Fito Páez",
      ])
    })

    test("por puntaje del organizador, descendente y los null al final", () => {
      const resenar = (comprador, organizador, puntuacion) => {
        const evento = service.misEventos(organizador)[0]
        const compra = compras.crear(
          comprador,
          {
            eventoId: evento.id,
            tipoEntradaId: evento.tiposEntrada[0].id,
            cantidad: 1,
          },
          HOY,
        )
        compras.confirmarPago(comprador, compra.id, HOY)
        compras.utilizar(organizador, compra.id, HOY)
        compras.resenar(
          comprador,
          compra.id,
          { puntuacion, detalle: "ok" },
          HOY,
        )
      }
      resenar(carla, ana, 3)
      resenar(beto, ana, 5)
      resenar(ana, carla, 2)

      expect(nombres(service.buscar({ orden: "puntaje" }, HOY))).toEqual([
        "Recital de Fito Páez",
        "Jam de jazz",
        "Obra: La Nona",
      ])
      expect(service.reputacionDe(ana)).toMatchObject({
        puntaje: 4,
        cantidadResenas: 2,
      })
      expect(service.reputacionDe(beto)).toMatchObject({
        puntaje: null,
        cantidadResenas: 0,
      })
    })
  })

  describe("comprasDelEvento", () => {
    test("solo el organizador las ve", () => {
      const evento = crear(ana, { nombre: "Recital" })
      const compra = compras.crear(
        beto,
        {
          eventoId: evento.id,
          tipoEntradaId: evento.tiposEntrada[0].id,
          cantidad: 2,
        },
        HOY,
      )

      expect(service.comprasDelEvento(ana, evento.id)).toEqual({
        evento,
        compras: [compra],
      })
      expect(() => service.comprasDelEvento(beto, evento.id)).toThrow(
        NoAutorizado,
      )
    })
  })

  describe("entradasDe", () => {
    test("cuenta las entradas que el usuario retiene en el evento", () => {
      const evento = crear(ana, { nombre: "Recital" })
      const comprar = (cantidad) =>
        compras.crear(
          beto,
          {
            eventoId: evento.id,
            tipoEntradaId: evento.tiposEntrada[0].id,
            cantidad,
          },
          HOY,
        )
      comprar(2)
      const cancelada = comprar(1)
      compras.cancelar(beto, cancelada.id, HOY)

      expect(service.entradasDe(beto, evento)).toBe(2)
      expect(service.entradasDe(carla, evento)).toBe(0)
    })
  })

  test("misEventos devuelve solo los que organizo", () => {
    crear(ana, { nombre: "Mío" })
    crear(beto, { nombre: "De otro" })

    expect(nombres(service.misEventos(ana))).toEqual(["Mío"])
  })
})
