import { useState } from "react"
import { Alert, StyleSheet, TextInput } from "react-native"

import { Boton } from "../../components/Boton"
import { Estrellas } from "../../components/Estrellas"
import { Seccion } from "../../components/Seccion"
import { mensajeDe, resenarCompra } from "../../services/api"
import { theme } from "../../theme"
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
      <TextInput
        style={styles.detalle}
        value={detalle}
        onChangeText={setDetalle}
        placeholder="¿Qué te pareció el evento?"
        placeholderTextColor={theme.colores.textoSecundario}
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

const styles = StyleSheet.create({
  detalle: {
    ...theme.texto.cuerpo,
    minHeight: 96,
    padding: theme.espacios.m,
    borderRadius: theme.radios.s,
    borderWidth: 1,
    borderColor: theme.colores.borde,
    textAlignVertical: "top",
  },
})
