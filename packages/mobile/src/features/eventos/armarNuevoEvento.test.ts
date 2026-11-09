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

test("acepta coma decimal en el precio", () => {
  const resultado = armarNuevoEvento(
    formulario({
      tiposEntrada: [
        { nombre: "VIP", descripcion: "", precio: "1500,50", cupo: "10" },
      ],
    }),
  )

  expect(resultado).toMatchObject({
    evento: { tiposEntrada: [{ precio: 1500.5, cupo: 10 }] },
  })
})

test("un número que no parsea viaja como NaN para que lo rechace el backend", () => {
  const resultado = armarNuevoEvento(
    formulario({
      tiposEntrada: [
        { nombre: "General", descripcion: "", precio: "mil", cupo: "200" },
      ],
    }),
  )

  expect(resultado).toMatchObject({
    evento: { tiposEntrada: [{ precio: NaN }] },
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
