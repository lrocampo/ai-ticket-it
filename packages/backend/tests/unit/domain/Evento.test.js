import { describe, expect, test } from "@jest/globals"
import {
  DomainRuleError,
  DomainValidationError,
} from "../../../src/domain/errors/DomainErrors.js"
import { LIMITE_POR_USUARIO_POR_DEFECTO } from "../../../src/domain/Evento.js"
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

  test("los tipos de entrada no pueden repetir nombre, ni cambiando mayúsculas o espacios", () => {
    expect(() =>
      evento({
        tiposEntrada: [
          tipoEntrada({ nombre: "General" }),
          tipoEntrada({ nombre: "General" }),
        ],
      }),
    ).toThrow(DomainValidationError)
    expect(() =>
      evento({
        tiposEntrada: [
          tipoEntrada({ nombre: "General" }),
          tipoEntrada({ nombre: " general " }),
        ],
      }),
    ).toThrow(DomainValidationError)
  })

  describe("límite de entradas por usuario", () => {
    test("por defecto es 6", () => {
      expect(LIMITE_POR_USUARIO_POR_DEFECTO).toBe(6)
      expect(evento().limitePorUsuario).toBe(6)
    })

    test("el organizador puede fijar otro", () => {
      expect(evento({ limitePorUsuario: 2 }).limitePorUsuario).toBe(2)
    })

    test.each([0, -1, 1.5, "4", null, Number.NaN, 1e300])(
      "rechaza el límite %p",
      (limitePorUsuario) => {
        expect(() => evento({ limitePorUsuario })).toThrow(
          DomainValidationError,
        )
      },
    )

    test("entradasRestantesPara descuenta lo que ya tiene y no baja de cero", () => {
      const recital = evento({ limitePorUsuario: 4 })

      expect(recital.entradasRestantesPara(0)).toBe(4)
      expect(recital.entradasRestantesPara(3)).toBe(1)
      expect(recital.entradasRestantesPara(9)).toBe(0)
    })

    test("verificarLimite deja pasar hasta el límite y rechaza el exceso con un mensaje claro", () => {
      const recital = evento({ limitePorUsuario: 4 })

      expect(() => recital.verificarLimite(4, 0)).not.toThrow()
      expect(() => recital.verificarLimite(1, 3)).not.toThrow()
      expect(() => recital.verificarLimite(5, 0)).toThrow(
        "Hasta 4 entradas por persona para este evento.",
      )
      expect(() => recital.verificarLimite(2, 3)).toThrow(DomainRuleError)
      expect(() => recital.verificarLimite(2, 3)).toThrow(
        "Hasta 4 entradas por persona para este evento: ya tenés 3.",
      )
    })
  })
})
