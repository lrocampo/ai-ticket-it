import DateTimePicker from "@react-native-community/datetimepicker"
import { router, Stack, usePreventRemove } from "expo-router"
import { useState } from "react"
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native"

import { Boton } from "../../src/components/Boton"
import { Campo } from "../../src/components/Campo"
import { Cargable } from "../../src/components/Cargable"
import { Chip } from "../../src/components/Chip"
import { Seccion } from "../../src/components/Seccion"
import {
  armarNuevoEvento,
  type CampoDelEvento,
  type ErrorDelFormulario,
  type FormularioEvento,
  formularioTieneDatos,
  formularioVacio,
  TIPO_VACIO,
  type TipoEntradaFormulario,
} from "../../src/features/eventos/armarNuevoEvento"
import { FormularioTipoEntrada } from "../../src/features/eventos/FormularioTipoEntrada"
import { useCarga } from "../../src/hooks/useCarga"
import { useEnvio } from "../../src/hooks/useEnvio"
import { crearEvento, listarCategorias } from "../../src/services/api"
import { theme } from "../../src/theme"
import { confirmar } from "../../src/utils/confirmar"
import { formatearFecha } from "../../src/utils/fechas"

export default function CrearEvento() {
  const categorias = useCarga(listarCategorias, [])
  const [formulario, setFormulario] = useState(formularioVacio)
  const { enviando: creando, enviar } = useEnvio()
  const [pickerAbierto, setPickerAbierto] = useState<"fecha" | "hora" | null>(
    null,
  )
  const [creado, setCreado] = useState(false)
  const [error, setError] = useState<ErrorDelFormulario | null>(null)
  const { tiposEntrada } = formulario

  const permitirSalir = usePreventRemove(
    formularioTieneDatos(formulario) && !creado,
    async ({ repeat }) => {
      const descartar = await confirmar(
        "Descartar el evento",
        "Se pierde todo lo que cargaste.",
        true,
      )
      if (descartar) repeat()
    },
  )

  function actualizar<K extends keyof FormularioEvento>(
    campo: K,
    valor: FormularioEvento[K],
  ) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }))
    setError(null)
  }

  function errorDe(campo: CampoDelEvento) {
    return error?.campo === campo ? error.mensaje : undefined
  }

  function errorDelTipo(indice: number) {
    return error?.campo === "tipo" && error.indice === indice ? error : null
  }

  function mostrarError(nuevo: ErrorDelFormulario) {
    setError(nuevo)
    AccessibilityInfo.announceForAccessibility(nuevo.mensaje)
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
      mostrarError(resultado.error)
      return
    }
    enviar("No se pudo crear el evento", async () => {
      const evento = await crearEvento(resultado.evento)
      setCreado(true)
      permitirSalir()
      router.replace(`/evento/${evento.id}`)
    })
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              hitSlop={theme.margenTactil(theme.texto.cuerpo.lineHeight)}
              accessibilityRole="button"
            >
              <Text style={styles.cancelar}>Cancelar</Text>
            </Pressable>
          ),
        }}
      />
      <Cargable carga={categorias}>
        {(listaDeCategorias) => (
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
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
                error={errorDe("nombre")}
              />
              <Campo
                etiqueta="Descripción"
                value={formulario.descripcion}
                onChangeText={(descripcion) =>
                  actualizar("descripcion", descripcion)
                }
                placeholder="Contá de qué se trata"
                multiline
                error={errorDe("descripcion")}
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
              {errorDe("categoriaId") && (
                <Text style={theme.texto.error}>{errorDe("categoriaId")}</Text>
              )}
              <Campo
                etiqueta="URL de una imagen (opcional)"
                value={formulario.imagen}
                onChangeText={(imagen) => actualizar("imagen", imagen)}
                placeholder="https://"
                keyboardType="url"
                autoCapitalize="none"
                autoCorrect={false}
                error={errorDe("imagen")}
              />
            </Seccion>

            <Seccion titulo="Fecha y hora">
              <Text style={theme.texto.cuerpo}>
                {formatearFecha(formulario.fecha.toISOString())}
              </Text>
              {Platform.OS === "ios" ? (
                <DateTimePicker
                  value={formulario.fecha}
                  mode="datetime"
                  display="spinner"
                  locale="es-AR"
                  minimumDate={new Date()}
                  onValueChange={(_, fecha) => actualizar("fecha", fecha)}
                />
              ) : (
                <>
                  <Boton
                    texto="Elegir fecha"
                    tono="secundario"
                    onPress={() => setPickerAbierto("fecha")}
                  />
                  <Boton
                    texto="Elegir hora"
                    tono="secundario"
                    onPress={() => setPickerAbierto("hora")}
                  />
                  {pickerAbierto && (
                    <DateTimePicker
                      value={formulario.fecha}
                      mode={pickerAbierto === "fecha" ? "date" : "time"}
                      is24Hour
                      minimumDate={new Date()}
                      onValueChange={(_, fecha) => {
                        setPickerAbierto(null)
                        actualizar("fecha", fecha)
                      }}
                      onDismiss={() => setPickerAbierto(null)}
                    />
                  )}
                </>
              )}
              {errorDe("fecha") && (
                <Text style={theme.texto.error}>{errorDe("fecha")}</Text>
              )}
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
                  error={errorDelTipo(indice)}
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

            {error && (
              <Text style={theme.texto.error}>
                {resumenDelError(error, tiposEntrada)}
              </Text>
            )}
            <Boton
              texto={creando ? "Creando…" : "Crear evento"}
              deshabilitado={creando}
              onPress={crear}
            />
          </ScrollView>
        )}
      </Cargable>
    </>
  )
}

function resumenDelError(
  error: ErrorDelFormulario,
  tipos: TipoEntradaFormulario[],
) {
  if (error.campo !== "tipo") return error.mensaje
  const nombre = tipos[error.indice]?.nombre.trim()
  return nombre ? `«${nombre}»: ${error.mensaje}` : error.mensaje
}

const styles = StyleSheet.create({
  cancelar: {
    ...theme.texto.cuerpo,
    color: theme.colores.primario,
  },
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
