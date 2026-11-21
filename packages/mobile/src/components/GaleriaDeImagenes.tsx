import { useState } from "react"
import {
  FlatList,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native"

import { theme } from "../theme"

type Props = {
  urls: string[]
  nombreDelEvento: string
}

export function GaleriaDeImagenes({ urls, nombreDelEvento }: Props) {
  const { width } = useWindowDimensions()
  const [pagina, setPagina] = useState(0)

  if (urls.length === 0) return null

  function alTerminarDeDeslizar(
    evento: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    setPagina(Math.round(evento.nativeEvent.contentOffset.x / width))
  }

  return (
    <View>
      <FlatList
        testID="galeria"
        data={urls}
        keyExtractor={(_, indice) => String(indice)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={alTerminarDeDeslizar}
        renderItem={({ item, index }) => (
          <Image
            source={{ uri: item }}
            accessible
            accessibilityLabel={`Imagen ${index + 1} de ${urls.length} de ${nombreDelEvento}`}
            style={[styles.imagen, { width }]}
          />
        )}
      />
      {urls.length > 1 && (
        <Text
          style={styles.indicador}
          accessibilityLabel={`Imagen ${pagina + 1} de ${urls.length}`}
        >
          {pagina + 1} / {urls.length}
        </Text>
      )}
    </View>
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
