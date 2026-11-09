export const theme = {
  colores: {
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
  },
  espacios: {
    xs: 4,
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
  },
  radios: {
    s: 8,
    m: 12,
    pill: 999,
  },
  texto: {
    titulo: { fontSize: 22, fontWeight: "700" },
    subtitulo: { fontSize: 17, fontWeight: "600" },
    cuerpo: { fontSize: 15 },
    chico: { fontSize: 13 },
  },
  sombra: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
} as const
