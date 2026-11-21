import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, View, type ViewProps } from "react-native"

import { theme } from "../theme"

export function SinImagen({ style, ...props }: ViewProps) {
  return (
    <View testID="sin-imagen" style={[styles.caja, style]} {...props}>
      <Ionicons
        name="ticket-outline"
        size={40}
        color={theme.colores.primario}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  caja: {
    backgroundColor: theme.colores.primarioSuave,
    alignItems: "center",
    justifyContent: "center",
  },
})
