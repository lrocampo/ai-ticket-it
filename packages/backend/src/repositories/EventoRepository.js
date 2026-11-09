import RepositorioEnMemoria from "./RepositorioEnMemoria.js"

export default class EventoRepository extends RepositorioEnMemoria {
  constructor() {
    super("El evento no existe.")
  }

  guardar(evento) {
    super.guardar(evento)
    evento.tiposEntrada.forEach((tipo, indice) => {
      tipo.id ??= `${evento.id}-${indice + 1}`
    })
    return evento
  }
}
