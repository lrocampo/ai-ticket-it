import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"
import type { Organizador } from "../types"

type Props = {
  organizador: Organizador
}

export function Puntaje({ organizador }: Props) {
  const { puntaje, cantidadResenas } = organizador
  if (puntaje === null) {
    return <Text style={styles.texto}>sin reseñas</Text>
  }
  const resenas = cantidadResenas === 1 ? "reseña" : "reseñas"
  return (
    <View style={styles.fila}>
      <Ionicons name="star" size={13} color={theme.colores.estrella} />
      <Text style={styles.texto}>
        {puntaje.toFixed(1)} · {cantidadResenas} {resenas}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", alignItems: "center", gap: 3 },
  texto: {
    ...theme.texto.chico,
    color: theme.colores.textoSecundario,
  },
})
