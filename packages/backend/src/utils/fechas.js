export const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000

export const sumarDias = (fecha, dias) =>
  new Date(fecha.getTime() + dias * MILISEGUNDOS_POR_DIA)
