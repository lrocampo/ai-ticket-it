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
      screen.getByRole("radio", { name: `${estrellas} estrellas` }),
    )
  }
  await fireEvent.changeText(
    screen.getByPlaceholderText("¿Qué te pareció el evento?"),
    texto,
  )
  const enviar = screen.getByRole("button", { name: "Enviar reseña" })
  return { enviar, onCompraActualizada }
}

const AYUDA_PUNTUACION = "Elegí una puntuación."
const AYUDA_DETALLE = "Contanos algo del evento."

test.each([
  {
    caso: "sin estrellas ni texto",
    estrellas: null,
    texto: "",
    ayudas: [AYUDA_PUNTUACION, AYUDA_DETALLE],
  },
  {
    caso: "con estrellas pero sin texto",
    estrellas: 4,
    texto: "",
    ayudas: [AYUDA_DETALLE],
  },
  {
    caso: "con estrellas y solo espacios",
    estrellas: 4,
    texto: "   ",
    ayudas: [AYUDA_DETALLE],
  },
  {
    caso: "con texto pero sin estrellas",
    estrellas: null,
    texto: "Bueno",
    ayudas: [AYUDA_PUNTUACION],
  },
])(
  "$caso: al enviar dice qué falta y no manda nada",
  async ({ estrellas, texto, ayudas }) => {
    const { enviar } = await completar({ estrellas, texto })
    expect(screen.queryByText(AYUDA_PUNTUACION)).not.toBeOnTheScreen()
    expect(screen.queryByText(AYUDA_DETALLE)).not.toBeOnTheScreen()

    expect(enviar).toBeEnabled()
    await fireEvent.press(enviar)

    for (const ayuda of [AYUDA_PUNTUACION, AYUDA_DETALLE]) {
      if (ayudas.includes(ayuda)) {
        expect(screen.getByText(ayuda)).toBeOnTheScreen()
      } else {
        expect(screen.queryByText(ayuda)).not.toBeOnTheScreen()
      }
    }
    expect(resenarCompra).not.toHaveBeenCalled()
  },
)

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
