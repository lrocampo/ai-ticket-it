// Puntaje de un organizador: el promedio de las puntuaciones de las reseñas
// de todos sus eventos, o null cuando todavía no tiene ninguna.
export default function reputacion(resenas) {
  const puntaje =
    resenas.length === 0
      ? null
      : resenas.reduce((suma, resena) => suma + resena.puntuacion, 0) /
        resenas.length
  return { puntaje, cantidadResenas: resenas.length, resenas }
}
