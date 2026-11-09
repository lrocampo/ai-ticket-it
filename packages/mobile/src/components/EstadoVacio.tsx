import { Ionicons } from "@expo/vector-icons"
import type { ComponentProps } from "react"
import { StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"
import { Boton } from "./Boton"

type Props = {
  mensaje: string
  icono?: ComponentProps<typeof Ionicons>["name"]
  accion?: { etiqueta: string; onPress: () => void }
}

export function EstadoVacio({
  mensaje,
  icono = "search-outline",
  accion,
}: Props) {
  return (
    <View style={styles.contenedor}>
      <Ionicons name={icono} size={48} color={theme.colores.textoSecundario} />
      <Text style={styles.mensaje}>{mensaje}</Text>
      {accion && (
        <Boton
          texto={accion.etiqueta}
          tono="secundario"
          onPress={accion.onPress}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: "center",
    gap: theme.espacios.m,
    paddingVertical: theme.espacios.xl * 2,
    paddingHorizontal: theme.espacios.xl,
  },
  mensaje: {
    ...theme.texto.cuerpo,
    color: theme.colores.textoSecundario,
    textAlign: "center",
  },
})
