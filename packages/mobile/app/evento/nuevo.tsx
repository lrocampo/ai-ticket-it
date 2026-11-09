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
  type TipoEntradaFormulario,
} from "../../src/features/eventos/armarNuevoEvento"
import { FormularioTipoEntrada } from "../../src/features/eventos/FormularioTipoEntrada"
import { useCarga } from "../../src/hooks/useCarga"
import {
  crearEvento,
  listarCategorias,
  mensajeDe,
} from "../../src/services/api"
import { theme } from "../../src/theme"

function mananaALas21() {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + 1)
  fecha.setHours(21, 0, 0, 0)
  return fecha
}

const TIPO_VACIO: TipoEntradaFormulario = {
  nombre: "",
  descripcion: "",
  precio: "",
  cupo: "",
}

export default function CrearEvento() {
  const categorias = useCarga(listarCategorias, [])
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [categoriaId, setCategoriaId] = useState<string | null>(null)
  const [fecha, setFecha] = useState(mananaALas21)
  const [imagen, setImagen] = useState("")
  const [tiposEntrada, setTiposEntrada] = useState([
    { ...TIPO_VACIO, nombre: "General" },
  ])
  const [creando, setCreando] = useState(false)

  function cambiarTipo(indice: number, tipo: TipoEntradaFormulario) {
    setTiposEntrada(tiposEntrada.map((t, i) => (i === indice ? tipo : t)))
  }

  function quitarTipo(indice: number) {
    setTiposEntrada(tiposEntrada.filter((_, i) => i !== indice))
  }

  async function crear() {
    const resultado = armarNuevoEvento({
      nombre,
      descripcion,
      categoriaId,
      fecha,
      imagen,
      tiposEntrada,
    })
    if ("error" in resultado) {
      Alert.alert("Falta completar", resultado.error)
      return
    }
    setCreando(true)
    try {
      const evento = await crearEvento(resultado.evento)
      router.replace(`/evento/${evento.id}`)
    } catch (e) {
      Alert.alert("No se pudo crear el evento", mensajeDe(e))
      setCreando(false)
    }
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
              value={nombre}
              onChangeText={setNombre}
              placeholder="Recital en el Luna Park"
            />
            <Campo
              etiqueta="Descripción"
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Contá de qué se trata"
              multiline
            />
            <Text style={theme.texto.destacado}>Categoría</Text>
            <View style={styles.chips}>
              {listaDeCategorias.map((categoria) => (
                <Chip
                  key={categoria.id}
                  texto={categoria.nombre}
                  activo={categoriaId === categoria.id}
                  onPress={() => setCategoriaId(categoria.id)}
                />
              ))}
            </View>
            <Campo
              etiqueta="URL de una imagen (opcional)"
              value={imagen}
              onChangeText={setImagen}
              placeholder="https://"
              keyboardType="url"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </Seccion>

          <Seccion titulo="Fecha y hora">
            <DateTimePicker
              value={fecha}
              mode="datetime"
              display="spinner"
              locale="es-AR"
              minimumDate={new Date()}
              onChange={(_, elegida) => elegida && setFecha(elegida)}
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
              onPress={() => setTiposEntrada([...tiposEntrada, TIPO_VACIO])}
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
