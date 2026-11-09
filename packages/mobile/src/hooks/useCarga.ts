import { useFocusEffect } from "expo-router"
import { type DependencyList, useCallback, useRef, useState } from "react"

import { mensajeDe } from "../services/api"

export function useCarga<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refrescando, setRefrescando] = useState(false)
  const pedidoVigente = useRef(0)

  const recargar = useCallback(async () => {
    const pedido = ++pedidoVigente.current
    setError(null)
    try {
      const resultado = await fn()
      if (pedido === pedidoVigente.current) setDatos(resultado)
    } catch (e) {
      if (pedido === pedidoVigente.current) setError(mensajeDe(e))
    }
  }, deps)

  const refrescar = useCallback(async () => {
    setRefrescando(true)
    await recargar()
    setRefrescando(false)
  }, [recargar])

  useFocusEffect(
    useCallback(() => {
      recargar()
    }, [recargar]),
  )

  return { datos, setDatos, error, recargar, refrescando, refrescar }
}
