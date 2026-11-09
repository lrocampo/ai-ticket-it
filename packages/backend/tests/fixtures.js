import Categoria from "../src/domain/Categoria.js"
import Evento from "../src/domain/Evento.js"
import TipoEntrada from "../src/domain/TipoEntrada.js"
import Usuario from "../src/domain/Usuario.js"

export const HOY = new Date("2026-11-09T12:00:00.000Z")

export const dias = (cantidad, desde = HOY) =>
  new Date(desde.getTime() + cantidad * 24 * 60 * 60 * 1000)

let proximoId = 1
const conId = (entidad) => {
  entidad.id = String(proximoId++)
  return entidad
}

export const usuario = (nombre) =>
  conId(
    new Usuario({
      nombre,
      apellido: "Prueba",
      email: `${nombre.toLowerCase()}@ejemplo.com`,
    }),
  )

export const categoria = (nombre = "Recitales") =>
  conId(new Categoria({ nombre }))

export const tipoEntrada = (datos = {}) =>
  conId(
    new TipoEntrada({ nombre: "General", precio: 1000, cupo: 10, ...datos }),
  )

export const evento = (datos = {}, creado = dias(-1)) =>
  conId(
    new Evento(
      {
        nombre: "Recital",
        descripcion: "Una noche de música",
        categoria: categoria(),
        fecha: dias(10),
        tiposEntrada: [tipoEntrada()],
        organizador: usuario("Organizadora"),
        ...datos,
      },
      creado,
    ),
  )
