export default class UsuarioService {
  constructor(usuarioRepository) {
    this.usuarios = usuarioRepository
  }

  todos = () => this.usuarios.todos()

  porId = (id) => this.usuarios.porId(id)
}
