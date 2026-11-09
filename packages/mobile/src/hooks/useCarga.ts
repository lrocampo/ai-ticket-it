import { useFocusEffect } from "expo-router"
import { type DependencyList, useCallback, useRef, useState } from "react"

export function useCarga<T>(fn: () => Promise<T>, deps: DependencyList) {
  const [datos, setDatos] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refrescando, setRefrescando] = useState(false)
  const ultimoPedido = useRef(0)

  const recargar = useCallback(async () => {
    // Si cambian los filtros mientras un pedido está en vuelo, la respuesta
    // vieja no tiene que pisar a la nueva.
    const pedido = ++ultimoPedido.current
    setError(null)
    try {
      const resultado = await fn()
      if (pedido === ultimoPedido.current) setDatos(resultado)
    } catch (e) {
      if (pedido === ultimoPedido.current) setError((e as Error).message)
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
