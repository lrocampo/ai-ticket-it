import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"

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
