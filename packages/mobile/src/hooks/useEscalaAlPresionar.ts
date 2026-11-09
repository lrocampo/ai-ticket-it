import { useRef } from "react"
import { Animated, Easing } from "react-native"

import { useMovimientoReducido } from "./useMovimientoReducido"

// 0.96 en 150 ms con ease-out son los valores exactos de better-ui ("Press
// scales to 0.96").
const ESCALA_PRESIONADO = 0.96
const DURACION_MS = 150

export function useEscalaAlPresionar() {
  const movimientoReducido = useMovimientoReducido()
  const escala = useRef(new Animated.Value(1)).current

  function animarA(valor: number) {
    Animated.timing(escala, {
      toValue: valor,
      duration: DURACION_MS,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start()
  }

  return {
    estilo: { transform: [{ scale: escala }] },
    alPresionar: () => {
      if (!movimientoReducido) animarA(ESCALA_PRESIONADO)
    },
    alSoltar: () => animarA(1),
  }
}
