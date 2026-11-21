import app from "./app.js"
import { repositorios, usaSecretoDeDesarrollo } from "./dependencias.js"
import cargarSeed from "./seeds/cargarSeed.js"

const port = process.env.PORT ?? 3000

if (usaSecretoDeDesarrollo) {
  console.warn(
    "JWT_SECRET no está definido: se usa un secreto de desarrollo. Definilo antes de exponer el backend.",
  )
}

cargarSeed(repositorios)

app.listen(port, () => {
  console.log(
    `Backend escuchando en http://localhost:${port} con ${repositorios.eventos.todos().length} eventos y ${repositorios.usuarios.todos().length} usuarios de ejemplo`,
  )
})
