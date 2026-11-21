import { router, Stack, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import { FlatList, StyleSheet, Text, View } from "react-native"

import { Cargable } from "../../../src/components/Cargable"
import { EstadoVacio } from "../../../src/components/EstadoVacio"
import { Seccion } from "../../../src/components/Seccion"
import { SelectorOrdenCompras } from "../../../src/components/SelectorOrdenCompras"
import { TarjetaCompra } from "../../../src/components/TarjetaCompra"
import { useCarga } from "../../../src/hooks/useCarga"
import { listarComprasDeEvento } from "../../../src/services/api"
import { theme } from "../../../src/theme"
import type { OrdenCompras } from "../../../src/types"
import { ordenarCompras } from "../../../src/utils/ordenarCompras"

export default function ComprasDelEvento() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const carga = useCarga(() => listarComprasDeEvento(id), [id])
  const [orden, setOrden] = useState<OrdenCompras>("recientes")

  return (
    <Cargable carga={carga}>
      {({ evento, compras }) => (
        <FlatList
          contentInsetAdjustmentBehavior="automatic"
          data={ordenarCompras(compras, orden)}
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
              <View style={styles.compras}>
                <Text style={theme.texto.subtitulo}>Compras</Text>
                {compras.length > 0 && (
                  <SelectorOrdenCompras orden={orden} onCambio={setOrden} />
                )}
              </View>
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
  compras: {
    gap: theme.espacios.s,
  },
  tipo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cupo: {
    ...theme.texto.cuerpo,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
})
