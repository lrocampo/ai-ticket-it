import { render, screen } from "@testing-library/react-native"

import { compraDePrueba } from "../../test/compraDePrueba"
import { AccionesDeCompra } from "./AccionesDeCompra"

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
