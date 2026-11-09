# AI Ticket It: auditoría de calidad de la pasada de interfaz (acc16a4..HEAD, packages/mobile)

Alcance: `git diff acc16a4..HEAD -- packages/mobile` (12 commits, 36 archivos, +1068/−325). Leí el reporte que originó la pasada (`docs/revisiones/2026-11-09-interfaz.md`) y las dos auditorías de calidad anteriores para no repetir lo que ya quedó como convención: `useEnvio`, `theme.input`, `Campo` como único input, `formularioVacio` al lado de `armarNuevoEvento`, `number | null` en `aNumero` y la unión `{ evento } | { error }` sin `ok`.

## Veredicto

Aprobado con cambios. La pasada cumple lo que pidió el reporte de interfaz y casi todo está en la capa correcta: los roles y nombres accesibles van dentro de los componentes compartidos y no en cada pantalla, el escalado al presionar ya es un solo hook (`useEscalaAlPresionar`) que usan `Boton` y `Tarjeta`, `confirmar` reemplaza tres `Alert.alert` copiados, y los tokens nuevos viven en `theme.ts`. Ningún archivo se acerca a las 1000 líneas.

Hay un problema estructural claro y dos de forma. El estructural es que `api.ts` creció unas 70 líneas para traducir los errores de validación de zod. Esa tabla traduce errores que la app ya evita antes de mandar, depende de cómo zod 4 arma cada issue y escribe un español peor que el de `armarNuevoEvento`. Los dos de forma están en el formulario de nuevo evento: el tipo del campo con error (`string | { tipo, campo }`) obliga a escribir tres funciones auxiliares en la pantalla, y la cuenta de posiciones para hacer scroll al error es la responsabilidad que más hizo crecer `nuevo.tsx` (de 204 a 317 líneas).

## Hallazgos, de mayor a menor impacto

### 1. La traducción de `details` en `api.ts` repite validaciones que la app ya hace y está en la capa equivocada

`src/services/api.ts:41-128` agrega `DetalleDeValidacion` con los campos internos de un issue de zod (`code`, `expected`, `format`, `origin`), dos tablas (`CAMPOS` con diez campos y `CAMPOS_DE_TIPO` con tres), `nombreDelCampo`, que interpreta la forma del `path` (`tiposEntrada.N.campo`, `multimedia.N`), `problemaDe`, que reconoce cuatro combinaciones de `code` y `format`, y `explicarDetalle`. Son cerca de 70 líneas de las 201 del archivo, y el test de `api.test.ts` que las cubre es el más largo de la app.

El problema es que casi ningún error que esa tabla traduce puede producirse desde la interfaz. Los campos de `eventoSchema` (nombre, descripción, categoría, fecha, imagen, nombre, precio y cupo de cada tipo) los valida antes `armarNuevoEvento`, que además ahora devuelve el campo y un mensaje mejor ("Ponele un nombre al evento.", "No es un número válido. Escribilo sin puntos de miles…"). `eventoId`, `tipoEntradaId` y `cantidad` salen del estado de `BloqueCompra` y del `Stepper`, no de algo que el usuario escribe. `texto` no se puede mandar vacío porque `ChatDeCompra.tsx:21` deshabilita el envío, y `puntuacion` y `detalle` los valida `FormularioResena` al enviar. Es decir, la tabla solo se usa cuando el cliente y el servidor no coinciden, que es un error de programación y no un caso que el usuario tenga que leer bien traducido.

Que la tabla esté duplicada se nota en los textos: el test fija "Categoría es obligatorio" (con el género mal), "Imagen 1 tiene que ser una URL http o https" cuando la etiqueta del campo es "URL de una imagen (opcional)", y "Nombre es obligatorio" sin decir de qué. Cada vez que cambie un esquema de zod o la versión de zod, alguien tiene que acordarse de esta tabla, que vive en el cliente HTTP y no al lado del esquema. Ya hay una diferencia entre las dos validaciones: el backend acepta una descripción vacía (`validations/evento.js`, `.default("")`) y `armarNuevoEvento` la exige.

El remedio es borrar la tabla. `mensajeDe` vuelve a ser lo que pedía la primera opción del hallazgo 4 del reporte de interfaz: el `message` del servidor y, debajo, el `message` de cada detalle tal como viene.

```ts
// src/services/api.ts
type CuerpoDeError = {
  message?: string
  details?: { path: (string | number)[]; message: string }[]
}

export function mensajeDe(error: unknown): string {
  if (isAxiosError<CuerpoDeError>(error)) {
    const cuerpo = error.response?.data
    if (cuerpo?.message) {
      const detalles = (cuerpo.details ?? []).map(
        (detalle) => `${detalle.path.join(".")}: ${detalle.message}`,
      )
      return [cuerpo.message, ...detalles].join("\n")
    }
    if (!error.response) {
      return "No hay conexión con el servidor. Revisá la conexión y volvé a intentar."
    }
  }
  return "Algo salió mal. Probá de nuevo."
}
```

Si quieren que ese caso raro también salga en español, el lugar es el esquema del backend, que es el dueño de la regla: `z.string().trim().min(1, "Ponele un nombre al evento.")`. Así el texto queda escrito al lado de la regla que lo produce, y `mensajeDe` no necesita saber nada de zod. El test de traducción de `api.test.ts` se reduce a uno solo, que verifica que los detalles se muestran debajo del mensaje.

### 2. El campo con error tiene un tipo que obliga a escribir tres funciones auxiliares, y usa el nombre del backend en vez del del formulario

`armarNuevoEvento.ts:20-30` define `CampoDelEvento` como cinco strings más un objeto `{ tipo: number; campo: CampoDeTipo }`. Como la unión mezcla strings con un objeto, `nuevo.tsx` necesita tres funciones para leerla: `errorDe(campo: Exclude<CampoDelEvento, object>)`, `errorDelTipo(indice)`, que pregunta `typeof error?.campo !== "object"` y rearma un objeto `{ campo, mensaje }`, y `posicionDe`, que vuelve a preguntar `typeof campo === "object"`. `FormularioTipoEntrada` tiene una cuarta, `errorDe`, con otra forma de error (`{ campo: CampoDeTipo; mensaje }`). Un docente que lee `Exclude<CampoDelEvento, object>` tiene que frenar a entender un truco de tipos que no explica nada del dominio.

Además, uno de los strings es `"multimedia"`, el nombre del campo en el body del POST, mientras que en `FormularioEvento` el campo se llama `imagen`. Los errores del formulario se nombran con el vocabulario de la API, y por eso `CampoDelEvento` no se puede derivar de `FormularioEvento`.

La versión directa es una unión discriminada por `campo`, que TypeScript angosta sin ayuda y que sale de los tipos que ya existen:

```ts
// src/features/eventos/armarNuevoEvento.ts
export type CampoDelEvento = Exclude<keyof FormularioEvento, "tiposEntrada">
export type CampoDeTipo = Exclude<keyof TipoEntradaFormulario, "descripcion">

export type ErrorDelTipo = {
  campo: "tiposEntrada"
  indice: number
  campoDelTipo: CampoDeTipo
  mensaje: string
}

export type ErrorDelFormulario =
  | { campo: CampoDelEvento; mensaje: string }
  | ErrorDelTipo

// en armarNuevoEvento: falta("imagen", …) en vez de falta("multimedia", …), y
// { error: { campo: "tiposEntrada", indice, campoDelTipo: "precio", mensaje } }
```

```tsx
// app/evento/nuevo.tsx
function errorDe(campo: CampoDelEvento) {
  return error?.campo === campo ? error.mensaje : undefined
}

function errorDelTipo(indice: number) {
  return error?.campo === "tiposEntrada" && error.indice === indice
    ? error
    : null
}
```

`FormularioTipoEntrada` recibe `error: ErrorDelTipo | null` y compara `error?.campoDelTipo === campo`, así hay una sola forma de error en toda la feature. Desaparecen el `Exclude<…, object>`, los dos `typeof === "object"` y el objeto que se rearmaba en `errorDelTipo`. Los tests de `armarNuevoEvento.test.ts:126-158` cambian solo en la forma del objeto esperado.

### 3. La cuenta de posiciones para hacer scroll al error es la responsabilidad que más hace crecer `nuevo.tsx`

`nuevo.tsx` pasó de 204 a 317 líneas. Casi la mitad de lo nuevo es la protección contra salir (`usePreventRemove` y el "Cancelar", que están bien donde están) y el scroll al error. Lo del scroll son tres `View` envoltorios que solo existen para el `onLayout` de cada sección, un tipo `Bloque`, dos refs (`posiciones` por sección y `posicionesDeTipos` por índice), `guardarPosicion`, `posicionDe`, que suma la posición de la sección más la del tipo, y la constante `MARGEN_SOBRE_EL_ERROR = 72`. Son unas 25 referencias a este mecanismo repartidas por toda la pantalla. El 72 es, en el fondo, la altura del header transparente de iOS más un poco de aire. En Android, donde el header es opaco y `contentInsetAdjustmentBehavior` no hace nada, el mismo número hace que el scroll se pase de largo. El mecanismo funciona y la suma es correcta (la `View` de cada tipo mide su posición contra la `Seccion`, que está en el origen de su envoltorio), pero es mucha maquinaria para un formulario de tres secciones.

`scrollToEnd` no sirve, porque el error casi siempre está arriba del botón. Veo dos salidas.

La que borra el concepto es no hacer scroll. La validación sigue el mismo orden que la pantalla, así que el error siempre está en el primer campo que falló. Alcanza con mostrar el error debajo del campo, como ya pasa, y repetirlo debajo del botón "Crear evento", que es donde el usuario está mirando cuando toca el botón (por ejemplo, "Revisá el precio de «General»: no es un número válido."). El anuncio a VoiceOver se queda. Con esto se van los tres envoltorios, las dos refs, `Bloque`, `guardarPosicion`, `posicionDe` y el 72, y `nuevo.tsx` vuelve a unas 250 líneas. Es un cambio de experiencia chico y el reporte de interfaz no pedía el scroll: pedía el error al lado del campo (hallazgo 12).

Si el scroll se queda, al menos tiene que tener menos piezas. `Seccion` puede recibir `onLayout` y pasárselo a su `View`, y así desaparecen los tres envoltorios. Las posiciones pueden guardarse con la misma clave que usa el error (con la unión del hallazgo 2, `error.campo` y, para los tipos, `error.indice`), y así `posicionDe` deja de traducir de un vocabulario a otro. El 72 tiene que decir que es la altura del header de iOS, o salir de `useHeaderHeight`, para que nadie lo toque pensando que es un margen de diseño.

### 4. Los números del área táctil y de la opacidad se repiten a mano en cada control

La cuenta `(theme.areaTactil - tamano) / 2` aparece cinco veces: `Stepper.tsx:7`, `(tabs)/_layout.tsx:11` y `:42`, `FormularioTipoEntrada.tsx:59` y `Estrellas.tsx:39`. Solo la última lleva `Math.max(0, …)`, que es justamente el caso que importa cuando el ícono es más grande que 44. Cada control define además su constante de tamaño del ícono solo para poder hacer la cuenta. Y el "Cancelar" de `nuevo.tsx:146` usa un `hitSlop={12}` literal, sin la cuenta.

Pasa lo mismo con la opacidad de los estados. Presionado es 0.85 en `Boton` y en `Tarjeta`. Deshabilitado es 0.5 en `Boton` y en `BloqueCompra`, y 0.4 en `Stepper` y en `ChatDeCompra`. No es una decisión: son dos valores que se fueron copiando.

El remedio va en el tema, que ya es donde la app pone este tipo de reglas:

```ts
// src/theme.ts
// Lo que le falta a un control de `tamano` pt para llegar a los 44 de Apple HIG.
function margenTactil(tamano: number) {
  return Math.max(0, (areaTactil - tamano) / 2)
}

const opacidad = { presionado: 0.85, deshabilitado: 0.5 }

export const theme = { /* … */ margenTactil, opacidad }
```

Cada control pasa a escribir `hitSlop={theme.margenTactil(ICONO_QUITAR)}` y `opacity: theme.opacidad.deshabilitado`. No hace falta un componente `Presionable` compartido para `Boton`, `Tarjeta`, `Chip` y `Stepper`. Cada uno tiene una forma y una semántica distintas, y lo único que comparten son estos dos números.

### 5. Los tests nuevos prueban comportamiento, pero uno tiene lógica adentro y el cableado del error en la pantalla no tiene test

Los tests nuevos van bien encaminados: `FormularioTipoEntrada.test.tsx` toca el tacho y contesta el `Alert`, y `EstadoVacio.test.tsx` toca la acción. El `test.each` de `FormularioResena.test.tsx:43-87`, en cambio, termina con un `for` que tiene un `if/else` adentro para decidir qué ayuda tiene que estar y cuál no. Un test con ramas obliga a leer dos veces para saber qué verifica. Es más directo comparar la lista de ayudas visibles con la esperada:

```ts
const visibles = [AYUDA_PUNTUACION, AYUDA_DETALLE].filter((ayuda) =>
  screen.queryByText(ayuda),
)
expect(visibles).toEqual(ayudas)
```

Lo que no tiene test es justamente lo que más se tocó: que un error de `armarNuevoEvento` aparezca debajo del campo correcto en la pantalla. `armarNuevoEvento.test.ts` prueba qué campo se señala, pero el paso de ese resultado a `errorDe` y `errorDelTipo` en `nuevo.tsx`, que es donde está la lógica de tipos del hallazgo 2, no lo prueba nadie. Alcanza con un test de pantalla: renderizar `CrearEvento` con `listarCategorias` mockeado, borrar el precio del primer tipo, tocar "Crear evento" y verificar que "Completá el precio." aparece y que `crearEvento` no se llamó. Ese test además protege el cambio del hallazgo 2.

## Lo que no es hallazgo

El escalado al presionar ya es un hook único (`useEscalaAlPresionar`) con `useMovimientoReducido` adentro. No hace falta un `usePresion` aparte. El reporte de interfaz decía que `Tarjeta` podía quedarse solo con opacidad; usar el mismo hook en los dos componentes cuesta tres líneas y mantiene una sola regla, así que está bien.

`confirmar` y el `Alert` de `useEnvio` no se pisan. En `AccionesDeCompra` la confirmación se espera adentro de `enviar`, así que `enviando` está en `true` mientras el usuario decide, y eso deja los botones deshabilitados durante el diálogo. Queda un poco al revés (es una espera de una persona, no de la red), pero tiene un efecto útil y no se ve. Si alguna vez molesta, se confirma primero y se llama a `enviar` solo si la respuesta es sí. El booleano posicional `destructiva` se lee bien con tres llamadas.

`creado` junto con `permitirSalir()` en `nuevo.tsx` parece doble, pero es exactamente lo que pide la documentación de `usePreventRemove` (`node_modules/expo-router/build/react-navigation/core/usePreventRemove.d.ts`): poner la condición en `false` y llamar a la función que devuelve el hook antes de navegar. `useEnvio` con el título en `enviar(titulo, pedido)` está bien, porque `AccionesDeCompra` necesita un título distinto por acción. `formularioTieneDatos` y `tipoTieneDatos`, con el nombre sugerido "General" como excepción, son funciones puras, tienen test y están al lado del tipo que analizan. `sinResultados` en la pestaña Eventos es una función chica con cuatro casos que se leen de corrido. `Estrellas`, partida en un modo de lectura con rol `image` y un modo `radiogroup`, es más clara que el `map` con un `if` adentro que tenía antes.

## Secuencia de remediación sugerida

1. Hallazgo 1: borrar `CAMPOS`, `CAMPOS_DE_TIPO`, `nombreDelCampo`, `problemaDe` y `explicarDetalle` de `api.ts`, dejar `mensajeDe` con `path: message` y reducir `api.test.ts` a un test de detalles. Si hacen falta mensajes en español para ese caso, escribirlos en los esquemas de `packages/backend/src/validations/`.
2. Hallazgo 2: unión discriminada `ErrorDelFormulario`, `"imagen"` en vez de `"multimedia"` y `ErrorDelTipo` compartido con `FormularioTipoEntrada`. Antes de tocarlo, agregar el test de pantalla del hallazgo 5 para que cubra el cambio.
3. Hallazgo 3: decidir entre no hacer scroll (error repetido debajo del botón) o mantenerlo con `Seccion` recibiendo `onLayout` y las posiciones con la clave del error. En los dos casos, probar en el simulador de iOS y en Android con un precio inválido en el segundo tipo.
4. Hallazgo 4: `theme.margenTactil` y `theme.opacidad`, y reemplazar las cinco cuentas y los cuatro valores de opacidad.
5. Hallazgo 5: sacar la rama del `test.each` de `FormularioResena.test.tsx`.
