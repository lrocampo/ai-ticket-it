import DateTimePicker from "@react-native-community/datetimepicker"
import { router, Stack, usePreventRemove } from "expo-router"
import { useRef, useState } from "react"
import {
  AccessibilityInfo,
  type LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  type ScrollViewInstance,
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

// Deja a la vista el header transparente de iOS y un poco de contexto arriba
// del campo con error.
const MARGEN_SOBRE_EL_ERROR = 72

type Bloque = "evento" | "fecha" | "entradas"

export default function CrearEvento() {
  const categorias = useCarga(listarCategorias, [])
  const [formulario, setFormulario] = useState(formularioVacio)
  const { enviando: creando, enviar } = useEnvio()
  const [pickerAbierto, setPickerAbierto] = useState<"fecha" | "hora" | null>(
    null,
  )
  const [creado, setCreado] = useState(false)
  const [error, setError] = useState<ErrorDelFormulario | null>(null)
  const scroll = useRef<ScrollViewInstance>(null)
  const posiciones = useRef<Partial<Record<Bloque, number>>>({})
  const posicionesDeTipos = useRef<number[]>([])
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

  function errorDe(campo: Exclude<CampoDelEvento, object>) {
    return error?.campo === campo ? error.mensaje : undefined
  }

  function errorDelTipo(indice: number) {
    if (typeof error?.campo !== "object" || error.campo.tipo !== indice) {
      return null
    }
    return { campo: error.campo.campo, mensaje: error.mensaje }
  }

  function guardarPosicion(bloque: Bloque) {
    return (evento: LayoutChangeEvent) => {
      posiciones.current[bloque] = evento.nativeEvent.layout.y
    }
  }

  function posicionDe(campo: CampoDelEvento) {
    const { evento = 0, fecha = 0, entradas = 0 } = posiciones.current
    if (typeof campo === "object") {
      return entradas + (posicionesDeTipos.current[campo.tipo] ?? 0)
    }
    return campo === "fecha" ? fecha : evento
  }

  function mostrarError(nuevo: ErrorDelFormulario) {
    setError(nuevo)
    AccessibilityInfo.announceForAccessibility(nuevo.mensaje)
    const y = posicionDe(nuevo.campo) - MARGEN_SOBRE_EL_ERROR
    scroll.current?.scrollTo({ y: Math.max(0, y), animated: true })
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
              hitSlop={12}
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
            ref={scroll}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={styles.pantalla}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
          >
            <View onLayout={guardarPosicion("evento")}>
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
                  <Text style={theme.texto.error}>
                    {errorDe("categoriaId")}
                  </Text>
                )}
                <Campo
                  etiqueta="URL de una imagen (opcional)"
                  value={formulario.imagen}
                  onChangeText={(imagen) => actualizar("imagen", imagen)}
                  placeholder="https://"
                  keyboardType="url"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errorDe("multimedia")}
                />
              </Seccion>
            </View>

            <View onLayout={guardarPosicion("fecha")}>
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
            </View>

            <View onLayout={guardarPosicion("entradas")}>
              <Seccion titulo="Entradas">
                {tiposEntrada.map((tipo, indice) => (
                  <View
                    key={indice}
                    onLayout={(evento) => {
                      posicionesDeTipos.current[indice] =
                        evento.nativeEvent.layout.y
                    }}
                  >
                    <FormularioTipoEntrada
                      tipo={tipo}
                      onCambio={(cambiado) => cambiarTipo(indice, cambiado)}
                      onQuitar={
                        tiposEntrada.length > 1
                          ? () => quitarTipo(indice)
                          : null
                      }
                      error={errorDelTipo(indice)}
                    />
                  </View>
                ))}
                <Boton
                  texto="Agregar tipo de entrada"
                  tono="secundario"
                  onPress={() =>
                    actualizar("tiposEntrada", [...tiposEntrada, TIPO_VACIO])
                  }
                />
              </Seccion>
            </View>

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
