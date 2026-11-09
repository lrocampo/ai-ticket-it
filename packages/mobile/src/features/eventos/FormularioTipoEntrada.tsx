import { Ionicons } from "@expo/vector-icons"
import { Pressable, StyleSheet, Text, View } from "react-native"

import { Campo } from "../../components/Campo"
import { theme } from "../../theme"
import type { TipoEntradaFormulario } from "./armarNuevoEvento"

type Props = {
  tipo: TipoEntradaFormulario
  onCambio: (tipo: TipoEntradaFormulario) => void
  onQuitar: (() => void) | null
}

export function FormularioTipoEntrada({ tipo, onCambio, onQuitar }: Props) {
  function cambiar(campo: keyof TipoEntradaFormulario, valor: string) {
    onCambio({ ...tipo, [campo]: valor })
  }

  return (
    <View style={styles.tipo}>
      <View style={styles.encabezado}>
        <Text style={theme.texto.subtitulo}>
          {tipo.nombre.trim() || "Tipo de entrada"}
        </Text>
        {onQuitar && (
          <Pressable
            onPress={onQuitar}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Quitar tipo de entrada"
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={theme.colores.error}
            />
          </Pressable>
        )}
      </View>
      <Campo
        etiqueta="Nombre"
        value={tipo.nombre}
        onChangeText={(valor) => cambiar("nombre", valor)}
        placeholder="General"
      />
      <Campo
        etiqueta="Descripción (opcional)"
        value={tipo.descripcion}
        onChangeText={(valor) => cambiar("descripcion", valor)}
      />
      <View style={styles.fila}>
        <View style={styles.columna}>
          <Campo
            etiqueta="Precio"
            value={tipo.precio}
            onChangeText={(valor) => cambiar("precio", valor)}
            keyboardType="numeric"
            placeholder="15000"
          />
        </View>
        <View style={styles.columna}>
          <Campo
            etiqueta="Cupo"
            value={tipo.cupo}
            onChangeText={(valor) => cambiar("cupo", valor)}
            keyboardType="numeric"
            placeholder="200"
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  tipo: {
    gap: theme.espacios.m,
    paddingTop: theme.espacios.m,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colores.borde,
  },
  encabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fila: {
    flexDirection: "row",
    gap: theme.espacios.m,
  },
  columna: {
    flex: 1,
  },
})
