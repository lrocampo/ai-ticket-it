import { StyleSheet, Text, View } from "react-native"

import { BotonQuitar } from "../../components/BotonQuitar"
import { Campo } from "../../components/Campo"
import { theme } from "../../theme"
import { confirmar } from "../../utils/confirmar"
import {
  type ErrorDelTipo,
  type TipoEntradaFormulario,
  tipoTieneDatos,
} from "./armarNuevoEvento"

type Props = {
  tipo: TipoEntradaFormulario
  onCambio: (tipo: TipoEntradaFormulario) => void
  onQuitar: (() => void) | null
  error: ErrorDelTipo | null
}

async function quitarSiConfirma(
  tipo: TipoEntradaFormulario,
  onQuitar: () => void,
) {
  const confirmado =
    !tipoTieneDatos(tipo) ||
    (await confirmar(
      "Quitar tipo de entrada",
      `Se borra lo que cargaste en «${tipo.nombre.trim() || "este tipo"}».`,
      true,
    ))
  if (confirmado) onQuitar()
}

export function FormularioTipoEntrada({
  tipo,
  onCambio,
  onQuitar,
  error,
}: Props) {
  function cambiar(campo: keyof TipoEntradaFormulario, valor: string) {
    onCambio({ ...tipo, [campo]: valor })
  }

  function errorDe(campo: keyof TipoEntradaFormulario) {
    return error?.campoDelTipo === campo ? error.mensaje : undefined
  }

  return (
    <View style={styles.tipo}>
      <View style={styles.encabezado}>
        <Text style={theme.texto.subtitulo}>
          {tipo.nombre.trim() || "Tipo de entrada"}
        </Text>
        {onQuitar && (
          <BotonQuitar
            etiqueta="Quitar tipo de entrada"
            onPress={() => quitarSiConfirma(tipo, onQuitar)}
          />
        )}
      </View>
      <Campo
        etiqueta="Nombre"
        value={tipo.nombre}
        onChangeText={(valor) => cambiar("nombre", valor)}
        placeholder="General"
        error={errorDe("nombre")}
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
            error={errorDe("precio")}
          />
        </View>
        <View style={styles.columna}>
          <Campo
            etiqueta="Cupo"
            value={tipo.cupo}
            onChangeText={(valor) => cambiar("cupo", valor)}
            keyboardType="numeric"
            placeholder="200"
            error={errorDe("cupo")}
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
