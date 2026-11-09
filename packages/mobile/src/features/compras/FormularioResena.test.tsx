import { fireEvent, render, screen } from "@testing-library/react-native"

import { resenarCompra } from "../../services/api"
import { compraDePrueba } from "../../test/compraDePrueba"
import { FormularioResena } from "./FormularioResena"

jest.mock("../../services/api")

beforeEach(() => jest.clearAllMocks())

const compra = compraDePrueba({ estado: "UTILIZADA", acciones: ["resenar"] })

async function completar({
  estrellas,
  texto,
}: {
  estrellas: number | null
  texto: string
}) {
  const onCompraActualizada = jest.fn()
  await render(
    <FormularioResena
      compra={compra}
      onCompraActualizada={onCompraActualizada}
    />,
  )
  if (estrellas) {
    await fireEvent.press(
      screen.getByRole("button", { name: `${estrellas} estrellas` }),
    )
  }
  await fireEvent.changeText(
    screen.getByPlaceholderText("¿Qué te pareció el evento?"),
    texto,
  )
  const enviar = screen.getByRole("button", { name: "Enviar reseña" })
  return { enviar, onCompraActualizada }
}

test.each([
  { caso: "sin estrellas ni texto", estrellas: null, texto: "" },
  { caso: "con estrellas pero sin texto", estrellas: 4, texto: "" },
  { caso: "con estrellas y solo espacios", estrellas: 4, texto: "   " },
  { caso: "con texto pero sin estrellas", estrellas: null, texto: "Bueno" },
])("$caso no se puede enviar", async ({ estrellas, texto }) => {
  const { enviar } = await completar({ estrellas, texto })

  expect(enviar).toBeDisabled()
  await fireEvent.press(enviar)
  expect(resenarCompra).not.toHaveBeenCalled()
})

test("con estrellas y texto manda la reseña y entrega la compra actualizada", async () => {
  const resenada = compraDePrueba({ estado: "UTILIZADA", acciones: [] })
  jest.mocked(resenarCompra).mockResolvedValue(resenada)
  const { enviar, onCompraActualizada } = await completar({
    estrellas: 4,
    texto: " Muy bueno ",
  })

  await fireEvent.press(enviar)

  expect(resenarCompra).toHaveBeenCalledWith("c1", {
    puntuacion: 4,
    detalle: "Muy bueno",
  })
  expect(onCompraActualizada).toHaveBeenCalledWith(resenada)
})
