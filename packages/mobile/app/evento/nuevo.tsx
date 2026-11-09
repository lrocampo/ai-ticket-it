import DateTimePicker from "@react-native-community/datetimepicker"
import { router } from "expo-router"
import { useState } from "react"
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native"

import { Boton } from "../../src/components/Boton"
import { Campo } from "../../src/components/Campo"
import { Cargable } from "../../src/components/Cargable"
import { Chip } from "../../src/components/Chip"
import { Seccion } from "../../src/components/Seccion"
import {
  armarNuevoEvento,
  type FormularioEvento,
  formularioVacio,
  TIPO_VACIO,
  type TipoEntradaFormulario,
} from "../../src/features/eventos/armarNuevoEvento"
import { FormularioTipoEntrada } from "../../src/features/eventos/FormularioTipoEntrada"
import { useCarga } from "../../src/hooks/useCarga"
import { useEnvio } from "../../src/hooks/useEnvio"
import { crearEvento, listarCategorias } from "../../src/services/api"
import { theme } from "../../src/theme"

export default function CrearEvento() {
  const categorias = useCarga(listarCategorias, [])
  const [formulario, setFormulario] = useState(formularioVacio)
  const { enviando: creando, enviar } = useEnvio("No se pudo crear el evento")
  const { tiposEntrada } = formulario

  function actualizar<K extends keyof FormularioEvento>(
    campo: K,
    valor: FormularioEvento[K],
  ) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }))
  }

  function cambiarTipo(indice: number, tipo: TipoEntradaFormulario) {
    actualizar(
      "tiposEntrada",
      tiposEntrada.map((t, i) => (i === indice ? tipo : t)),
    )
  }

  function quitarTipo(indice: number) {
    actualizar(
      "tiposEntrada",
      tiposEntrada.filter((_, i) => i !== indice),
    )
  }

  function crear() {
    const resultado = armarNuevoEvento(formulario)
    if ("error" in resultado) {
      Alert.alert("Falta completar", resultado.error)
      return
    }
    enviar(async () => {
      const evento = await crearEvento(resultado.evento)
      router.replace(`/evento/${evento.id}`)
    })
  }

  return (
    <Cargable carga={categorias}>
      {(listaDeCategorias) => (
        <ScrollView
          contentContainerStyle={styles.pantalla}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <Seccion titulo="El evento">
            <Campo
              etiqueta="Nombre"
              value={formulario.nombre}
              onChangeText={(nombre) => actualizar("nombre", nombre)}
              placeholder="Recital en el Luna Park"
            />
            <Campo
              etiqueta="Descripción"
              value={formulario.descripcion}
              onChangeText={(descripcion) =>
                actualizar("descripcion", descripcion)
              }
              placeholder="Contá de qué se trata"
              multiline
            />
            <Text style={theme.texto.destacado}>Categoría</Text>
            <View style={styles.chips}>
              {listaDeCategorias.map((categoria) => (
                <Chip
                  key={categoria.id}
                  texto={categoria.nombre}
                  activo={formulario.categoriaId === categoria.id}
                  onPress={() => actualizar("categoriaId", categoria.id)}
                />
              ))}
            </View>
            <Campo
              etiqueta="URL de una imagen (opcional)"
              value={formulario.imagen}
              onChangeText={(imagen) => actualizar("imagen", imagen)}
              placeholder="https://"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Seccion>

          <Seccion titulo="Fecha y hora">
            <DateTimePicker
              value={formulario.fecha}
              mode="datetime"
              display="spinner"
              locale="es-AR"
              minimumDate={new Date()}
              onValueChange={(_, fecha) => actualizar("fecha", fecha)}
            />
          </Seccion>

          <Seccion titulo="Entradas">
            {tiposEntrada.map((tipo, indice) => (
              <FormularioTipoEntrada
                key={indice}
                tipo={tipo}
                onCambio={(cambiado) => cambiarTipo(indice, cambiado)}
                onQuitar={
                  tiposEntrada.length > 1 ? () => quitarTipo(indice) : null
                }
              />
            ))}
            <Boton
              texto="Agregar tipo de entrada"
              tono="secundario"
              onPress={() =>
                actualizar("tiposEntrada", [...tiposEntrada, TIPO_VACIO])
              }
            />
          </Seccion>

          <Boton
            texto={creando ? "Creando…" : "Crear evento"}
            deshabilitado={creando}
            onPress={crear}
          />
        </ScrollView>
      )}
    </Cargable>
  )
}

const styles = StyleSheet.create({
  pantalla: {
    padding: theme.espacios.l,
    paddingBottom: theme.espacios.xl * 2,
    gap: theme.espacios.l,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.espacios.s,
  },
})
