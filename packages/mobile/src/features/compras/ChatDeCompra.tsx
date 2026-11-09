import { Ionicons } from "@expo/vector-icons"
import { useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"

import { useUsuarioActual } from "../../context/UsuarioContext"
import { useEnvio } from "../../hooks/useEnvio"
import { enviarMensaje } from "../../services/api"
import { theme } from "../../theme"
import type { Compra } from "../../types"
import { formatearFechaHora } from "../../utils/fechas"

type Props = {
  compra: Compra
  onCompraActualizada: (compra: Compra) => void
}

export function ChatDeCompra({ compra, onCompraActualizada }: Props) {
  const usuario = useUsuarioActual()
  const [texto, setTexto] = useState("")
  const { enviando, enviar } = useEnvio()
  const puedeEnviar = texto.trim() !== "" && !enviando

  function enviarTexto() {
    enviar(async () => {
      onCompraActualizada(await enviarMensaje(compra.id, texto.trim()))
      setTexto("")
    })
  }

  return (
    <View style={styles.contenedor}>
      {compra.mensajes.length === 0 ? (
        <Text style={theme.texto.secundario}>Todavía no hay mensajes.</Text>
      ) : (
        compra.mensajes.map((mensaje) => {
          const esMio = mensaje.usuario.id === usuario.id
          return (
            <View
              key={mensaje.id}
              style={[styles.burbuja, esMio ? styles.mia : styles.ajena]}
            >
              <Text style={theme.texto.destacado}>
                {esMio ? "Vos" : mensaje.usuario.nombre}
              </Text>
              <Text style={theme.texto.cuerpo}>{mensaje.texto}</Text>
              <Text style={styles.hora}>
                {formatearFechaHora(mensaje.enviado)}
              </Text>
            </View>
          )
        })
      )}
      <View style={styles.redaccion}>
        <TextInput
          style={styles.input}
          value={texto}
          onChangeText={setTexto}
          placeholder="Escribí un mensaje"
          accessibilityLabel="Mensaje"
          placeholderTextColor={theme.colores.textoSecundario}
          multiline
        />
        <Pressable
          style={[styles.enviar, !puedeEnviar && styles.deshabilitado]}
          disabled={!puedeEnviar}
          onPress={enviarTexto}
          accessibilityRole="button"
          accessibilityLabel="Enviar mensaje"
          accessibilityState={{ disabled: !puedeEnviar }}
        >
          <Ionicons name="send" size={18} color={theme.colores.sobrePrimario} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    gap: theme.espacios.s,
  },
  burbuja: {
    maxWidth: "85%",
    padding: theme.espacios.m,
    borderRadius: theme.radios.m,
    gap: 2,
  },
  mia: {
    alignSelf: "flex-end",
    backgroundColor: theme.colores.primarioSuave,
  },
  ajena: {
    alignSelf: "flex-start",
    backgroundColor: theme.colores.fondo,
  },
  redaccion: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: theme.espacios.s,
    marginTop: theme.espacios.s,
  },
  input: {
    ...theme.input,
    flex: 1,
    maxHeight: 120,
    borderRadius: theme.radios.m,
  },
  enviar: {
    width: 40,
    height: 40,
    borderRadius: theme.radios.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colores.primario,
  },
  deshabilitado: {
    opacity: 0.4,
  },
  hora: {
    fontSize: 11,
    color: theme.colores.textoSecundario,
    alignSelf: "flex-end",
  },
})
