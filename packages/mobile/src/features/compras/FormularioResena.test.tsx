import { fireEvent, render, screen } from "@testing-library/react-native"

import { compraDePrueba } from "../../test/compraDePrueba"
import { FormularioResena } from "./FormularioResena"

async function renderizarFormulario() {
  const compra = compraDePrueba({ estado: "UTILIZADA", acciones: ["resenar"] })
  await render(
    <FormularioResena compra={compra} onCompraActualizada={jest.fn()} />,
  )
  return screen.getByRole("button", { name: "Enviar reseña" })
}

test("sin estrellas ni texto no se puede enviar", async () => {
  const enviar = await renderizarFormulario()

  expect(enviar).toBeDisabled()
})

test("con estrellas pero sin texto no se puede enviar", async () => {
  const enviar = await renderizarFormulario()

  await fireEvent.press(screen.getByRole("button", { name: "4 estrellas" }))

  expect(enviar).toBeDisabled()
})

test("con texto pero sin estrellas no se puede enviar", async () => {
  const enviar = await renderizarFormulario()

  await fireEvent.changeText(
    screen.getByPlaceholderText("¿Qué te pareció el evento?"),
    "Muy bueno",
  )

  expect(enviar).toBeDisabled()
})

test("con estrellas y texto se puede enviar", async () => {
  const enviar = await renderizarFormulario()

  await fireEvent.press(screen.getByRole("button", { name: "4 estrellas" }))
  await fireEvent.changeText(
    screen.getByPlaceholderText("¿Qué te pareció el evento?"),
    "Muy bueno",
  )

  expect(enviar).toBeEnabled()
})
