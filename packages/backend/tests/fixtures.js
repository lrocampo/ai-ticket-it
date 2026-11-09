import Categoria from "../src/domain/Categoria.js"
import Evento from "../src/domain/Evento.js"
import TipoEntrada from "../src/domain/TipoEntrada.js"
import Usuario from "../src/domain/Usuario.js"
import { sumarDias } from "../src/utils/fechas.js"

export const HOY = new Date("2026-11-09T12:00:00.000Z")

// Ninguna fixture asigna ids: el test guarda en un repositorio lo que
// necesite identificar, igual que en producción.
export const usuario = (nombre) =>
  new Usuario({
    nombre,
    apellido: "Prueba",
    email: `${nombre.toLowerCase()}@ejemplo.com`,
  })

export const categoria = (nombre = "Recitales") => new Categoria({ nombre })

export const tipoEntrada = (datos = {}) =>
  new TipoEntrada({ nombre: "General", precio: 1000, cupo: 10, ...datos })

export const evento = (datos = {}, creado = sumarDias(HOY, -1)) =>
  new Evento(
    {
      nombre: "Recital",
      descripcion: "Una noche de música",
      categoria: categoria(),
      fecha: sumarDias(HOY, 10),
      tiposEntrada: [tipoEntrada()],
      organizador: usuario("Organizadora"),
      ...datos,
    },
    creado,
  )
