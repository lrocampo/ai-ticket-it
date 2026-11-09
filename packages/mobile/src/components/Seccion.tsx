import type { ReactNode } from "react"
import { StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"

type Props = {
  titulo: string
  children: ReactNode
}

export function Seccion({ titulo, children }: Props) {
  return (
    <View style={styles.seccion}>
      <Text style={styles.titulo}>{titulo}</Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  seccion: {
    backgroundColor: theme.colores.superficie,
    borderRadius: theme.radios.m,
    padding: theme.espacios.l,
    gap: theme.espacios.m,
    ...theme.sombra,
  },
  titulo: {
    ...theme.texto.subtitulo,
    color: theme.colores.texto,
  },
})
