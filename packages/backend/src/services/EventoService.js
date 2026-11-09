import Evento from "../domain/Evento.js"
import TipoEntrada from "../domain/TipoEntrada.js"
import { NoAutorizado } from "../errors/ApplicationErrors.js"

const normalizar = (texto) =>
  texto.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()

const nulosAlFinal = (comparar) => (a, b) => {
  if (a === null || b === null) {
    return (a === null) - (b === null)
  }
  return comparar(a, b)
}

export default class EventoService {
  constructor(
    eventoRepository,
    categoriaRepository,
    compraRepository,
    resenaRepository,
  ) {
    this.eventos = eventoRepository
    this.categorias = categoriaRepository
    this.compras = compraRepository
    this.resenas = resenaRepository
    const puntajeDescendente = nulosAlFinal((a, b) => b - a)
    this.ordenes = {
      fecha: (a, b) => a.fecha - b.fecha,
      precio: (a, b) => a.precioDesde() - b.precioDesde(),
      puntaje: (a, b) =>
        puntajeDescendente(this.puntajeDe(a), this.puntajeDe(b)),
    }
  }

  crear = (organizador, datos, ahora = new Date()) => {
    const categoria = this.categorias.porId(datos.categoriaId)
    const evento = new Evento(
      {
        ...datos,
        categoria,
        organizador,
        tiposEntrada: datos.tiposEntrada.map((tipo) => new TipoEntrada(tipo)),
      },
      ahora,
    )
    return this.eventos.guardar(evento)
  }

  porId = (id) => this.eventos.porId(id)

  // El catálogo es para comprar: los eventos que ya ocurrieron no aparecen.
  buscar = (
    { texto, categoriaId, orden = "fecha" } = {},
    ahora = new Date(),
  ) => {
    const buscado = texto ? normalizar(texto) : null
    const eventos = this.eventos.filtrar(
      (evento) =>
        !evento.yaOcurrio(ahora) &&
        (!categoriaId || evento.categoria.id === categoriaId) &&
        (!buscado ||
          normalizar(`${evento.nombre} ${evento.descripcion}`).includes(
            buscado,
          )),
    )
    return eventos.sort(this.ordenes[orden])
  }

  puntajeDe = (evento) => this.reputacionDe(evento.organizador).puntaje

  misEventos = (organizador) =>
    this.eventos.filtrar((evento) => evento.esOrganizador(organizador))

  comprasDelEvento = (usuario, eventoId) => {
    const evento = this.eventos.porId(eventoId)
    if (!evento.esOrganizador(usuario)) {
      throw new NoAutorizado(
        "Solo el organizador puede ver las compras del evento.",
      )
    }
    const compras = this.compras.filtrar((compra) => compra.evento === evento)
    return { evento, compras }
  }

  // Único lugar donde se calcula el puntaje de un organizador: lo usan el
  // orden por puntaje y la presentación del organizador en cada evento.
  reputacionDe = (organizador) => {
    const resenas = this.resenas.filtrar((resena) =>
      resena.evento.esOrganizador(organizador),
    )
    const puntaje =
      resenas.length === 0
        ? null
        : resenas.reduce((suma, resena) => suma + resena.puntuacion, 0) /
          resenas.length
    return { puntaje, cantidadResenas: resenas.length, resenas }
  }
}
