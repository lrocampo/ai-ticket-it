import { z } from "zod"

export const compraSchema = z
  .object({
    eventoId: z.string().min(1),
    tipoEntradaId: z.string().min(1),
    cantidad: z.number(),
  })
  .strict()

export const mensajeSchema = z
  .object({
    texto: z.string().trim().min(1),
  })
  .strict()

export const resenaSchema = z
  .object({
    puntuacion: z.number(),
    detalle: z.string().trim().min(1),
  })
  .strict()
