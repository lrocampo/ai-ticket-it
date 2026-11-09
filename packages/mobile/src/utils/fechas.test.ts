import {
  formatearFecha,
  formatearFechaCorta,
  formatearFechaHora,
  formatearPesos,
  textoDiasRestantes,
} from "./fechas"

// Se arma en hora local para que el test no dependa de la zona horaria.
const miercoles = new Date(2027, 2, 3, 9, 7).toISOString()
const lunes = new Date(2026, 10, 9, 21, 45).toISOString()

describe("formatearFecha", () => {
  test("muestra día de la semana, día, mes y hora", () => {
    expect(formatearFecha(miercoles)).toBe("mié 3 mar, 09:07")
    expect(formatearFecha(lunes)).toBe("lun 9 nov, 21:45")
  })
})

describe("formatearFechaCorta", () => {
  test("muestra día, mes y año", () => {
    expect(formatearFechaCorta(miercoles)).toBe("3 mar 2027")
  })
})

describe("formatearFechaHora", () => {
  test("muestra la fecha con dos dígitos y la hora", () => {
    expect(formatearFechaHora(miercoles)).toBe("03/03/2027 09:07")
    expect(formatearFechaHora(lunes)).toBe("09/11/2026 21:45")
  })
})

describe("formatearPesos", () => {
  test("separa los miles con punto y no muestra centavos", () => {
    expect(formatearPesos(18000)).toBe("$ 18.000")
    expect(formatearPesos(1234.6)).toBe("$ 1.235")
    expect(formatearPesos(0)).toBe("$ 0")
  })
})

describe("textoDiasRestantes", () => {
  test.each([
    [0, "Es hoy"],
    [1, "Falta 1 día"],
    [12, "Faltan 12 días"],
  ])("con %i días dice %s", (dias, texto) => {
    expect(textoDiasRestantes(dias)).toBe(texto)
  })
})
