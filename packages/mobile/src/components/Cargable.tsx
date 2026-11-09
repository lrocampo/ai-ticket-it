import type { ReactNode } from "react"
import { StyleSheet, Text } from "react-native"

import { theme } from "../theme"
import { Cargando } from "./Cargando"
import { MensajeDeError } from "./MensajeDeError"

type Props<T> = {
  carga: { datos: T | null; error: string | null; recargar: () => void }
  children: (datos: T) => ReactNode
}

export function Cargable<T>({ carga, children }: Props<T>) {
  const { datos, error, recargar } = carga
  if (datos === null) {
    if (error) return <MensajeDeError mensaje={error} onReintentar={recargar} />
    return <Cargando />
  }
  return (
    <>
      {error && <Text style={styles.aviso}>{error}</Text>}
      {children(datos)}
    </>
  )
}

const styles = StyleSheet.create({
  aviso: {
    ...theme.texto.secundario,
    color: theme.colores.error,
    textAlign: "center",
    paddingHorizontal: theme.espacios.l,
    paddingTop: theme.espacios.s,
  },
})
