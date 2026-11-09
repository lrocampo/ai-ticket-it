import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"

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
      <Pressable style={styles.boton} onPress={onReintentar}>
        <Text style={styles.textoBoton}>Reintentar</Text>
      </Pressable>
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
  boton: {
    backgroundColor: theme.colores.primario,
    paddingHorizontal: theme.espacios.xl,
    paddingVertical: theme.espacios.m,
    borderRadius: theme.radios.pill,
  },
  textoBoton: {
    ...theme.texto.cuerpo,
    color: theme.colores.sobrePrimario,
    fontWeight: "600",
  },
})
