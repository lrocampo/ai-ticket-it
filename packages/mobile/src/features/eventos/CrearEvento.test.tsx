import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native"

import CrearEvento from "../../../app/evento/nuevo"
import { crearEvento, listarCategorias } from "../../services/api"

jest.mock("../../services/api")
jest.mock("@react-native-community/datetimepicker", () => () => null)
jest.mock("expo-router", () => {
  const { useEffect } = jest.requireActual("react")
  return {
    router: { back: jest.fn(), replace: jest.fn() },
    Stack: { Screen: () => null },
    useFocusEffect: (efecto: () => void) => useEffect(efecto, [efecto]),
    usePreventRemove: () => jest.fn(),
  }
})

beforeEach(() => {
  jest.clearAllMocks()
  jest
    .mocked(listarCategorias)
    .mockResolvedValue([{ id: "1", nombre: "Música", descripcion: "" }])
})

async function completarElEvento() {
  await render(<CrearEvento />)
  const [nombre] = await screen.findAllByLabelText("Nombre")
  await fireEvent.changeText(nombre, "Recital")
  await fireEvent.changeText(screen.getByLabelText("Descripción"), "Rock")
  await fireEvent.press(screen.getByRole("button", { name: "Música" }))
}

function crear() {
  return fireEvent.press(screen.getByRole("button", { name: "Crear evento" }))
}

function campo(etiqueta: string, indice = 0) {
  return within(screen.getAllByLabelText(etiqueta)[indice].parent!)
}

function textoAntesDelBoton() {
  const textos = screen.getAllByText(/./).map((texto) => texto.props.children)
  return textos[textos.indexOf("Crear evento") - 1]
}

test("el error de un tipo de entrada aparece debajo de su campo y arriba del botón", async () => {
  await completarElEvento()

  await crear()

  expect(campo("Precio").getByText("Completá el precio.")).toBeVisible()
  expect(campo("Cupo").queryByText(/Completá/)).toBeNull()
  expect(textoAntesDelBoton()).toBe("«General»: Completá el precio.")
  expect(crearEvento).not.toHaveBeenCalled()
})

test("el error de un campo del evento aparece debajo de ese campo y arriba del botón", async () => {
  await completarElEvento()
  await fireEvent.changeText(screen.getAllByLabelText("Nombre")[0], " ")

  await crear()

  expect(campo("Nombre").getByText("Ponele un nombre al evento.")).toBeVisible()
  expect(campo("Nombre", 1).queryByText(/Ponele/)).toBeNull()
  expect(textoAntesDelBoton()).toBe("Ponele un nombre al evento.")
  expect(crearEvento).not.toHaveBeenCalled()
})

test("el máximo de entradas por persona arranca en 6 y su error aparece debajo de su campo", async () => {
  await completarElEvento()
  expect(screen.getByLabelText("Máximo de entradas por persona")).toHaveProp(
    "value",
    "6",
  )

  await fireEvent.changeText(
    screen.getByLabelText("Máximo de entradas por persona"),
    "0",
  )
  await crear()

  expect(
    campo("Máximo de entradas por persona").getByText(
      "No es un número válido. Escribilo sin puntos de miles, por ejemplo 6.",
    ),
  ).toBeVisible()
  expect(crearEvento).not.toHaveBeenCalled()
})
