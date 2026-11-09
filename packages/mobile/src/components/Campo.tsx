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
}

export function Campo({ etiqueta, error, style, ...props }: Props) {
  return (
    <View style={styles.campo}>
      <Text
        style={theme.texto.destacado}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {etiqueta}
      </Text>
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
      {error !== undefined && <Text style={theme.texto.error}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  campo: {
    gap: theme.espacios.xs,
  },
  input: theme.input,
  multilinea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  conError: {
    borderColor: theme.colores.error,
  },
})
