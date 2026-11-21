import { StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"
import type { OrdenCompras } from "../types"
import { Chip } from "./Chip"

const ORDENES: { valor: OrdenCompras; etiqueta: string }[] = [
  { valor: "recientes", etiqueta: "Más recientes" },
  { valor: "antiguas", etiqueta: "Más antiguas" },
]

type Props = {
  orden: OrdenCompras
  onCambio: (orden: OrdenCompras) => void
}

export function SelectorOrdenCompras({ orden, onCambio }: Props) {
  return (
    <View style={styles.orden}>
      <Text style={theme.texto.secundario}>Ordenar por</Text>
      {ORDENES.map((opcion) => (
        <Chip
          key={opcion.valor}
          texto={opcion.etiqueta}
          activo={orden === opcion.valor}
          onPress={() => onCambio(opcion.valor)}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  orden: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.espacios.s,
  },
})
