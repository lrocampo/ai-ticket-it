export type Usuario = {
  id: string
  nombre: string
  apellido: string
  email: string
}

export type Sesion = {
  token: string
  usuario: Usuario
}

export type Categoria = {
  id: string
  nombre: string
  descripcion: string
}

export type TipoEntrada = {
  id: string
  nombre: string
  descripcion: string
  precio: number
  cupo: number
  disponibles: number
}

export type Organizador = Usuario & {
  puntaje: number | null
  cantidadResenas: number
}

export type Evento = {
  id: string
  nombre: string
  descripcion: string
  categoria: Categoria
  fecha: string
  multimedia: string[]
  organizador: Organizador
  tiposEntrada: TipoEntrada[]
  precioDesde: number
  yaOcurrio: boolean
  limitePorUsuario: number
}

export type Resena = {
  id: string
  puntuacion: number
  detalle: string
  fecha: string
  comprador: Usuario
  evento: { id: string; nombre: string }
}

export type EventoDetalle = Evento & {
  resenasDelOrganizador: Resena[]
  entradasDelUsuario: number
}

export type EstadoCompra =
  | "PENDIENTE"
  | "CONFIRMADA"
  | "UTILIZADA"
  | "CANCELADA"
  | "REEMBOLSADA"

export type Accion =
  | "confirmarPago"
  | "utilizar"
  | "cancelar"
  | "reembolsar"
  | "resenar"

export type CambioEstado = {
  estado: EstadoCompra
  quien: Usuario
  fechaHora: string
}

export type Mensaje = {
  id: string
  usuario: Usuario
  texto: string
  enviado: string
}

export type Compra = {
  id: string
  creada: string
  estado: EstadoCompra
  cantidad: number
  total: number
  comprador: Usuario
  evento: { id: string; nombre: string; fecha: string; organizador: Usuario }
  tipoEntrada: { id: string; nombre: string; precio: number }
  diasParaElEvento: number | null
  acciones: Accion[]
  historial: CambioEstado[]
  mensajes: Mensaje[]
  resena: Resena | null
}

export type ComprasDeEvento = {
  evento: Evento
  compras: Compra[]
}

export type OrdenCompras = "recientes" | "antiguas"

export type OrdenEventos = "precio" | "fecha" | "puntaje"

export type FiltrosEventos = {
  texto: string
  categoriaId: string | null
  orden: OrdenEventos
}

export type NuevaCompra = {
  eventoId: string
  tipoEntradaId: string
  cantidad: number
}

export type NuevoEvento = {
  nombre: string
  descripcion: string
  categoriaId: string
  fecha: string
  multimedia: string[]
  limitePorUsuario: number
  tiposEntrada: Omit<TipoEntrada, "id" | "disponibles">[]
}

export type NuevaResena = {
  puntuacion: number
  detalle: string
}
