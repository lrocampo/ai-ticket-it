import type { NuevoEvento } from "../../types"

export type TipoEntradaFormulario = {
  nombre: string
  descripcion: string
  precio: string
  cupo: string
}

export type FormularioEvento = {
  nombre: string
  descripcion: string
  categoriaId: string | null
  fecha: Date
  imagen: string
  limitePorUsuario: string
  tiposEntrada: TipoEntradaFormulario[]
}

export type CampoDelEvento = Exclude<keyof FormularioEvento, "tiposEntrada">

export type ErrorDelTipo = {
  campo: "tipo"
  indice: number
  campoDelTipo: keyof TipoEntradaFormulario
  mensaje: string
}

export type ErrorDelFormulario =
  | { campo: CampoDelEvento; mensaje: string }
  | ErrorDelTipo

export const TIPO_VACIO: TipoEntradaFormulario = {
  nombre: "",
  descripcion: "",
  precio: "",
  cupo: "",
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
    imagen: "",
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
  const { nombre, descripcion, categoriaId, imagen, tiposEntrada } = formulario
  return (
    [nombre, descripcion, imagen].some((campo) => campo.trim() !== "") ||
    categoriaId !== null ||
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
  const imagen = formulario.imagen.trim()
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
  if (imagen !== "" && !/^https?:\/\/\S+$/i.test(imagen)) {
    return falta(
      "imagen",
      "La URL de la imagen tiene que empezar con http:// o https://.",
    )
  }

  const limitePorUsuario = formulario.limitePorUsuario.trim()
  if (limitePorUsuario === "") {
    return falta(
      "limitePorUsuario",
      "Completá el máximo de entradas por persona.",
    )
  }
  if (!/^\d+$/.test(limitePorUsuario) || Number(limitePorUsuario) < 1) {
    return falta(
      "limitePorUsuario",
      "Escribí un número entero de 1 en adelante, por ejemplo 6.",
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
      multimedia: imagen === "" ? [] : [imagen],
      limitePorUsuario: Number(limitePorUsuario),
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

const EJEMPLOS = { precio: "15000 o 1500,50", cupo: "200" }

function errorDeNumero(campo: keyof typeof EJEMPLOS, texto: string) {
  if (texto.trim() === "") return `Completá el ${campo}.`
  return `No es un número válido. Escribilo sin puntos de miles, por ejemplo ${EJEMPLOS[campo]}.`
}
