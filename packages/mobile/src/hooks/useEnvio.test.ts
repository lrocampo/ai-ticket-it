import { act, renderHook } from "@testing-library/react-native"
import { AxiosError, AxiosHeaders } from "axios"
import { Alert } from "react-native"

import { useEnvio } from "./useEnvio"

const alerta = jest.spyOn(Alert, "alert").mockImplementation(() => {})

beforeEach(() => alerta.mockClear())

function diferido() {
  let resolver!: () => void
  const promesa = new Promise<void>((resolve) => {
    resolver = resolve
  })
  return { promesa, resolver }
}

test("marca enviando mientras corre el pedido", async () => {
  const pedido = diferido()
  const { result } = await renderHook(() => useEnvio())

  let envio!: Promise<void>
  await act(async () => {
    envio = result.current.enviar("No se pudo", () => pedido.promesa)
  })
  expect(result.current.enviando).toBe(true)

  await act(async () => {
    pedido.resolver()
    await envio
  })
  expect(result.current.enviando).toBe(false)
  expect(alerta).not.toHaveBeenCalled()
})

test("si el pedido falla, muestra el mensaje del servidor", async () => {
  const config = { headers: new AxiosHeaders() }
  const error = new AxiosError(
    "Request failed",
    "ERR_BAD_REQUEST",
    config,
    null,
    {
      data: { message: "No quedan entradas.", details: [] },
      status: 409,
      statusText: "Conflict",
      headers: {},
      config,
    },
  )
  const { result } = await renderHook(() => useEnvio())

  await act(() =>
    result.current.enviar("No se pudo hacer la compra", () =>
      Promise.reject(error),
    ),
  )

  expect(alerta).toHaveBeenCalledWith(
    "No se pudo hacer la compra",
    "No quedan entradas.",
  )
  expect(result.current.enviando).toBe(false)
})
