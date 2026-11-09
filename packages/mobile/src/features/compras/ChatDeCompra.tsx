import { StyleSheet, Text, View } from "react-native"

import { useUsuario } from "../../context/UsuarioContext"
import { theme } from "../../theme"
import type { Compra } from "../../types"
import { formatearFechaHora } from "../../utils/fechas"

type Props = {
  compra: Compra
  onCompraActualizada: (compra: Compra) => void
}

export function ChatDeCompra({ compra }: Props) {
  const { usuario } = useUsuario()

  return (
    <View style={styles.contenedor}>
      {compra.mensajes.length === 0 ? (
        <Text style={styles.vacio}>Todavía no hay mensajes.</Text>
      ) : (
        compra.mensajes.map((mensaje) => {
          const esMio = mensaje.usuario.id === usuario?.id
          return (
            <View
              key={mensaje.id}
              style={[styles.burbuja, esMio ? styles.mia : styles.ajena]}
            >
              <Text style={styles.autor}>
                {esMio ? "Vos" : mensaje.usuario.nombre}
              </Text>
              <Text style={styles.texto}>{mensaje.texto}</Text>
              <Text style={styles.hora}>
                {formatearFechaHora(mensaje.enviado)}
              </Text>
            </View>
          )
        })
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  contenedor: {
    gap: theme.espacios.s,
  },
  vacio: {
    ...theme.texto.chico,
    color: theme.colores.textoSecundario,
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
  autor: {
    ...theme.texto.chico,
    color: theme.colores.primario,
    fontWeight: "600",
  },
  texto: {
    ...theme.texto.cuerpo,
    color: theme.colores.texto,
  },
  hora: {
    fontSize: 11,
    color: theme.colores.textoSecundario,
    alignSelf: "flex-end",
  },
})
