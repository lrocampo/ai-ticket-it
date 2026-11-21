import { z } from "zod"

import { objetoEstricto, textoObligatorio } from "./comunes.js"

const descripcionSchema = z
  .string({ error: "La descripción tiene que ser texto" })
  .trim()
  .default("")

const tipoEntradaSchema = objetoEstricto({
  nombre: textoObligatorio(
    "El nombre del tipo de entrada no puede estar vacío",
  ),
  descripcion: descripcionSchema,
  precio: z.number({ error: "El precio tiene que ser un número" }),
  cupo: z.number({ error: "El cupo tiene que ser un número" }),
})

const sinTiposDeEntrada = "Hace falta al menos un tipo de entrada"

export const eventoSchema = objetoEstricto({
  nombre: textoObligatorio("El nombre no puede estar vacío"),
  descripcion: descripcionSchema,
  categoriaId: textoObligatorio("Hace falta una categoría"),
  fecha: z.iso
    .datetime({
      offset: true,
      error: "La fecha tiene que tener formato ISO y zona horaria",
    })
    .pipe(z.coerce.date()),
  multimedia: z
    .array(
      z.url({
        protocol: /^https?$/,
        error: "La URL tiene que empezar con http o https",
      }),
      { error: "Las imágenes tienen que ser una lista de URLs" },
    )
    .default([]),
  tiposEntrada: z
    .array(tipoEntradaSchema, { error: sinTiposDeEntrada })
    .min(1, { error: sinTiposDeEntrada }),
  limitePorUsuario: z
    .number({
      error: "El máximo de entradas por persona tiene que ser un número",
    })
    .optional(),
})

export const busquedaEventosSchema = z.object({
  texto: z
    .string({ error: "La búsqueda tiene que ser texto" })
    .trim()
    .optional(),
  categoriaId: z
    .string({ error: "La categoría tiene que ser un id" })
    .optional(),
  orden: z
    .enum(["precio", "fecha", "puntaje"], {
      error: "El orden tiene que ser precio, fecha o puntaje",
    })
    .default("fecha"),
})
