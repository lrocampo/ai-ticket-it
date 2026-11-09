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

  return {
    evento: {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoriaId,
      fecha: fecha.toISOString(),
      multimedia: imagen.trim() === "" ? [] : [imagen.trim()],
      tiposEntrada: tiposEntrada.map((tipo) => ({
        nombre: tipo.nombre.trim(),
        descripcion: tipo.descripcion.trim(),
        precio: aNumero(tipo.precio),
        cupo: aNumero(tipo.cupo),
      })),
    },
  }
}

function estaCompleto(tipo: TipoEntradaFormulario) {
  return [tipo.nombre, tipo.precio, tipo.cupo].every(
    (campo) => campo.trim() !== "",
  )
}

// El teclado numérico de iOS en español escribe coma decimal.
function aNumero(texto: string) {
  return Number(texto.trim().replace(",", "."))
}
