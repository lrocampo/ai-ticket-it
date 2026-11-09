import { DomainValidationError } from "./errors/DomainErrors.js"

export default class Resena {
  constructor({ id, compra, puntuacion, detalle, fecha }) {
    if (!(Number.isInteger(puntuacion) && puntuacion >= 1 && puntuacion <= 5)) {
      throw new DomainValidationError(
        "La puntuación debe ser un entero entre 1 y 5.",
      )
    }
    if (!detalle?.trim()) {
      throw new DomainValidationError("La reseña necesita un comentario.")
    }
    this.id = id
    this.compra = compra
    this.comprador = compra.comprador
    this.evento = compra.evento
    this.puntuacion = puntuacion
    this.detalle = detalle
    this.fecha = fecha
  }
}
