import { presentarCompra } from "../presentadores/presentadores.js"

export default class CompraController {
  constructor(compraService) {
    this.compraService = compraService
  }

  mias = (req, res, next) => {
    try {
      res.json(
        this.compraService
          .mias(req.usuario)
          .map((compra) => presentarCompra(compra, req.usuario)),
      )
    } catch (error) {
      next(error)
    }
  }

  porId = (req, res, next) => {
    try {
      const compra = this.compraService.porId(req.usuario, req.params.id)
      res.json(presentarCompra(compra, req.usuario))
    } catch (error) {
      next(error)
    }
  }

  crear = (req, res, next) => {
    try {
      const compra = this.compraService.crear(req.usuario, req.body)
      res.status(201).json(presentarCompra(compra, req.usuario))
    } catch (error) {
      next(error)
    }
  }

  confirmarPago = this.#accion("confirmarPago")
  utilizar = this.#accion("utilizar")
  cancelar = this.#accion("cancelar")
  reembolsar = this.#accion("reembolsar")

  enviarMensaje = (req, res, next) => {
    try {
      const compra = this.compraService.enviarMensaje(
        req.usuario,
        req.params.id,
        req.body.texto,
      )
      res.status(201).json(presentarCompra(compra, req.usuario))
    } catch (error) {
      next(error)
    }
  }

  resenar = (req, res, next) => {
    try {
      const compra = this.compraService.resenar(
        req.usuario,
        req.params.id,
        req.body,
      )
      res.status(201).json(presentarCompra(compra, req.usuario))
    } catch (error) {
      next(error)
    }
  }

  #accion(nombre) {
    return (req, res, next) => {
      try {
        const compra = this.compraService[nombre](req.usuario, req.params.id)
        res.json(presentarCompra(compra, req.usuario))
      } catch (error) {
        next(error)
      }
    }
  }
}
