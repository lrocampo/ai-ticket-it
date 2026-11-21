import type { ReactNode } from "react"
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
  error?: string
  accesorio?: ReactNode
}

export function Campo({ etiqueta, error, accesorio, style, ...props }: Props) {
  return (
    <View style={styles.campo}>
      <Text
        style={theme.texto.destacado}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {etiqueta}
      </Text>
      <View style={styles.fila}>
        <TextInput
          accessibilityLabel={etiqueta}
          accessibilityHint={error}
          style={[
            styles.input,
            props.multiline && styles.multilinea,
            error !== undefined && styles.conError,
            style,
          ]}
          placeholderTextColor={theme.colores.textoSecundario}
          {...props}
        />
        {accesorio}
      </View>
      {error !== undefined && <Text style={theme.texto.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  campo: {
    gap: theme.espacios.xs,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.espacios.m,
  },
  input: {
    ...theme.input,
    flex: 1,
  },
  multilinea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  conError: {
    borderColor: theme.colores.error,
  },
})
