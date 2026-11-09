import { presentarUsuario } from "../presentadores/presentadores.js"

export default class UsuarioController {
  constructor(usuarioService) {
    this.usuarioService = usuarioService
  }

  todos = (_req, res, next) => {
    try {
      res.json(this.usuarioService.todos().map(presentarUsuario))
    } catch (error) {
      next(error)
    }
  }
}
