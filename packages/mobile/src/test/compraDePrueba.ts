import type { Compra, Usuario } from "../types"

const comprador: Usuario = {
  id: "u1",
  nombre: "Ana",
  apellido: "García",
  email: "ana@example.com",
}

const organizador: Usuario = {
  id: "u2",
  nombre: "Bruno",
  apellido: "Díaz",
  email: "bruno@example.com",
}

export function compraDePrueba(cambios: Partial<Compra> = {}): Compra {
  return {
    id: "c1",
    estado: "PENDIENTE",
    cantidad: 2,
    total: 18000,
    comprador,
    evento: {
      id: "e1",
      nombre: "Recital",
      fecha: "2026-12-20T21:00:00.000Z",
      organizador,
    },
    tipoEntrada: { id: "e1-0", nombre: "General", precio: 9000 },
    diasParaElEvento: null,
    acciones: [],
    historial: [],
    mensajes: [],
    resena: null,
    ...cambios,
  }
}
