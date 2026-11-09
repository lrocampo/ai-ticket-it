import { router } from "expo-router"
import { FlatList, StyleSheet } from "react-native"

import { Cargable } from "../../src/components/Cargable"
import { EstadoVacio } from "../../src/components/EstadoVacio"
import { TarjetaEvento } from "../../src/components/TarjetaEvento"
import { useCarga } from "../../src/hooks/useCarga"
import { listarMisEventos } from "../../src/services/api"
import { theme } from "../../src/theme"

export default function MisEventos() {
  const eventos = useCarga(listarMisEventos, [])

  return (
    <Cargable carga={eventos}>
      {(datos) => (
        <FlatList
          data={datos}
          keyExtractor={(evento) => evento.id}
          contentContainerStyle={styles.lista}
          refreshing={eventos.refrescando}
          onRefresh={eventos.refrescar}
          ListEmptyComponent={
            <EstadoVacio
              icono="megaphone-outline"
              mensaje="Todavía no organizás eventos"
              accion={{
                etiqueta: "Crear evento",
                onPress: () => router.push("/evento/nuevo"),
              }}
            />
          }
          renderItem={({ item }) => (
            <TarjetaEvento
              evento={item}
              onPress={() => router.push(`/evento/${item.id}/compras`)}
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
    gap: theme.espacios.l,
  },
})
