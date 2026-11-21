import { fireEvent, render, screen } from "@testing-library/react-native"

import type { EventoDetalle } from "../../types"
import { BloqueCompra } from "./BloqueCompra"

jest.mock("../../services/api")
jest.mock("expo-router", () => ({ router: { dismissTo: jest.fn() } }))
jest.mock("../../context/UsuarioContext", () => ({
  useUsuarioActual: () => ({
    id: "u1",
    nombre: "Ana",
    apellido: "García",
    email: "ana@example.com",
  }),
}))

function eventoDePrueba(cambios: Partial<EventoDetalle> = {}): EventoDetalle {
  const organizador = {
    id: "u2",
    nombre: "Bruno",
    apellido: "Díaz",
    email: "bruno@example.com",
    puntaje: null,
    cantidadResenas: 0,
  }
  return {
    id: "e1",
    nombre: "Recital",
    descripcion: "",
    categoria: { id: "c1", nombre: "Música", descripcion: "" },
    fecha: "2026-12-20T21:00:00.000Z",
    multimedia: [],
    organizador,
    tiposEntrada: [
      {
        id: "e1-1",
        nombre: "General",
        descripcion: "",
        precio: 9000,
        cupo: 100,
        disponibles: 100,
      },
    ],
    precioDesde: 9000,
    yaOcurrio: false,
    limitePorUsuario: 6,
    entradasDelUsuario: 0,
    resenasDelOrganizador: [],
    ...cambios,
  }
}

async function elegirGeneral(evento: EventoDetalle) {
  await render(<BloqueCompra evento={evento} />)
  await fireEvent.press(screen.getByRole("radio", { name: /General/ }))
}

async function sumarHastaElTope() {
  for (let i = 0; i < 10; i++) {
    const sumar = screen.getByRole("button", { name: "Sumar uno" })
    if (sumar.props.accessibilityState?.disabled) break
    await fireEvent.press(sumar)
  }
}

test("avisa cuántas entradas se pueden comprar por persona", async () => {
  await elegirGeneral(eventoDePrueba())

  expect(screen.getByText("Hasta 6 por persona")).toBeOnTheScreen()
})

test("avisa también cuántas entradas ya tiene el usuario", async () => {
  await elegirGeneral(eventoDePrueba({ entradasDelUsuario: 2 }))

  expect(screen.getByText("Hasta 6 por persona · ya tenés 2")).toBeOnTheScreen()
})

test("no deja pedir más de lo que le queda al usuario", async () => {
  await elegirGeneral(eventoDePrueba({ entradasDelUsuario: 4 }))

  await sumarHastaElTope()

  expect(screen.getByText("2")).toBeOnTheScreen()
})

test("el cupo sigue limitando cuando queda menos que el máximo", async () => {
  const evento = eventoDePrueba()
  evento.tiposEntrada[0].disponibles = 3
  await elegirGeneral(evento)

  await sumarHastaElTope()

  expect(screen.getByText("3")).toBeOnTheScreen()
})

test("con el máximo alcanzado explica por qué no se puede comprar", async () => {
  await render(
    <BloqueCompra evento={eventoDePrueba({ entradasDelUsuario: 6 })} />,
  )

  expect(
    screen.getByText("Ya tenés el máximo de 6 entradas para este evento."),
  ).toBeOnTheScreen()
  expect(screen.queryByRole("button", { name: /Comprá/ })).toBeNull()
  expect(screen.getByRole("radio", { name: /General/ })).toBeDisabled()
})
