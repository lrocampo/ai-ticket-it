import { Alert } from "react-native"

// "Volver" y no "Cancelar": en esta app "Cancelar" se confunde con cancelar
// una compra.
export function confirmar(
  titulo: string,
  mensaje: string,
  destructiva = false,
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(titulo, mensaje, [
      { text: "Volver", style: "cancel", onPress: () => resolve(false) },
      {
        text: titulo,
        style: destructiva ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ])
  })
}
