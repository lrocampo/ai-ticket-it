import { useEffect, useState } from "react"
import { AccessibilityInfo } from "react-native"

export function useMovimientoReducido() {
  const [reducido, setReducido] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducido)
    const suscripcion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReducido,
    )
    return () => suscripcion.remove()
  }, [])

  return reducido
}
