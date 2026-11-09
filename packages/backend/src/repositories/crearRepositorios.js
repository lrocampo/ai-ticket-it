import EventoRepository from "./EventoRepository.js"
import RepositorioEnMemoria from "./RepositorioEnMemoria.js"

export default function crearRepositorios() {
  return {
    usuarios: new RepositorioEnMemoria("El usuario no existe."),
    categorias: new RepositorioEnMemoria("La categoría no existe."),
    eventos: new EventoRepository(),
    compras: new RepositorioEnMemoria("La compra no existe."),
    resenas: new RepositorioEnMemoria("La reseña no existe."),
  }
}
