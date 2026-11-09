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
        <Text style={theme.texto.secundario}>Todavía no hay mensajes.</Text>
      ) : (
        compra.mensajes.map((mensaje) => {
          const esMio = mensaje.usuario.id === usuario?.id
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
  hora: {
    fontSize: 11,
    color: theme.colores.textoSecundario,
    alignSelf: "flex-end",
  },
})
