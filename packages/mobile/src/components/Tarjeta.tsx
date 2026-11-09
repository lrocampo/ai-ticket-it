import type { ReactNode } from "react"
import {
  Animated,
  Pressable,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from "react-native"

import { useEscalaAlPresionar } from "../hooks/useEscalaAlPresionar"
import { theme } from "../theme"

type Props = {
  onPress: () => void
  style?: StyleProp<ViewStyle>
  children: ReactNode
}

export function Tarjeta({ onPress, style, children }: Props) {
  const { estilo, alPresionar, alSoltar } = useEscalaAlPresionar()
  return (
    <Animated.View style={estilo}>
      <Pressable
        onPress={onPress}
        onPressIn={alPresionar}
        onPressOut={alSoltar}
        accessibilityRole="button"
        style={({ pressed }) => [
          theme.tarjeta,
          style,
          pressed && styles.presionada,
        ]}
      >
        {children}
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  presionada: {
    opacity: 0.85,
  },
})
