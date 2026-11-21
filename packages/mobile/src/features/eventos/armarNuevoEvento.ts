import type { NuevoEvento } from "../../types"

export type TipoEntradaFormulario = {
  nombre: string
  descripcion: string
  precio: string
  cupo: string
}

export type ImagenFormulario = {
  id: number
  url: string
}

export type FormularioEvento = {
  nombre: string
  descripcion: string
  categoriaId: string | null
  fecha: Date
  imagenes: ImagenFormulario[]
  limitePorUsuario: string
  tiposEntrada: TipoEntradaFormulario[]
}

export type CampoDelEvento = Exclude<
  keyof FormularioEvento,
  "tiposEntrada" | "imagenes"
>

export type ErrorDelTipo = {
  campo: "tipo"
  indice: number
  campoDelTipo: keyof TipoEntradaFormulario
  mensaje: string
}

export type ErrorDeImagen = {
  campo: "imagen"
  indice: number
  mensaje: string
}

export type ErrorDelFormulario =
  | { campo: CampoDelEvento; mensaje: string }
  | ErrorDelTipo
  | ErrorDeImagen

export const TIPO_VACIO: TipoEntradaFormulario = {
  nombre: "",
  descripcion: "",
  precio: "",
  cupo: "",
}

let ultimoIdDeImagen = 0

export function imagenVacia(): ImagenFormulario {
  ultimoIdDeImagen += 1
  return { id: ultimoIdDeImagen, url: "" }
}

const NOMBRE_SUGERIDO = "General"
const LIMITE_POR_USUARIO_POR_DEFECTO = 6

export function formularioVacio(): FormularioEvento {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + 1)
  fecha.setHours(21, 0, 0, 0)
  return {
    nombre: "",
    descripcion: "",
    categoriaId: null,
    fecha,
    imagenes: [imagenVacia()],
    limitePorUsuario: String(LIMITE_POR_USUARIO_POR_DEFECTO),
    tiposEntrada: [{ ...TIPO_VACIO, nombre: NOMBRE_SUGERIDO }],
  }
}

export function tipoTieneDatos(tipo: TipoEntradaFormulario) {
  const nombre = tipo.nombre.trim()
  return (
    (nombre !== "" && nombre !== NOMBRE_SUGERIDO) ||
    [tipo.descripcion, tipo.precio, tipo.cupo].some(
      (campo) => campo.trim() !== "",
    )
  )
}

export function formularioTieneDatos(formulario: FormularioEvento) {
  const { nombre, descripcion, categoriaId, imagenes, tiposEntrada } =
    formulario
  return (
    [nombre, descripcion, ...imagenes.map((imagen) => imagen.url)].some(
      (campo) => campo.trim() !== "",
    ) ||
    categoriaId !== null ||
    formulario.limitePorUsuario.trim() !==
      String(LIMITE_POR_USUARIO_POR_DEFECTO) ||
    tiposEntrada.some(tipoTieneDatos)
  )
}

function falta(campo: CampoDelEvento, mensaje: string) {
  return { error: { campo, mensaje } }
}

function faltaEnTipo(
  indice: number,
  campoDelTipo: ErrorDelTipo["campoDelTipo"],
  mensaje: string,
): { error: ErrorDelTipo } {
  return { error: { campo: "tipo", indice, campoDelTipo, mensaje } }
}

export function armarNuevoEvento(
  formulario: FormularioEvento,
  ahora = new Date(),
): { evento: NuevoEvento } | { error: ErrorDelFormulario } {
  const { nombre, descripcion, categoriaId, fecha, tiposEntrada } = formulario
  if (nombre.trim() === "") {
    return falta("nombre", "Ponele un nombre al evento.")
  }
  if (descripcion.trim() === "") {
    return falta("descripcion", "Escribí una descripción.")
  }
  if (categoriaId === null) return falta("categoriaId", "Elegí una categoría.")
  if (fecha <= ahora) {
    return falta("fecha", "Elegí una fecha que todavía no pasó.")
  }

  const multimedia: string[] = []
  for (const [indice, imagen] of formulario.imagenes.entries()) {
    const url = imagen.url.trim()
    if (url === "") continue
    if (!/^https?:\/\/\S+$/i.test(url)) {
      return {
        error: {
          campo: "imagen",
          indice,
          mensaje:
            "La URL de la imagen tiene que empezar con http:// o https://.",
        },
      }
    }
    multimedia.push(url)
  }

  const limitePorUsuario = aEntero(formulario.limitePorUsuario)
  if (limitePorUsuario === null) {
    return falta(
      "limitePorUsuario",
      errorDeNumero("limitePorUsuario", formulario.limitePorUsuario),
    )
  }

  const tipos: NuevoEvento["tiposEntrada"] = []
  for (const [indice, tipo] of tiposEntrada.entries()) {
    const nombreTipo = tipo.nombre.trim()
    if (nombreTipo === "") {
      return faltaEnTipo(
        indice,
        "nombre",
        "Ponele un nombre a este tipo de entrada.",
      )
    }
    const precio = aNumero(tipo.precio)
    if (precio === null) {
      return faltaEnTipo(indice, "precio", errorDeNumero("precio", tipo.precio))
    }
    const cupo = aNumero(tipo.cupo)
    if (cupo === null) {
      return faltaEnTipo(indice, "cupo", errorDeNumero("cupo", tipo.cupo))
    }
    tipos.push({
      nombre: nombreTipo,
      descripcion: tipo.descripcion.trim(),
      precio,
      cupo,
    })
  }

  return {
    evento: {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoriaId,
      fecha: fecha.toISOString(),
      multimedia,
      limitePorUsuario,
      tiposEntrada: tipos,
    },
  }
}

// En Argentina el punto separa miles, así que "15.000" es ambiguo: antes que
// adivinar, solo se acepta un separador decimal con hasta dos decimales.
function aNumero(texto: string): number | null {
  const limpio = texto.trim()
  if (!/^\d+([.,]\d{1,2})?$/.test(limpio)) return null
  return Number(limpio.replace(",", "."))
}

function aEntero(texto: string): number | null {
  const limpio = texto.trim()
  return /^[1-9]\d*$/.test(limpio) ? Number(limpio) : null
}

const SIN_PUNTOS_DE_MILES =
  "No es un número válido. Escribilo sin puntos de miles"

const CAMPOS_NUMERICOS = {
  precio: {
    nombre: "precio",
    invalido: `${SIN_PUNTOS_DE_MILES}, por ejemplo 15000 o 1500,50.`,
  },
  cupo: {
    nombre: "cupo",
    invalido: `${SIN_PUNTOS_DE_MILES}, por ejemplo 200.`,
  },
  limitePorUsuario: {
    nombre: "máximo de entradas por persona",
    invalido: `Tiene que ser un número entero de 1 en adelante, por ejemplo ${LIMITE_POR_USUARIO_POR_DEFECTO}.`,
  },
}

function errorDeNumero(campo: keyof typeof CAMPOS_NUMERICOS, texto: string) {
  const { nombre, invalido } = CAMPOS_NUMERICOS[campo]
  return texto.trim() === "" ? `Completá el ${nombre}.` : invalido
}
