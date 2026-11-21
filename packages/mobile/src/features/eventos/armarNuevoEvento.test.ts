import {
  armarNuevoEvento,
  type FormularioEvento,
  formularioTieneDatos,
  formularioVacio,
  TIPO_VACIO,
} from "./armarNuevoEvento"

const fecha = new Date("2026-12-20T21:00:00.000Z")

function formulario(cambios: Partial<FormularioEvento> = {}): FormularioEvento {
  return {
    nombre: " Recital ",
    descripcion: "Banda en vivo",
    categoriaId: "musica",
    fecha,
    imagenes: [""],
    limitePorUsuario: "6",
    tiposEntrada: [
      { nombre: "General", descripcion: "", precio: "15000", cupo: "200" },
    ],
    ...cambios,
  }
}

test("convierte los textos del formulario en el body de POST /eventos", () => {
  const resultado = armar(
    formulario({ imagenes: [" https://ejemplo.com/a.jpg "] }),
  )

  expect(resultado).toEqual({
    evento: {
      nombre: "Recital",
      descripcion: "Banda en vivo",
      categoriaId: "musica",
      fecha: "2026-12-20T21:00:00.000Z",
      multimedia: ["https://ejemplo.com/a.jpg"],
      limitePorUsuario: 6,
      tiposEntrada: [
        { nombre: "General", descripcion: "", precio: 15000, cupo: 200 },
      ],
    },
  })
})

test("sin imagen manda multimedia vacío", () => {
  const resultado = armar(formulario({ imagenes: ["  "] }))

  expect(resultado).toMatchObject({ evento: { multimedia: [] } })
})

test("manda las imágenes en el orden del formulario y ignora las filas vacías", () => {
  const resultado = armar(
    formulario({
      imagenes: [
        "https://ejemplo.com/portada.jpg",
        " ",
        " http://ejemplo.com/b.jpg ",
        "",
      ],
    }),
  )

  expect(resultado).toMatchObject({
    evento: {
      multimedia: [
        "https://ejemplo.com/portada.jpg",
        "http://ejemplo.com/b.jpg",
      ],
    },
  })
})

test("una URL inválida señala la fila de esa imagen", () => {
  const resultado = armar(
    formulario({
      imagenes: ["https://ejemplo.com/a.jpg", "ftp://ejemplo.com/b.jpg"],
    }),
  )

  expect(resultado).toEqual({
    error: {
      campo: "imagen",
      indice: 1,
      mensaje: "La URL de la imagen tiene que empezar con http:// o https://.",
    },
  })
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
  expect(armar(conTipo(precio))).toMatchObject({
    evento: { tiposEntrada: [{ precio: esperado }] },
  })
})

const ahora = new Date("2026-11-09T12:00:00.000Z")

function armar(formulario: FormularioEvento) {
  return armarNuevoEvento(formulario, ahora)
}

const precioInvalido = {
  error: {
    campo: "tipo",
    indice: 0,
    campoDelTipo: "precio",
    mensaje:
      "No es un número válido. Escribilo sin puntos de miles, por ejemplo 15000 o 1500,50.",
  },
}

test.each(["15.000", "1,000", "1.000,50", "abc", "-1", "1e3", "1,5,0"])(
  "el precio %p pide corregirlo",
  (precio) => {
    expect(armar(conTipo(precio))).toEqual(precioInvalido)
  },
)

test("un cupo que no es un número pide corregirlo", () => {
  expect(armar(conTipo("15000", "doscientos"))).toEqual({
    error: {
      campo: "tipo",
      indice: 0,
      campoDelTipo: "cupo",
      mensaje:
        "No es un número válido. Escribilo sin puntos de miles, por ejemplo 200.",
    },
  })
})

test("un cupo con decimales viaja tal cual para que lo rechace el dominio", () => {
  expect(armar(conTipo("15000", "2,5"))).toMatchObject({
    evento: { tiposEntrada: [{ cupo: 2.5 }] },
  })
})

test("un precio vacío pide completarlo", () => {
  expect(armar(conTipo(""))).toEqual({
    error: {
      campo: "tipo",
      indice: 0,
      campoDelTipo: "precio",
      mensaje: "Completá el precio.",
    },
  })
})

test.each<[string, Partial<FormularioEvento>, unknown]>([
  ["el nombre", { nombre: "  " }, "nombre"],
  ["la descripción", { descripcion: "" }, "descripcion"],
  ["la categoría", { categoriaId: null }, "categoriaId"],
  ["una fecha que ya pasó", { fecha: ahora }, "fecha"],
])("señala %s como el campo a corregir", (_, cambios, campo) => {
  expect(armar(formulario(cambios))).toMatchObject({ error: { campo } })
})

test("señala el tipo de entrada y el campo que falta", () => {
  const resultado = armar(
    formulario({
      tiposEntrada: [
        { nombre: "General", descripcion: "", precio: "15000", cupo: "200" },
        { nombre: "VIP", descripcion: "", precio: "", cupo: "20" },
        { nombre: "", descripcion: "", precio: "", cupo: "" },
      ],
    }),
  )

  expect(resultado).toEqual({
    error: {
      campo: "tipo",
      indice: 1,
      campoDelTipo: "precio",
      mensaje: "Completá el precio.",
    },
  })
})

test("un tipo sin nombre pide ponerle uno", () => {
  const resultado = armar(
    formulario({
      tiposEntrada: [{ nombre: " ", descripcion: "", precio: "1", cupo: "1" }],
    }),
  )

  expect(resultado).toEqual({
    error: {
      campo: "tipo",
      indice: 0,
      campoDelTipo: "nombre",
      mensaje: "Ponele un nombre a este tipo de entrada.",
    },
  })
})

test("el formulario recién abierto no tiene nada que descartar", () => {
  const vacio = formularioVacio()

  expect(formularioTieneDatos(vacio)).toBe(false)
  expect(
    formularioTieneDatos({
      ...vacio,
      tiposEntrada: [...vacio.tiposEntrada, TIPO_VACIO],
    }),
  ).toBe(false)
})

test.each<[string, Partial<FormularioEvento>]>([
  ["un nombre", { nombre: "Recital" }],
  ["una categoría", { categoriaId: "musica" }],
  ["una URL", { imagenes: ["https://"] }],
  ["una URL en la segunda fila", { imagenes: ["", "https://"] }],
  ["otro máximo por persona", { limitePorUsuario: "2" }],
  [
    "un precio en un tipo",
    { tiposEntrada: [{ ...TIPO_VACIO, nombre: "General", precio: "100" }] },
  ],
  ["un tipo renombrado", { tiposEntrada: [{ ...TIPO_VACIO, nombre: "VIP" }] }],
])("con %s hay algo que descartar", (_, cambios) => {
  expect(formularioTieneDatos({ ...formularioVacio(), ...cambios })).toBe(true)
})

test("el máximo de entradas por persona arranca en 6 y viaja como número", () => {
  expect(formularioVacio().limitePorUsuario).toBe("6")
  expect(armar(formulario({ limitePorUsuario: " 4 " }))).toMatchObject({
    evento: { limitePorUsuario: 4 },
  })
})

const SIN_NUMERO =
  "Tiene que ser un número entero de 1 en adelante, por ejemplo 6."

test.each([
  ["", "Completá el máximo de entradas por persona."],
  ["0", SIN_NUMERO],
  ["2,5", SIN_NUMERO],
  ["-3", SIN_NUMERO],
  ["seis", SIN_NUMERO],
])("el máximo por persona %p se corrige en su campo", (valor, mensaje) => {
  expect(armar(formulario({ limitePorUsuario: valor }))).toEqual({
    error: { campo: "limitePorUsuario", mensaje },
  })
})
