import { Pressable, StyleSheet, Text } from "react-native"

import { theme } from "../theme"

type Props = {
  texto: string
  activo: boolean
  onPress: () => void
}

export function Chip({ texto, activo, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, activo && styles.chipActivo]}
      accessibilityRole="button"
      accessibilityState={{ selected: activo }}
    >
      <Text style={[styles.texto, activo && styles.textoActivo]}>{texto}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: theme.espacios.l,
    paddingVertical: theme.espacios.s,
    borderRadius: theme.radios.pill,
    borderWidth: 1,
    borderColor: theme.colores.borde,
    backgroundColor: theme.colores.superficie,
  },
  chipActivo: {
    backgroundColor: theme.colores.primario,
    borderColor: theme.colores.primario,
  },
  texto: {
    ...theme.texto.chico,
    color: theme.colores.texto,
    fontWeight: "500",
  },
  textoActivo: {
    color: theme.colores.sobrePrimario,
  },
})
