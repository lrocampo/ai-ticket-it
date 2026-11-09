import { describe, expect, test } from "@jest/globals"
import crearRepositorios from "../../../src/repositories/crearRepositorios.js"
import { usuario } from "../../fixtures.js"

describe("Usuario", () => {
  test("esElMismo compara por id, y sin id nadie es el mismo", () => {
    const { usuarios } = crearRepositorios()
    const ana = usuarios.guardar(usuario("Ana"))
    const beto = usuarios.guardar(usuario("Beto"))

    expect(ana.esElMismo(ana)).toBe(true)
    expect(ana.esElMismo(beto)).toBe(false)
    expect(ana.esElMismo(undefined)).toBe(false)
    expect(usuario("Carla").esElMismo(usuario("Dana"))).toBe(false)
    expect(usuario("Carla").esElMismo(usuario("Carla"))).toBe(false)
  })
})
