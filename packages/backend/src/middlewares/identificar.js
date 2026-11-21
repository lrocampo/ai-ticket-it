import { NoAutenticado } from "../errors/ApplicationErrors.js"

export default function identificar(usuarioRepository, tokens) {
  return (req, _res, next) => {
    const [, token] =
      /^Bearer (\S+)$/.exec(req.headers.authorization ?? "") ?? []
    if (!token) {
      return next(new NoAutenticado("Falta el token de sesión."))
    }
    try {
      const usuario = usuarioRepository.buscarPorId(tokens.verificar(token))
      if (!usuario) {
        throw new NoAutenticado("La sesión no es válida o venció.")
      }
      req.usuario = usuario
      next()
    } catch (error) {
      next(error)
    }
  }
}
