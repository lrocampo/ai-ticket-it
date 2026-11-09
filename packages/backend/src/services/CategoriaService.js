export default class CategoriaService {
  constructor(categoriaRepository) {
    this.categorias = categoriaRepository
  }

  todas = () => this.categorias.todos()
}
