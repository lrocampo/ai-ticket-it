import {
  DomainRuleError,
  DomainValidationError,
} from "./errors/DomainErrors.js"

export default class TipoEntrada {
  constructor({ nombre, descripcion = "", precio, cupo }) {
    if (!nombre?.trim()) {
      throw new DomainValidationError("El tipo de entrada necesita un nombre.")
    }
    if (!(Number.isFinite(precio) && precio >= 0)) {
      throw new DomainValidationError(
        `El precio de "${nombre}" no puede ser negativo.`,
      )
    }
    if (!(Number.isInteger(cupo) && cupo > 0)) {
      throw new DomainValidationError(
        `El cupo de "${nombre}" debe ser un entero positivo.`,
      )
    }
    this.nombre = nombre
    this.descripcion = descripcion
    this.precio = precio
    this.cupo = cupo
    this.vendidas = 0
  }

  disponibles() {
    return this.cupo - this.vendidas
  }

  hayCupoPara(cantidad) {
    return cantidad <= this.disponibles()
  }

  reservar(cantidad) {
    if (!this.hayCupoPara(cantidad)) {
      throw new DomainRuleError(
        `No hay cupo para ${cantidad} entradas "${this.nombre}": quedan ${this.disponibles()}.`,
      )
    }
    this.vendidas += cantidad
  }

  liberar(cantidad) {
    this.vendidas -= cantidad
  }
}
