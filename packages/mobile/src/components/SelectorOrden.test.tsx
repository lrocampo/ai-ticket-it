import { fireEvent, render, screen } from "@testing-library/react-native"

import { SelectorOrden } from "./SelectorOrden"

const opciones = [
  { valor: "a", etiqueta: "Primero" },
  { valor: "b", etiqueta: "Segundo" },
]

test("marca la opción activa y avisa cuando se elige otra", async () => {
  const onCambio = jest.fn()
  await render(
    <SelectorOrden opciones={opciones} orden="a" onCambio={onCambio} />,
  )

  expect(screen.getByRole("button", { name: "Primero" })).toBeSelected()
  expect(screen.getByRole("button", { name: "Segundo" })).not.toBeSelected()

  await fireEvent.press(screen.getByRole("button", { name: "Segundo" }))

  expect(onCambio).toHaveBeenCalledWith("b")
})
