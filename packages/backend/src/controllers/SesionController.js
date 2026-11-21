import { presentarUsuario } from "../presentadores/presentadores.js"

export default class SesionController {
  constructor(usuarioService, tokens) {
    this.usuarioService = usuarioService
    this.tokens = tokens
  }

  crear = (req, res, next) => {
    try {
      const usuario = this.usuarioService.porId(req.body.usuarioId)
      res.status(201).json({
        token: this.tokens.emitir(usuario),
        usuario: presentarUsuario(usuario),
      })
    } catch (error) {
      next(error)
    }
  }

  actual = (req, res) => {
    res.json(presentarUsuario(req.usuario))
  }
}
