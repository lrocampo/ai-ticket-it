import { Stack, useLocalSearchParams } from "expo-router"
import { Image, ScrollView, StyleSheet, Text, View } from "react-native"

import { Cargable } from "../../src/components/Cargable"
import { Estrellas } from "../../src/components/Estrellas"
import { Puntaje } from "../../src/components/Puntaje"
import { Seccion } from "../../src/components/Seccion"
import { BloqueCompra } from "../../src/features/compras/BloqueCompra"
import { useCarga } from "../../src/hooks/useCarga"
import { obtenerEvento } from "../../src/services/api"
import { theme } from "../../src/theme"
import { formatearFecha, formatearFechaCorta } from "../../src/utils/fechas"

export default function DetalleEvento() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const carga = useCarga(() => obtenerEvento(id), [id])

  return (
    <Cargable carga={carga}>
      {(evento) => (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.pantalla}
        >
          <Stack.Screen options={{ title: evento.nombre }} />
          {evento.multimedia[0] && (
            <Image
              source={{ uri: evento.multimedia[0] }}
              style={styles.imagen}
            />
          )}

          <View style={styles.contenido}>
            <View style={styles.encabezado}>
              <Text style={styles.categoria}>{evento.categoria.nombre}</Text>
              <Text style={theme.texto.titulo}>{evento.nombre}</Text>
              <Text style={styles.fecha}>{formatearFecha(evento.fecha)}</Text>
              <View style={styles.organizador}>
                <Text style={styles.textoOrganizador}>
                  Organiza {evento.organizador.nombre}{" "}
                  {evento.organizador.apellido}
                </Text>
                <Puntaje organizador={evento.organizador} />
              </View>
              <Text style={styles.descripcion}>{evento.descripcion}</Text>
            </View>

            <BloqueCompra evento={evento} />

            <Seccion titulo="Reseñas del organizador">
              {evento.resenasDelOrganizador.length === 0 ? (
                <Text style={theme.texto.secundario}>
                  Este organizador todavía no tiene reseñas.
                </Text>
              ) : (
                evento.resenasDelOrganizador.map((resena) => (
                  <View key={resena.id} style={styles.resena}>
                    <Estrellas puntuacion={resena.puntuacion} />
                    <Text style={theme.texto.cuerpo}>{resena.detalle}</Text>
                    <Text style={theme.texto.secundario}>
                      {resena.comprador.nombre} {resena.comprador.apellido} ·{" "}
                      {resena.evento.nombre} ·{" "}
                      {formatearFechaCorta(resena.fecha)}
                    </Text>
                  </View>
                ))
              )}
            </Seccion>
          </View>
        </ScrollView>
      )}
    </Cargable>
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
    ...theme.texto.destacado,
    textTransform: "uppercase",
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
    fontWeight: "500",
  },
  descripcion: {
    ...theme.texto.cuerpo,
    marginTop: theme.espacios.m,
    lineHeight: 22,
  },
  resena: {
    gap: theme.espacios.xs,
    paddingTop: theme.espacios.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colores.borde,
  },
})
