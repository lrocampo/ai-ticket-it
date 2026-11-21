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
      <Text style={theme.texto.subtitulo} accessibilityRole="header">
        {titulo}
      </Text>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  seccion: {
    ...theme.tarjeta,
    padding: theme.espacios.l,
    gap: theme.espacios.m,
  },
})
