import { router } from "expo-router"
import { useState } from "react"
import { FlatList, StyleSheet } from "react-native"

import { Cargable } from "../../src/components/Cargable"
import { EstadoVacio } from "../../src/components/EstadoVacio"
import { SelectorOrdenCompras } from "../../src/components/SelectorOrdenCompras"
import { TarjetaCompra } from "../../src/components/TarjetaCompra"
import { useCarga } from "../../src/hooks/useCarga"
import { listarMisCompras } from "../../src/services/api"
import { theme } from "../../src/theme"
import type { OrdenCompras } from "../../src/types"
import { ordenarCompras } from "../../src/utils/ordenarCompras"

export default function MisCompras() {
  const compras = useCarga(listarMisCompras, [])
  const [orden, setOrden] = useState<OrdenCompras>("recientes")

  return (
    <Cargable carga={compras}>
      {(datos) => (
        <FlatList
          data={ordenarCompras(datos, orden)}
          keyExtractor={(compra) => compra.id}
          contentContainerStyle={styles.lista}
          refreshing={compras.refrescando}
          onRefresh={compras.refrescar}
          ListHeaderComponent={
            datos.length > 0 ? (
              <SelectorOrdenCompras orden={orden} onCambio={setOrden} />
            ) : undefined
          }
          ListEmptyComponent={
            <EstadoVacio
              icono="ticket-outline"
              mensaje="Todavía no compraste entradas"
              accion={{
                etiqueta: "Ver eventos",
                onPress: () => router.navigate("/"),
              }}
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
