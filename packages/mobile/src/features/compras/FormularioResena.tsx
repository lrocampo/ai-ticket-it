import { useState } from "react"
import { AccessibilityInfo, Text } from "react-native"

import { Boton } from "../../components/Boton"
import { Campo } from "../../components/Campo"
import { Estrellas } from "../../components/Estrellas"
import { Seccion } from "../../components/Seccion"
import { useEnvio } from "../../hooks/useEnvio"
import { resenarCompra } from "../../services/api"
import { theme } from "../../theme"
import type { Compra } from "../../types"

type Props = {
  compra: Compra
  onCompraActualizada: (compra: Compra) => void
}

export function FormularioResena({ compra, onCompraActualizada }: Props) {
  const [puntuacion, setPuntuacion] = useState(0)
  const [detalle, setDetalle] = useState("")
  const [intentoEnviar, setIntentoEnviar] = useState(false)
  const { enviando, enviar } = useEnvio()
  const faltaPuntuacion = intentoEnviar && puntuacion === 0
  const faltaDetalle = intentoEnviar && detalle.trim() === ""

  function enviarResena() {
    if (puntuacion === 0 || detalle.trim() === "") {
      setIntentoEnviar(true)
      AccessibilityInfo.announceForAccessibility(
        puntuacion === 0 ? "Elegí una puntuación" : "Contanos algo del evento",
      )
      return
    }
    enviar("No se pudo guardar la reseña", async () => {
      const resena = { puntuacion, detalle: detalle.trim() }
      onCompraActualizada(await resenarCompra(compra.id, resena))
      AccessibilityInfo.announceForAccessibility("Reseña publicada")
    })
  }

  return (
    <Seccion titulo="Contanos cómo estuvo">
      <Estrellas puntuacion={puntuacion} tamano={32} onCambio={setPuntuacion} />
      {faltaPuntuacion && (
        <Text style={theme.texto.error}>Elegí una puntuación.</Text>
      )}
      <Campo
        etiqueta="Tu comentario"
        value={detalle}
        onChangeText={setDetalle}
        placeholder="¿Qué te pareció el evento?"
        multiline
        error={faltaDetalle ? "Contanos algo del evento." : undefined}
      />
      <Boton
        texto={enviando ? "Enviando…" : "Enviar reseña"}
        deshabilitado={enviando}
        onPress={enviarResena}
      />
    </Seccion>
  )
}
