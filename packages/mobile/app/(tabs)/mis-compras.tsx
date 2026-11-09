import { router } from "expo-router"
import { FlatList, StyleSheet } from "react-native"

import { Cargable } from "../../src/components/Cargable"
import { EstadoVacio } from "../../src/components/EstadoVacio"
import { TarjetaCompra } from "../../src/components/TarjetaCompra"
import { useCarga } from "../../src/hooks/useCarga"
import { listarMisCompras } from "../../src/services/api"
import { theme } from "../../src/theme"

export default function MisCompras() {
  const compras = useCarga(listarMisCompras, [])

  return (
    <Cargable carga={compras}>
      {(datos) => (
        <FlatList
          data={datos}
          keyExtractor={(compra) => compra.id}
          contentContainerStyle={styles.lista}
          refreshing={compras.refrescando}
          onRefresh={compras.refrescar}
          ListEmptyComponent={
            <EstadoVacio
              icono="ticket-outline"
              mensaje="Todavía no compraste entradas"
            />
          }
          renderItem={({ item }) => (
            <TarjetaCompra
              compra={item}
              vista="comprador"
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
})
