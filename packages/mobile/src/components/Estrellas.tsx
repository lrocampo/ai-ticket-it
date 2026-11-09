import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, View } from "react-native"

import { theme } from "../theme"

type Props = {
  puntuacion: number
  tamano?: number
  onCambio?: (puntuacion: number) => void
}

const PUNTUACIONES = [1, 2, 3, 4, 5]

export function Estrellas({ puntuacion, tamano = 16, onCambio }: Props) {
  function estrella(n: number) {
    return (
      <Ionicons
        key={n}
        name={n <= puntuacion ? "star" : "star-outline"}
        size={tamano}
        color={theme.colores.estrella}
      />
    )
  }

  if (!onCambio) {
    return (
      <View
        style={styles.fila}
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${puntuacion} de 5 estrellas`}
      >
        {PUNTUACIONES.map(estrella)}
      </View>
    )
  }

  const margen = Math.max(0, (theme.areaTactil - tamano) / 2)
  return (
    <View
      style={[styles.fila, { gap: margen * 2 }]}
      accessibilityRole="radiogroup"
      accessibilityLabel="Puntuación"
    >
      {PUNTUACIONES.map((n) => (
        <Pressable
          key={n}
          onPress={() => onCambio(n)}
          hitSlop={margen}
          accessibilityRole="radio"
          accessibilityLabel={n === 1 ? "1 estrella" : `${n} estrellas`}
          accessibilityState={{ checked: n === puntuacion }}
        >
          {estrella(n)}
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", gap: 2 },
})
