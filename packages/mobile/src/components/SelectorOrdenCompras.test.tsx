import { fireEvent, render, screen } from "@testing-library/react-native"

import { SelectorOrdenCompras } from "./SelectorOrdenCompras"

test("marca el orden elegido y avisa cuando se elige el otro", async () => {
  const onCambio = jest.fn()
  await render(<SelectorOrdenCompras orden="recientes" onCambio={onCambio} />)

  expect(screen.getByText("Ordenar por")).toBeOnTheScreen()
  expect(screen.getByRole("button", { name: "Más recientes" })).toBeSelected()
  expect(
    screen.getByRole("button", { name: "Más antiguas" }),
  ).not.toBeSelected()

  await fireEvent.press(screen.getByRole("button", { name: "Más antiguas" }))

  expect(onCambio).toHaveBeenCalledWith("antiguas")
})
