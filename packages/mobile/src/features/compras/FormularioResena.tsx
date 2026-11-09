import { useState } from "react"

import { Boton } from "../../components/Boton"
import { Campo } from "../../components/Campo"
import { Estrellas } from "../../components/Estrellas"
import { Seccion } from "../../components/Seccion"
import { useEnvio } from "../../hooks/useEnvio"
import { resenarCompra } from "../../services/api"
import type { Compra } from "../../types"

type Props = {
  compra: Compra
  onCompraActualizada: (compra: Compra) => void
}

export function FormularioResena({ compra, onCompraActualizada }: Props) {
  const [puntuacion, setPuntuacion] = useState(0)
  const [detalle, setDetalle] = useState("")
  const { enviando, enviar } = useEnvio()
  const completa = puntuacion > 0 && detalle.trim() !== ""

  function enviarResena() {
    enviar(async () => {
      const resena = { puntuacion, detalle: detalle.trim() }
      onCompraActualizada(await resenarCompra(compra.id, resena))
    })
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
        onPress={enviarResena}
      />
    </Seccion>
  )
}
