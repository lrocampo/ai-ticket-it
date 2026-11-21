import { fireEvent, render, screen } from "@testing-library/react-native"

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

function verPagina(indice: number) {
  return fireEvent(screen.getByTestId("galeria"), "viewableItemsChanged", {
    viewableItems: [{ index: indice, item: urls[indice], isViewable: true }],
  })
}

test("indica cuál imagen se ve y sigue a la que queda visible", async () => {
  await galeria(urls)
  expect(
    screen.getByText("1 / 3", { includeHiddenElements: true }),
  ).toBeOnTheScreen()

  await verPagina(1)

  expect(
    screen.getByText("2 / 3", { includeHiddenElements: true }),
  ).toBeOnTheScreen()
  expect(
    screen.queryByText("1 / 3", { includeHiddenElements: true }),
  ).toBeNull()
})

test("el indicador no se expone a lectores de pantalla", async () => {
  await galeria(urls)

  expect(screen.queryByText("1 / 3")).toBeNull()
})

test("si una imagen no carga, su página muestra el ícono de sin imagen", async () => {
  await galeria(urls)
  expect(screen.queryByTestId("sin-imagen")).toBeNull()

  await fireEvent(screen.getByLabelText("Imagen 1 de 3 de Recital"), "error")

  expect(screen.getByTestId("sin-imagen")).toBeOnTheScreen()
  expect(screen.getByLabelText("Imagen 1 de 3 de Recital")).toBeOnTheScreen()
  expect(screen.getByLabelText("Imagen 2 de 3 de Recital")).toHaveProp(
    "source",
    { uri: urls[1] },
  )
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
