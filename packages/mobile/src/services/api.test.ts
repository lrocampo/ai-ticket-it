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

test("traduce cada detalle de validación al campo y al problema", () => {
  const error = datosInvalidos(
    {
      expected: "number",
      code: "invalid_type",
      path: ["tiposEntrada", 1, "precio"],
      message: "Invalid input: expected number, received null",
    },
    {
      code: "invalid_format",
      format: "url",
      path: ["multimedia", 0],
      message: "Invalid URL",
    },
    {
      origin: "string",
      code: "too_small",
      minimum: 1,
      path: ["nombre"],
      message: "Too small: expected string to have >=1 characters",
    },
    {
      code: "invalid_format",
      format: "datetime",
      path: ["fecha"],
      message: "Invalid ISO datetime",
    },
    {
      expected: "string",
      code: "invalid_type",
      path: ["categoriaId"],
      message: "Invalid input: expected string, received undefined",
    },
  )

  expect(mensajeDe(error)).toBe(
    "Datos inválidos\n" +
      "Precio del tipo de entrada 2 tiene que ser un número\n" +
      "Imagen 1 tiene que ser una URL http o https\n" +
      "Nombre es obligatorio\n" +
      "Fecha tiene que ser una fecha válida\n" +
      "Categoría es obligatorio",
  )
})

test("un campo o un problema que no conoce lo muestra como viene", () => {
  const error = datosInvalidos(
    {
      code: "too_small",
      origin: "array",
      path: ["tiposEntrada"],
      message: "Too small: expected array to have >=1 items",
    },
    {
      code: "custom",
      path: ["puntuacion"],
      message: "Tiene que estar entre 1 y 5",
    },
  )

  expect(mensajeDe(error)).toBe(
    "Datos inválidos\n" +
      "tiposEntrada: Too small: expected array to have >=1 items\n" +
      "Puntuación: Tiene que estar entre 1 y 5",
  )
})

test("sin respuesta avisa que no hay conexión", () => {
  const config = { headers: new AxiosHeaders() }
  const error = new AxiosError("Network Error", "ERR_NETWORK", config)

  expect(mensajeDe(error)).toBe(
    "No hay conexión con el servidor. Revisá la conexión y volvé a intentar.",
  )
})
