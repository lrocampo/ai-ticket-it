const colores = {
  primario: "#3B1E6E",
  primarioSuave: "#EDE7F6",
  fondo: "#F5F4F8",
  superficie: "#FFFFFF",
  texto: "#1C1B22",
  textoSecundario: "#6B6878",
  borde: "#E3E1EA",
  error: "#C62828",
  estrella: "#F5A623",
  sobrePrimario: "#FFFFFF",
}

const radios = {
  s: 8,
  m: 12,
  pill: 999,
}

const texto = {
  titulo: { fontSize: 22, fontWeight: "700", color: colores.texto },
  subtitulo: { fontSize: 17, fontWeight: "600", color: colores.texto },
  cuerpo: { fontSize: 15, color: colores.texto },
  chico: { fontSize: 13, color: colores.texto },
  secundario: { fontSize: 13, color: colores.textoSecundario },
  destacado: { fontSize: 13, fontWeight: "600", color: colores.primario },
} as const

const espacios = {
  xs: 4,
  s: 8,
  m: 12,
  l: 16,
  xl: 24,
}

const sombra = {
  shadowColor: "#000",
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
}

export const theme = {
  colores,
  espacios,
  radios,
  texto,
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    ...sombra,
  },
  input: {
    ...texto.cuerpo,
    paddingHorizontal: espacios.m,
    paddingVertical: espacios.s,
    borderRadius: radios.s,
    borderWidth: 1,
    borderColor: colores.borde,
    backgroundColor: colores.superficie,
  },
} as const
