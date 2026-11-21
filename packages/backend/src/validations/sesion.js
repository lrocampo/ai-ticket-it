import { objetoEstricto, textoObligatorio } from "./comunes.js"

export const sesionSchema = objetoEstricto({
  usuarioId: textoObligatorio("Hace falta el usuario"),
})
