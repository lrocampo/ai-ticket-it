import { beforeEach, describe, expect, test } from "@jest/globals"
import Compra from "../../../src/domain/Compra.js"
import entradasRetenidas from "../../../src/domain/entradasRetenidas.js"
import crearRepositorios from "../../../src/repositories/crearRepositorios.js"
import { HOY, evento, tipoEntrada, usuario } from "../../fixtures.js"

describe("entradasRetenidas", () => {
  let compradora
  let otra
  let recital
  let otroEvento
  let compras

  beforeEach(() => {
    const { usuarios, eventos } = crearRepositorios()
    compradora = usuarios.guardar(usuario("Compradora"))
    otra = usuarios.guardar(usuario("Otra"))
    const organizador = usuarios.guardar(usuario("Organizador"))
    recital = eventos.guardar(
      evento({
        organizador,
        tiposEntrada: [
          tipoEntrada({ nombre: "General" }),
          tipoEntrada({ nombre: "VIP" }),
        ],
      }),
    )
    otroEvento = eventos.guardar(evento({ organizador }))
    compras = []
  })

  const comprar = (comprador, elEvento, indiceTipo, cantidad) => {
    const compra = new Compra(
      {
        comprador,
        evento: elEvento,
        tipoEntrada: elEvento.tiposEntrada[indiceTipo],
        cantidad,
      },
      HOY,
    )
    compras.push(compra)
    return compra
  }

  test("sin compras es cero", () => {
    expect(entradasRetenidas(compradora, recital, compras)).toBe(0)
  })

  test("suma entradas de todos los tipos del evento", () => {
    comprar(compradora, recital, 0, 2)
    comprar(compradora, recital, 1, 3)

    expect(entradasRetenidas(compradora, recital, compras)).toBe(5)
  })

  test("ignora otros compradores y otros eventos", () => {
    comprar(compradora, recital, 0, 2)
    comprar(otra, recital, 0, 3)
    comprar(compradora, otroEvento, 0, 4)

    expect(entradasRetenidas(compradora, recital, compras)).toBe(2)
  })

  test("no cuenta las compras canceladas ni las reembolsadas", () => {
    const cancelada = comprar(compradora, recital, 0, 2)
    cancelada.cancelar(compradora, HOY)
    const reembolsada = comprar(compradora, recital, 0, 3)
    reembolsada.confirmarPago(compradora, HOY)
    reembolsada.cancelar(compradora, HOY)
    reembolsada.reembolsar(recital.organizador, HOY)
    const pendiente = comprar(compradora, recital, 0, 1)
    const utilizada = comprar(compradora, recital, 0, 1)
    utilizada.confirmarPago(compradora, HOY)
    utilizada.utilizar(recital.organizador, HOY)

    expect(pendiente.retieneEntradas()).toBe(true)
    expect(entradasRetenidas(compradora, recital, compras)).toBe(2)
  })
})
