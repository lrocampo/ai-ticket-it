import { Ionicons } from "@expo/vector-icons"
import { FlatList, StyleSheet, Text, View } from "react-native"

import { Cargable } from "../src/components/Cargable"
import { Tarjeta } from "../src/components/Tarjeta"
import { useUsuario } from "../src/context/UsuarioContext"
import { useCarga } from "../src/hooks/useCarga"
import { listarUsuarios } from "../src/services/api"
import { theme } from "../src/theme"

export default function QuienSoy() {
  const { elegirUsuario } = useUsuario()
  const usuarios = useCarga(listarUsuarios, [])

  return (
    <Cargable carga={usuarios}>
      {(datos) => (
        <FlatList
          data={datos}
          keyExtractor={(usuario) => usuario.id}
          contentContainerStyle={styles.lista}
          refreshing={usuarios.refrescando}
          onRefresh={usuarios.refrescar}
          ListHeaderComponent={
            <Text style={styles.intro}>
              Elegí quién sos para ver tus compras y tus eventos.
            </Text>
          }
          renderItem={({ item }) => (
            <Tarjeta style={styles.fila} onPress={() => elegirUsuario(item)}>
              <View style={styles.avatar}>
                <Text style={styles.iniciales}>
                  {item.nombre[0]}
                  {item.apellido[0]}
                </Text>
              </View>
              <View style={styles.datos}>
                <Text style={theme.texto.subtitulo}>
                  {item.nombre} {item.apellido}
                </Text>
                <Text style={theme.texto.secundario}>{item.email}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={theme.colores.textoSecundario}
              />
            </Tarjeta>
          )}
        />
      )}
    </Cargable>
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
})
