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

test("agrega cada detalle de validación con su campo", () => {
  const error = respuestaDelServidor(400, {
    message: "Datos inválidos",
    details: [
      {
        code: "invalid_type",
        path: ["tiposEntrada", 0, "precio"],
        message: "Invalid input: expected number, received null",
      },
      {
        code: "invalid_format",
        path: ["multimedia", 0],
        message: "Invalid URL",
      },
    ],
  })

  expect(mensajeDe(error)).toBe(
    "Datos inválidos\n" +
      "tiposEntrada.0.precio: Invalid input: expected number, received null\n" +
      "multimedia.0: Invalid URL",
  )
})

test("sin respuesta avisa que no hay conexión", () => {
  const config = { headers: new AxiosHeaders() }
  const error = new AxiosError("Network Error", "ERR_NETWORK", config)

  expect(mensajeDe(error)).toBe("No pudimos conectarnos con el servidor.")
})
