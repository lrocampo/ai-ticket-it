import { fireEvent, render, screen } from "@testing-library/react-native"
import { Alert } from "react-native"

import { cancelarCompra } from "../../services/api"
import { compraDePrueba } from "../../test/compraDePrueba"
import { AccionesDeCompra } from "./AccionesDeCompra"

jest.mock("../../services/api")

beforeEach(() => jest.clearAllMocks())

test("muestra un botón por cada acción que puede hacer el usuario", async () => {
  const compra = compraDePrueba({ acciones: ["confirmarPago", "cancelar"] })

  await render(
    <AccionesDeCompra compra={compra} onCompraActualizada={jest.fn()} />,
  )

  expect(screen.getAllByRole("button")).toHaveLength(2)
  expect(
    screen.getByRole("button", { name: "Confirmar pago" }),
  ).toBeOnTheScreen()
  expect(
    screen.getByRole("button", { name: "Cancelar compra" }),
  ).toBeOnTheScreen()
})

test("sin acciones no muestra botones", async () => {
  const compra = compraDePrueba({ acciones: [] })

  await render(
    <AccionesDeCompra compra={compra} onCompraActualizada={jest.fn()} />,
  )

  expect(screen.queryAllByRole("button")).toHaveLength(0)
})

test("reseñar no es un botón de acción", async () => {
  const compra = compraDePrueba({ estado: "UTILIZADA", acciones: ["resenar"] })

  await render(
    <AccionesDeCompra compra={compra} onCompraActualizada={jest.fn()} />,
  )

  expect(screen.queryAllByRole("button")).toHaveLength(0)
})

test("mientras se confirma una acción no se puede abrir otra", async () => {
  const alerta = jest.spyOn(Alert, "alert").mockImplementation(() => {})
  const compra = compraDePrueba({ acciones: ["confirmarPago", "cancelar"] })
  await render(
    <AccionesDeCompra compra={compra} onCompraActualizada={jest.fn()} />,
  )

  await fireEvent.press(screen.getByRole("button", { name: "Confirmar pago" }))
  await fireEvent.press(screen.getByRole("button", { name: "Cancelar compra" }))

  expect(alerta).toHaveBeenCalledTimes(1)
  expect(screen.getByRole("button", { name: "Cancelar compra" })).toBeDisabled()
  alerta.mockRestore()
})

test("al volver del diálogo los botones se habilitan de nuevo", async () => {
  const alerta = jest
    .spyOn(Alert, "alert")
    .mockImplementation((_titulo, _mensaje, botones) =>
      botones?.find((boton) => boton.text === "Volver")?.onPress?.(),
    )
  const compra = compraDePrueba({ acciones: ["cancelar"] })
  await render(
    <AccionesDeCompra compra={compra} onCompraActualizada={jest.fn()} />,
  )

  await fireEvent.press(screen.getByRole("button", { name: "Cancelar compra" }))

  expect(screen.getByRole("button", { name: "Cancelar compra" })).toBeEnabled()
  expect(cancelarCompra).not.toHaveBeenCalled()
  alerta.mockRestore()
})
