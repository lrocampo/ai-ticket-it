import {
  presentarCompra,
  presentarEvento,
  presentarEventoDetalle,
} from "../presentadores/presentadores.js"

export default class EventoController {
  constructor(eventoService) {
    this.eventoService = eventoService
  }

  buscar = (req, res, next) => {
    try {
      res.json(this.eventoService.buscar(req.query).map(this.presentar))
    } catch (error) {
      next(error)
    }
  }

  porId = (req, res, next) => {
    try {
      res.json(
        this.presentarDetalle(
          this.eventoService.porId(req.params.id),
          req.usuario,
        ),
      )
    } catch (error) {
      next(error)
    }
  }

  crear = (req, res, next) => {
    try {
      const evento = this.eventoService.crear(req.usuario, req.body)
      res.status(201).json(this.presentarDetalle(evento, req.usuario))
    } catch (error) {
      next(error)
    }
  }

  compras = (req, res, next) => {
    try {
      const { evento, compras } = this.eventoService.comprasDelEvento(
        req.usuario,
        req.params.id,
      )
      res.json({
        evento: this.presentar(evento),
        compras: compras.map((compra) => presentarCompra(compra, req.usuario)),
      })
    } catch (error) {
      next(error)
    }
  }

  misEventos = (req, res, next) => {
    try {
      res.json(this.eventoService.misEventos(req.usuario).map(this.presentar))
    } catch (error) {
      next(error)
    }
  }

  presentar = (evento) =>
    presentarEvento(evento, this.eventoService.reputacionDe(evento.organizador))

  presentarDetalle = (evento, usuario) =>
    presentarEventoDetalle(
      evento,
      this.eventoService.reputacionDe(evento.organizador),
      usuario,
    )
}
