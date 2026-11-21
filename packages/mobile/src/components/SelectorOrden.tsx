import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native"

import { theme } from "../theme"
import { Chip } from "./Chip"

type Props<T extends string> = {
  opciones: { valor: T; etiqueta: string }[]
  orden: T
  onCambio: (orden: T) => void
  style?: StyleProp<ViewStyle>
}

export function SelectorOrden<T extends string>({
  opciones,
  orden,
  onCambio,
  style,
}: Props<T>) {
  return (
    <View style={[styles.orden, style]}>
      <Text style={theme.texto.secundario}>Ordenar por</Text>
      {opciones.map((opcion) => (
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
