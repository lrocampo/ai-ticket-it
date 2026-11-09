import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import { Alert, Pressable, StyleSheet, Text, View } from "react-native"

import { Seccion } from "../../components/Seccion"
import { Stepper } from "../../components/Stepper"
import { crearCompra, mensajeDe } from "../../services/api"
import { theme } from "../../theme"
import type { EventoDetalle, TipoEntrada } from "../../types"
import { formatearPesos } from "../../utils/fechas"

export function BloqueCompra({ evento }: { evento: EventoDetalle }) {
  const [tipoElegidoId, setTipoElegidoId] = useState<string | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [comprando, setComprando] = useState(false)

  const tipoElegido = evento.tiposEntrada.find((t) => t.id === tipoElegidoId)
  // Al volver a la pantalla se recargan los disponibles, y pueden haber bajado.
  const cantidadValida = tipoElegido
    ? Math.min(cantidad, tipoElegido.disponibles)
    : cantidad

  function elegirTipo(tipo: TipoEntrada) {
    setTipoElegidoId(tipo.id)
    setCantidad(1)
  }

  async function comprar() {
    if (!tipoElegido) return
    setComprando(true)
    try {
      await crearCompra({
        eventoId: evento.id,
        tipoEntradaId: tipoElegido.id,
        cantidad: cantidadValida,
      })
      router.dismissTo("/mis-compras")
      Alert.alert(
        "¡Compra hecha!",
        "Tu compra quedó pendiente. Confirmá el pago desde Mis compras.",
      )
    } catch (e) {
      Alert.alert("No pudimos hacer la compra", mensajeDe(e))
    } finally {
      setComprando(false)
    }
  }

  return (
    <Seccion titulo="Entradas">
      {evento.tiposEntrada.map((tipo) => {
        const agotado = tipo.disponibles === 0
        const elegido = tipo.id === tipoElegidoId
        return (
          <Pressable
            key={tipo.id}
            style={[
              styles.tipo,
              elegido && styles.tipoElegido,
              (agotado || evento.yaOcurrio) && styles.tipoDeshabilitado,
            ]}
            disabled={agotado || evento.yaOcurrio}
            onPress={() => elegirTipo(tipo)}
            accessibilityRole="radio"
            accessibilityState={{ checked: elegido }}
          >
            <Ionicons
              name={elegido ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={theme.colores.primario}
            />
            <View style={styles.datosTipo}>
              <Text style={styles.nombreTipo}>{tipo.nombre}</Text>
              {tipo.descripcion ? (
                <Text style={theme.texto.secundario}>{tipo.descripcion}</Text>
              ) : null}
              <Text style={theme.texto.secundario}>
                {agotado ? "Agotadas" : `${tipo.disponibles} disponibles`}
              </Text>
            </View>
            <Text style={styles.precioTipo}>{formatearPesos(tipo.precio)}</Text>
          </Pressable>
        )
      })}

      {evento.yaOcurrio ? (
        <Text style={styles.aviso}>
          Este evento ya ocurrió, no se pueden comprar entradas.
        </Text>
      ) : (
        <>
          <View style={styles.filaCantidad}>
            <Text style={theme.texto.cuerpo}>Cantidad</Text>
            <Stepper
              valor={cantidadValida}
              minimo={1}
              maximo={tipoElegido?.disponibles ?? 1}
              onCambio={setCantidad}
            />
          </View>
          <View style={styles.filaTotal}>
            <Text style={theme.texto.cuerpo}>Total</Text>
            <Text style={theme.texto.subtitulo}>
              {formatearPesos(
                tipoElegido ? tipoElegido.precio * cantidadValida : 0,
              )}
            </Text>
          </View>
          <Pressable
            style={[
              styles.botonComprar,
              (!tipoElegido || comprando) && styles.botonDeshabilitado,
            ]}
            disabled={!tipoElegido || comprando}
            onPress={comprar}
          >
            <Text style={styles.textoBoton}>
              {comprando
                ? "Comprando…"
                : tipoElegido
                  ? "Comprá tus entradas"
                  : "Elegí un tipo de entrada"}
            </Text>
          </Pressable>
        </>
      )}
    </Seccion>
  )
}

const styles = StyleSheet.create({
  tipo: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.espacios.m,
    padding: theme.espacios.m,
    borderRadius: theme.radios.s,
    borderWidth: 1,
    borderColor: theme.colores.borde,
  },
  tipoElegido: {
    borderColor: theme.colores.primario,
    backgroundColor: theme.colores.primarioSuave,
  },
  tipoDeshabilitado: {
    opacity: 0.5,
  },
  datosTipo: {
    flex: 1,
    gap: 2,
  },
  nombreTipo: {
    ...theme.texto.cuerpo,
    fontWeight: "600",
  },
  precioTipo: {
    ...theme.texto.cuerpo,
    color: theme.colores.primario,
    fontWeight: "700",
  },
  aviso: {
    ...theme.texto.cuerpo,
    color: theme.colores.textoSecundario,
    textAlign: "center",
  },
  filaCantidad: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  filaTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  botonComprar: {
    backgroundColor: theme.colores.primario,
    borderRadius: theme.radios.m,
    paddingVertical: theme.espacios.l,
    alignItems: "center",
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  textoBoton: {
    ...theme.texto.cuerpo,
    color: theme.colores.sobrePrimario,
    fontWeight: "700",
  },
})
