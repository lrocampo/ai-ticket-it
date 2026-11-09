import { describe, expect, test } from "@jest/globals"
import { DomainValidationError } from "../../../src/domain/errors/DomainErrors.js"
import { sumarDias } from "../../../src/utils/fechas.js"
import { HOY, evento, tipoEntrada } from "../../fixtures.js"

describe("Evento", () => {
  test("yaOcurrio depende de la hora que se le pasa", () => {
    const recital = evento({ fecha: sumarDias(HOY, 10) })

    expect(recital.yaOcurrio(HOY)).toBe(false)
    expect(recital.yaOcurrio(sumarDias(HOY, 20))).toBe(true)
  })

  test("diasHasta redondea hacia arriba", () => {
    const recital = evento({ fecha: new Date("2026-11-19T20:00:00.000Z") })

    expect(recital.diasHasta(HOY)).toBe(11)
    expect(recital.diasHasta(new Date("2026-11-19T19:00:00.000Z"))).toBe(1)
    expect(recital.diasHasta(new Date("2026-11-20T00:00:00.000Z"))).toBe(0)
  })

  test("precioDesde es el menor precio entre sus tipos", () => {
    const recital = evento({
      tiposEntrada: [
        tipoEntrada({ nombre: "VIP", precio: 5000 }),
        tipoEntrada({ nombre: "Campo", precio: 1500 }),
      ],
    })

    expect(recital.precioDesde()).toBe(1500)
  })

  test("no se crea con fecha pasada ni sin tipos de entrada", () => {
    expect(() => evento({ fecha: sumarDias(HOY, -1) }, HOY)).toThrow(
      DomainValidationError,
    )
    expect(() => evento({ tiposEntrada: [] })).toThrow(DomainValidationError)
  })

  test("los tipos de entrada no pueden repetir nombre", () => {
    expect(() =>
      evento({
        tiposEntrada: [
          tipoEntrada({ nombre: "General" }),
          tipoEntrada({ nombre: "General" }),
        ],
      }),
    ).toThrow(DomainValidationError)
  })
})
