import { useState } from "react"
import { Alert, StyleSheet, View } from "react-native"

import { Boton, type Tono } from "../../components/Boton"
import {
  cancelarCompra,
  confirmarPago,
  mensajeDe,
  reembolsarCompra,
  utilizarCompra,
} from "../../services/api"
import { theme } from "../../theme"
import type { Accion, Compra } from "../../types"
import { formatearPesos } from "../../utils/fechas"

type AccionConBoton = Exclude<Accion, "resenar">

const ACCIONES: Record<
  AccionConBoton,
  {
    etiqueta: string
    tono: Tono
    confirmacion: (compra: Compra) => string
    ejecutar: (id: string) => Promise<Compra>
  }
> = {
  confirmarPago: {
    etiqueta: "Confirmar pago",
    tono: "primario",
    confirmacion: (compra) =>
      `Pagar ${formatearPesos(compra.total)}. El pago es simulado, no se cobra nada.`,
    ejecutar: confirmarPago,
  },
  utilizar: {
    etiqueta: "Marcar como utilizada",
    tono: "primario",
    confirmacion: () => "Marcar la entrada como utilizada.",
    ejecutar: utilizarCompra,
  },
  cancelar: {
    etiqueta: "Cancelar compra",
    tono: "peligro",
    confirmacion: () => "La compra queda cancelada y se libera el cupo.",
    ejecutar: cancelarCompra,
  },
  reembolsar: {
    etiqueta: "Registrar reembolso",
    tono: "secundario",
    confirmacion: (compra) =>
      `Registrar el reembolso de ${formatearPesos(compra.total)}.`,
    ejecutar: reembolsarCompra,
  },
}

function tieneBoton(accion: Accion): accion is AccionConBoton {
  return accion !== "resenar"
}

type Props = {
  compra: Compra
  onCompraActualizada: (compra: Compra) => void
}

export function AccionesDeCompra({ compra, onCompraActualizada }: Props) {
  const [enCurso, setEnCurso] = useState(false)
  const acciones = compra.acciones.filter(tieneBoton)

  if (acciones.length === 0) return null

  async function ejecutar(accion: AccionConBoton) {
    setEnCurso(true)
    try {
      onCompraActualizada(await ACCIONES[accion].ejecutar(compra.id))
    } catch (e) {
      Alert.alert("No se pudo", mensajeDe(e))
    } finally {
      setEnCurso(false)
    }
  }

  function pedirConfirmacion(accion: AccionConBoton) {
    const { etiqueta, tono, confirmacion } = ACCIONES[accion]
    Alert.alert(etiqueta, confirmacion(compra), [
      { text: "Cancelar", style: "cancel" },
      {
        text: etiqueta,
        style: tono === "peligro" ? "destructive" : "default",
        onPress: () => ejecutar(accion),
      },
    ])
  }

  return (
    <View style={styles.botones}>
      {acciones.map((accion) => (
        <Boton
          key={accion}
          texto={ACCIONES[accion].etiqueta}
          tono={ACCIONES[accion].tono}
          deshabilitado={enCurso}
          onPress={() => pedirConfirmacion(accion)}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  botones: {
    gap: theme.espacios.s,
  },
})
