import { describe, expect, test } from "@jest/globals"
import TipoEntrada from "../../../src/domain/TipoEntrada.js"
import {
  DomainRuleError,
  DomainValidationError,
} from "../../../src/domain/errors/DomainErrors.js"

describe("TipoEntrada", () => {
  const crear = (cambios = {}) =>
    new TipoEntrada({ nombre: "General", precio: 1000, cupo: 5, ...cambios })

  test("arranca con todo el cupo disponible", () => {
    const tipo = crear()

    expect(tipo.disponibles()).toBe(5)
    expect(tipo.hayCupoPara(5)).toBe(true)
    expect(tipo.hayCupoPara(6)).toBe(false)
  })

  test("reservar descuenta y liberar devuelve", () => {
    const tipo = crear()

    tipo.reservar(3)
    expect(tipo.disponibles()).toBe(2)
    expect(tipo.hayCupoPara(3)).toBe(false)

    tipo.liberar(3)
    expect(tipo.disponibles()).toBe(5)
  })

  test("reservar más del cupo falla y no descuenta", () => {
    const tipo = crear()
    tipo.reservar(4)

    expect(() => tipo.reservar(2)).toThrow(DomainRuleError)
    expect(tipo.disponibles()).toBe(1)
  })

  test("admite precio cero", () => {
    expect(crear({ precio: 0 }).precio).toBe(0)
  })

  test.each([
    ["precio negativo", { precio: -1 }],
    ["cupo cero", { cupo: 0 }],
    ["cupo decimal", { cupo: 2.5 }],
    ["cupo negativo", { cupo: -3 }],
    ["sin nombre", { nombre: " " }],
  ])("rechaza %s", (_caso, cambios) => {
    expect(() => crear(cambios)).toThrow(DomainValidationError)
  })
})
