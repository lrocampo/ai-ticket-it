import { Pressable, StyleSheet, Text } from "react-native"

import { theme } from "../theme"

export type Tono = "primario" | "secundario" | "peligro"

const COLORES: Record<Tono, { fondo: string; texto: string; borde: string }> = {
  primario: {
    fondo: theme.colores.primario,
    texto: theme.colores.sobrePrimario,
    borde: theme.colores.primario,
  },
  secundario: {
    fondo: theme.colores.primarioSuave,
    texto: theme.colores.primario,
    borde: theme.colores.primarioSuave,
  },
  peligro: {
    fondo: theme.colores.superficie,
    texto: theme.colores.error,
    borde: theme.colores.error,
  },
}

type Props = {
  texto: string
  onPress: () => void
  tono?: Tono
  deshabilitado?: boolean
}

export function Boton({
  texto,
  onPress,
  tono = "primario",
  deshabilitado = false,
}: Props) {
  const colores = COLORES[tono]
  return (
    <Pressable
      onPress={onPress}
      disabled={deshabilitado}
      accessibilityRole="button"
      accessibilityState={{ disabled: deshabilitado }}
      style={({ pressed }) => [
        styles.boton,
        { backgroundColor: colores.fondo, borderColor: colores.borde },
        pressed && styles.presionado,
        deshabilitado && styles.deshabilitado,
      ]}
    >
      <Text style={[styles.texto, { color: colores.texto }]}>{texto}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  boton: {
    alignItems: "center",
    paddingVertical: theme.espacios.m,
    paddingHorizontal: theme.espacios.xl,
    borderRadius: theme.radios.m,
    borderWidth: 1,
  },
  presionado: {
    opacity: 0.85,
  },
  deshabilitado: {
    opacity: 0.5,
  },
  texto: {
    ...theme.texto.cuerpo,
    fontWeight: "700",
  },
})
