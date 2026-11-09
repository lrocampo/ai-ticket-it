import { ActivityIndicator, StyleSheet, View } from "react-native"

import { theme } from "../theme"

export function Cargando() {
  return (
    <View style={styles.contenedor}>
      <ActivityIndicator size="large" color={theme.colores.primario} />
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colores.fondo,
  },
})
