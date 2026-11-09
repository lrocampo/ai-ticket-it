import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, View } from "react-native"

import { theme } from "../theme"

type Props = {
  puntuacion: number
  tamano?: number
  onCambio?: (puntuacion: number) => void
}

export function Estrellas({ puntuacion, tamano = 16, onCambio }: Props) {
  return (
    <View
      style={styles.fila}
      accessibilityLabel={`${puntuacion} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const estrella = (
          <Ionicons
            key={n}
            name={n <= puntuacion ? "star" : "star-outline"}
            size={tamano}
            color={theme.colores.estrella}
          />
        )
        if (!onCambio) return estrella
        return (
          <Pressable
            key={n}
            onPress={() => onCambio(n)}
            hitSlop={4}
            accessibilityRole="button"
            accessibilityLabel={n === 1 ? "1 estrella" : `${n} estrellas`}
          >
            {estrella}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", gap: 2 },
})
