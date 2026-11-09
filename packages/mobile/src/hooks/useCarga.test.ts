import { act, renderHook, waitFor } from "@testing-library/react-native"
import { AxiosError, AxiosHeaders } from "axios"

import { useCarga } from "./useCarga"

// Fuera de un navegador no hay foco: la pantalla se considera enfocada al montar.
jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react")
  return {
    useFocusEffect: (efecto: () => void) => useEffect(efecto, [efecto]),
  }
})

function errorDelServidor(message: string) {
  const config = { headers: new AxiosHeaders() }
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, null, {
    data: { message },
    status: 404,
    statusText: "Not Found",
    headers: {},
    config,
  })
}

function diferido<T>() {
  let resolver!: (valor: T) => void
  const promesa = new Promise<T>((resolve) => {
    resolver = resolve
  })
  return { promesa, resolver }
}

test("trae los datos al montar", async () => {
  const { result } = await renderHook(() =>
    useCarga(async () => ["a", "b"], []),
  )

  await waitFor(() => expect(result.current.datos).toEqual(["a", "b"]))
  expect(result.current.error).toBeNull()
})

test("sin datos, deja el mensaje del servidor en error", async () => {
  const fn = () => Promise.reject(errorDelServidor("El evento no existe."))
  const { result } = await renderHook(() => useCarga(fn, []))

  await waitFor(() => expect(result.current.error).toBe("El evento no existe."))
  expect(result.current.datos).toBeNull()
})

test("si falla un refresco, conserva los datos y expone el error", async () => {
  const fn = jest
    .fn<Promise<string[]>, []>()
    .mockResolvedValueOnce(["a"])
    .mockRejectedValueOnce(errorDelServidor("Se cayó el servidor."))
  const { result } = await renderHook(() => useCarga(fn, []))
  await waitFor(() => expect(result.current.datos).toEqual(["a"]))

  await act(() => result.current.refrescar())

  expect(result.current.datos).toEqual(["a"])
  expect(result.current.error).toBe("Se cayó el servidor.")
  expect(result.current.refrescando).toBe(false)
})

test("una respuesta vieja no pisa la de los filtros nuevos", async () => {
  const vieja = diferido<string>()
  const nueva = diferido<string>()
  const pedidos: Record<string, Promise<string>> = {
    viejo: vieja.promesa,
    nuevo: nueva.promesa,
  }
  const { result, rerender } = await renderHook(
    ({ filtro }: { filtro: string }) =>
      useCarga(() => pedidos[filtro], [filtro]),
    { initialProps: { filtro: "viejo" } },
  )

  await rerender({ filtro: "nuevo" })
  await act(async () => nueva.resolver("lista nueva"))
  await act(async () => vieja.resolver("lista vieja"))

  expect(result.current.datos).toBe("lista nueva")
})
