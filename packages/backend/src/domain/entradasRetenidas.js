export default function entradasRetenidas(comprador, evento, compras) {
  return compras
    .filter(
      (compra) =>
        compra.evento === evento &&
        compra.esComprador(comprador) &&
        compra.retieneEntradas(),
    )
    .reduce((suma, compra) => suma + compra.cantidad, 0)
}
