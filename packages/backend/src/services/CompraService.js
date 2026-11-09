import Compra from "../domain/Compra.js"
import { EntityNotFound, NoAutorizado } from "../errors/ApplicationErrors.js"

// Quién puede pedir cada acción, según la tabla de docs/dominio.md. La
// transición en sí la decide la Compra.
const acciones = {
  confirmarPago: { quien: "comprador" },
  utilizar: { quien: "organizador" },
  cancelar: { quien: "comprador" },
  reembolsar: { quien: "organizador" },
}

const esQuien = {
  comprador: (compra, usuario) => compra.esComprador(usuario),
  organizador: (compra, usuario) => compra.evento.esOrganizador(usuario),
}

export default class CompraService {
  constructor(compraRepository, eventoRepository, resenaRepository) {
    this.compras = compraRepository
    this.eventos = eventoRepository
    this.resenas = resenaRepository
  }

  crear = (comprador, { eventoId, tipoEntradaId, cantidad }, ahora) => {
    const evento = this.eventos.porId(eventoId)
    const tipoEntrada = evento.tipoEntrada(tipoEntradaId)
    if (!tipoEntrada) {
      throw new EntityNotFound("El tipo de entrada no existe en este evento.")
    }
    const compra = new Compra(
      { comprador, evento, tipoEntrada, cantidad },
      ahora,
    )
    return this.compras.guardar(compra)
  }

  mias = (usuario) =>
    this.compras.filtrar((compra) => compra.esComprador(usuario))

  porId = (usuario, id) => {
    const compra = this.compras.porId(id)
    if (!compra.esParte(usuario)) {
      throw new NoAutorizado("Esta compra no es tuya.")
    }
    return compra
  }

  confirmarPago = (usuario, id, ahora) =>
    this.#accion("confirmarPago", usuario, id, ahora)

  utilizar = (usuario, id, ahora) =>
    this.#accion("utilizar", usuario, id, ahora)

  cancelar = (usuario, id, ahora) =>
    this.#accion("cancelar", usuario, id, ahora)

  reembolsar = (usuario, id, ahora) =>
    this.#accion("reembolsar", usuario, id, ahora)

  enviarMensaje = (usuario, id, texto, ahora) => {
    const compra = this.porId(usuario, id)
    compra.enviarMensaje(usuario, texto, ahora)
    return compra
  }

  resenar = (usuario, id, { puntuacion, detalle }, ahora) => {
    const compra = this.#deQuien("comprador", usuario, id, "reseñar")
    const resena = compra.resenar(puntuacion, detalle, ahora)
    this.resenas.guardar(resena)
    return compra
  }

  #accion(nombre, usuario, id, ahora = new Date()) {
    const compra = this.#deQuien(acciones[nombre].quien, usuario, id, nombre)
    compra[nombre](usuario, ahora)
    return compra
  }

  #deQuien(quien, usuario, id, accion) {
    const compra = this.compras.porId(id)
    if (!esQuien[quien](compra, usuario)) {
      throw new NoAutorizado(`Solo el ${quien} puede ${accion} esta compra.`)
    }
    return compra
  }
}
