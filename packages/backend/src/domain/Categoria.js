import { DomainValidationError } from "./errors/DomainErrors.js"

export default class Categoria {
  constructor({ nombre, descripcion = "" }) {
    if (!nombre?.trim()) {
      throw new DomainValidationError("La categoría necesita un nombre.")
    }
    this.nombre = nombre
    this.descripcion = descripcion
  }
}
