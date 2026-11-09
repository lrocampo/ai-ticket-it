import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native"

import { theme } from "../theme"

type Props = TextInputProps & {
  etiqueta: string
}

export function Campo({ etiqueta, style, ...props }: Props) {
  return (
    <View style={styles.campo}>
      <Text style={theme.texto.destacado}>{etiqueta}</Text>
      <TextInput
        style={[styles.input, props.multiline && styles.multilinea, style]}
        placeholderTextColor={theme.colores.textoSecundario}
        {...props}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  campo: {
    gap: theme.espacios.xs,
  },
  input: {
    ...theme.texto.cuerpo,
    paddingHorizontal: theme.espacios.m,
    paddingVertical: theme.espacios.s,
    borderRadius: theme.radios.s,
    borderWidth: 1,
    borderColor: theme.colores.borde,
    backgroundColor: theme.colores.superficie,
  },
  multilinea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
})
