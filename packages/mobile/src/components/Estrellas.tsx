import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, View } from "react-native"

import { theme } from "../theme"

type Props = {
  puntuacion: number
  tamano?: number
}

export function Estrellas({ puntuacion, tamano = 16 }: Props) {
  return (
    <View
      style={styles.fila}
      accessibilityLabel={`${puntuacion} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Ionicons
          key={n}
          name={n <= puntuacion ? "star" : "star-outline"}
          size={tamano}
          color={theme.colores.estrella}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  fila: { flexDirection: "row", gap: 2 },
})
