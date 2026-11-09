import { AxiosError, AxiosHeaders } from "axios"

import { mensajeDe } from "./api"

function respuestaDelServidor(status: number, data: unknown) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, null, {
    data,
    status,
    statusText: "",
    headers: {},
    config,
  })
}

test("muestra el mensaje del servidor", () => {
  const error = respuestaDelServidor(409, {
    message: "No quedan entradas.",
    details: [],
  })

  expect(mensajeDe(error)).toBe("No quedan entradas.")
})

function datosInvalidos(...details: unknown[]) {
  return respuestaDelServidor(400, { message: "Datos inválidos", details })
}

test("muestra cada detalle de validación debajo del mensaje", () => {
  const error = datosInvalidos(
    {
      path: ["tiposEntrada", 1, "precio"],
      message: "El precio tiene que ser un número",
    },
    { path: ["nombre"], message: "El nombre no puede estar vacío" },
    { path: [], message: "No se esperaba el campo otro" },
  )

  expect(mensajeDe(error)).toBe(
    "Datos inválidos\n" +
      "tiposEntrada.1.precio: El precio tiene que ser un número\n" +
      "nombre: El nombre no puede estar vacío\n" +
      "No se esperaba el campo otro",
  )
})

test("sin respuesta avisa que no hay conexión", () => {
  const config = { headers: new AxiosHeaders() }
  const error = new AxiosError("Network Error", "ERR_NETWORK", config)

  expect(mensajeDe(error)).toBe(
    "No hay conexión con el servidor. Revisá la conexión y volvé a intentar.",
  )
})
