import { z } from "zod"

// La forma la valida zod (400). Los valores (fecha futura, precio, cupo,
// nombres únicos) los valida el dominio (422).
const tipoEntradaSchema = z
  .object({
    nombre: z.string().trim().min(1),
    descripcion: z.string().trim().default(""),
    precio: z.number(),
    cupo: z.number(),
  })
  .strict()

export const eventoSchema = z
  .object({
    nombre: z.string().trim().min(1),
    descripcion: z.string().trim().default(""),
    categoriaId: z.string().min(1),
    fecha: z.iso.datetime({ offset: true }).pipe(z.coerce.date()),
    multimedia: z.array(z.url({ protocol: /^https?$/ })).default([]),
    tiposEntrada: z.array(tipoEntradaSchema).min(1),
  })
  .strict()

export const busquedaEventosSchema = z.object({
  texto: z.string().trim().optional(),
  categoriaId: z.string().optional(),
  orden: z.enum(["precio", "fecha", "puntaje"]).default("fecha"),
})
