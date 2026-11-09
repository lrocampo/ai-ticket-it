import { StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"
import type { EstadoCompra } from "../types"

const ESTILOS: Record<
  EstadoCompra,
  { etiqueta: string; color: string; fondo: string }
> = {
  PENDIENTE: { etiqueta: "Pendiente", color: "#8A5A00", fondo: "#FFF1D6" },
  CONFIRMADA: { etiqueta: "Confirmada", color: "#1B6B32", fondo: "#DFF3E4" },
  UTILIZADA: { etiqueta: "Utilizada", color: "#555360", fondo: "#ECEBF0" },
  CANCELADA: { etiqueta: "Cancelada", color: "#A61B1B", fondo: "#FBE2E2" },
  REEMBOLSADA: { etiqueta: "Reembolsada", color: "#1A4F99", fondo: "#DFEAFB" },
}

export function BadgeEstado({ estado }: { estado: EstadoCompra }) {
  const { etiqueta, color, fondo } = ESTILOS[estado]
  return (
    <View style={[styles.badge, { backgroundColor: fondo }]}>
      <Text style={[styles.texto, { color }]}>{etiqueta}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radios.pill,
  },
  texto: {
    fontSize: 12,
    fontWeight: "700",
  },
})
