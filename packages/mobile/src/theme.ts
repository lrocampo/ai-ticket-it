const colores = {
  primario: "#3B1E6E",
  primarioSuave: "#EDE7F6",
  fondo: "#F5F4F8",
  superficie: "#FFFFFF",
  texto: "#1C1B22",
  textoSecundario: "#625F70",
  borde: "#E3E1EA",
  bordeControl: "#8C8899",
  error: "#C62828",
  estrella: "#C77700",
  sobrePrimario: "#FFFFFF",
}

// 44 pt es el área táctil mínima de Apple HIG (better-accessibility, "Minimum
// hit area"); los controles más chicos la completan con hitSlop.
const areaTactil = 44

const radios = {
  s: 8,
  m: 12,
  pill: 999,
}

// Interlineado por rol de better-typography: título 1.2, subtítulo 1.3,
// cuerpo 1.5 y textos chicos 1.4.
const texto = {
  titulo: {
    fontSize: 22,
    lineHeight: 26,
    letterSpacing: -0.2,
    fontWeight: "700",
    color: colores.texto,
  },
  subtitulo: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
    color: colores.texto,
  },
  cuerpo: { fontSize: 15, lineHeight: 23, color: colores.texto },
  chico: { fontSize: 13, lineHeight: 18, color: colores.texto },
  secundario: { fontSize: 13, lineHeight: 18, color: colores.textoSecundario },
  destacado: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: colores.primario,
  },
  error: { fontSize: 13, lineHeight: 18, color: colores.error },
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
  areaTactil,
  espacios,
  radios,
  texto,
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    ...sombra,
  },
  // Sin lineHeight: en iOS corre hacia abajo el texto de un TextInput.
  input: {
    fontSize: texto.cuerpo.fontSize,
    color: texto.cuerpo.color,
    paddingHorizontal: espacios.m,
    paddingVertical: espacios.s,
    borderRadius: radios.s,
    borderWidth: 1,
    borderColor: colores.bordeControl,
    backgroundColor: colores.superficie,
  },
} as const
