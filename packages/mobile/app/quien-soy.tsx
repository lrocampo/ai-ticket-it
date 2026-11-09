import { Ionicons } from "@expo/vector-icons"
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native"

import { Cargando } from "../src/components/Cargando"
import { MensajeDeError } from "../src/components/MensajeDeError"
import { useUsuario } from "../src/context/UsuarioContext"
import { useCarga } from "../src/hooks/useCarga"
import { listarUsuarios } from "../src/services/api"
import { theme } from "../src/theme"

export default function QuienSoy() {
  const { elegirUsuario } = useUsuario()
  const { datos, error, recargar, refrescando, refrescar } = useCarga(
    listarUsuarios,
    [],
  )

  if (error && !datos) {
    return <MensajeDeError mensaje={error} onReintentar={recargar} />
  }
  if (!datos) return <Cargando />

  return (
    <FlatList
      data={datos}
      keyExtractor={(usuario) => usuario.id}
      contentContainerStyle={styles.lista}
      refreshing={refrescando}
      onRefresh={refrescar}
      ListHeaderComponent={
        <Text style={styles.intro}>
          Elegí quién sos para ver tus compras y tus eventos.
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.fila, pressed && styles.presionada]}
          onPress={() => elegirUsuario(item)}
        >
          <View style={styles.avatar}>
            <Text style={styles.iniciales}>
              {item.nombre[0]}
              {item.apellido[0]}
            </Text>
          </View>
          <View style={styles.datos}>
            <Text style={styles.nombre}>
              {item.nombre} {item.apellido}
            </Text>
            <Text style={styles.email}>{item.email}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colores.textoSecundario}
          />
        </Pressable>
      )}
    />
  )
}

const styles = StyleSheet.create({
  lista: {
    padding: theme.espacios.l,
    gap: theme.espacios.s,
  },
  intro: {
    ...theme.texto.cuerpo,
    color: theme.colores.textoSecundario,
    marginBottom: theme.espacios.s,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.espacios.m,
    padding: theme.espacios.l,
    backgroundColor: theme.colores.superficie,
    borderRadius: theme.radios.m,
    ...theme.sombra,
  },
  presionada: {
    opacity: 0.85,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radios.pill,
    backgroundColor: theme.colores.primarioSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  iniciales: {
    ...theme.texto.cuerpo,
    color: theme.colores.primario,
    fontWeight: "700",
  },
  datos: {
    flex: 1,
    gap: 2,
  },
  nombre: {
    ...theme.texto.subtitulo,
    color: theme.colores.texto,
  },
  email: {
    ...theme.texto.chico,
    color: theme.colores.textoSecundario,
  },
})
