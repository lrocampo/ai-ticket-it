import { Ionicons } from "@expo/vector-icons"
import { Pressable } from "react-native"

import { theme } from "../theme"

const ICONO = 20

type Props = {
  etiqueta: string
  onPress: () => void
}

export function BotonQuitar({ etiqueta, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={theme.margenTactil(ICONO)}
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
    >
      <Ionicons name="trash-outline" size={ICONO} color={theme.colores.error} />
    </Pressable>
  )
}
