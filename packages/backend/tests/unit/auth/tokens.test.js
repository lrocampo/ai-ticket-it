import { describe, expect, test } from "@jest/globals"
import jwt from "jsonwebtoken"
import crearTokens from "../../../src/auth/tokens.js"
import { NoAutenticado } from "../../../src/errors/ApplicationErrors.js"
import { usuario } from "../../fixtures.js"

describe("tokens", () => {
  const tokens = crearTokens({ secreto: "secreto-de-prueba" })
  const ana = Object.assign(usuario("Ana"), { id: "7" })

  test("el token emitido para un usuario devuelve su id al verificarlo", () => {
    expect(tokens.verificar(tokens.emitir(ana))).toBe("7")
  })

  test("un token con otra firma no es válido", () => {
    const ajeno = crearTokens({ secreto: "otro-secreto" }).emitir(ana)

    expect(() => tokens.verificar(ajeno)).toThrow(NoAutenticado)
  })

  test("un token alterado no es válido", () => {
    const [encabezado, , firma] = tokens.emitir(ana).split(".")
    const cuerpo = Buffer.from(JSON.stringify({ sub: "1" })).toString(
      "base64url",
    )

    expect(() => tokens.verificar(`${encabezado}.${cuerpo}.${firma}`)).toThrow(
      NoAutenticado,
    )
  })

  test("un token vencido no es válido", () => {
    const vencido = crearTokens({
      secreto: "secreto-de-prueba",
      expiraEn: -1,
    }).emitir(ana)

    expect(() => tokens.verificar(vencido)).toThrow(NoAutenticado)
  })

  test("un token que no es JWT no es válido", () => {
    expect(() => tokens.verificar("cualquier-cosa")).toThrow(NoAutenticado)
  })

  test("no acepta tokens sin firma", () => {
    const sinFirma = jwt.sign({ sub: "7" }, null, { algorithm: "none" })

    expect(() => tokens.verificar(sinFirma)).toThrow(NoAutenticado)
  })

  test("el token expira a las 8 horas por defecto", () => {
    const { iat, exp } = jwt.decode(tokens.emitir(ana))

    expect(exp - iat).toBe(8 * 60 * 60)
  })
})
