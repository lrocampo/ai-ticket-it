import { Pressable, StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"
import type { Compra } from "../types"
import {
  formatearFecha,
  formatearPesos,
  textoDiasRestantes,
} from "../utils/fechas"
import { BadgeEstado } from "./BadgeEstado"

type Props = {
  compra: Compra
  // El comprador ve el evento que compró; el organizador ya sabe qué evento
  // es y le interesa quién compró.
  vista: "comprador" | "organizador"
  onPress: () => void
}

export function TarjetaCompra({ compra, vista, onPress }: Props) {
  const titulo =
    vista === "comprador"
      ? compra.evento.nombre
      : `${compra.comprador.nombre} ${compra.comprador.apellido}`

  return (
    <Pressable
      style={({ pressed }) => [styles.tarjeta, pressed && styles.presionada]}
      onPress={onPress}
    >
      <View style={styles.encabezado}>
        <Text style={styles.titulo} numberOfLines={2}>
          {titulo}
        </Text>
        <BadgeEstado estado={compra.estado} />
      </View>
      {vista === "comprador" && (
        <Text style={styles.secundario}>
          {formatearFecha(compra.evento.fecha)}
        </Text>
      )}
      <View style={styles.pie}>
        <Text style={styles.secundario}>
          {compra.tipoEntrada.nombre} × {compra.cantidad}
        </Text>
        <Text style={styles.total}>{formatearPesos(compra.total)}</Text>
      </View>
      {vista === "comprador" && compra.diasParaElEvento !== null && (
        <Text style={styles.dias}>
          {textoDiasRestantes(compra.diasParaElEvento)}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: theme.colores.superficie,
    borderRadius: theme.radios.m,
    padding: theme.espacios.l,
    gap: theme.espacios.xs,
    ...theme.sombra,
  },
  presionada: {
    opacity: 0.85,
  },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.espacios.m,
  },
  titulo: {
    ...theme.texto.subtitulo,
    color: theme.colores.texto,
    flex: 1,
  },
  secundario: {
    ...theme.texto.chico,
    color: theme.colores.textoSecundario,
  },
  pie: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: theme.espacios.xs,
  },
  total: {
    ...theme.texto.cuerpo,
    color: theme.colores.texto,
    fontWeight: "700",
  },
  dias: {
    ...theme.texto.chico,
    color: theme.colores.primario,
    fontWeight: "600",
  },
})
