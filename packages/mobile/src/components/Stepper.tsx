import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"

const TAMANO = 36

type Props = {
  valor: number
  minimo: number
  maximo: number
  onCambio: (valor: number) => void
}

export function Stepper({ valor, minimo, maximo, onCambio }: Props) {
  const puedeBajar = valor > minimo
  const puedeSubir = valor < maximo

  return (
    <View style={styles.fila}>
      <Pressable
        style={[styles.boton, !puedeBajar && styles.deshabilitado]}
        hitSlop={theme.margenTactil(TAMANO)}
        disabled={!puedeBajar}
        onPress={() => onCambio(valor - 1)}
        accessibilityRole="button"
        accessibilityLabel="Quitar una entrada"
        accessibilityState={{ disabled: !puedeBajar }}
      >
        <Ionicons name="remove" size={20} color={theme.colores.primario} />
      </Pressable>
      <Text style={styles.valor} accessibilityLiveRegion="polite">
        {valor}
      </Text>
      <Pressable
        style={[styles.boton, !puedeSubir && styles.deshabilitado]}
        hitSlop={theme.margenTactil(TAMANO)}
        disabled={!puedeSubir}
        onPress={() => onCambio(valor + 1)}
        accessibilityRole="button"
        accessibilityLabel="Agregar una entrada"
        accessibilityState={{ disabled: !puedeSubir }}
      >
        <Ionicons name="add" size={20} color={theme.colores.primario} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.espacios.m,
  },
  boton: {
    width: TAMANO,
    height: TAMANO,
    borderRadius: theme.radios.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colores.primarioSuave,
  },
  deshabilitado: {
    opacity: theme.opacidad.deshabilitado,
  },
  valor: {
    ...theme.texto.subtitulo,
    minWidth: 28,
    textAlign: "center",
    fontVariant: ["tabular-nums"],
  },
})
