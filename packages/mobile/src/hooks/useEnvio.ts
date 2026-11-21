import { useState } from "react"
import { AccessibilityInfo, Alert } from "react-native"

import { mensajeDe } from "../services/api"

export function useEnvio() {
  const [enviando, setEnviando] = useState(false)

  async function enviar(tituloDelError: string, pedido: () => Promise<void>) {
    setEnviando(true)
    try {
      await pedido()
    } catch (e) {
      const mensaje = mensajeDe(e)
      AccessibilityInfo.announceForAccessibility(
        `${tituloDelError}. ${mensaje}`,
      )
      Alert.alert(tituloDelError, mensaje)
    } finally {
      setEnviando(false)
    }
  }

  return { enviando, enviar }
}
