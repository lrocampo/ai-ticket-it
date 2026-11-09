import { Ionicons } from "@expo/vector-icons"
import { Image, Pressable, StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"
import type { Evento } from "../types"
import { formatearFecha, formatearPesos } from "../utils/fechas"
import { Puntaje } from "./Puntaje"

type Props = {
  evento: Evento
  onPress: () => void
}

export function TarjetaEvento({ evento, onPress }: Props) {
  const imagen = evento.multimedia[0]

  return (
    <Pressable
      style={({ pressed }) => [styles.tarjeta, pressed && styles.presionada]}
      onPress={onPress}
    >
      {imagen ? (
        <Image source={{ uri: imagen }} style={styles.imagen} />
      ) : (
        <View style={[styles.imagen, styles.sinImagen]}>
          <Ionicons
            name="ticket-outline"
            size={40}
            color={theme.colores.primario}
          />
        </View>
      )}
      <View style={styles.cuerpo}>
        <Text style={styles.categoria}>{evento.categoria.nombre}</Text>
        <Text style={styles.nombre} numberOfLines={2}>
          {evento.nombre}
        </Text>
        <Text style={styles.fecha}>{formatearFecha(evento.fecha)}</Text>
        <View style={styles.pie}>
          <View style={styles.organizador}>
            <Text style={styles.textoOrganizador} numberOfLines={1}>
              {evento.organizador.nombre} {evento.organizador.apellido}
            </Text>
            <Puntaje organizador={evento.organizador} />
          </View>
          <Text style={styles.precio}>
            desde {formatearPesos(evento.precioDesde)}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  tarjeta: {
    backgroundColor: theme.colores.superficie,
    borderRadius: theme.radios.m,
    overflow: "hidden",
    ...theme.sombra,
  },
  presionada: {
    opacity: 0.85,
  },
  imagen: {
    width: "100%",
    height: 160,
    backgroundColor: theme.colores.primarioSuave,
  },
  sinImagen: {
    alignItems: "center",
    justifyContent: "center",
  },
  cuerpo: {
    padding: theme.espacios.l,
    gap: theme.espacios.xs,
  },
  categoria: {
    ...theme.texto.chico,
    color: theme.colores.primario,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  nombre: {
    ...theme.texto.subtitulo,
    color: theme.colores.texto,
  },
  fecha: {
    ...theme.texto.chico,
    color: theme.colores.textoSecundario,
  },
  pie: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: theme.espacios.s,
    gap: theme.espacios.m,
  },
  organizador: {
    flex: 1,
    gap: 2,
  },
  textoOrganizador: {
    ...theme.texto.chico,
    color: theme.colores.texto,
  },
  precio: {
    ...theme.texto.cuerpo,
    color: theme.colores.primario,
    fontWeight: "700",
  },
})
