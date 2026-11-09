import { DomainValidationError } from "./errors/DomainErrors.js"
import { MILISEGUNDOS_POR_DIA } from "../utils/fechas.js"

export default class Evento {
  constructor(
    {
      nombre,
      descripcion = "",
      categoria,
      fecha,
      tiposEntrada,
      multimedia = [],
      organizador,
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
    const nombres = new Set(tiposEntrada.map((tipo) => tipo.nombre))
    if (nombres.size !== tiposEntrada.length) {
      throw new DomainValidationError(
        "Los tipos de entrada deben tener nombres distintos.",
      )
    }
    this.nombre = nombre
    this.descripcion = descripcion
    this.categoria = categoria
    this.fecha = fechaEvento
    this.tiposEntrada = tiposEntrada
    this.multimedia = multimedia
    this.organizador = organizador
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

  esOrganizador(usuario) {
    return this.organizador.esElMismo(usuario)
  }
}
