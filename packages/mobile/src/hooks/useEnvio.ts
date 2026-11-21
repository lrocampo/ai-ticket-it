import { useState } from "react"
import { Alert } from "react-native"

import { mensajeDe } from "../services/api"

export function useEnvio() {
  const [enviando, setEnviando] = useState(false)

  async function enviar(tituloDelError: string, pedido: () => Promise<void>) {
    setEnviando(true)
    try {
      await pedido()
    } catch (e) {
      Alert.alert(tituloDelError, mensajeDe(e))
    } finally {
      setEnviando(false)
    }
  }

  return { enviando, enviar }
}
