import { router } from "expo-router"
import { FlatList, StyleSheet } from "react-native"

import { Cargando } from "../../src/components/Cargando"
import { EstadoVacio } from "../../src/components/EstadoVacio"
import { MensajeDeError } from "../../src/components/MensajeDeError"
import { TarjetaCompra } from "../../src/components/TarjetaCompra"
import { useCarga } from "../../src/hooks/useCarga"
import { listarMisCompras } from "../../src/services/api"
import { theme } from "../../src/theme"

export default function MisCompras() {
  const { datos, error, recargar, refrescando, refrescar } = useCarga(
    listarMisCompras,
    [],
  )

  if (error && !datos) {
    return <MensajeDeError mensaje={error} onReintentar={recargar} />
  }
  if (!datos) return <Cargando />

  return (
    <FlatList
      data={datos}
      keyExtractor={(compra) => compra.id}
      contentContainerStyle={styles.lista}
      refreshing={refrescando}
      onRefresh={refrescar}
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
  )
}

const styles = StyleSheet.create({
  lista: {
    padding: theme.espacios.l,
    gap: theme.espacios.m,
  },
})
