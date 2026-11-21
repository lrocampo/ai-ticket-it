import { fireEvent, render, screen } from "@testing-library/react-native"

import MisCompras from "../../../app/(tabs)/mis-compras"
import { listarMisCompras } from "../../services/api"
import { compraDePrueba } from "../../test/compraDePrueba"

jest.mock("../../services/api")
jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react")
  return {
    router: { push: jest.fn(), navigate: jest.fn() },
    useFocusEffect: (efecto: () => void) => useEffect(efecto, [efecto]),
  }
})

const compras = [
  compraDePrueba({
    id: "1",
    creada: "2026-11-01T10:00:00.000Z",
    evento: { ...compraDePrueba().evento, nombre: "Primera" },
  }),
  compraDePrueba({
    id: "2",
    creada: "2026-11-09T10:00:00.000Z",
    evento: { ...compraDePrueba().evento, nombre: "Última" },
  }),
]

function nombresEnPantalla() {
  return screen
    .getAllByText(/^(Primera|Última)$/)
    .map((texto) => texto.props.children)
}

test("muestra primero la compra más reciente y permite invertir el orden", async () => {
  jest.mocked(listarMisCompras).mockResolvedValue(compras)
  await render(<MisCompras />)
  await screen.findByText("Última")

  expect(nombresEnPantalla()).toEqual(["Última", "Primera"])

  await fireEvent.press(screen.getByRole("button", { name: "Más antiguas" }))

  expect(nombresEnPantalla()).toEqual(["Primera", "Última"])
})

test("sin compras no ofrece ordenar", async () => {
  jest.mocked(listarMisCompras).mockResolvedValue([])
  await render(<MisCompras />)
  await screen.findByText("Todavía no compraste entradas")

  expect(screen.queryByText("Ordenar por")).toBeNull()
})
