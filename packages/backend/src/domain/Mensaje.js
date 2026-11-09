import { DomainValidationError } from "./errors/DomainErrors.js"

export default class Mensaje {
  constructor({ id, usuario, texto, enviado }) {
    if (!texto?.trim()) {
      throw new DomainValidationError("El mensaje no puede estar vacío.")
    }
    this.id = id
    this.usuario = usuario
    this.texto = texto
    this.enviado = enviado
  }
}
