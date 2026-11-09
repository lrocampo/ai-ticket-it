import { useState } from "react"
import { Alert } from "react-native"

import { Boton } from "../../components/Boton"
import { Campo } from "../../components/Campo"
import { Estrellas } from "../../components/Estrellas"
import { Seccion } from "../../components/Seccion"
import { mensajeDe, resenarCompra } from "../../services/api"
import type { Compra } from "../../types"

type Props = {
  compra: Compra
  onCompraActualizada: (compra: Compra) => void
}

export function FormularioResena({ compra, onCompraActualizada }: Props) {
  const [puntuacion, setPuntuacion] = useState(0)
  const [detalle, setDetalle] = useState("")
  const [enviando, setEnviando] = useState(false)
  const completa = puntuacion > 0 && detalle.trim() !== ""

  async function enviar() {
    setEnviando(true)
    try {
      onCompraActualizada(
        await resenarCompra(compra.id, { puntuacion, detalle: detalle.trim() }),
      )
    } catch (e) {
      Alert.alert("No se pudo", mensajeDe(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Seccion titulo="Contanos cómo estuvo">
      <Estrellas puntuacion={puntuacion} tamano={32} onCambio={setPuntuacion} />
      <Campo
        etiqueta="Tu comentario"
        value={detalle}
        onChangeText={setDetalle}
        placeholder="¿Qué te pareció el evento?"
        multiline
      />
      <Boton
        texto={enviando ? "Enviando…" : "Enviar reseña"}
        deshabilitado={!completa || enviando}
        onPress={enviar}
      />
    </Seccion>
  )
}
