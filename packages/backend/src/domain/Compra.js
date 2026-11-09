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

// Única tabla de transiciones. `falla` devuelve el motivo cuando una condición
// extra no se cumple y `efecto` corre una vez aplicada la transición.
const transiciones = {
  confirmarPago: {
    verbo: "confirmar el pago de",
    desde: [PENDIENTE],
    hacia: CONFIRMADA,
  },
  utilizar: { verbo: "utilizar", desde: [CONFIRMADA], hacia: UTILIZADA },
  cancelar: {
    verbo: "cancelar",
    desde: [PENDIENTE, CONFIRMADA],
    hacia: CANCELADA,
    falla: (compra, ahora) =>
      compra.evento.yaOcurrio(ahora) &&
      "No se puede cancelar una compra de un evento que ya ocurrió.",
    efecto: (compra) => compra.tipoEntrada.liberar(compra.cantidad),
  },
  reembolsar: {
    verbo: "reembolsar",
    desde: [CANCELADA],
    hacia: REEMBOLSADA,
    falla: (compra) =>
      !compra.pasoPor(CONFIRMADA) &&
      "Solo se reembolsa una compra que había sido pagada.",
  },
}

export default class Compra {
  constructor(
    { comprador, evento, tipoEntrada, cantidad },
    ahora = new Date(),
  ) {
    if (!(Number.isInteger(cantidad) && cantidad > 0)) {
      throw new DomainValidationError(
        "La cantidad de entradas debe ser un entero positivo.",
      )
    }
    if (evento.yaOcurrio(ahora)) {
      throw new DomainRuleError("El evento ya ocurrió.")
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
    return this.estado === CONFIRMADA ? this.evento.diasHasta(ahora) : null
  }

  puedeCancelarse(ahora = new Date()) {
    return !this.#impedimento("cancelar", ahora)
  }

  puedeResenarse() {
    return this.estado === UTILIZADA && this.resena === null
  }

  resenar(puntuacion, detalle, ahora = new Date()) {
    if (this.resena !== null) {
      throw new DomainRuleError("La compra ya tiene una reseña.")
    }
    if (this.estado !== UTILIZADA) {
      throw new DomainRuleError("Solo se puede reseñar una compra utilizada.")
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

  esParte(usuario) {
    return this.esComprador(usuario) || this.evento.esOrganizador(usuario)
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
    const transicion = transiciones[accion]
    if (!transicion.desde.includes(this.estado)) {
      return `No se puede ${transicion.verbo} una compra ${this.estado}.`
    }
    return transicion.falla?.(this, ahora) || null
  }

  #transicionar(accion, quien, ahora) {
    const impedimento = this.#impedimento(accion, ahora)
    if (impedimento) {
      throw new DomainRuleError(impedimento)
    }
    const transicion = transiciones[accion]
    this.estado = transicion.hacia
    this.historial.push(new CambioEstadoCompra(transicion.hacia, quien, ahora))
    transicion.efecto?.(this)
  }
}
