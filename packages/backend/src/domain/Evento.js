import {
  DomainRuleError,
  DomainValidationError,
} from "./errors/DomainErrors.js"
import { MILISEGUNDOS_POR_DIA } from "../utils/fechas.js"

const LIMITE_POR_USUARIO_POR_DEFECTO = 6

export default class Evento {
  #retenidas = new Map()

  constructor(
    {
      nombre,
      descripcion = "",
      categoria,
      fecha,
      tiposEntrada,
      multimedia = [],
      organizador,
      limitePorUsuario = LIMITE_POR_USUARIO_POR_DEFECTO,
    },
    ahora = new Date(),
  ) {
    if (!nombre?.trim()) {
      throw new DomainValidationError("El evento necesita un nombre.")
    }
    if (!categoria || !organizador) {
      throw new DomainValidationError(
        "El evento necesita una categoría y un organizador.",
      )
    }
    const fechaEvento = new Date(fecha)
    if (Number.isNaN(fechaEvento.getTime())) {
      throw new DomainValidationError("La fecha del evento es inválida.")
    }
    if (fechaEvento <= ahora) {
      throw new DomainValidationError("La fecha del evento debe ser futura.")
    }
    if (!tiposEntrada?.length) {
      throw new DomainValidationError(
        "El evento necesita al menos un tipo de entrada.",
      )
    }
    const nombres = new Set(
      tiposEntrada.map((tipo) => tipo.nombre.trim().toLowerCase()),
    )
    if (nombres.size !== tiposEntrada.length) {
      throw new DomainValidationError(
        "Los tipos de entrada deben tener nombres distintos.",
      )
    }
    if (!(Number.isSafeInteger(limitePorUsuario) && limitePorUsuario > 0)) {
      throw new DomainValidationError(
        "El máximo de entradas por persona debe ser un entero positivo.",
      )
    }
    this.nombre = nombre
    this.descripcion = descripcion
    this.categoria = categoria
    this.fecha = fechaEvento
    this.tiposEntrada = tiposEntrada
    this.multimedia = multimedia
    this.organizador = organizador
    this.limitePorUsuario = limitePorUsuario
  }

  yaOcurrio(ahora = new Date()) {
    return this.fecha < ahora
  }

  diasHasta(ahora = new Date()) {
    // Math.ceil devuelve -0 para una fracción negativa; el || lo vuelve 0.
    return Math.ceil((this.fecha - ahora) / MILISEGUNDOS_POR_DIA) || 0
  }

  precioDesde() {
    return Math.min(...this.tiposEntrada.map((tipo) => tipo.precio))
  }

  tipoEntrada(id) {
    return this.tiposEntrada.find((tipo) => tipo.id === id)
  }

  entradasDe(usuario) {
    return this.#retenidas.get(usuario.id) ?? 0
  }

  reservar(comprador, tipoEntrada, cantidad) {
    const yaTiene = this.entradasDe(comprador)
    if (yaTiene + cantidad > this.limitePorUsuario) {
      const detalle = yaTiene > 0 ? `: ya tenés ${yaTiene}` : ""
      throw new DomainRuleError(
        `Hasta ${this.limitePorUsuario} entradas por persona para este evento${detalle}.`,
      )
    }
    tipoEntrada.reservar(cantidad)
    this.#retenidas.set(comprador.id, yaTiene + cantidad)
  }

  liberar(comprador, tipoEntrada, cantidad) {
    tipoEntrada.liberar(cantidad)
    this.#retenidas.set(comprador.id, this.entradasDe(comprador) - cantidad)
  }

  esOrganizador(usuario) {
    return this.organizador.esElMismo(usuario)
  }
}
