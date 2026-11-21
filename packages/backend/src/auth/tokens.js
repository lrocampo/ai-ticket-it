import jwt from "jsonwebtoken"
import { NoAutenticado } from "../errors/ApplicationErrors.js"

export const SECRETO_DE_DESARROLLO = "secreto-solo-para-desarrollo"

const ALGORITMO = "HS256"

export default function crearTokens({ secreto, expiraEn = "8h" }) {
  return {
    emitir: (usuario) =>
      jwt.sign({ sub: usuario.id }, secreto, {
        algorithm: ALGORITMO,
        expiresIn: expiraEn,
      }),

    verificar: (token) => {
      try {
        return jwt.verify(token, secreto, { algorithms: [ALGORITMO] }).sub
      } catch {
        throw new NoAutenticado("La sesión no es válida o venció.")
      }
    },
  }
}
