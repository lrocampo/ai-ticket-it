import { router } from "expo-router"
import { FlatList, StyleSheet } from "react-native"

import { Cargando } from "../../src/components/Cargando"
import { EstadoVacio } from "../../src/components/EstadoVacio"
import { MensajeDeError } from "../../src/components/MensajeDeError"
import { TarjetaEvento } from "../../src/components/TarjetaEvento"
import { useCarga } from "../../src/hooks/useCarga"
import { listarMisEventos } from "../../src/services/api"
import { theme } from "../../src/theme"

export default function MisEventos() {
  const { datos, error, recargar, refrescando, refrescar } = useCarga(
    listarMisEventos,
    [],
  )

  if (error && !datos) {
    return <MensajeDeError mensaje={error} onReintentar={recargar} />
  }
  if (!datos) return <Cargando />

  return (
    <FlatList
      data={datos}
      keyExtractor={(evento) => evento.id}
      contentContainerStyle={styles.lista}
      refreshing={refrescando}
      onRefresh={refrescar}
      ListEmptyComponent={
        <EstadoVacio
          icono="megaphone-outline"
          mensaje="Todavía no organizás eventos"
        />
      }
      renderItem={({ item }) => (
        <TarjetaEvento
          evento={item}
          onPress={() => router.push(`/evento/${item.id}/compras`)}
        />
      )}
    />
  )
}

const styles = StyleSheet.create({
  lista: {
    padding: theme.espacios.l,
    gap: theme.espacios.l,
  },
})
