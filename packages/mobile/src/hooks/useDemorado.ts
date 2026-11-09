import { useEffect, useState } from "react"

export function useDemorado<T>(valor: T, milisegundos: number): T {
  const [demorado, setDemorado] = useState(valor)

  useEffect(() => {
    const timer = setTimeout(() => setDemorado(valor), milisegundos)
    return () => clearTimeout(timer)
  }, [valor, milisegundos])

  return demorado
}
