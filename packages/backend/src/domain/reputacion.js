export default function reputacion(resenas) {
  const puntaje =
    resenas.length === 0
      ? null
      : resenas.reduce((suma, resena) => suma + resena.puntuacion, 0) /
        resenas.length
  return { puntaje, cantidadResenas: resenas.length, resenas }
}
