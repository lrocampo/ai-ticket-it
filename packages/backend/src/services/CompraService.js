import Compra from "../domain/Compra.js"
import { EntityNotFound, NoAutorizado } from "../errors/ApplicationErrors.js"

export default class CompraService {
  constructor(compraRepository, eventoRepository) {
    this.compras = compraRepository
    this.eventos = eventoRepository
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

  confirmarPago = (usuario, id, ahora) => {
    const compra = this.#autorizada(usuario, id, "confirmarPago")
    compra.confirmarPago(usuario, ahora)
    return compra
  }

  utilizar = (usuario, id, ahora) => {
    const compra = this.#autorizada(usuario, id, "utilizar")
    compra.utilizar(usuario, ahora)
    return compra
  }

  cancelar = (usuario, id, ahora) => {
    const compra = this.#autorizada(usuario, id, "cancelar")
    compra.cancelar(usuario, ahora)
    return compra
  }

  reembolsar = (usuario, id, ahora) => {
    const compra = this.#autorizada(usuario, id, "reembolsar")
    compra.reembolsar(usuario, ahora)
    return compra
  }

  enviarMensaje = (usuario, id, texto, ahora) => {
    const compra = this.porId(usuario, id)
    compra.enviarMensaje(usuario, texto, ahora)
    return compra
  }

  resenar = (usuario, id, { puntuacion, detalle }, ahora) => {
    const compra = this.#autorizada(usuario, id, "resenar")
    compra.resenar(puntuacion, detalle, ahora)
    return compra
  }

  #autorizada(usuario, id, accion) {
    const compra = this.compras.porId(id)
    const motivo = compra.motivoDeNoAutorizado(usuario, accion)
    if (motivo) {
      throw new NoAutorizado(motivo)
    }
    return compra
  }
}
