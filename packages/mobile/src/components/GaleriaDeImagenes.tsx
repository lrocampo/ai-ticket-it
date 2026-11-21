import { useRef, useState } from "react"
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native"

import { theme } from "../theme"
import { SinImagen } from "./SinImagen"

type Props = {
  urls: string[]
  nombreDelEvento: string
}

const CONFIGURACION_DE_VISTA = { itemVisiblePercentThreshold: 50 }

export function GaleriaDeImagenes({ urls, nombreDelEvento }: Props) {
  const { width } = useWindowDimensions()
  const [pagina, setPagina] = useState(0)
  const alCambiarLasVisibles = useRef(
    ({ viewableItems }: { viewableItems: { index?: number | null }[] }) => {
      const visible = viewableItems[0]?.index
      if (visible != null) setPagina(visible)
    },
  )

  if (urls.length === 0) return null

  return (
    <View>
      <FlatList
        testID="galeria"
        data={urls}
        keyExtractor={(_, indice) => String(indice)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        viewabilityConfig={CONFIGURACION_DE_VISTA}
        onViewableItemsChanged={alCambiarLasVisibles.current}
        renderItem={({ item, index }) => (
          <PaginaDeGaleria
            url={item}
            width={width}
            etiqueta={`Imagen ${index + 1} de ${urls.length} de ${nombreDelEvento}`}
          />
        )}
      />
      {urls.length > 1 && (
        <Text
          style={styles.indicador}
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          {pagina + 1} / {urls.length}
        </Text>
      )}
    </View>
  )
}

type PaginaProps = {
  url: string
  width: number
  etiqueta: string
}

function PaginaDeGaleria({ url, width, etiqueta }: PaginaProps) {
  const [fallo, setFallo] = useState(false)
  const propiedades = {
    accessible: true,
    accessibilityRole: "image",
    accessibilityLabel: etiqueta,
    style: [styles.imagen, { width }],
  } as const

  return fallo ? (
    <SinImagen {...propiedades} />
  ) : (
    <Image
      source={{ uri: url }}
      onError={() => setFallo(true)}
      {...propiedades}
    />
  )
}

const styles = StyleSheet.create({
  imagen: {
    height: 220,
    backgroundColor: theme.colores.primarioSuave,
  },
  indicador: {
    ...theme.texto.chico,
    position: "absolute",
    right: theme.espacios.m,
    bottom: theme.espacios.m,
    paddingHorizontal: theme.espacios.s,
    paddingVertical: theme.espacios.xs,
    borderRadius: theme.radios.pill,
    overflow: "hidden",
    color: theme.colores.sobrePrimario,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    fontVariant: ["tabular-nums"],
  },
})
