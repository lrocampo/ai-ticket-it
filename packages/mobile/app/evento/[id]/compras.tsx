import { router, Stack, useLocalSearchParams } from "expo-router"
import { FlatList, StyleSheet, Text, View } from "react-native"

import { Cargable } from "../../../src/components/Cargable"
import { EstadoVacio } from "../../../src/components/EstadoVacio"
import { Seccion } from "../../../src/components/Seccion"
import { TarjetaCompra } from "../../../src/components/TarjetaCompra"
import { useCarga } from "../../../src/hooks/useCarga"
import { listarComprasDeEvento } from "../../../src/services/api"
import { theme } from "../../../src/theme"

export default function ComprasDelEvento() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const carga = useCarga(() => listarComprasDeEvento(id), [id])

  return (
    <Cargable carga={carga}>
      {({ evento, compras }) => (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          data={compras}
          keyExtractor={(compra) => compra.id}
          contentContainerStyle={styles.lista}
          refreshing={carga.refrescando}
          onRefresh={carga.refrescar}
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
      )}
    </Cargable>
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
