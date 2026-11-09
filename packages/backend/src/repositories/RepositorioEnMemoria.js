import { EntityNotFound } from "../errors/ApplicationErrors.js"

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

  limpiar() {
    this.#entidades.clear()
    this.#ultimoId = 0
  }

  todos() {
    return [...this.#entidades.values()]
  }

  filtrar(predicado) {
    return this.todos().filter(predicado)
  }
}
