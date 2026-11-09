import { Ionicons } from "@expo/vector-icons"
import { StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"
import { Boton } from "./Boton"

type Props = {
  mensaje: string
  onReintentar: () => void
}

export function MensajeDeError({ mensaje, onReintentar }: Props) {
  return (
    <View style={styles.contenedor}>
      <Ionicons
        name="cloud-offline-outline"
        size={48}
        color={theme.colores.textoSecundario}
      />
      <Text style={styles.mensaje}>{mensaje}</Text>
      <Boton texto="Reintentar" onPress={onReintentar} />
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: theme.espacios.m,
    padding: theme.espacios.xl,
    backgroundColor: theme.colores.fondo,
  },
  mensaje: {
    ...theme.texto.cuerpo,
    textAlign: "center",
  },
})
