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
  tiposEntrada: TipoEntradaFormulario[]
}

export const TIPO_VACIO: TipoEntradaFormulario = {
  nombre: "",
  descripcion: "",
  precio: "",
  cupo: "",
}

const NOMBRE_SUGERIDO = "General"

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

export function armarNuevoEvento(
  formulario: FormularioEvento,
): { evento: NuevoEvento } | { error: string } {
  const { nombre, descripcion, categoriaId, fecha, imagen, tiposEntrada } =
    formulario
  if (nombre.trim() === "") return { error: "Ponele un nombre al evento." }
  if (descripcion.trim() === "") return { error: "Escribí una descripción." }
  if (categoriaId === null) return { error: "Elegí una categoría." }
  if (tiposEntrada.length === 0 || !tiposEntrada.every(estaCompleto)) {
    return {
      error: "Completá nombre, precio y cupo de cada tipo de entrada.",
    }
  }

  const tipos: NuevoEvento["tiposEntrada"] = []
  for (const tipo of tiposEntrada) {
    const nombreTipo = tipo.nombre.trim()
    const precio = aNumero(tipo.precio)
    if (precio === null) return { error: noEsNumero("precio", nombreTipo) }
    const cupo = aNumero(tipo.cupo)
    if (cupo === null) return { error: noEsNumero("cupo", nombreTipo) }
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
      multimedia: imagen.trim() === "" ? [] : [imagen.trim()],
      tiposEntrada: tipos,
    },
  }
}

function estaCompleto(tipo: TipoEntradaFormulario) {
  return [tipo.nombre, tipo.precio, tipo.cupo].every(
    (campo) => campo.trim() !== "",
  )
}

// En Argentina el punto separa miles, así que "15.000" es ambiguo: antes que
// adivinar, solo se acepta un separador decimal con hasta dos decimales.
function aNumero(texto: string): number | null {
  const limpio = texto.trim()
  if (!/^\d+([.,]\d{1,2})?$/.test(limpio)) return null
  return Number(limpio.replace(",", "."))
}

const EJEMPLOS = { precio: "15000 o 1500,50", cupo: "200" }

function noEsNumero(campo: keyof typeof EJEMPLOS, tipo: string) {
  return `El ${campo} de ${tipo} no es un número válido. Escribilo sin puntos de miles, por ejemplo ${EJEMPLOS[campo]}.`
}
