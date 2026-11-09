import { router, Stack, useLocalSearchParams } from "expo-router"
import { FlatList, StyleSheet, Text, View } from "react-native"

import { Cargando } from "../../../src/components/Cargando"
import { EstadoVacio } from "../../../src/components/EstadoVacio"
import { MensajeDeError } from "../../../src/components/MensajeDeError"
import { Seccion } from "../../../src/components/Seccion"
import { TarjetaCompra } from "../../../src/components/TarjetaCompra"
import { useCarga } from "../../../src/hooks/useCarga"
import { listarComprasDeEvento } from "../../../src/services/api"
import { theme } from "../../../src/theme"

export default function ComprasDelEvento() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { datos, error, recargar, refrescando, refrescar } = useCarga(
    () => listarComprasDeEvento(id),
    [id],
  )

  if (error && !datos) {
    return <MensajeDeError mensaje={error} onReintentar={recargar} />
  }
  if (!datos) return <Cargando />

  const { evento, compras } = datos

  return (
    <FlatList
      data={compras}
      keyExtractor={(compra) => compra.id}
      contentContainerStyle={styles.lista}
      refreshing={refrescando}
      onRefresh={refrescar}
      ListHeaderComponent={
        <View style={styles.encabezado}>
          <Stack.Screen options={{ title: evento.nombre }} />
          <Seccion titulo="Disponibilidad">
            {evento.tiposEntrada.map((tipo) => (
              <View key={tipo.id} style={styles.tipo}>
                <Text style={theme.texto.cuerpo}>{tipo.nombre}</Text>
                <Text style={styles.cupo}>
                  {tipo.disponibles} / {tipo.cupo}
                </Text>
              </View>
            ))}
          </Seccion>
          <Text style={theme.texto.subtitulo}>Compras</Text>
        </View>
      }
      ListEmptyComponent={
        <EstadoVacio
          icono="ticket-outline"
          mensaje="Todavía nadie compró entradas para este evento"
        />
      }
      renderItem={({ item }) => (
        <TarjetaCompra
          compra={item}
          vista="organizador"
          onPress={() => router.push(`/compra/${item.id}`)}
        />
      )}
    />
  )
}

const styles = StyleSheet.create({
  lista: {
    padding: theme.espacios.l,
    gap: theme.espacios.m,
  },
  encabezado: {
    gap: theme.espacios.l,
  },
  tipo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cupo: {
    ...theme.texto.cuerpo,
    fontWeight: "600",
  },
})
