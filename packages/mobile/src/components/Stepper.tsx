import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"

const TAMANO = 36
const MARGEN = (theme.areaTactil - TAMANO) / 2

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
        hitSlop={MARGEN}
        disabled={!puedeBajar}
        onPress={() => onCambio(valor - 1)}
        accessibilityRole="button"
        accessibilityLabel="Restar uno"
        accessibilityState={{ disabled: !puedeBajar }}
      >
        <Ionicons name="remove" size={20} color={theme.colores.primario} />
      </Pressable>
      <Text style={styles.valor}>{valor}</Text>
      <Pressable
        style={[styles.boton, !puedeSubir && styles.deshabilitado]}
        hitSlop={MARGEN}
        disabled={!puedeSubir}
        onPress={() => onCambio(valor + 1)}
        accessibilityRole="button"
        accessibilityLabel="Sumar uno"
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
    opacity: 0.4,
  },
  valor: {
    ...theme.texto.subtitulo,
    minWidth: 28,
    textAlign: "center",
  },
})
