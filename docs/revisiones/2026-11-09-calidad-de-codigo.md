# AI Ticket It: auditoría de calidad de código (28aab29..HEAD)

Alcance: los 88 archivos del rango, menos `node_modules` y `package-lock.json`. Leí primero `docs/dominio.md` y `docs/api.md` y después el código completo de `packages/backend` y `packages/mobile`. Los 101 tests del backend pasan (`npm test`, 0,7 s). No edité nada del repo.

## Veredicto

Es una primera iteración prolija. Las capas están donde la cátedra las pide, el dominio tiene las reglas y no los controllers, los tests de dominio testean comportamiento, y ningún archivo se acerca a las 1000 líneas (el más grande es `cargarSeed.js`, con 364, y casi todo son datos). Igual no lo aprobaría tal como está para el video. Hay dos movidas de backend que borran conceptos enteros y que un docente puede preguntar en la demo: las reseñas se guardan en dos lugares, y la tabla de quién puede hacer cada acción repite la tabla de transiciones del dominio. En la app, el problema principal es que hay estilos repetidos en casi todos los archivos, porque el tema define tamaños de texto sin color y no tiene un estilo de tarjeta. Ninguno de los hallazgos es un bug de hoy. Son lugares donde un lector tiene que tener dos cosas en la cabeza para entender algo que podría ser una sola.

Las abstracciones que el pedido manda a revisar, en una línea cada una. `RepositorioEnMemoria` se gana el lugar porque lo usan cinco repositorios y concentra el "no existe" en un solo lugar. `crearRepositorios` también, porque los tests lo usan para arrancar con repositorios vacíos. Los presentadores son necesarios por las referencias circulares del dominio, pero tienen un parámetro trampa (hallazgo 5). `Seccion` se usa en cinco lugares y es directo. `useCarga` se gana el lugar, aunque carga estado que nadie lee (hallazgo 4). La tabla de transiciones de `Compra` se gana el lugar porque alimenta a la vez las transiciones y `puedeCancelarse`, y además la decidieron en `docs/dominio.md`. La tabla `acciones` de `CompraService` no se gana el lugar (hallazgo 2).

## Hallazgos, de mayor a menor impacto

### 1. Las reseñas tienen dos fuentes de verdad: `compra.resena` y el repositorio `resenas`

`Compra.resenar` guarda la reseña en `this.resena` (`src/domain/Compra.js:105`), y después `CompraService.resenar` la guarda también en `this.resenas` (`src/services/CompraService.js:70`). El seed repite el doble guardado a mano (`src/seeds/cargarSeed.js:263`). El único que lee ese repositorio es `EventoService.reputacionDe` (`src/services/EventoService.js:88`), que lo usa para filtrar las reseñas de un organizador. Nadie llama a `resenas.porId`, así que el mensaje "La reseña no existe." de `crearRepositorios.js:10` nunca aparece. El repositorio existe solo para darle un id a la reseña y para tener una lista que ya se puede sacar de las compras. Esto le cuesta al código un quinto repositorio, un cuarto parámetro en el constructor de `EventoService`, un tercero en el de `CompraService`, un parámetro más en `cargarSeed`, y un invariante que nadie hace cumplir: las dos copias tienen que coincidir. Si alguien agrega una reseña por otro camino (por ejemplo, en el seed sin el `resenas.guardar`), el puntaje del organizador sale mal y ningún test lo detecta. El test `CompraService.test.js:172` verifica justamente el doble guardado (`repositorios.resenas.todos()`), que es un detalle de implementación.

La movida es borrar el repositorio y derivar la lista de las compras. Como hay una reseña por compra, el id puede ser el de la compra, igual que `Mensaje` ya recibe su id del dominio:

```js
// src/domain/Compra.js, dentro de resenar
this.resena = new Resena({
  id: this.id,
  compra: this,
  puntuacion,
  detalle,
  fecha: ahora,
})

// src/domain/Resena.js: el constructor recibe y guarda id

// src/domain/reputacion.js (nuevo, puro y testeable sin repositorios)
export const reputacion = (resenas) => ({
  puntaje:
    resenas.length === 0
      ? null
      : resenas.reduce((suma, r) => suma + r.puntuacion, 0) / resenas.length,
  cantidadResenas: resenas.length,
  resenas,
})

// src/services/EventoService.js
reputacionDe = (organizador) =>
  reputacion(
    this.compras
      .filtrar(
        (compra) => compra.resena && compra.evento.esOrganizador(organizador),
      )
      .map((compra) => compra.resena),
  )
```

Con esto `CompraService.resenar` queda en `const compra = this.#delComprador(...); compra.resenar(...); return compra`. Desaparecen `resenas` de `crearRepositorios`, de `dependencias.js`, de los dos constructores y del seed. Además, la regla "el puntaje es el promedio de las reseñas" pasa al dominio, que es donde la pone `docs/dominio.md`, y deja de estar en un servicio. El test de `CompraService` pasa a verificar algo observable: después de reseñar, `eventoService.reputacionDe(organizador)` cuenta la reseña nueva. Hay que actualizar la línea de `TipoEntrada`/`Resena` en `docs/dominio.md` para decir que el id de la reseña es el de su compra.

### 2. La tabla `acciones` de `CompraService` repite la tabla de transiciones y agrega despacho por strings en tres capas

`CompraService.js:6-16` define `acciones` (con `quien` y `verbo` por acción) y `esQuien`. Los cuatro textos de `verbo` repiten los de `transiciones` en `Compra.js:15-39` ("confirmar el pago de", "utilizar", "cancelar", "reembolsar"). Para entender qué pasa con `POST /compras/:id/cancelacion`, el lector sigue un string `"cancelar"` desde la ruta, pasando por `CompraController.#accion("cancelar")`, que hace `this.compraService[nombre]`, y por `CompraService.cancelar`, que llama a `#accion("cancelar")`, que busca en `acciones` y llama a `#deQuien`, que busca en `esQuien` y hace `compra[nombre]`, hasta `Compra.cancelar`, que llama a `#transicionar("cancelar")` y busca en `transiciones`. Son tres tablas indexadas por el mismo string y dos accesos dinámicos (`obj[nombre]`) para cuatro acciones. La tabla del dominio se justifica porque la comparten las transiciones y `puedeCancelarse`. La del servicio no comparte nada: es una fila del cuadro de `docs/dominio.md` pasada a datos.

El remedio es borrar `acciones`, `esQuien` y `#accion`, y escribir las cuatro acciones a mano con dos helpers con nombre. `resenar` ya sigue ese patrón:

```js
confirmarPago = (usuario, id, ahora) => {
  const compra = this.#delComprador(usuario, id, "confirmar el pago de")
  compra.confirmarPago(usuario, ahora)
  return compra
}

utilizar = (usuario, id, ahora) => {
  const compra = this.#delOrganizador(usuario, id, "utilizar")
  compra.utilizar(usuario, ahora)
  return compra
}
// cancelar y reembolsar, igual

#delComprador(usuario, id, accion) {
  const compra = this.compras.porId(id)
  if (!compra.esComprador(usuario)) {
    throw new NoAutorizado(`Solo el comprador puede ${accion} esta compra.`)
  }
  return compra
}
// #delOrganizador, igual con compra.evento.esOrganizador
```

Queda apenas más largo que hoy, pero cada método se lee como la fila del cuadro de `docs/dominio.md`, sin indirección. El `#accion` del controller puede quedar, porque los campos de clase se inicializan antes de que el constructor asigne `compraService` y por eso ahí hace falta el nombre. Aprovechando el cambio, el idiom `falla: (compra, ahora) => compra.evento.yaOcurrio(ahora) && "mensaje"` de la tabla del dominio devuelve `false` o un string. Es ingenioso, y un `if (...) return "mensaje"` con `return null` se lee sin pensar.

### 3. App: el tema no define estilos de texto con color ni un estilo de tarjeta, y por eso cada archivo los vuelve a escribir

`src/theme.ts` define `texto.cuerpo`, `texto.chico` y otros variantes con tamaño y sin color. Por eso cada `StyleSheet` vuelve a armar las mismas combinaciones: hay 36 apariciones de `...theme.texto.chico,` o `...theme.texto.cuerpo,`, y 14 de ellas van seguidas de `color: theme.colores.textoSecundario`. Los estilos `secundario` y `cuerpo` están copiados literalmente en `app/compra/[id].tsx`, `app/evento/[id].tsx` y `TarjetaCompra.tsx`. La superficie de tarjeta (`superficie` + `radios.m` + `...theme.sombra`) se repite en `Seccion.tsx`, `TarjetaCompra.tsx`, `TarjetaEvento.tsx` y la fila de `quien-soy.tsx`, y el `presionada: { opacity: 0.85 }`, en tres de esos cuatro lugares. `app/evento/[id].tsx` tiene 327 líneas, de las cuales 122 son estilos, y buena parte de esos estilos son estas repeticiones.

El remedio es que el tema exporte estilos ya combinados y un componente `Tarjeta` para el contenedor que se puede tocar:

```ts
// src/theme.ts
const colores = { ... }
export const theme = {
  colores, espacios, radios, sombra,
  texto: {
    titulo: { fontSize: 22, fontWeight: "700", color: colores.texto },
    subtitulo: { fontSize: 17, fontWeight: "600", color: colores.texto },
    cuerpo: { fontSize: 15, color: colores.texto },
    secundario: { fontSize: 13, color: colores.textoSecundario },
  },
  tarjeta: {
    backgroundColor: colores.superficie,
    borderRadius: radios.m,
    ...sombra,
  },
} as const
```

```tsx
// src/components/Tarjeta.tsx
export function Tarjeta({ onPress, style, children }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        theme.tarjeta,
        style,
        pressed && { opacity: 0.85 },
      ]}
    >
      {children}
    </Pressable>
  )
}
```

Con esto, `<Text style={theme.texto.secundario}>` reemplaza a los estilos locales `secundario`, `fecha`, `email` y `etiquetaOrden`. `TarjetaEvento`, `TarjetaCompra` y la fila de `quien-soy` dejan de declarar `tarjeta` y `presionada`, y `Seccion` usa `theme.tarjeta`. No hace falta una librería de UI. Es el mismo `StyleSheet` a mano, con los valores en un solo lugar. `TarjetaEvento` y `TarjetaCompra` no tienen que fusionarse: comparten el contenedor, no el contenido. El prop `vista` de `TarjetaCompra` está bien así, porque son dos lecturas reales de la misma compra y el comentario explica por qué.

### 4. `useCarga` guarda estado que nadie lee, esconde errores y obliga a repetir una ternaria en seis pantallas

`src/hooks/useCarga.ts` mantiene `cargando` (líneas 7, 17 y 25) y lo devuelve, pero ninguna pantalla lo usa (`grep` sin resultados fuera del hook). Todas deciden con `!datos`. El patrón `if (error && !datos) return <MensajeDeError/>; if (!datos) return <Cargando/>` aparece en `quien-soy.tsx`, `mis-compras.tsx`, `mis-eventos.tsx`, `evento/[id].tsx`, `evento/[id]/compras.tsx` y `compra/[id].tsx`, y en `(tabs)/index.tsx:99-122` se convierte en una ternaria anidada dentro del JSX. Como la condición es `error && !datos`, cuando falla un pull-to-refresh o la recarga al volver a la pantalla, el error se guarda en el estado y no se muestra en ningún lado. El usuario ve los datos viejos sin enterarse. Por último, `useCallback(fn, deps)` (línea 11) le pasa al hook dependencias que el linter de hooks no puede verificar, y `(e as Error).message` (línea 23) es un cast que el interceptor de `api.ts` vuelve cierto, pero solo por convención.

El remedio tiene dos partes. Primero, borrar `cargando` y `setCargando`, y recibir `fn` directamente en el `useCallback` de `recargar` con `deps`. Segundo, un componente que haga la ramificación una sola vez:

```tsx
// src/components/Cargable.tsx
type Props<T> = {
  carga: { datos: T | null; error: string | null; recargar: () => void }
  children: (datos: T) => ReactNode
}

export function Cargable<T>({ carga, children }: Props<T>) {
  if (carga.datos !== null) return children(carga.datos)
  if (carga.error)
    return (
      <MensajeDeError mensaje={carga.error} onReintentar={carga.recargar} />
    )
  return <Cargando />
}
```

Cada pantalla queda así: `const compras = useCarga(listarMisCompras, []); return <Cargable carga={compras}>{(datos) => <FlatList data={datos} .../>}</Cargable>`, y la ternaria de `index.tsx` desaparece. Para el error con datos viejos alcanza un `Alert` en `refrescar` cuando `recargar` falla, o una línea de texto arriba de la lista. Lo que no puede pasar es que el error se pierda. Si el render-prop le parece demasiado para el video, las cuatro líneas de early return son aceptables. En ese caso hay que dejarlas idénticas en las seis pantallas, incluida `index.tsx`, y borrar igual `cargando`.

### 5. Los presentadores reciben un `ahora` opcional que convierte `.map(presentarCompra)` en una trampa

`presentarEvento`, `presentarEventoDetalle` y `presentarCompra` (`src/presentadores/presentadores.js:32, 45 y 76`) aceptan `ahora = new Date()`. Ningún controller ni test lo pasa nunca. Por culpa de ese parámetro, `CompraController.js:13` y `EventoController.js:45` tienen que escribir `.map((compra) => presentarCompra(compra))`: si escribieran `.map(presentarCompra)`, el índice del array llegaría como `ahora`, `diasParaElEvento(0)` daría cualquier cosa y ningún test lo detectaría, porque los tests de API solo verifican `expect.any(Number)`. Un lector que "simplifique" ese lambda rompe la app. Mientras tanto, `CategoriaController` y `UsuarioController` sí usan `.map(presentarX)`, así que el estilo es inconsistente sin explicación.

El remedio es borrar el parámetro y usar `new Date()` adentro, o calcular `const ahora = new Date()` una vez en el controller y pasarlo explícito con un lambda que lo diga (`compras.map((c) => presentarCompra(c, ahora))`). La primera opción es más corta y alcanza, porque el reloj ya se inyecta en el dominio, que es donde se testea. Lo mismo vale, en menor grado, para el `ahora` que viaja opcional por los servicios. `CompraService.#accion` le pone `= new Date()` por defecto, `crear` no, y `Compra` vuelve a ponerle default. Hay que elegir una sola capa que ponga el default (la del dominio) y que las demás solo lo pasen.

### 6. App: optionalidad y casts que esconden invariantes que el router ya garantiza

`UsuarioContext` expone `usuario: Usuario | null`. Pero `app/_layout.tsx:22` usa `Stack.Protected guard={usuario !== null}`, así que adentro de `(tabs)`, `evento/*` y `compra/*` el usuario nunca es null. Aun así, `BotonCambiarUsuario` escribe `usuario?.nombre` (`(tabs)/_layout.tsx:18`) y `ChatDeCompra` escribe `mensaje.usuario.id === usuario?.id` (`ChatDeCompra.tsx:22`). El tipo le dice al lector que tiene que pensar en un caso que no existe. El remedio es agregar un `useUsuarioActual(): Usuario` en el context, que lance si es null (igual que `useUsuario` lanza fuera del provider), y usarlo en todas las pantallas protegidas. `useUsuario` queda para `_layout` y `quien-soy`.

En la misma línea, `(e as Error).message` aparece en `useCarga.ts:23` y en `evento/[id].tsx:117`. El interceptor de `api.ts:42` ya convierte todo en `Error`. Conviene exportar desde `api.ts` un `mensajeDe(error: unknown): string` (es el `mensajeDeError` que ya existe) y usarlo en los dos `catch`, para que el contrato quede en el tipo y no en una convención. También hay una doble normalización de filtros. `index.tsx:41` convierte `null` en `undefined` (`categoriaId ?? undefined`), y `listarEventos` (`api.ts:63-64`) vuelve a convertir `""` en `undefined`. `FiltrosEventos` tiene todo opcional aunque la única pantalla que lo usa siempre manda los tres campos. Lo más simple es que `listarEventos` reciba `{ texto: string; categoriaId: string | null; orden: OrdenEventos }` y normalice una sola vez.

### 7. `EventoService` arma los órdenes en el constructor y tiene un combinador genérico para un solo uso

`EventoService.js:8-13` define `nulosAlFinal`, una función de orden superior que se usa una sola vez. Además, el constructor (líneas 26-32) arma `this.ordenes` con closures sobre `this.puntajeDe`, que es público solo para eso. Como la puntuación mínima es 1, "los null al final, de mayor a menor" es simplemente tratar null como 0:

```js
// fuera de la clase
const ordenes = {
  fecha: (a, b) => a.fecha - b.fecha,
  precio: (a, b) => a.precioDesde() - b.precioDesde(),
}

// dentro de buscar
const puntaje = (evento) => this.reputacionDe(evento.organizador).puntaje ?? 0
const comparar =
  orden === "puntaje" ? (a, b) => puntaje(b) - puntaje(a) : ordenes[orden]
return eventos.sort(comparar)
```

Desaparecen `nulosAlFinal`, `puntajeDe` y el armado en el constructor. El constructor vuelve a solo asignar repositorios, como en los demás servicios. El test `EventoService.test.js:171` sigue cubriendo el caso de los null.

### 8. Tests de API acoplados a un estado global compartido y a ids mágicos del seed

`tests/integration/api.test.js` importa el singleton `repositorios` de `dependencias.js`, corre `cargarSeed` una sola vez en `beforeAll`, y cada test modifica ese estado (crea compras, consume cupo, crea un evento). Las aserciones dependen del orden y de ids escritos a mano: `como("4")`, `comprador = "6"`, `organizador = "1"`, `evento = "2"`, `categoriaId: "4"`, `tipoEntradaId: "2-1"`, `total: 18000`. Por ejemplo, `POST /eventos` espera que `/mis-eventos` del usuario "5" devuelva solo el evento nuevo. Eso funciona porque Valentina no organiza nada en el seed, pero el test no lo dice. El test de puntaje (línea 92) ordena con `b - a` y pasaría por casualidad si hubiera nulls. Además, el seed no garantiza que haya null.

Hay una movida grande: una fábrica `crearApp(repositorios)` en lugar del singleton. Va contra el `dependencias.js` de la cátedra, así que no la recomiendo. El remedio proporcionado es que el seed devuelva lo que creó (`return { usuarios: { lucia, ... }, eventos: { ...futuros, ...pasados } }`) y que el test use `seed.usuarios.tomas.id` y `seed.eventos.jazz.id` en vez de strings. Así cada id se explica solo, y si se reordena el seed los tests no se rompen en silencio. La app sigue dependiendo de que los ids de usuario sean 1 a 6, como dice el comentario de `cargarSeed.js:40`. Eso está bien y no cambia.

En los tests unitarios hay dos estilos de fixture. `CompraService.test.js` usa `fixtures.usuario`, que inventa ids con un contador propio (`conId`) y no guarda en el repositorio. `EventoService.test.js:24-31` redefine `usuario` para guardarlo en `repositorios.usuarios`. Lo más simple es que `fixtures.js` no asigne ids y que cada test guarde lo que necesita en el repositorio, que es lo que pasa en producción. El contador global `proximoId` comparte estado entre archivos de test sin que se note. Los tests de `Compra.test.js` están muy bien: `llevarA` por estado, `test.each` sobre la tabla y aserciones de que una transición inválida no cambia nada. No hay que tocarlos.

### 9. El seed hace aritmética de fechas indirecta y repite helpers de los tests

`cargarSeed.js` está bien organizado para su tamaño: catálogos como arreglos de tuplas, `futuros` y `pasados` con nombre, y helpers `comprar` y `utilizada`. No lo partiría. Lo que sí cambiaría es la línea 257, `enDias(evento.diasHasta(enDias(0)) - 15)`, que pasa por "días hasta el evento desde hoy" para decir "15 días antes del evento". `new Date(evento.fecha.getTime() - 15 * MILISEGUNDOS_POR_DIA)`, o un `diasDesde(fecha, n)` compartido, dice lo mismo sin rodeos. La línea 267 ya hace eso para "un día después". `MILISEGUNDOS_POR_DIA` está definido en `Evento.js` y en el seed, y `fixtures.dias` es el mismo helper que `enDias` con otro nombre. Un `src/utils/fechas.js` con `sumarDias(fecha, dias)` reemplaza a los tres. Con el hallazgo 1, `utilizada` deja de recibir el repositorio `resenas` y la llamada queda en `compra.resenar(...)`.

### 10. Ubicación de los componentes de compra y stubs en la app

`app/evento/[id].tsx` define adentro `BloqueCompra` (líneas 86-203), que tiene estado propio, llama a la API y maneja errores. Mientras tanto, `src/features/compras/` tiene dos archivos: `AccionesDeCompra`, que devuelve `null`, y `ChatDeCompra`, que recibe `onCompraActualizada` y no lo usa. La bitácora dice que esto es trabajo de la próxima iteración, así que los stubs no son un problema hoy. Pero el criterio de qué va en `features/` queda al revés: lo que existe está inline en la pantalla, y lo que no existe tiene su carpeta. Hay que mover `BloqueCompra` a `src/features/compras/BloqueCompra.tsx`, y con eso la pantalla de evento baja a unas 150 líneas. Y no hay que grabar el video con `AccionesDeCompra` devolviendo `null` ni con las siete funciones de `api.ts` sin uso (`confirmarPago`, `utilizarCompra`, `cancelarCompra`, `reembolsarCompra`, `enviarMensaje`, `resenarCompra`, `crearEvento`).

## Lo que no es hallazgo

Revisé y dejé a propósito afuera varias cosas. Los servicios de una línea (`UsuarioService` y `CategoriaService`) los piden las capas de la cátedra. La cadena de `instanceof` de `errorHandler.js` es larga pero se lee como la tabla de errores de `docs/api.md`. El 404 de ruta en `app.js:18-23` arma un `Error` con `status` y `expose` en vez de usar `EntityNotFound`, y es un nit. `Usuario.favoritos` no tiene uso, pero está en el diseño. Los `z.number()` sin `.int()` son intencionales para que el dominio devuelva 422. El `usuarioActualId` de módulo en `api.ts` está bien: es la forma más directa de inyectar el header sin pasar el usuario a cada llamada.

## Secuencia de remediación sugerida

1. Backend, reseñas (hallazgo 1): darle a `Resena` el id de su compra, crear `domain/reputacion.js`, derivar `reputacionDe` de las compras, borrar el repositorio `resenas` de `crearRepositorios`, `dependencias`, los servicios y el seed, y reemplazar la aserción de `CompraService.test.js:172` por una sobre `reputacionDe`. Correr `npm test`.
2. Backend, acciones (hallazgos 2 y 7): borrar `acciones`, `esQuien` y `#accion` de `CompraService` y escribir las cuatro acciones con `#delComprador` y `#delOrganizador`. Sacar `nulosAlFinal` y los órdenes del constructor de `EventoService`. Los tests existentes cubren los dos cambios sin modificarlos.
3. Backend, `ahora` (hallazgo 5): borrar el parámetro de los presentadores, pasar a `.map(presentarCompra)` y dejar el default de `ahora` solo en el dominio.
4. App, tema (hallazgo 3): estilos de texto con color, `theme.tarjeta` y el componente `Tarjeta`. Después, borrar los estilos locales repetidos archivo por archivo. Verificar en el simulador que nada cambió visualmente.
5. App, carga y tipos (hallazgos 4 y 6): sacar `cargando` de `useCarga`, agregar `Cargable` (o dejar los early returns idénticos), mostrar el error de refresco, agregar `useUsuarioActual` y `mensajeDe`, y simplificar `FiltrosEventos`. `tsc` limpio.
6. Tests y seed (hallazgos 8 y 9): que el seed devuelva sus entidades con nombre, reemplazar los ids mágicos en `api.test.js`, unificar las fixtures y crear `sumarDias`.
7. Antes del video (hallazgo 10): mover `BloqueCompra` a `features/compras` e implementar o sacar los stubs.
