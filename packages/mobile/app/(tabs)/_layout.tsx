import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { Tabs } from "expo-router/js-tabs"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { useUsuario, useUsuarioActual } from "../../src/context/UsuarioContext"
import { theme } from "../../src/theme"

const ICONO_NUEVO = 26
const ICONO_USUARIO = 20
const MARGEN_USUARIO = (theme.areaTactil - ICONO_USUARIO) / 2

function BotonCambiarUsuario() {
  const usuario = useUsuarioActual()
  const { salir } = useUsuario()

  return (
    <Pressable
      style={styles.boton}
      onPress={salir}
      hitSlop={{ top: MARGEN_USUARIO, bottom: MARGEN_USUARIO }}
      accessibilityRole="button"
      accessibilityLabel={`${usuario.nombre}, cambiar de usuario`}
    >
      <Text style={styles.nombre} numberOfLines={1}>
        {usuario.nombre}
      </Text>
      <Ionicons
        name="swap-horizontal"
        size={ICONO_USUARIO}
        color={theme.colores.primario}
      />
    </Pressable>
  )
}

function BotonNuevoEvento() {
  return (
    <Pressable
      style={styles.nuevoEvento}
      onPress={() => router.push("/evento/nuevo")}
      hitSlop={(theme.areaTactil - ICONO_NUEVO) / 2}
      accessibilityRole="button"
      accessibilityLabel="Crear evento"
    >
      <Ionicons name="add" size={ICONO_NUEVO} color={theme.colores.primario} />
    </Pressable>
  )
}

// El color se elige acá y no con el que pasa Tabs porque sus tipos (ColorValue)
// no coinciden con los de @expo/vector-icons.
function IconoTab({
  nombre,
  focused,
  size,
}: {
  nombre: "calendar" | "ticket" | "megaphone"
  focused: boolean
  size: number
}) {
  return (
    <Ionicons
      name={focused ? nombre : `${nombre}-outline`}
      size={size}
      color={focused ? theme.colores.primario : theme.colores.textoSecundario}
    />
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colores.primario,
        tabBarInactiveTintColor: theme.colores.textoSecundario,
        headerTitleStyle: { color: theme.colores.texto },
        headerRight: () => <BotonCambiarUsuario />,
        sceneStyle: { backgroundColor: theme.colores.fondo },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Eventos",
          tabBarIcon: ({ focused, size }) => (
            <IconoTab nombre="calendar" focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mis-compras"
        options={{
          title: "Mis compras",
          tabBarIcon: ({ focused, size }) => (
            <IconoTab nombre="ticket" focused={focused} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="mis-eventos"
        options={{
          title: "Mis eventos",
          headerRight: () => (
            <View style={styles.acciones}>
              <BotonNuevoEvento />
              <BotonCambiarUsuario />
            </View>
          ),
          tabBarIcon: ({ focused, size }) => (
            <IconoTab nombre="megaphone" focused={focused} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  acciones: {
    flexDirection: "row",
    alignItems: "center",
  },
  nuevoEvento: {
    marginRight: theme.espacios.m,
  },
  boton: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.espacios.xs,
    marginRight: theme.espacios.l,
    maxWidth: 160,
  },
  nombre: {
    ...theme.texto.cuerpo,
    color: theme.colores.primario,
    fontWeight: "600",
  },
})
