import { Ionicons } from "@expo/vector-icons"
import { Tabs } from "expo-router/js-tabs"
import { Pressable, StyleSheet, Text } from "react-native"

import { useUsuario, useUsuarioActual } from "../../src/context/UsuarioContext"
import { theme } from "../../src/theme"

function BotonCambiarUsuario() {
  const usuario = useUsuarioActual()
  const { salir } = useUsuario()

  return (
    <Pressable
      style={styles.boton}
      onPress={salir}
      accessibilityLabel="Cambiar de usuario"
    >
      <Text style={styles.nombre} numberOfLines={1}>
        {usuario.nombre}
      </Text>
      <Ionicons
        name="swap-horizontal"
        size={20}
        color={theme.colores.primario}
      />
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
          tabBarIcon: ({ focused, size }) => (
            <IconoTab nombre="megaphone" focused={focused} size={size} />
          ),
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
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
