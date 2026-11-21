import { compraDePrueba } from "../test/compraDePrueba"
import { ordenarCompras } from "./ordenarCompras"

const vieja = compraDePrueba({
  id: "vieja",
  creada: "2026-11-01T10:00:00.000Z",
})
const media = compraDePrueba({
  id: "media",
  creada: "2026-11-05T10:00:00.000Z",
})
const nueva = compraDePrueba({
  id: "nueva",
  creada: "2026-11-09T10:00:00.000Z",
})
const compras = [media, nueva, vieja]

const ids = (lista: typeof compras) => lista.map((compra) => compra.id)

test("recientes pone primero la compra creada más tarde", () => {
  expect(ids(ordenarCompras(compras, "recientes"))).toEqual([
    "nueva",
    "media",
    "vieja",
  ])
})

test("antiguas pone primero la compra creada antes", () => {
  expect(ids(ordenarCompras(compras, "antiguas"))).toEqual([
    "vieja",
    "media",
    "nueva",
  ])
})

test("no modifica la lista que recibe", () => {
  ordenarCompras(compras, "antiguas")

  expect(ids(compras)).toEqual(["media", "nueva", "vieja"])
})

test("una lista vacía queda vacía", () => {
  expect(ordenarCompras([], "recientes")).toEqual([])
})
