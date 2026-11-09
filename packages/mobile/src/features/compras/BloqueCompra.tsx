import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import { Alert, Pressable, StyleSheet, Text, View } from "react-native"

import { Boton } from "../../components/Boton"
import { Seccion } from "../../components/Seccion"
import { Stepper } from "../../components/Stepper"
import { useUsuarioActual } from "../../context/UsuarioContext"
import { crearCompra, mensajeDe } from "../../services/api"
import { theme } from "../../theme"
import type { EventoDetalle, TipoEntrada, Usuario } from "../../types"
import { formatearPesos } from "../../utils/fechas"

function motivoParaNoComprar(
  evento: EventoDetalle,
  usuario: Usuario,
): string | null {
  if (evento.yaOcurrio) {
    return "Este evento ya ocurrió, no se pueden comprar entradas."
  }
  if (evento.organizador.id === usuario.id) return "Este evento es tuyo."
  return null
}

function tipoConCupo(evento: EventoDetalle, tipoId: string | null) {
  return evento.tiposEntrada.find((t) => t.id === tipoId && t.disponibles > 0)
}

function acotarAlCupo(cantidad: number, tipo: TipoEntrada | undefined) {
  return tipo ? Math.min(cantidad, tipo.disponibles) : cantidad
}

export function BloqueCompra({ evento }: { evento: EventoDetalle }) {
  const usuario = useUsuarioActual()
  const motivo = motivoParaNoComprar(evento, usuario)
  const [tipoElegidoId, setTipoElegidoId] = useState<string | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [comprando, setComprando] = useState(false)

  const tipoElegido = tipoConCupo(evento, tipoElegidoId)
  const cantidadValida = acotarAlCupo(cantidad, tipoElegido)

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
        const deshabilitado = agotado || motivo !== null
        const elegido = tipo.id === tipoElegido?.id
        return (
          <Pressable
            key={tipo.id}
            style={[
              styles.tipo,
              elegido && styles.tipoElegido,
              deshabilitado && styles.tipoDeshabilitado,
            ]}
            disabled={deshabilitado}
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

      {motivo ? (
        <Text style={styles.aviso}>{motivo}</Text>
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
          <Boton
            texto={
              comprando
                ? "Comprando…"
                : tipoElegido
                  ? "Comprá tus entradas"
                  : "Elegí un tipo de entrada"
            }
            deshabilitado={!tipoElegido || comprando}
            onPress={comprar}
          />
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
})
