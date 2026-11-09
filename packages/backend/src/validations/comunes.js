import { z } from "zod"

export function textoObligatorio(mensaje) {
  return z.string({ error: mensaje }).trim().min(1, { error: mensaje })
}

export function objetoEstricto(forma) {
  return z.strictObject(forma, {
    error: (issue) =>
      issue.code === "unrecognized_keys"
        ? `No se esperaba el campo ${issue.keys.join(", ")}`
        : "Faltan los datos del pedido",
  })
}
