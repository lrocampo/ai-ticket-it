import CambioEstadoCompra from "./CambioEstadoCompra.js"
import Mensaje from "./Mensaje.js"
import Resena from "./Resena.js"
import { EstadoCompra } from "./enums/EstadoCompra.js"
import {
  DomainRuleError,
  DomainValidationError,
} from "./errors/DomainErrors.js"

const { PENDIENTE, CONFIRMADA, UTILIZADA, CANCELADA, REEMBOLSADA } =
  EstadoCompra

const transiciones = {
  confirmarPago: {
    verbo: "confirmar el pago de",
    quien: "comprador",
    desde: [PENDIENTE],
    hacia: CONFIRMADA,
  },
  utilizar: {
    verbo: "utilizar",
    quien: "organizador",
    desde: [CONFIRMADA],
    hacia: UTILIZADA,
  },
  cancelar: {
    verbo: "cancelar",
    quien: "comprador",
    desde: [PENDIENTE, CONFIRMADA],
    hacia: CANCELADA,
    motivoDeRechazo: (compra, ahora) => {
      if (compra.evento.yaOcurrio(ahora)) {
        return "No se puede cancelar una compra de un evento que ya ocurrió."
      }
      return null
    },
    alAplicar: (compra) => compra.tipoEntrada.liberar(compra.cantidad),
  },
  reembolsar: {
    verbo: "reembolsar",
    quien: "organizador",
    desde: [CANCELADA],
    hacia: REEMBOLSADA,
    motivoDeRechazo: (compra) => {
      if (!compra.pasoPor(CONFIRMADA)) {
        return "Solo se reembolsa una compra que había sido pagada."
      }
      return null
    },
  },
}

const acciones = {
  ...transiciones,
  resenar: {
    verbo: "reseñar",
    quien: "comprador",
    desde: [UTILIZADA],
    motivoDeRechazo: (compra) => {
      if (compra.resena !== null) {
        return "La compra ya tiene una reseña."
      }
      return null
    },
  },
}

export default class Compra {
  static accion(nombre) {
    const { quien, verbo } = acciones[nombre]
    return { quien, verbo }
  }

  constructor(
    { comprador, evento, tipoEntrada, cantidad },
    ahora = new Date(),
  ) {
    if (!(Number.isSafeInteger(cantidad) && cantidad > 0)) {
      throw new DomainValidationError(
        "La cantidad de entradas debe ser un entero positivo.",
      )
    }
    if (evento.yaOcurrio(ahora)) {
      throw new DomainRuleError("El evento ya ocurrió.")
    }
    if (evento.esOrganizador(comprador)) {
      throw new DomainRuleError(
        "El organizador no puede comprar entradas de su propio evento.",
      )
    }
    tipoEntrada.reservar(cantidad)
    this.comprador = comprador
    this.evento = evento
    this.tipoEntrada = tipoEntrada
    this.cantidad = cantidad
    this.total = tipoEntrada.precio * cantidad
    this.estado = PENDIENTE
    this.historial = [new CambioEstadoCompra(PENDIENTE, comprador, ahora)]
    this.mensajes = []
    this.resena = null
  }

  confirmarPago(quien, ahora = new Date()) {
    this.#transicionar("confirmarPago", quien, ahora)
  }

  utilizar(quien, ahora = new Date()) {
    this.#transicionar("utilizar", quien, ahora)
  }

  cancelar(quien, ahora = new Date()) {
    this.#transicionar("cancelar", quien, ahora)
  }

  reembolsar(quien, ahora = new Date()) {
    this.#transicionar("reembolsar", quien, ahora)
  }

  pasoPor(estado) {
    return this.historial.some((cambio) => cambio.estado === estado)
  }

  diasParaElEvento(ahora = new Date()) {
    if (this.estado !== CONFIRMADA || this.evento.yaOcurrio(ahora)) {
      return null
    }
    return this.evento.diasHasta(ahora)
  }

  accionesPara(usuario, ahora = new Date()) {
    const rol = this.rolDe(usuario)
    return Object.keys(acciones).filter(
      (accion) =>
        acciones[accion].quien === rol && !this.#impedimento(accion, ahora),
    )
  }

  resenar(puntuacion, detalle, ahora = new Date()) {
    const impedimento = this.#impedimento("resenar", ahora)
    if (impedimento) {
      throw new DomainRuleError(impedimento)
    }
    this.resena = new Resena({
      id: this.id,
      compra: this,
      puntuacion,
      detalle,
      fecha: ahora,
    })
    return this.resena
  }

  rolDe(usuario) {
    if (this.esComprador(usuario)) {
      return "comprador"
    }
    if (this.evento.esOrganizador(usuario)) {
      return "organizador"
    }
    return null
  }

  esParte(usuario) {
    return this.rolDe(usuario) !== null
  }

  esComprador(usuario) {
    return this.comprador.esElMismo(usuario)
  }

  enviarMensaje(usuario, texto, ahora = new Date()) {
    if (!this.esParte(usuario)) {
      throw new DomainRuleError(
        "Solo el comprador y el organizador pueden escribir en esta compra.",
      )
    }
    const mensaje = new Mensaje({
      id: String(this.mensajes.length + 1),
      usuario,
      texto,
      enviado: ahora,
    })
    this.mensajes.push(mensaje)
    return mensaje
  }

  #impedimento(accion, ahora) {
    const regla = acciones[accion]
    if (!regla.desde.includes(this.estado)) {
      return `No se puede ${regla.verbo} una compra ${this.estado}.`
    }
    return regla.motivoDeRechazo?.(this, ahora) ?? null
  }

  #transicionar(accion, quien, ahora) {
    const impedimento = this.#impedimento(accion, ahora)
    if (impedimento) {
      throw new DomainRuleError(impedimento)
    }
    const transicion = transiciones[accion]
    this.estado = transicion.hacia
    this.historial.push(new CambioEstadoCompra(transicion.hacia, quien, ahora))
    transicion.alAplicar?.(this)
  }
}
