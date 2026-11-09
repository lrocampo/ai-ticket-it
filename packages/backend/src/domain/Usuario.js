import { DomainValidationError } from "./errors/DomainErrors.js"

export default class Usuario {
  constructor({ nombre, apellido, email }) {
    if (!nombre?.trim() || !apellido?.trim() || !email?.trim()) {
      throw new DomainValidationError(
        "El usuario necesita nombre, apellido y email.",
      )
    }
    this.nombre = nombre
    this.apellido = apellido
    this.email = email
    this.favoritos = []
  }

  esElMismo(otro) {
    return otro?.id === this.id
  }
}
