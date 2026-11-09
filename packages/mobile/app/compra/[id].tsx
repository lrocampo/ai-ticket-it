import { useLocalSearchParams } from "expo-router"
import { ScrollView, StyleSheet, Text, View } from "react-native"

import { BadgeEstado } from "../../src/components/BadgeEstado"
import { Cargando } from "../../src/components/Cargando"
import { MensajeDeError } from "../../src/components/MensajeDeError"
import { Seccion } from "../../src/components/Seccion"
import { AccionesDeCompra } from "../../src/features/compras/AccionesDeCompra"
import { ChatDeCompra } from "../../src/features/compras/ChatDeCompra"
import { useCarga } from "../../src/hooks/useCarga"
import { obtenerCompra } from "../../src/services/api"
import { theme } from "../../src/theme"
import {
  formatearFecha,
  formatearFechaHora,
  formatearPesos,
  textoDiasRestantes,
} from "../../src/utils/fechas"

export default function DetalleCompra() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { datos, setDatos, error, recargar } = useCarga(
    () => obtenerCompra(id),
    [id],
  )

  if (error && !datos) {
    return <MensajeDeError mensaje={error} onReintentar={recargar} />
  }
  if (!datos) return <Cargando />

  const compra = datos

  return (
    <ScrollView contentContainerStyle={styles.pantalla}>
      <View style={styles.encabezado}>
        <BadgeEstado estado={compra.estado} />
        <Text style={styles.titulo}>{compra.evento.nombre}</Text>
        <Text style={theme.texto.secundario}>
          {formatearFecha(compra.evento.fecha)}
        </Text>
        {compra.diasParaElEvento !== null && (
          <Text style={styles.dias}>
            {textoDiasRestantes(compra.diasParaElEvento)}
          </Text>
        )}
      </View>

      <Seccion titulo="Datos de la compra">
        <Dato etiqueta="Entrada" valor={compra.tipoEntrada.nombre} />
        <Dato
          etiqueta="Precio unitario"
          valor={formatearPesos(compra.tipoEntrada.precio)}
        />
        <Dato etiqueta="Cantidad" valor={String(compra.cantidad)} />
        <Dato etiqueta="Total" valor={formatearPesos(compra.total)} />
        <Dato
          etiqueta="Comprador"
          valor={`${compra.comprador.nombre} ${compra.comprador.apellido}`}
        />
        <Dato
          etiqueta="Organizador"
          valor={`${compra.evento.organizador.nombre} ${compra.evento.organizador.apellido}`}
        />
      </Seccion>

      <AccionesDeCompra compra={compra} onCompraActualizada={setDatos} />

      <Seccion titulo="Historial">
        {compra.historial.map((cambio, indice) => (
          <View key={indice} style={styles.cambio}>
            <BadgeEstado estado={cambio.estado} />
            <View style={styles.datosCambio}>
              <Text style={theme.texto.cuerpo}>
                {cambio.quien.nombre} {cambio.quien.apellido}
              </Text>
              <Text style={theme.texto.secundario}>
                {formatearFechaHora(cambio.fechaHora)}
              </Text>
            </View>
          </View>
        ))}
      </Seccion>

      <Seccion titulo="Mensajes">
        <ChatDeCompra compra={compra} onCompraActualizada={setDatos} />
      </Seccion>
    </ScrollView>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={theme.texto.secundario}>{etiqueta}</Text>
      <Text style={theme.texto.cuerpo}>{valor}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pantalla: {
    padding: theme.espacios.l,
    paddingBottom: theme.espacios.xl * 2,
    gap: theme.espacios.l,
  },
  encabezado: {
    gap: theme.espacios.xs,
  },
  titulo: {
    ...theme.texto.titulo,
    marginTop: theme.espacios.s,
  },
  dias: {
    ...theme.texto.cuerpo,
    color: theme.colores.primario,
    fontWeight: "700",
  },
  dato: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.espacios.m,
  },
  cambio: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.espacios.m,
  },
  datosCambio: {
    flex: 1,
  },
})
