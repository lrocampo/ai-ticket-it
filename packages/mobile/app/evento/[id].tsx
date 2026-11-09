import { Ionicons } from "@expo/vector-icons"
import { router, Stack, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"

import { Cargando } from "../../src/components/Cargando"
import { Estrellas } from "../../src/components/Estrellas"
import { MensajeDeError } from "../../src/components/MensajeDeError"
import { Puntaje } from "../../src/components/Puntaje"
import { Seccion } from "../../src/components/Seccion"
import { Stepper } from "../../src/components/Stepper"
import { useCarga } from "../../src/hooks/useCarga"
import { crearCompra, obtenerEvento } from "../../src/services/api"
import { theme } from "../../src/theme"
import type { EventoDetalle, TipoEntrada } from "../../src/types"
import {
  formatearFecha,
  formatearFechaCorta,
  formatearPesos,
} from "../../src/utils/fechas"

export default function DetalleEvento() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { datos, error, recargar } = useCarga(() => obtenerEvento(id), [id])

  if (error && !datos) {
    return <MensajeDeError mensaje={error} onReintentar={recargar} />
  }
  if (!datos) return <Cargando />

  const evento = datos
  const imagen = evento.multimedia[0]

  return (
    <ScrollView contentContainerStyle={styles.pantalla}>
      <Stack.Screen options={{ title: evento.nombre }} />
      {imagen && <Image source={{ uri: imagen }} style={styles.imagen} />}

      <View style={styles.contenido}>
        <View style={styles.encabezado}>
          <Text style={styles.categoria}>{evento.categoria.nombre}</Text>
          <Text style={styles.nombre}>{evento.nombre}</Text>
          <Text style={styles.fecha}>{formatearFecha(evento.fecha)}</Text>
          <View style={styles.organizador}>
            <Text style={styles.textoOrganizador}>
              Organiza {evento.organizador.nombre} {evento.organizador.apellido}
            </Text>
            <Puntaje organizador={evento.organizador} />
          </View>
          <Text style={styles.descripcion}>{evento.descripcion}</Text>
        </View>

        <BloqueCompra evento={evento} />

        <Seccion titulo="Reseñas del organizador">
          {evento.resenasDelOrganizador.length === 0 ? (
            <Text style={styles.secundario}>
              Este organizador todavía no tiene reseñas.
            </Text>
          ) : (
            evento.resenasDelOrganizador.map((resena) => (
              <View key={resena.id} style={styles.resena}>
                <Estrellas puntuacion={resena.puntuacion} />
                <Text style={styles.cuerpo}>{resena.detalle}</Text>
                <Text style={styles.secundario}>
                  {resena.comprador.nombre} {resena.comprador.apellido} ·{" "}
                  {resena.evento.nombre} · {formatearFechaCorta(resena.fecha)}
                </Text>
              </View>
            ))
          )}
        </Seccion>
      </View>
    </ScrollView>
  )
}

function BloqueCompra({ evento }: { evento: EventoDetalle }) {
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
      Alert.alert("No pudimos hacer la compra", (e as Error).message)
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
                <Text style={styles.secundario}>{tipo.descripcion}</Text>
              ) : null}
              <Text style={styles.secundario}>
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
            <Text style={styles.cuerpo}>Cantidad</Text>
            <Stepper
              valor={cantidadValida}
              minimo={1}
              maximo={tipoElegido?.disponibles ?? 1}
              onCambio={setCantidad}
            />
          </View>
          <View style={styles.filaTotal}>
            <Text style={styles.cuerpo}>Total</Text>
            <Text style={styles.total}>
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
  pantalla: {
    paddingBottom: theme.espacios.xl * 2,
  },
  contenido: {
    padding: theme.espacios.l,
    gap: theme.espacios.l,
  },
  imagen: {
    width: "100%",
    height: 220,
    backgroundColor: theme.colores.primarioSuave,
  },
  encabezado: {
    gap: theme.espacios.xs,
  },
  categoria: {
    ...theme.texto.chico,
    color: theme.colores.primario,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  nombre: {
    ...theme.texto.titulo,
    color: theme.colores.texto,
  },
  fecha: {
    ...theme.texto.cuerpo,
    color: theme.colores.textoSecundario,
  },
  organizador: {
    marginTop: theme.espacios.s,
    gap: 2,
  },
  textoOrganizador: {
    ...theme.texto.cuerpo,
    color: theme.colores.texto,
    fontWeight: "500",
  },
  descripcion: {
    ...theme.texto.cuerpo,
    color: theme.colores.texto,
    marginTop: theme.espacios.m,
    lineHeight: 22,
  },
  cuerpo: {
    ...theme.texto.cuerpo,
    color: theme.colores.texto,
  },
  secundario: {
    ...theme.texto.chico,
    color: theme.colores.textoSecundario,
  },
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
    color: theme.colores.texto,
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
  total: {
    ...theme.texto.subtitulo,
    color: theme.colores.texto,
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
  resena: {
    gap: theme.espacios.xs,
    paddingTop: theme.espacios.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colores.borde,
  },
})
