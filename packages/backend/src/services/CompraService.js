import Compra from "../domain/Compra.js"
import { EntityNotFound, NoAutorizado } from "../errors/ApplicationErrors.js"

// Quién puede pedir cada acción sigue la tabla de docs/dominio.md. La
// transición en sí la decide la Compra.
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
    const compra = this.#delComprador(usuario, id, "confirmar el pago de")
    compra.confirmarPago(usuario, ahora)
    return compra
  }

  utilizar = (usuario, id, ahora) => {
    const compra = this.#delOrganizador(usuario, id, "utilizar")
    compra.utilizar(usuario, ahora)
    return compra
  }

  cancelar = (usuario, id, ahora) => {
    const compra = this.#delComprador(usuario, id, "cancelar")
    compra.cancelar(usuario, ahora)
    return compra
  }

  reembolsar = (usuario, id, ahora) => {
    const compra = this.#delOrganizador(usuario, id, "reembolsar")
    compra.reembolsar(usuario, ahora)
    return compra
  }

  enviarMensaje = (usuario, id, texto, ahora) => {
    const compra = this.porId(usuario, id)
    compra.enviarMensaje(usuario, texto, ahora)
    return compra
  }

  resenar = (usuario, id, { puntuacion, detalle }, ahora) => {
    const compra = this.#delComprador(usuario, id, "reseñar")
    compra.resenar(puntuacion, detalle, ahora)
    return compra
  }

  #delComprador(usuario, id, accion) {
    const compra = this.compras.porId(id)
    if (!compra.esComprador(usuario)) {
      throw new NoAutorizado(`Solo el comprador puede ${accion} esta compra.`)
    }
    return compra
  }

  #delOrganizador(usuario, id, accion) {
    const compra = this.compras.porId(id)
    if (!compra.evento.esOrganizador(usuario)) {
      throw new NoAutorizado(`Solo el organizador puede ${accion} esta compra.`)
    }
    return compra
  }
}
