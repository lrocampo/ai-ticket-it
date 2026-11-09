# AI Ticket It: auditoría de calidad, segunda iteración (8c67f20~1..HEAD)

Alcance: los 31 archivos del rango, menos `package-lock.json`. Leí el diff completo y el contenido actual de `Compra.js`, `CompraService.js`, `CompraController.js`, los presentadores, y en la app `AccionesDeCompra`, `FormularioResena`, `ChatDeCompra`, `BloqueCompra`, `app/compra/[id].tsx`, `app/evento/nuevo.tsx`, `Campo`, `FormularioTipoEntrada`, `armarNuevoEvento` (y su test), `Boton`, `Estrellas`, `compraDePrueba`, `types.ts`, `useCarga`, `Cargable` y `mensajeDe` de `api.ts`. También leí `docs/dominio.md` y la validación zod de eventos. No corrí los tests porque no hay `node_modules`. No edité nada del repo. Los hallazgos de la revisión anterior (`docs/revisiones/2026-11-09-calidad-de-codigo.md`) están aplicados y no los repito.

## Veredicto

Es una iteración buena y con una idea central correcta: el backend decide qué acciones tiene cada usuario sobre una compra y la app se limita a dibujarlas. La tabla de botones de `AccionesDeCompra` no repite ninguna regla del backend: solo traduce un nombre de acción a etiqueta, tono, texto de confirmación y endpoint, que es presentación pura. Ningún archivo se acerca a las 1000 líneas (`nuevo.tsx` tiene 176 y `Compra.js` 205). Igual no la aprobaría tal como está. Hay tres cosas que corregiría antes del video. La primera es que la autorización del backend quedó repartida en tres piezas públicas que se coordinan por strings, cuando el dominio ya tiene el patrón exacto para resolverla en un solo método. La segunda es que el patrón "enviando + try/catch + Alert" está copiado cinco veces en la app. La tercera es que `armarNuevoEvento` documenta y testea un contrato falso: el `NaN` no viaja como `NaN`, viaja como `null`, y el usuario recibe "Datos inválidos" sin saber qué campo está mal. Los otros hallazgos son de menor impacto.

## Hallazgos, de mayor a menor impacto

### 1. La autorización del backend está en tres piezas públicas que se coordinan por strings; alcanza con un método de dominio simétrico a `#impedimento`

Hoy, para saber si un usuario puede cancelar, el servicio hace esto (`CompraService.js:70-77`): llama a `Compra.accion("cancelar")`, un método estático que existe solo para que el servicio lea dos campos de una fila de la tabla privada; llama a `compra.rolDe(usuario)`, que devuelve el string `"comprador"`, `"organizador"` o `null`; compara los dos strings, y arma el mensaje con `quien` y `verbo`. Al mismo tiempo, `accionesPara` (`Compra.js:130-136`) hace la misma comparación `acciones[accion].quien === rol` por su cuenta. La regla "quién puede hacer cada acción" está escrita una vez en la tabla, que era el objetivo, pero se consulta en dos lugares con dos códigos distintos, y el contrato entre la tabla y `rolDe` es que los strings que devuelve `rolDe` coincidan con los valores de la columna `quien`. Eso no lo dice ningún tipo ni ningún nombre. `Compra.accion` además expone la tabla hacia afuera de la clase, y `rolDe` queda público solo para el servicio y para `esParte`.

El dominio ya tiene la forma de resolver esto: `#impedimento(accion, ahora)` devuelve el motivo de rechazo o `null`, y tanto `accionesPara` como las transiciones lo usan. La autorización puede ser exactamente lo mismo:

```js
// src/domain/Compra.js
motivoDeNoAutorizado(usuario, accion) {
  const { quien, verbo } = acciones[accion]
  if (this.#rolDe(usuario) === quien) {
    return null
  }
  return `Solo el ${quien} puede ${verbo} esta compra.`
}

accionesPara(usuario, ahora = new Date()) {
  return Object.keys(acciones).filter(
    (accion) =>
      !this.motivoDeNoAutorizado(usuario, accion) &&
      !this.#impedimento(accion, ahora),
  )
}

#rolDe(usuario) { /* igual que hoy, pero privado */ }
```

```js
// src/services/CompraService.js
#autorizada(usuario, id, accion) {
  const compra = this.compras.porId(id)
  const motivo = compra.motivoDeNoAutorizado(usuario, accion)
  if (motivo) {
    throw new NoAutorizado(motivo)
  }
  return compra
}
```

Desaparecen `Compra.accion` y el `rolDe` público, y la comparación de strings queda en un solo lugar, adentro de la clase que es dueña de la tabla. El servicio sigue siendo el que lanza `NoAutorizado` (403), así que se respeta la separación de errores. Un docente que pregunte "¿dónde se decide quién puede cancelar?" recibe una sola respuesta: `motivoDeNoAutorizado`, que lee la tabla.

Hay que corregir además `docs/dominio.md:36`, que sigue diciendo que la autorización está en servicios "porque el dominio no sabe quién está pidiendo". Esa frase ya es falsa: el dominio tiene la columna `quien`, `rolDe` y `accionesPara(usuario)`. Lo que hay que decir ahora es que el dominio sabe responder si alguien puede hacer la acción, y que el servicio convierte esa respuesta en un 403. De paso, conviene agregarle a la tabla del documento una fila para `resenar` (desde `UTILIZADA`, hacia "—", quién: el comprador, condición: no tiene reseña), porque hoy `resenar` es una fila de la tabla del código y en el documento aparece solo en prosa.

Sobre la pregunta de si `transiciones` y `acciones` deberían ser una sola tabla: no. `acciones = { ...transiciones, resenar }` dice exactamente lo que pasa, que las acciones son las transiciones más reseñar, y le permite a `#transicionar` leer solo filas que tienen `hacia`. Fusionarlas obligaría a que `hacia` sea opcional y a que `#transicionar("resenar")` sea un error posible. Las dos tablas se justifican.

### 2. El patrón "enviando + try/catch + Alert + finally" está copiado cinco veces en la app

`AccionesDeCompra.tsx:65-79`, `FormularioResena.tsx:19-33`, `ChatDeCompra.tsx:26-39`, `BloqueCompra.tsx:39-67` y `app/evento/nuevo.tsx:48-78` repiten la misma estructura: un `useState(false)`, `setX(true)`, un `try` que espera la API, un `catch` con `Alert.alert(titulo, mensajeDe(e))` y un `finally` con `setX(false)`. Los nombres cambian (`enCurso`, `enviando`, `comprando`, `creando`), pero es el mismo concepto. Cuando el alumno quiera cambiar cómo se muestran los errores de envío, o agregar un mensaje de éxito, va a tener que tocar cinco archivos.

La movida es un hook chico en `src/hooks/`, al lado de `useCarga`, que es su par para las escrituras:

```ts
// src/hooks/useEnvio.ts
import { useState } from "react"
import { Alert } from "react-native"

import { mensajeDe } from "../services/api"

export function useEnvio(tituloDelError = "No se pudo") {
  const [enviando, setEnviando] = useState(false)

  async function enviar(pedido: () => Promise<void>) {
    setEnviando(true)
    try {
      await pedido()
    } catch (e) {
      Alert.alert(tituloDelError, mensajeDe(e))
    } finally {
      setEnviando(false)
    }
  }

  return { enviando, enviar }
}
```

```tsx
// src/features/compras/FormularioResena.tsx
const { enviando, enviar } = useEnvio()
// ...
<Boton
  texto={enviando ? "Enviando…" : "Enviar reseña"}
  deshabilitado={!completa || enviando}
  onPress={() =>
    enviar(async () => {
      const resena = { puntuacion, detalle: detalle.trim() }
      onCompraActualizada(await resenarCompra(compra.id, resena))
    })
  }
/>
```

En `nuevo.tsx` el `setCreando(false)` hoy va solo en el `catch`, porque si sale bien se navega. Con el hook se resetea siempre en el `finally`, y eso no cambia nada visible. `BloqueCompra` pasa `useEnvio("No pudimos hacer la compra")` y `nuevo.tsx` pasa `useEnvio("No se pudo crear el evento")`. Cada componente pierde unas diez líneas y la pregunta "¿qué pasa si falla un envío?" tiene una sola respuesta, igual que "¿qué pasa si falla una carga?" ya la tiene en `useCarga` y `Cargable`.

### 3. `armarNuevoEvento` dice que manda `NaN`, pero por JSON viaja `null` y el usuario recibe "Datos inválidos"

`aNumero` (`armarNuevoEvento.ts:57-59`) devuelve `NaN` cuando el texto no es un número, y el test de la línea 58 se llama "un número que no parsea viaja como NaN para que lo rechace el backend". Pero `JSON.stringify` convierte `NaN` en `null`, así que el body que llega es `"precio": null`. El esquema zod (`validations/evento.js:7`) lo rechaza con un 400 cuyo `message` es "Datos inválidos" (`middlewares/validar.js:8`), y `mensajeDe` muestra solo eso. Es decir: el usuario escribe "mil" en el precio, toca "Crear evento" y ve "Datos inválidos" sin saber qué corregir. El test pasa porque mira el objeto antes de serializarlo, así que verifica un contrato que no existe del otro lado de la red. Y el tipo `NuevoEvento` dice `precio: number`, cuando lo que se está modelando es "un número o nada".

`armarNuevoEvento` ya es la función que parsea el formulario en el borde y ya devuelve `{ error }` para los demás campos. El número es un campo más:

```ts
// src/features/eventos/armarNuevoEvento.ts

// El teclado numérico de iOS en español escribe coma decimal.
function aNumero(texto: string): number | null {
  const numero = Number(texto.trim().replace(",", "."))
  return Number.isFinite(numero) ? numero : null
}

// adentro de armarNuevoEvento, después de chequear estaCompleto:
const tipos = tiposEntrada.map((tipo) => ({
  nombre: tipo.nombre.trim(),
  descripcion: tipo.descripcion.trim(),
  precio: aNumero(tipo.precio),
  cupo: aNumero(tipo.cupo),
}))
if (tipos.some((tipo) => tipo.precio === null || tipo.cupo === null)) {
  return { error: "El precio y el cupo tienen que ser números." }
}
```

Para que TypeScript acepte `tipos` como `NuevoEvento["tiposEntrada"]` sin cast, lo más directo es validar texto por texto antes de convertir (`const precio = aNumero(tipo.precio); if (precio === null) return { error: ... }` dentro de un `for`), o usar un `for...of` que vaya armando el arreglo. Cualquiera de las dos evita el `as`. Las reglas de dominio siguen en el backend: un precio negativo o un cupo con decimales siguen llegando como números y los rechaza el dominio con 422 y un mensaje propio, que es la decisión que ya tomaron. La app solo deja de mandar algo que no es un número. El test de la línea 58 pasa a ser "un precio que no es un número pide corregirlo", con `toEqual({ error: ... })`.

El tipo `{ evento: NuevoEvento } | { error: string }` con `"error" in resultado` está bien. Es una unión que TypeScript angosta sin ayuda y se lee sin explicación. No hace falta un `ok: true`.

### 4. `FormularioResena` y `ChatDeCompra` vuelven a escribir el input que `Campo` ya resuelve

El estilo `detalle` de `FormularioResena.tsx:56-64` (`texto.cuerpo`, `minHeight: 96`, `borderRadius: radios.s`, `borderWidth: 1`, `borde`, `textAlignVertical: "top"`) es casi idéntico al `input` + `multilinea` de `Campo.tsx:32-44`, y además repite el `placeholderTextColor` que `Campo` ya pone. Es la misma clase de repetición que la revisión anterior resolvió con `theme.tarjeta`. `ChatDeCompra.tsx:112-122` tiene un tercer input con el mismo borde y el mismo color de placeholder, con un layout distinto (va en una fila con el botón de enviar).

El remedio tiene dos partes. Primero, `FormularioResena` usa `Campo` directamente: `<Campo etiqueta="Tu comentario" value={detalle} onChangeText={setDetalle} placeholder="¿Qué te pareció el evento?" multiline />`, y borra su `StyleSheet`. Segundo, el estilo base del input pasa al tema como `theme.input`, igual que `theme.tarjeta`, y lo usan `Campo` y el input del chat, que agrega solo lo suyo (`flex: 1`, `maxHeight: 120`, `borderRadius: radios.m`). Con esto los tres campos de texto de la app se ven iguales por construcción. El test de `FormularioResena` busca por placeholder, así que no se rompe.

`Campo` se gana el lugar: lo usan siete campos y concentra etiqueta, color de placeholder y altura multilínea. `FormularioTipoEntrada` también se lo gana: es un subformulario que se repite una vez por tipo de entrada y saca de `nuevo.tsx` unas 50 líneas con su propio layout. Su `cambiar(campo: keyof TipoEntradaFormulario, valor)` es directo. Un detalle menor: `key={indice}` en `nuevo.tsx:139` funciona porque `FormularioTipoEntrada` no tiene estado propio, pero si alguien le agrega uno (por ejemplo, un "expandido"), quitar el tipo del medio le pasa ese estado al siguiente. Darle a cada `TipoEntradaFormulario` un `clave` generado al crearlo lo evita, pero no es urgente.

### 5. `nuevo.tsx` parte en seis `useState` un objeto que ya tiene tipo y después lo rearma

`armarNuevoEvento.ts:10-17` define `FormularioEvento`, con los seis campos del formulario. `nuevo.tsx:40-47` los guarda en seis `useState` separados y en las líneas 59-66 los vuelve a juntar en un `FormularioEvento` para pasárselo a `armarNuevoEvento`. Los valores iniciales (`mananaALas21` y `TIPO_VACIO`) viven en la pantalla, aunque son parte de la forma del formulario, y el test de `armarNuevoEvento` tiene su propio `formulario()` con otros valores por defecto.

La versión con menos piezas mueve el formulario inicial al módulo que es dueño del tipo y guarda un solo estado:

```ts
// src/features/eventos/armarNuevoEvento.ts
export const TIPO_VACIO: TipoEntradaFormulario = {
  nombre: "",
  descripcion: "",
  precio: "",
  cupo: "",
}

export function formularioVacio(): FormularioEvento {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + 1)
  fecha.setHours(21, 0, 0, 0)
  return {
    nombre: "",
    descripcion: "",
    categoriaId: null,
    fecha,
    imagen: "",
    tiposEntrada: [{ ...TIPO_VACIO, nombre: "General" }],
  }
}
```

```tsx
// app/evento/nuevo.tsx
const [formulario, setFormulario] = useState(formularioVacio)
const cambiar = (cambios: Partial<FormularioEvento>) =>
  setFormulario({ ...formulario, ...cambios })
// <Campo value={formulario.nombre} onChangeText={(nombre) => cambiar({ nombre })} />
// const resultado = armarNuevoEvento(formulario)
```

Esto es de convicción media. Seis `useState` se leen muy bien para alguien que está aprendiendo React, y la pantalla no está desordenada. Lo que convence es que el rearmado de las líneas 59-66 desaparece, que `cambiarTipo` y `quitarTipo` pasan a ser `cambiar({ tiposEntrada: ... })`, y que el formulario inicial queda al lado de la función que lo valida. Si el alumno prefiere los seis estados, alcanza con mover `mananaALas21` y `TIPO_VACIO` a `armarNuevoEvento.ts`. El tamaño de `nuevo.tsx` (176 líneas, 12 de estilos) está bien y no hace falta partirlo más.

### 6. Los tests de componentes prueban qué se ve, pero no qué pasa al tocar

`AccionesDeCompra.test.tsx` verifica cuántos botones aparecen y con qué nombre. Eso está bien y es comportamiento observable. Pero ninguno de los tres tests toca un botón, así que la parte con lógica propia del componente (confirmar con `Alert`, ejecutar la API correcta, pasar el resultado a `onCompraActualizada`, deshabilitar mientras corre) no está cubierta. Lo mismo pasa con `FormularioResena.test.tsx`: los cuatro tests son sobre si el botón está habilitado, y ninguno verifica que al enviar se manda el detalle sin espacios y se llama a `onCompraActualizada` con la compra que devuelve la API. Los cuatro casos de habilitado además son una tabla natural para `test.each`, como ya hace `Compra.test.js` en el backend.

El remedio es agregar un test por componente que haga el recorrido completo, con `jest.mock("../../services/api")` y `jest.spyOn(Alert, "alert")`. Para `FormularioResena`: tocar 4 estrellas, escribir " Muy bueno ", tocar enviar y verificar que `resenarCompra` se llamó con `("c1", { puntuacion: 4, detalle: "Muy bueno" })` y que `onCompraActualizada` recibió la compra que devolvió el mock. Para `AccionesDeCompra`: tocar "Cancelar compra", ejecutar el `onPress` del botón destructivo del `Alert` y verificar que se llamó a `cancelarCompra("c1")`. Si se hace el hallazgo 2, estos tests lo cubren sin cambiar.

`src/test/compraDePrueba.ts` está bien ubicado. Lo usan dos features y es la única fábrica de datos de prueba de la app, así que una carpeta `src/test/` explica sola qué es. `Partial<Compra>` para los cambios es lo justo.

## Lo que no es hallazgo

La tabla `ACCIONES` de `AccionesDeCompra` con `Record<Exclude<Accion, "resenar">, …>` es correcta: el compilador obliga a que cada acción con botón tenga etiqueta y endpoint, y si el backend agrega una acción el tipo `Accion` lo hace notar. Si se quiere un concepto menos, la guarda `tieneBoton` puede derivarse de la tabla (`(accion): accion is AccionConBoton => accion in ACCIONES`), así "reseñar no tiene botón" se lee en un solo lugar en vez de dos. Que la pantalla decida `compra.acciones.includes("resenar")` para mostrar `FormularioResena` está bien, porque la reseña va en otro lugar de la pantalla.

`Boton` con `tono` y la tabla `COLORES` es directo, y que `MensajeDeError` y `BloqueCompra` lo usen borra estilos repetidos. `Estrellas` con `onCambio` opcional para pasar de "mostrar" a "elegir" es el mismo patrón que `Pressable` con `onPress`, y no merece dos componentes. `presentarCompra(compra, usuario)` obliga a escribir el lambda en los `.map`, pero ahora el segundo parámetro es obligatorio y tiene nombre, así que ya no es la trampa que señalaba la revisión anterior. Las siete repeticiones de `presentarCompra(compra, req.usuario)` en `CompraController` son aceptables: cada handler se lee solo. El helper `accionesDe` de `api.test.js` y la tabla de `accionesPara` en `Compra.test.js` (comprador, organizador y tercero por estado) son tests muy buenos.

## Secuencia de remediación sugerida

1. Backend (hallazgo 1): agregar `motivoDeNoAutorizado` en `Compra`, hacer `rolDe` privado, borrar `Compra.accion`, simplificar `#autorizada` y `accionesPara`, y corregir `docs/dominio.md:36` y la fila de `resenar`. Los tests de `Compra.test.js` y `api.test.js` cubren el cambio sin tocarlos, salvo que algún test unitario use `rolDe` (hoy ninguno lo hace).
2. App, número (hallazgo 3): `aNumero` devuelve `number | null`, `armarNuevoEvento` devuelve `{ error }` si no parsea, y se reescribe el test del `NaN`.
3. App, envíos (hallazgo 2): crear `useEnvio` y migrar los cinco componentes. Probar en el simulador un error de red en cada uno.
4. App, inputs (hallazgo 4): `theme.input`, `FormularioResena` con `Campo`, y el chat con el estilo base.
5. Tests (hallazgo 6): un test de recorrido completo para `AccionesDeCompra` y otro para `FormularioResena`, y `test.each` para los casos de habilitado.
6. Opcional (hallazgo 5): mover `formularioVacio` a `armarNuevoEvento.ts` y, si convence, pasar `nuevo.tsx` a un solo estado.
