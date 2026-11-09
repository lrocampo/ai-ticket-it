import { useLocalSearchParams } from "expo-router"
import { ScrollView, StyleSheet, Text, View } from "react-native"

import { BadgeEstado } from "../../src/components/BadgeEstado"
import { Cargable } from "../../src/components/Cargable"
import { Estrellas } from "../../src/components/Estrellas"
import { Seccion } from "../../src/components/Seccion"
import { AccionesDeCompra } from "../../src/features/compras/AccionesDeCompra"
import { ChatDeCompra } from "../../src/features/compras/ChatDeCompra"
import { FormularioResena } from "../../src/features/compras/FormularioResena"
import { useCarga } from "../../src/hooks/useCarga"
import { obtenerCompra } from "../../src/services/api"
import { theme } from "../../src/theme"
import {
  formatearFecha,
  formatearFechaCorta,
  formatearFechaHora,
  formatearPesos,
  textoDiasRestantes,
} from "../../src/utils/fechas"

export default function DetalleCompra() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const carga = useCarga(() => obtenerCompra(id), [id])

  return (
    <Cargable carga={carga}>
      {(compra) => (
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.pantalla}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
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

          <AccionesDeCompra
            compra={compra}
            onCompraActualizada={carga.setDatos}
          />

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

          {compra.resena && (
            <Seccion titulo="Reseña">
              <Estrellas puntuacion={compra.resena.puntuacion} tamano={20} />
              <Text style={theme.texto.cuerpo}>{compra.resena.detalle}</Text>
              <Text style={theme.texto.secundario}>
                {formatearFechaCorta(compra.resena.fecha)}
              </Text>
            </Seccion>
          )}

          {compra.acciones.includes("resenar") && (
            <FormularioResena
              compra={compra}
              onCompraActualizada={carga.setDatos}
            />
          )}

          <Seccion titulo="Historial">
            {compra.historial.map((cambio, indice) => (
              <View key={indice} style={styles.cambio}>
                <View style={styles.datosCambio}>
                  <Text style={theme.texto.cuerpo}>
                    {cambio.quien.nombre} {cambio.quien.apellido}
                  </Text>
                  <Text style={theme.texto.secundario}>
                    {formatearFechaHora(cambio.fechaHora)}
                  </Text>
                </View>
                <BadgeEstado estado={cambio.estado} />
              </View>
            ))}
          </Seccion>

          <Seccion titulo="Mensajes">
            <ChatDeCompra
              compra={compra}
              onCompraActualizada={carga.setDatos}
            />
          </Seccion>
        </ScrollView>
      )}
    </Cargable>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.dato}>
      <Text style={theme.texto.secundario}>{etiqueta}</Text>
      <Text style={styles.valor}>{valor}</Text>
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
    fontVariant: ["tabular-nums"],
  },
  dato: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.espacios.m,
  },
  valor: {
    ...theme.texto.cuerpo,
    fontVariant: ["tabular-nums"],
  },
  cambio: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: theme.espacios.m,
  },
  datosCambio: {
    flex: 1,
  },
})
