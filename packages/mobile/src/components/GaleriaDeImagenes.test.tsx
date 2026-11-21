import { fireEvent, render, screen } from "@testing-library/react-native"
import { Dimensions } from "react-native"

import { GaleriaDeImagenes } from "./GaleriaDeImagenes"

const urls = [
  "https://ejemplo.com/1.jpg",
  "https://ejemplo.com/2.jpg",
  "https://ejemplo.com/3.jpg",
]

function galeria(imagenes: string[]) {
  return render(<GaleriaDeImagenes urls={imagenes} nombreDelEvento="Recital" />)
}

test("muestra una imagen por URL, cada una con su lugar en la galería", async () => {
  await galeria(urls)

  for (const [i, uri] of urls.entries()) {
    const imagen = screen.getByLabelText(`Imagen ${i + 1} de 3 de Recital`)
    expect(imagen).toHaveProp("source", { uri })
  }
})

test("con varias imágenes indica cuál se está viendo", async () => {
  await galeria(urls)

  expect(screen.getByText("1 / 3")).toBeVisible()
})

test("al deslizar a la segunda página indica 2 / 3", async () => {
  await galeria(urls)
  const { width } = Dimensions.get("window")

  await fireEvent(screen.getByTestId("galeria"), "momentumScrollEnd", {
    nativeEvent: {
      contentOffset: { x: width },
      layoutMeasurement: { width },
      contentSize: { width: width * 3 },
    },
  })

  expect(screen.getByText("2 / 3")).toBeVisible()
  expect(screen.queryByText("1 / 3")).toBeNull()
})

test("con una sola imagen no muestra indicador", async () => {
  await galeria(urls.slice(0, 1))

  expect(screen.getByLabelText("Imagen 1 de 1 de Recital")).toBeVisible()
  expect(screen.queryByText(/ \/ /)).toBeNull()
})

test("sin imágenes no muestra nada", async () => {
  const { toJSON } = await galeria([])

  expect(toJSON()).toBeNull()
})
