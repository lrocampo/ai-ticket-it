import { z } from "zod"

import { objetoEstricto, textoObligatorio } from "./comunes.js"

export const compraSchema = objetoEstricto({
  eventoId: textoObligatorio("Hace falta el evento"),
  tipoEntradaId: textoObligatorio("Hace falta el tipo de entrada"),
  cantidad: z.number({ error: "La cantidad tiene que ser un número" }),
})

export const mensajeSchema = objetoEstricto({
  texto: textoObligatorio("El mensaje no puede estar vacío"),
})

export const resenaSchema = objetoEstricto({
  puntuacion: z.number({ error: "La puntuación tiene que ser un número" }),
  detalle: textoObligatorio("El comentario no puede estar vacío"),
})
