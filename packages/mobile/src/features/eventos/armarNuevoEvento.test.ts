import { armarNuevoEvento, type FormularioEvento } from "./armarNuevoEvento"

const fecha = new Date("2026-12-20T21:00:00.000Z")

function formulario(cambios: Partial<FormularioEvento> = {}): FormularioEvento {
  return {
    nombre: " Recital ",
    descripcion: "Banda en vivo",
    categoriaId: "musica",
    fecha,
    imagen: "",
    tiposEntrada: [
      { nombre: "General", descripcion: "", precio: "15000", cupo: "200" },
    ],
    ...cambios,
  }
}

test("convierte los textos del formulario en el body de POST /eventos", () => {
  const resultado = armarNuevoEvento(
    formulario({ imagen: " https://ejemplo.com/a.jpg " }),
  )

  expect(resultado).toEqual({
    evento: {
      nombre: "Recital",
      descripcion: "Banda en vivo",
      categoriaId: "musica",
      fecha: "2026-12-20T21:00:00.000Z",
      multimedia: ["https://ejemplo.com/a.jpg"],
      tiposEntrada: [
        { nombre: "General", descripcion: "", precio: 15000, cupo: 200 },
      ],
    },
  })
})

test("sin imagen manda multimedia vacío", () => {
  const resultado = armarNuevoEvento(formulario({ imagen: "  " }))

  expect(resultado).toMatchObject({ evento: { multimedia: [] } })
})

function conTipo(precio: string, cupo = "200") {
  return formulario({
    tiposEntrada: [{ nombre: "Platea", descripcion: "", precio, cupo }],
  })
}

test.each([
  ["1500,50", 1500.5],
  ["1500.50", 1500.5],
  ["2,5", 2.5],
  ["0", 0],
  [" 15000 ", 15000],
])("el precio %p se manda como %p", (precio, esperado) => {
  expect(armarNuevoEvento(conTipo(precio))).toMatchObject({
    evento: { tiposEntrada: [{ precio: esperado }] },
  })
})

const precioInvalido = {
  error:
    "El precio de Platea no es un número válido. Escribilo sin puntos de miles, por ejemplo 15000 o 1500,50.",
}

test.each(["15.000", "1,000", "1.000,50", "abc", "-1", "1e3", "1,5,0"])(
  "el precio %p pide corregirlo",
  (precio) => {
    expect(armarNuevoEvento(conTipo(precio))).toEqual(precioInvalido)
  },
)

test("un cupo que no es un número pide corregirlo", () => {
  expect(armarNuevoEvento(conTipo("15000", "doscientos"))).toEqual({
    error:
      "El cupo de Platea no es un número válido. Escribilo sin puntos de miles, por ejemplo 200.",
  })
})

test("un cupo con decimales viaja tal cual para que lo rechace el dominio", () => {
  expect(armarNuevoEvento(conTipo("15000", "2,5"))).toMatchObject({
    evento: { tiposEntrada: [{ cupo: 2.5 }] },
  })
})

test("un precio vacío pide completarlo", () => {
  expect(armarNuevoEvento(conTipo(""))).toEqual({
    error: "Completá nombre, precio y cupo de cada tipo de entrada.",
  })
})

test("pide la categoría si no se eligió", () => {
  expect(armarNuevoEvento(formulario({ categoriaId: null }))).toEqual({
    error: "Elegí una categoría.",
  })
})

test("pide nombre, precio y cupo en cada tipo de entrada", () => {
  const resultado = armarNuevoEvento(
    formulario({
      tiposEntrada: [
        { nombre: "General", descripcion: "", precio: "15000", cupo: "200" },
        { nombre: "VIP", descripcion: "", precio: "", cupo: "20" },
      ],
    }),
  )

  expect(resultado).toEqual({
    error: "Completá nombre, precio y cupo de cada tipo de entrada.",
  })
})
