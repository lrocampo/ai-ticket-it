import { act, render, screen } from "@testing-library/react-native"
import * as SecureStore from "expo-secure-store"
import { Text } from "react-native"

import {
  crearSesion,
  obtenerSesion,
  onSesionVencida,
  setToken,
} from "../services/api"
import type { Usuario } from "../types"
import { UsuarioProvider, useUsuario } from "./UsuarioContext"

jest.mock("expo-secure-store")
jest.mock("../services/api")

const lucia: Usuario = {
  id: "1",
  nombre: "Lucía",
  apellido: "Aguirre",
  email: "lucia@ejemplo.com",
}

let contexto!: ReturnType<typeof useUsuario>

function Sonda() {
  contexto = useUsuario()
  return (
    <Text>
      {contexto.recuperando
        ? "recuperando"
        : (contexto.usuario?.nombre ?? "sin usuario")}
    </Text>
  )
}

const montar = () =>
  render(
    <UsuarioProvider>
      <Sonda />
    </UsuarioProvider>,
  )

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue()
  jest.mocked(SecureStore.setItemAsync).mockResolvedValue()
})

test("sin token guardado queda sin usuario", async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null)
  await montar()

  await screen.findByText("sin usuario")
  expect(obtenerSesion).not.toHaveBeenCalled()
})

test("con token guardado restaura al usuario", async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue("abc")
  jest.mocked(obtenerSesion).mockResolvedValue(lucia)
  await montar()

  await screen.findByText("Lucía")
  expect(setToken).toHaveBeenCalledWith("abc")
})

test("si el token ya no sirve, lo descarta y queda sin usuario", async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue("viejo")
  jest.mocked(obtenerSesion).mockRejectedValue(new Error("401"))
  await montar()

  await screen.findByText("sin usuario")
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("sesion")
  expect(setToken).toHaveBeenLastCalledWith(null)
})

test("si SecureStore falla al leer, no se queda cargando", async () => {
  jest.mocked(SecureStore.getItemAsync).mockRejectedValue(new Error("falló"))
  await montar()

  await screen.findByText("sin usuario")
})

test("elegir un usuario crea la sesión y guarda el token", async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null)
  jest.mocked(crearSesion).mockResolvedValue({ token: "nuevo", usuario: lucia })
  await montar()
  await screen.findByText("sin usuario")

  await act(() => contexto.elegirUsuario(lucia))

  expect(crearSesion).toHaveBeenCalledWith("1")
  expect(setToken).toHaveBeenLastCalledWith("nuevo")
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith("sesion", "nuevo")
  await screen.findByText("Lucía")
})

test("salir borra el token y el usuario", async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue("abc")
  jest.mocked(obtenerSesion).mockResolvedValue(lucia)
  await montar()
  await screen.findByText("Lucía")

  await act(() => contexto.salir())

  expect(setToken).toHaveBeenLastCalledWith(null)
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("sesion")
  await screen.findByText("sin usuario")
})

test("cuando el backend rechaza el token, vuelve a sin usuario", async () => {
  jest.mocked(SecureStore.getItemAsync).mockResolvedValue("abc")
  jest.mocked(obtenerSesion).mockResolvedValue(lucia)
  await montar()
  await screen.findByText("Lucía")

  const alVencer = jest.mocked(onSesionVencida).mock.calls[0][0]
  await act(async () => alVencer?.())

  await screen.findByText("sin usuario")
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith("sesion")
})
