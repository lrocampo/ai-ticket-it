import { StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"
import type { Compra } from "../types"
import {
  formatearFecha,
  formatearPesos,
  textoDiasRestantes,
} from "../utils/fechas"
import { BadgeEstado } from "./BadgeEstado"
import { Tarjeta } from "./Tarjeta"

type Props = {
  compra: Compra
  vista: "comprador" | "organizador"
  onPress: () => void
}

export function TarjetaCompra({ compra, vista, onPress }: Props) {
  const titulo =
    vista === "comprador"
      ? compra.evento.nombre
      : `${compra.comprador.nombre} ${compra.comprador.apellido}`

  return (
    <Tarjeta style={styles.tarjeta} onPress={onPress}>
      <View style={styles.encabezado}>
        <Text style={styles.titulo} numberOfLines={2}>
          {titulo}
        </Text>
        <BadgeEstado estado={compra.estado} />
      </View>
      {vista === "comprador" && (
        <Text style={theme.texto.secundario}>
          {formatearFecha(compra.evento.fecha)}
        </Text>
      )}
      <View style={styles.pie}>
        <Text style={styles.cantidad}>
          {compra.tipoEntrada.nombre} × {compra.cantidad}
        </Text>
        <Text style={styles.total}>{formatearPesos(compra.total)}</Text>
      </View>
      {vista === "comprador" && compra.diasParaElEvento !== null && (
        <Text style={styles.dias}>
          {textoDiasRestantes(compra.diasParaElEvento)}
        </Text>
      )}
    </Tarjeta>
  )
}

const styles = StyleSheet.create({
  tarjeta: {
    padding: theme.espacios.l,
    gap: theme.espacios.xs,
  },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.espacios.m,
  },
  titulo: {
    ...theme.texto.subtitulo,
    flex: 1,
  },
  pie: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.espacios.xs,
  },
  cantidad: {
    ...theme.texto.secundario,
    fontVariant: ["tabular-nums"],
  },
  total: {
    ...theme.texto.cuerpo,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  dias: {
    ...theme.texto.destacado,
    fontVariant: ["tabular-nums"],
  },
})
