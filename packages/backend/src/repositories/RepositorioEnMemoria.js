import { EntityNotFound } from "../errors/ApplicationErrors.js"

// Guarda los objetos de dominio por referencia: lo que devuelve es el mismo
// objeto que se guardó, así una compra que reserva cupo se ve en el catálogo.
export default class RepositorioEnMemoria {
  #entidades = new Map()
  #ultimoId = 0
  #mensajeNoEncontrado

  constructor(mensajeNoEncontrado) {
    this.#mensajeNoEncontrado = mensajeNoEncontrado
  }

  guardar(entidad) {
    if (entidad.id === undefined) {
      entidad.id = String(++this.#ultimoId)
    }
    this.#entidades.set(entidad.id, entidad)
    return entidad
  }

  buscarPorId(id) {
    return this.#entidades.get(id)
  }

  porId(id) {
    const entidad = this.buscarPorId(id)
    if (!entidad) {
      throw new EntityNotFound(this.#mensajeNoEncontrado)
    }
    return entidad
  }

  todos() {
    return [...this.#entidades.values()]
  }

  filtrar(predicado) {
    return this.todos().filter(predicado)
  }
}
