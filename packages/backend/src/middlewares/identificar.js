import { NoAutenticado } from "../errors/ApplicationErrors.js"

export default function identificar(usuarioRepository) {
  return (req, _res, next) => {
    const id = req.headers["x-usuario-id"]
    if (!id) {
      return next(new NoAutenticado("Falta el header x-usuario-id."))
    }
    const usuario = usuarioRepository.buscarPorId(id)
    if (!usuario) {
      return next(new NoAutenticado("El usuario de x-usuario-id no existe."))
    }
    req.usuario = usuario
    next()
  }
}
