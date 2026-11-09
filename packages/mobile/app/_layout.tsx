import { router, Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { Pressable, StyleSheet, Text } from "react-native"

import { Cargando } from "../src/components/Cargando"
import { UsuarioProvider, useUsuario } from "../src/context/UsuarioContext"
import { theme } from "../src/theme"

function Navegacion() {
  const { usuario, recuperando } = useUsuario()

  if (recuperando) return <Cargando />

  return (
    <Stack
      screenOptions={{
        headerTintColor: theme.colores.primario,
        headerTitleStyle: { color: theme.colores.texto },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: theme.colores.fondo },
      }}
    >
      <Stack.Protected guard={usuario !== null}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="evento/[id]" options={{ title: "Evento" }} />
        <Stack.Screen
          name="evento/nuevo"
          options={{
            title: "Nuevo evento",
            presentation: "modal",
            headerLeft: () => (
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
              >
                <Text style={styles.cancelar}>Cancelar</Text>
              </Pressable>
            ),
          }}
        />
        <Stack.Screen
          name="evento/[id]/compras"
          options={{ title: "Compras del evento" }}
        />
        <Stack.Screen name="compra/[id]" options={{ title: "Compra" }} />
      </Stack.Protected>
      <Stack.Protected guard={usuario === null}>
        <Stack.Screen name="quien-soy" options={{ title: "¿Quién sos?" }} />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <UsuarioProvider>
      <StatusBar style="dark" />
      <Navegacion />
    </UsuarioProvider>
  )
}

const styles = StyleSheet.create({
  cancelar: {
    ...theme.texto.cuerpo,
    color: theme.colores.primario,
  },
})
