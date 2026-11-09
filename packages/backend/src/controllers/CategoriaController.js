import { presentarCategoria } from "../presentadores/presentadores.js"

export default class CategoriaController {
  constructor(categoriaService) {
    this.categoriaService = categoriaService
  }

  todas = (_req, res, next) => {
    try {
      res.json(this.categoriaService.todas().map(presentarCategoria))
    } catch (error) {
      next(error)
    }
  }
}
