import { compraDePrueba } from "../test/compraDePrueba"
import { ordenarCompras } from "./ordenarCompras"

const vieja = compraDePrueba({
  id: "1",
  creada: "2026-11-01T10:00:00.000Z",
})
const media = compraDePrueba({
  id: "2",
  creada: "2026-11-05T10:00:00.000Z",
})
const nueva = compraDePrueba({
  id: "3",
  creada: "2026-11-09T10:00:00.000Z",
})
const compras = [media, nueva, vieja]

const ids = (lista: typeof compras) => lista.map((compra) => compra.id)

test("recientes pone primero la compra creada más tarde", () => {
  expect(ids(ordenarCompras(compras, "recientes"))).toEqual(["3", "2", "1"])
})

test("antiguas pone primero la compra creada antes", () => {
  expect(ids(ordenarCompras(compras, "antiguas"))).toEqual(["1", "2", "3"])
})

test("con la misma fecha desempata por id en el mismo sentido", () => {
  const mismaHora = "2026-11-09T10:00:00.000Z"
  const diez = compraDePrueba({ id: "10", creada: mismaHora })
  const nueve = compraDePrueba({ id: "9", creada: mismaHora })

  expect(ids(ordenarCompras([nueve, diez], "recientes"))).toEqual(["10", "9"])
  expect(ids(ordenarCompras([diez, nueve], "antiguas"))).toEqual(["9", "10"])
})
