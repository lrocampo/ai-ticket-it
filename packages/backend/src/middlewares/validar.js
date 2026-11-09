import { BadRequestError } from "../errors/ApplicationErrors.js"

export default function validar(schema, origen = "body") {
  return (req, _res, next) => {
    const resultado = schema.safeParse(req[origen])
    if (resultado.error) {
      return next(
        new BadRequestError("Datos inválidos", resultado.error.issues),
      )
    }
    // En Express 5 req.query es un getter: hay que redefinirlo para pisarlo.
    Object.defineProperty(req, origen, {
      value: resultado.data,
      writable: true,
      enumerable: true,
      configurable: true,
    })
    next()
  }
}

export const validarQuery = (schema) => validar(schema, "query")
