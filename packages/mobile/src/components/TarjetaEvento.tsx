import { Ionicons } from "@expo/vector-icons"
import { Image, StyleSheet, Text, View } from "react-native"

import { theme } from "../theme"
import type { Evento } from "../types"
import { formatearFecha, formatearPesos } from "../utils/fechas"
import { Puntaje } from "./Puntaje"
import { Tarjeta } from "./Tarjeta"

type Props = {
  evento: Evento
  onPress: () => void
}

export function TarjetaEvento({ evento, onPress }: Props) {
  const imagen = evento.multimedia[0]

  return (
    <Tarjeta style={styles.tarjeta} onPress={onPress}>
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
        <Text style={theme.texto.subtitulo} numberOfLines={2}>
          {evento.nombre}
        </Text>
        <Text style={theme.texto.secundario}>
          {formatearFecha(evento.fecha)}
        </Text>
        <View style={styles.pie}>
          <View style={styles.organizador}>
            <Text style={theme.texto.chico} numberOfLines={1}>
              {evento.organizador.nombre} {evento.organizador.apellido}
            </Text>
            <Puntaje organizador={evento.organizador} />
          </View>
          <Text style={styles.precio}>
            desde {formatearPesos(evento.precioDesde)}
          </Text>
        </View>
      </View>
    </Tarjeta>
  )
}

const styles = StyleSheet.create({
  tarjeta: {
    overflow: "hidden",
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
    ...theme.texto.destacado,
    textTransform: "uppercase",
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
  precio: {
    ...theme.texto.cuerpo,
    color: theme.colores.primario,
    fontWeight: "700",
  },
})
