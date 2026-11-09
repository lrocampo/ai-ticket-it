import { fireEvent, render, screen } from "@testing-library/react-native"
import { Alert } from "react-native"

import { TIPO_VACIO, type TipoEntradaFormulario } from "./armarNuevoEvento"
import { FormularioTipoEntrada } from "./FormularioTipoEntrada"

const alerta = jest.spyOn(Alert, "alert")

beforeEach(() => alerta.mockReset())

function responderAlerta(boton: string) {
  alerta.mockImplementation((_titulo, _mensaje, botones) =>
    botones?.find((b) => b.text === boton)?.onPress?.(),
  )
}

async function tocarQuitar(tipo: TipoEntradaFormulario) {
  const onQuitar = jest.fn()
  await render(
    <FormularioTipoEntrada
      tipo={tipo}
      onCambio={jest.fn()}
      onQuitar={onQuitar}
    />,
  )
  await fireEvent.press(
    screen.getByRole("button", { name: "Quitar tipo de entrada" }),
  )
  return onQuitar
}

const conDatos = { ...TIPO_VACIO, nombre: "VIP", cupo: "20" }

test("un tipo sin nada escrito se quita sin preguntar", async () => {
  const onQuitar = await tocarQuitar(TIPO_VACIO)

  expect(alerta).not.toHaveBeenCalled()
  expect(onQuitar).toHaveBeenCalled()
})

test("un tipo con datos pide confirmar y con Volver no se quita", async () => {
  responderAlerta("Volver")

  const onQuitar = await tocarQuitar(conDatos)

  expect(alerta).toHaveBeenCalledWith(
    "Quitar tipo de entrada",
    "Se borra lo que cargaste en «VIP».",
    expect.any(Array),
  )
  expect(onQuitar).not.toHaveBeenCalled()
})

test("al confirmar se quita el tipo con datos", async () => {
  responderAlerta("Quitar tipo de entrada")

  const onQuitar = await tocarQuitar(conDatos)

  expect(onQuitar).toHaveBeenCalled()
})
