// Convierten el dominio (con referencias circulares) a las formas JSON de
// docs/api.md. `reputacion` viene de EventoService.reputacionDe.

export const presentarUsuario = ({ id, nombre, apellido, email }) => ({
  id,
  nombre,
  apellido,
  email,
})

export const presentarCategoria = ({ id, nombre, descripcion }) => ({
  id,
  nombre,
  descripcion,
})

export const presentarTipoEntrada = (tipo) => ({
  id: tipo.id,
  nombre: tipo.nombre,
  descripcion: tipo.descripcion,
  precio: tipo.precio,
  cupo: tipo.cupo,
  disponibles: tipo.disponibles(),
})

export const presentarOrganizador = (usuario, reputacion) => ({
  ...presentarUsuario(usuario),
  puntaje: reputacion.puntaje,
  cantidadResenas: reputacion.cantidadResenas,
})

export const presentarEvento = (evento, reputacion, ahora = new Date()) => ({
  id: evento.id,
  nombre: evento.nombre,
  descripcion: evento.descripcion,
  categoria: presentarCategoria(evento.categoria),
  fecha: evento.fecha.toISOString(),
  multimedia: evento.multimedia,
  organizador: presentarOrganizador(evento.organizador, reputacion),
  tiposEntrada: evento.tiposEntrada.map(presentarTipoEntrada),
  precioDesde: evento.precioDesde(),
  yaOcurrio: evento.yaOcurrio(ahora),
})

export const presentarEventoDetalle = (
  evento,
  reputacion,
  ahora = new Date(),
) => ({
  ...presentarEvento(evento, reputacion, ahora),
  resenasDelOrganizador: reputacion.resenas.map(presentarResena),
})

export const presentarResena = (resena) => ({
  id: resena.id,
  puntuacion: resena.puntuacion,
  detalle: resena.detalle,
  fecha: resena.fecha.toISOString(),
  comprador: presentarUsuario(resena.comprador),
  evento: { id: resena.evento.id, nombre: resena.evento.nombre },
})

const presentarCambioEstado = (cambio) => ({
  estado: cambio.estado,
  quien: presentarUsuario(cambio.quien),
  fechaHora: cambio.fechaHora.toISOString(),
})

const presentarMensaje = (mensaje) => ({
  id: mensaje.id,
  usuario: presentarUsuario(mensaje.usuario),
  texto: mensaje.texto,
  enviado: mensaje.enviado.toISOString(),
})

export const presentarCompra = (compra, ahora = new Date()) => ({
  id: compra.id,
  estado: compra.estado,
  cantidad: compra.cantidad,
  total: compra.total,
  comprador: presentarUsuario(compra.comprador),
  evento: {
    id: compra.evento.id,
    nombre: compra.evento.nombre,
    fecha: compra.evento.fecha.toISOString(),
    organizador: presentarUsuario(compra.evento.organizador),
  },
  tipoEntrada: {
    id: compra.tipoEntrada.id,
    nombre: compra.tipoEntrada.nombre,
    precio: compra.tipoEntrada.precio,
  },
  diasParaElEvento: compra.diasParaElEvento(ahora),
  puedeCancelarse: compra.puedeCancelarse(ahora),
  puedeResenarse: compra.puedeResenarse(),
  historial: compra.historial.map(presentarCambioEstado),
  mensajes: compra.mensajes.map(presentarMensaje),
  resena: compra.resena && presentarResena(compra.resena),
})
