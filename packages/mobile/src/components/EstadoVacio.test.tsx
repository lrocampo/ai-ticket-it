import { fireEvent, render, screen } from "@testing-library/react-native"

import { EstadoVacio } from "./EstadoVacio"

test("sin acción muestra solo el mensaje", async () => {
  await render(<EstadoVacio mensaje="Todavía nadie compró entradas" />)

  expect(screen.getByText("Todavía nadie compró entradas")).toBeOnTheScreen()
  expect(screen.queryByRole("button")).not.toBeOnTheScreen()
})

test("con acción ofrece un botón que la ejecuta", async () => {
  const onPress = jest.fn()
  await render(
    <EstadoVacio
      mensaje="Todavía no compraste entradas"
      accion={{ etiqueta: "Ver eventos", onPress }}
    />,
  )

  await fireEvent.press(screen.getByRole("button", { name: "Ver eventos" }))

  expect(onPress).toHaveBeenCalled()
})
