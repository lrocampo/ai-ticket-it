import app from "./app.js"
import { repositorios } from "./dependencias.js"
import cargarSeed from "./seeds/cargarSeed.js"

const port = process.env.PORT ?? 3000

cargarSeed(repositorios)

app.listen(port, () => {
  console.log(
    `Backend escuchando en http://localhost:${port} con ${repositorios.eventos.todos().length} eventos y ${repositorios.usuarios.todos().length} usuarios de ejemplo`,
  )
})
