import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { useState } from "react"
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"

import { Cargable } from "../../src/components/Cargable"
import { Chip } from "../../src/components/Chip"
import { EstadoVacio } from "../../src/components/EstadoVacio"
import { TarjetaEvento } from "../../src/components/TarjetaEvento"
import { useCarga } from "../../src/hooks/useCarga"
import { useDemorado } from "../../src/hooks/useDemorado"
import { listarCategorias, listarEventos } from "../../src/services/api"
import { theme } from "../../src/theme"
import type { Categoria, OrdenEventos } from "../../src/types"

const ORDENES: { valor: OrdenEventos; etiqueta: string }[] = [
  { valor: "fecha", etiqueta: "Fecha" },
  { valor: "precio", etiqueta: "Precio" },
  { valor: "puntaje", etiqueta: "Puntaje" },
]

function sinResultados(texto: string, categoria: Categoria | undefined) {
  if (texto && categoria) {
    return `No hay eventos de ${categoria.nombre} para «${texto}»`
  }
  if (texto) return `No hay eventos para «${texto}»`
  if (categoria) return `No hay eventos de ${categoria.nombre}`
  return "Todavía no hay eventos publicados"
}

export default function Eventos() {
  const [texto, setTexto] = useState("")
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [orden, setOrden] = useState<OrdenEventos>("fecha")
  const textoBuscado = useDemorado(texto, 300)

  const categorias = useCarga(listarCategorias, [])
  const eventos = useCarga(
    () => listarEventos({ texto: textoBuscado, categoriaId, orden }),
    [textoBuscado, categoriaId, orden],
  )
  const categoriaElegida = categorias.datos?.find((c) => c.id === categoriaId)
  const buscado = textoBuscado.trim()
  const hayFiltros = buscado !== "" || categoriaId !== null

  function limpiarFiltros() {
    setTexto("")
    setCategoriaId(null)
  }

  return (
    <View style={styles.pantalla}>
      <View style={styles.filtros}>
        <View style={styles.buscador}>
          <Ionicons
            name="search"
            size={18}
            color={theme.colores.textoSecundario}
          />
          <TextInput
            style={styles.input}
            value={texto}
            onChangeText={setTexto}
            placeholder="Buscá un evento"
            accessibilityLabel="Buscar eventos"
            placeholderTextColor={theme.colores.textoSecundario}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          <Chip
            texto="Todas"
            activo={categoriaId === null}
            onPress={() => setCategoriaId(null)}
          />
          {categorias.datos?.map((categoria) => (
            <Chip
              key={categoria.id}
              texto={categoria.nombre}
              activo={categoriaId === categoria.id}
              onPress={() => setCategoriaId(categoria.id)}
            />
          ))}
        </ScrollView>
        <View style={styles.orden}>
          <Text style={theme.texto.secundario}>Ordenar por</Text>
          {ORDENES.map((opcion) => (
            <Chip
              key={opcion.valor}
              texto={opcion.etiqueta}
              activo={orden === opcion.valor}
              onPress={() => setOrden(opcion.valor)}
            />
          ))}
        </View>
      </View>

      <Cargable carga={eventos}>
        {(datos) => (
          <FlatList
            data={datos}
            keyExtractor={(evento) => evento.id}
            contentContainerStyle={styles.lista}
            keyboardShouldPersistTaps="handled"
            refreshing={eventos.refrescando}
            onRefresh={eventos.refrescar}
            ListEmptyComponent={
              <EstadoVacio
                mensaje={sinResultados(buscado, categoriaElegida)}
                accion={
                  hayFiltros
                    ? { etiqueta: "Limpiar filtros", onPress: limpiarFiltros }
                    : undefined
                }
              />
            }
            renderItem={({ item }) => (
              <TarjetaEvento
                evento={item}
                onPress={() => router.push(`/evento/${item.id}`)}
              />
            )}
          />
        )}
      </Cargable>
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: theme.colores.fondo,
  },
  filtros: {
    paddingTop: theme.espacios.m,
    paddingBottom: theme.espacios.s,
    gap: theme.espacios.m,
    backgroundColor: theme.colores.fondo,
  },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.espacios.s,
    marginHorizontal: theme.espacios.l,
    paddingHorizontal: theme.espacios.m,
    backgroundColor: theme.colores.superficie,
    borderRadius: theme.radios.m,
    borderWidth: 1,
    borderColor: theme.colores.bordeControl,
  },
  input: {
    fontSize: theme.input.fontSize,
    color: theme.input.color,
    flex: 1,
    paddingVertical: theme.espacios.m,
  },
  chips: {
    gap: theme.espacios.s,
    paddingHorizontal: theme.espacios.l,
  },
  orden: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.espacios.s,
    paddingHorizontal: theme.espacios.l,
  },
  lista: {
    padding: theme.espacios.l,
    gap: theme.espacios.l,
  },
})
