import { AxiosError, type InternalAxiosRequestConfig } from "axios"

import { crearSesion, obtenerSesion, onSesionVencida, setToken } from "./api"

const mockAdapter = jest.fn()

jest.mock("axios", () => {
  const actual = jest.requireActual("axios")
  return {
    ...actual,
    __esModule: true,
    default: {
      ...actual.default,
      create: (config: object) =>
        actual.default.create({
          ...config,
          adapter: (pedido: unknown) => mockAdapter(pedido),
        }),
    },
  }
})

const usuario = { id: "1", nombre: "Lucía", apellido: "A", email: "l@a.com" }

function responder(status: number, data: unknown) {
  mockAdapter.mockImplementation(async (config: InternalAxiosRequestConfig) => {
    const respuesta = { data, status, statusText: "", headers: {}, config }
    if (status >= 400) {
      throw new AxiosError("falló", "ERR_BAD_REQUEST", config, null, respuesta)
    }
    return respuesta
  })
}

beforeEach(() => {
  mockAdapter.mockReset()
  setToken(null)
  onSesionVencida(null)
})

test("sin token no manda Authorization", async () => {
  responder(200, usuario)
  await obtenerSesion()

  expect(
    mockAdapter.mock.calls[0][0].headers.get("Authorization"),
  ).toBeUndefined()
})

test("con token manda Authorization Bearer", async () => {
  responder(200, usuario)
  setToken("abc")
  await obtenerSesion()

  expect(mockAdapter.mock.calls[0][0].headers.get("Authorization")).toBe(
    "Bearer abc",
  )
})

test("crearSesion pide un token para el usuario elegido", async () => {
  responder(201, { token: "abc", usuario })

  expect(await crearSesion("1")).toEqual({ token: "abc", usuario })
  const pedido = mockAdapter.mock.calls[0][0]
  expect(pedido.url).toBe("/sesiones")
  expect(JSON.parse(pedido.data)).toEqual({ usuarioId: "1" })
})

test("un 401 con sesión avisa que venció y deja de mandar el token", async () => {
  const alVencer = jest.fn()
  onSesionVencida(alVencer)
  setToken("abc")
  responder(401, { message: "La sesión no es válida o venció." })

  await expect(obtenerSesion()).rejects.toThrow()
  expect(alVencer).toHaveBeenCalledTimes(1)

  responder(200, usuario)
  await obtenerSesion()
  expect(
    mockAdapter.mock.calls[1][0].headers.get("Authorization"),
  ).toBeUndefined()
})

test("un 401 sin sesión no avisa nada", async () => {
  const alVencer = jest.fn()
  onSesionVencida(alVencer)
  responder(401, { message: "Falta el token de sesión." })

  await expect(obtenerSesion()).rejects.toThrow()
  expect(alVencer).not.toHaveBeenCalled()
})

test("otros errores no cierran la sesión", async () => {
  const alVencer = jest.fn()
  onSesionVencida(alVencer)
  setToken("abc")
  responder(409, { message: "No quedan entradas." })

  await expect(obtenerSesion()).rejects.toThrow()
  expect(alVencer).not.toHaveBeenCalled()
})
