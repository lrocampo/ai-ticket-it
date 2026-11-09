import type { ReactNode } from "react"
import {
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from "react-native"

import { theme } from "../theme"

type Props = {
  onPress: () => void
  style?: StyleProp<ViewStyle>
  children: ReactNode
}

export function Tarjeta({ onPress, style, children }: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        theme.tarjeta,
        style,
        pressed && styles.presionada,
      ]}
    >
      {children}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  presionada: {
    opacity: 0.85,
  },
})
