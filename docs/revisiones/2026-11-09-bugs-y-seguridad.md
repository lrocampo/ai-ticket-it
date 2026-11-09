# AI Ticket It: revisión de bugs y seguridad (rango 28aab29..HEAD)

Revisé todo el código agregado en el rango contra `docs/dominio.md` y `docs/api.md`. Corrí `npm test` (6 suites, 101 tests en verde), `tsc --noEmit` en mobile (limpio), `npx expo install --check` ("Dependencies are up to date"), `npx expo-doctor` (20/20) y `npm run lint` (limpio). Levanté el backend en el puerto 3100 y reproduje cada hallazgo con curl o con un script contra el dominio. No toqué archivos del repo.

Las decisiones intencionales (sin login, `x-usuario-id`, memoria, pago simulado, CORS abierto) no están reportadas.

Resumen: 0 altos, 1 medio, 10 bajos.

---

## Media

### M1. El organizador puede comprar su propio evento y reseñarse a sí mismo, subiendo su puntaje

**Archivos:** `packages/backend/src/services/CompraService.js:25-36` (`crear`), `packages/backend/src/domain/Compra.js:42-64` (constructor) y `:98-112` (`resenar`).

**Qué pasa.** Ni el servicio ni el dominio verifican que el comprador no sea el organizador del evento. Como el organizador es a la vez "comprador" y "organizador" de esa compra, la tabla de autorización lo deja hacer todo el ciclo solo: comprar, confirmar el pago, marcarla utilizada y reseñar. La reseña entra en `reputacionDe` como cualquier otra, así que un organizador sube su propio puntaje (y por lo tanto su posición en `?orden=puntaje`) con cuatro requests y sin que nadie más intervenga. También puede mantener diálogo consigo mismo en el chat de la compra, pero eso es inocuo.

`docs/dominio.md` no prohíbe explícitamente que el organizador compre, por eso lo califico medio y no alto: es un agujero del sistema de reputación, no una violación del contrato escrito. Pero el puntaje del organizador es el criterio de orden del catálogo y el enunciado lo presenta como señal de confianza para el comprador, así que conviene cerrarlo.

**Reproducción (verificada en :3100, Lucía = usuario 1 organiza el evento 1):**

```bash
B=localhost:3100
curl -s $B/eventos/1 -H 'x-usuario-id: 4' | python3 -c 'import sys,json;print(json.load(sys.stdin)["organizador"])'
# puntaje 4.5, cantidadResenas 2
curl -s -X POST $B/compras -H 'x-usuario-id: 1' -H 'content-type: application/json' \
  -d '{"eventoId":"1","tipoEntradaId":"1-1","cantidad":1}'      # 201, id 17
curl -s -X POST $B/compras/17/confirmacion -H 'x-usuario-id: 1'  # 200
curl -s -X POST $B/compras/17/uso -H 'x-usuario-id: 1'           # 200
curl -s -X POST $B/compras/17/resena -H 'x-usuario-id: 1' -H 'content-type: application/json' \
  -d '{"puntuacion":5,"detalle":"Me puntúo yo"}'                 # 201
curl -s $B/eventos/1 -H 'x-usuario-id: 4' | python3 -c 'import sys,json;print(json.load(sys.stdin)["organizador"])'
# puntaje 4.666..., cantidadResenas 3
```

**Arreglo propuesto.** El natural es en el dominio, en el constructor de `Compra`: `if (evento.esOrganizador(comprador)) throw new DomainRuleError("El organizador no puede comprar entradas de su propio evento.")`, antes de `reservar`. Sale como 409 por el `errorHandler` existente. Agregar la fila a la tabla de `docs/dominio.md`, un test en `Compra.test.js` ("el organizador no puede comprar su propio evento") y uno de integración. En la app, `BloqueCompra` puede deshabilitar el botón cuando `evento.organizador.id === usuario.id` para no mostrar un error que el usuario no entiende.

---

## Bajas

### B1. `diasParaElEvento` da negativo y la app muestra "Faltan -3 días"

**Archivos:** `packages/backend/src/domain/Evento.js:57-60` (`diasHasta`), `packages/backend/src/domain/Compra.js:86-88`, `packages/mobile/src/utils/fechas.ts:45-49` (`textoDiasRestantes`), que se usa en `app/compra/[id].tsx:42-46` y `src/components/TarjetaCompra.tsx:48-52`.

**Qué pasa.** Una compra `CONFIRMADA` de un evento que ya pasó (el comprador no fue, el organizador nunca la marcó utilizada) sigue siendo `CONFIRMADA`, y `diasHasta` con `Math.ceil` devuelve un entero negativo. La app no lo filtra: `textoDiasRestantes(-3)` cae en la rama genérica y pinta "Faltan -3 días" en violeta y negrita. El caso de "hoy después de la hora" da `-0 || 0 = 0` y queda "Es hoy", que está bien.

**Reproducción (script contra el dominio, verificado):**

```js
// node --input-type=module desde packages/backend
import Evento from "./src/domain/Evento.js"
import TipoEntrada from "./src/domain/TipoEntrada.js"
import Compra from "./src/domain/Compra.js"
import Usuario from "./src/domain/Usuario.js"
const d = (n) => new Date(Date.UTC(2026, 10, 9 + n, 12))
const u = Object.assign(
  new Usuario({ nombre: "a", apellido: "b", email: "c" }),
  { id: "1" },
)
const o = Object.assign(
  new Usuario({ nombre: "a", apellido: "b", email: "c" }),
  { id: "2" },
)
const t = new TipoEntrada({ nombre: "G", precio: 10, cupo: 5 })
const ev = new Evento(
  {
    nombre: "E",
    categoria: {},
    fecha: d(1),
    tiposEntrada: [t],
    organizador: o,
  },
  d(0),
)
const c = new Compra(
  { comprador: u, evento: ev, tipoEntrada: t, cantidad: 1 },
  d(0),
)
c.confirmarPago(u, d(0))
console.log(c.diasParaElEvento(d(4))) // -3
```

**Arreglo propuesto.** Decidir el significado y fijarlo en `docs/dominio.md`. Lo más honesto con el contrato ("solo cuando está CONFIRMADA") es que `Compra.diasParaElEvento` devuelva `null` también cuando `evento.yaOcurrio(ahora)`, y que la app no muestre nada. Alternativa mínima: `Math.max(0, ...)` en `diasHasta`, pero entonces "Es hoy" mentiría para un evento de hace una semana. Agregar el caso a `Compra.test.js` ("diasParaElEvento después del evento").

### B2. Nombres de tipo de entrada repetidos con distinta capitalización pasan la validación

**Archivo:** `packages/backend/src/domain/Evento.js:38-43`.

**Qué pasa.** La unicidad se verifica con un `Set` sobre el nombre crudo, así que "General" y "general" (o "VIP" y "Vip") cuentan como distintos. Para el comprador son el mismo tipo y la lista de entradas queda confusa.

**Reproducción (verificada, responde 201):**

```bash
curl -s -X POST localhost:3100/eventos -H 'x-usuario-id: 5' -H 'content-type: application/json' \
  -d '{"nombre":"X","categoriaId":"1","fecha":"2030-01-01T21:00:00.000Z","tiposEntrada":[{"nombre":"General","precio":1,"cupo":1},{"nombre":"general","precio":1,"cupo":1}]}'
```

**Arreglo propuesto.** `new Set(tiposEntrada.map((tipo) => tipo.nombre.trim().toLowerCase()))` y un caso más en `Evento.test.js`.

### B3. `multimedia` acepta cualquier esquema de URL

**Archivo:** `packages/backend/src/validations/evento.js:20`.

**Qué pasa.** `z.url()` de zod 4 valida con `new URL()`, que acepta `javascript:alert(1)`, `ftp://x` o `data:`. Hoy la app solo lo pasa a `<Image source={{ uri }}>` (no ejecuta nada), pero el contrato dice "URLs" pensando en imágenes servidas por http(s), y un `javascript:` guardado en el dominio es una sorpresa esperando a que alguien renderice `multimedia` en una WebView o en web.

**Reproducción (verificada, responde 201 con `multimedia: ["javascript:alert(1)","ftp://x"]`):**

```bash
curl -s -X POST localhost:3100/eventos -H 'x-usuario-id: 5' -H 'content-type: application/json' \
  -d '{"nombre":"Y","categoriaId":"1","fecha":"2030-01-01T21:00:00.000Z","multimedia":["javascript:alert(1)","ftp://x"],"tiposEntrada":[{"nombre":"General","precio":1,"cupo":1}]}'
```

**Arreglo propuesto.** `z.url({ protocol: /^https?$/ })` y un test de 400 en `api.test.js`.

### B4. `cupo` sin tope: `1e300` es "entero positivo"

**Archivos:** `packages/backend/src/validations/evento.js:9-10` y `packages/backend/src/domain/TipoEntrada.js:16`.

**Qué pasa.** `Number.isInteger(1e300)` es `true`, así que un evento puede nacer con cupo `1e300` y `disponibles: 1e+300` en el JSON. No rompe nada, pero `vendidas += cantidad` sobre números fuera del rango seguro deja de ser exacto, y en la app se ve "1e+300 disponibles".

**Reproducción (verificada, 201):**

```bash
curl -s -X POST localhost:3100/eventos -H 'x-usuario-id: 5' -H 'content-type: application/json' \
  -d '{"nombre":"Z","categoriaId":"1","fecha":"2030-01-01T21:00:00.000Z","tiposEntrada":[{"nombre":"G","precio":0.1,"cupo":1e300}]}'
```

**Arreglo propuesto.** `Number.isSafeInteger(cupo)` en el dominio (también para `cantidad` en `Compra.js:46`), y en el borde `z.number().int().positive().max(1_000_000)` si se quiere un 400 con `details` en vez de un 422.

### B5. `Usuario.esElMismo` devuelve `true` entre dos usuarios sin id

**Archivo:** `packages/backend/src/domain/Usuario.js:16-18`.

**Qué pasa.** `otro?.id === this.id` con los dos `id` en `undefined` da `true`. En producción todos los usuarios vienen del repositorio con id, así que no es alcanzable por HTTP; el riesgo es en tests o seeds futuros que armen usuarios sin guardar y den por buena una autorización que en realidad compara `undefined === undefined`. Verificado con `new Usuario(...).esElMismo(new Usuario(...))` → `true`.

**Arreglo propuesto.** `return this.id !== undefined && otro?.id === this.id`.

### B6. App: con un tipo elegido que se agota al volver a la pantalla, el botón sigue habilitado y manda `cantidad: 0`

**Archivo:** `packages/mobile/app/evento/[id].tsx:91-95` y `:183-189`.

**Qué pasa.** `cantidadValida = Math.min(cantidad, tipoElegido.disponibles)` está pensado para cuando bajan los disponibles al refrescar (bien), pero si bajan a 0 queda `cantidadValida = 0`: el `Pressable` del tipo se deshabilita pero sigue seleccionado, el Stepper muestra 0 con los dos botones apagados, el total dice `$ 0` y el botón "Comprá tus entradas" sigue activo porque solo mira `!tipoElegido || comprando`. Al tocarlo el backend responde 422 "La cantidad de entradas debe ser un entero positivo." (verificado con curl con `cantidad: 0`), que es un mensaje que el usuario no entiende.

**Reproducción.** Abrir un evento, elegir un tipo con 1 disponible, ir a otra pantalla, comprar esa última entrada con otro usuario (o con curl), volver: `useFocusEffect` recarga el evento y el tipo queda agotado pero elegido.

**Arreglo propuesto.** Deshabilitar el botón también cuando `cantidadValida < 1`, o en el render, si `tipoElegido` existe y `tipoElegido.disponibles === 0`, resetear `tipoElegidoId` a `null` (por ejemplo derivándolo: `const tipoElegido = evento.tiposEntrada.find((t) => t.id === tipoElegidoId && t.disponibles > 0)`).

### B7. App: si `AsyncStorage.getItem` rechaza, la app queda en el spinner para siempre

**Archivo:** `packages/mobile/src/context/UsuarioContext.tsx:26-35` y `:41-47`.

**Qué pasa.** `recuperarUsuario` atrapa el error de `listarUsuarios` pero no el de `AsyncStorage.getItem`; el `.then` del efecto nunca corre, `recuperando` queda en `true` y `Navegacion` muestra `<Cargando />` sin salida. Es raro (storage corrupto, simulador con disco lleno), pero la salida es un cuelgue sin mensaje.

**Arreglo propuesto.** Mover el `try` para que envuelva también el `getItem`, o en el efecto usar `.catch(() => null).then(...)` / `finally(() => setRecuperando(false))`.

### B8. App: la URL del backend se arma solo desde `hostUri`, con puerto 3000 fijo

**Archivo:** `packages/mobile/src/services/api.ts:19-23`.

**Qué pasa.** Funciona en Expo Go por LAN (y es lo documentado), pero falla en silencio en dos casos razonables para la demo: `expo start --tunnel` (`hostUri` es `xxx.exp.direct`, que no sirve el backend) y un backend levantado con `PORT` distinto de 3000 (el `server.js` lo permite). En ambos la app muestra "No pudimos conectarnos con el servidor" sin pista.

**Arreglo propuesto.** `process.env.EXPO_PUBLIC_API_URL ?? \`http://${host}:3000\``, y una línea en el README.

### B9. Contrato: `POST /compras/:id/resena` exige `detalle` no vacío, `docs/dominio.md` lo define opcional

**Archivos:** `packages/backend/src/validations/compra.js:17-22`, `packages/backend/src/domain/Resena.js:4` (`detalle = ""`), `docs/api.md` ("Body `{ puntuacion, detalle }`", sin decir que es obligatorio).

**Qué pasa.** `detalle: z.string().trim().min(1)` rechaza con 400 una reseña solo con estrellas (verificado: `{"puntuacion":5,"detalle":""}` → 400 "Too small"), mientras el dominio la acepta. Cuando la app implemente la reseña va a tener que inventar la regla. Es una decisión de producto, pero hoy los tres lugares dicen cosas distintas.

**Arreglo propuesto.** Elegir una: si el detalle es opcional, `z.string().trim().default("")` y decirlo en `api.md`; si es obligatorio, sacar el default de `Resena` y decirlo en `dominio.md` y `api.md`.

### B10. Devex: `npm run format:check` falla y el override de React deja un peer "invalid"

**Archivos:** `packages/mobile/tsconfig.json`, `package.json:24-26`.

**Qué pasa.**

- `prettier . --check` marca `packages/mobile/tsconfig.json` (verificado). Es el único archivo; quien corra el script de la raíz antes de un commit lo ve rojo.
- `overrides: { react: "19.3.0" }` fija `react` pero no `react-dom`, que quedó en 19.3.1 (lo pide `@expo/metro-runtime`) y declara peer `react ^19.3.1`; `npm ls react` lo lista como `invalid`. `expo-doctor` pasa 20/20 y `expo install --check` está al día, así que no rompe nada hoy, pero la próxima vez que alguien corra `npm install` con un `npm` que trate peers inválidos como error va a chocar. Fijar también `react-dom` en el override (o subir los dos a lo que Expo 58 bundlea, que es 19.3.0 para ambos) deja el árbol consistente.
- El README no dice que hace falta Expo Go instalado en el teléfono ni que el backend tiene que estar corriendo antes de abrir la app para que "quién soy" cargue; son dos líneas.

---

## Tests: lo que el contrato o el dominio no cubren

No encontré tests que pasen por una razón equivocada. Sí hay comportamiento sin cobertura, y dos tests más débiles de lo que parecen:

- `api.test.js` "orden=puntaje": en el momento en que corre, todos los organizadores del catálogo tienen reseñas, así que nunca verifica que los `null` vayan al final por HTTP (lo cubre el unitario de `EventoService`, pero no el presentador ni el default de `orden`).
- `api.test.js` comparte el singleton de `dependencias.js` entre tests y depende del orden (por ejemplo "POST /eventos crea..." asume que el usuario 5 no tenía eventos). Hoy Jest corre los archivos en workers separados y es estable; si alguien agrega otro archivo de integración que importe `app.js`, el seed se carga dos veces sobre el mismo repositorio y los ids se corren.
- Sin cobertura por HTTP: `cantidad` 0 / negativa (422), `cantidad` como string (400), compra en evento que ya ocurrió (409), tipos de entrada con nombre repetido (422), `multimedia` que no es URL (400), búsqueda con tildes (`?texto=marat%C3%B3n`), `categoriaId` inexistente en la búsqueda, cancelar una compra ajena (403, hay unitario), reembolsar una cancelada que nunca se pagó por HTTP (hay unitario), JSON inválido (400), ruta con campo extra (400 por `.strict()`).
- Sin cobertura en el dominio: que `Compra` no verifique que `tipoEntrada` pertenezca a `evento` (lo garantiza el servicio con `evento.tipoEntrada(id)`, verificado: `tipoEntradaId` de otro evento da 404), `diasParaElEvento` después del evento (B1), organizador comprando su propio evento (M1).
- Nada de la app tiene tests (`useCarga`, `useDemorado`, `fechas.ts`); la bitácora ya registra que `formatearFecha` se rompió en Hermes y se arregló a mano, y hoy eso tampoco tiene test.

---

## Revisado y sin problemas

- Tabla de transiciones de `Compra` contra `docs/dominio.md`: desde/hacia, quién, `cancelar` solo si el evento no ocurrió y libera cupo, `reembolsar` solo si pasó por `CONFIRMADA`, historial con el primer cambio a `PENDIENTE`. `utilizar` sin condición de fecha, como dice la tabla.
- Cupo: `reservar` valida antes de mutar y `Compra` valida `cantidad` entera positiva antes de reservar, así que un error no deja cupo reservado; sin sobreventa por cantidad (41 sobre 40 → 409, verificado); `cancelar` libera exactamente lo reservado; Node es monohilo y los repositorios son síncronos, no hay carrera entre dos compras.
- `yaOcurrio` / `diasHasta` en el borde "hoy": `-0 || 0`, zona horaria irrelevante porque opera sobre instantes absolutos; coherente con la creación (`fecha <= ahora` inválida).
- Reseña única por compra (segundo intento → 409, verificado por test y curl), puntuación entera 1..5 (422), puntaje del organizador como promedio sobre reseñas de todos sus eventos, `null` sin reseñas, orden por puntaje descendente con `null` al final (verificado por HTTP con los eventos 13–15 al final).
- Búsqueda sin tildes ni mayúsculas (NFD + `\p{M}`), en nombre y descripción, `texto=` vacío ignora el filtro, `categoriaId` inexistente devuelve `[]`, `texto` repetido en la query → 400 y no un crash. El catálogo deja afuera lo que ya ocurrió y `GET /eventos/:id` lo sigue sirviendo con `yaOcurrio: true`.
- Autorización por acción, verificada con curl además de los tests: confirmar/cancelar solo comprador, usar/reembolsar solo organizador, `GET /compras/:id` comprador u organizador (otro → 403, inexistente → 404), `GET /eventos/:id/compras` solo organizador, mensajes solo las partes (doble chequeo en servicio y dominio), reseña solo comprador. `identificar` corre antes que la validación, así que sin header es 401 aunque el body sea inválido.
- Validación en el borde: `.strict()` rechaza campos extra, body array / sin content-type / JSON inválido → 400 con `{message, details}`, `1e400` (Infinity) rechazado por zod, fecha sin zona rechazada por `z.iso.datetime({ offset: true })`, `tiposEntrada: []` → 400, `tipoEntradaId` de otro evento → 404, path con percent-encoding roto → 400 JSON y no HTML de Express, ruta desconocida → 404 JSON.
- `errorHandler`: mapeo 422/409/404/401/403/400/500 según la tabla de `api.md`, `details` siempre presente, `headersSent` respetado, errores del body-parser con `expose`.
- Estado compartido en memoria: los presentadores solo leen; `multimedia` y `tiposEntrada` llegan como arrays nuevos del parseo de zod; cada repositorio tiene su propio contador y los ids de `TipoEntrada` (`<evento>-<n>`) no colisionan con los numéricos; `EventoRepository.guardar` asigna ids con `??=`, así que re-guardar no los cambia; `comprasDelEvento` compara por identidad y funciona porque todo es la misma referencia; el seed no comparte instancias de `TipoEntrada` entre eventos. Las fechas (`Date`) se exponen por referencia pero nadie las muta.
- Contrato `docs/api.md` contra los presentadores, campo por campo (Usuario, Categoria, TipoEntrada, Organizador, Evento, EventoDetalle, Resena, CambioEstado, Mensaje, Compra, `{evento, compras}`), códigos de respuesta (201 en POST de eventos, compras, mensajes y reseña; 200 en las acciones), rutas en sustantivo. `types.ts` y `api.ts` de la app coinciden con `api.md` campo por campo, incluido `evento` y `tipoEntrada` reducidos dentro de `Compra` y `params` de `listarEventos` (`texto`/`categoriaId` vacíos se omiten).
- App: `useCarga` descarta respuestas viejas con el contador `ultimoPedido` (cambio de filtros en vuelo no pisa la lista nueva) y recarga en cada foco, así "Mis compras" y el catálogo se refrescan después de comprar; `useDemorado` limpia el timer; `router.dismissTo("/mis-compras")` se traduce a `POP_TO` sobre el stack raíz (que sí contiene `(tabs)`) y a un `NAVIGATE` con `pop` dentro de las tabs, lo verifiqué en `expo-router/build/global-state/resolveNavigationDestination.js:142-143`; `Alert.alert` después de navegar es seguro; `Stack.Protected` con guards complementarios redirige en los dos sentidos y `quien-soy` no es alcanzable con usuario; id guardado en AsyncStorage que ya no existe en el seed cae a "¿Quién sos?"; keys de listas únicas (`usuario.id`, `evento.id`, `compra.id`, `tipo.id`, `mensaje.id` por compra, `resena.id`, índice solo en el historial que es inmutable); errores de red convertidos a `Error` con mensaje en el interceptor y mostrados con reintento; `hostUri` nulo cae a `localhost` (que es lo correcto en simulador y web).
- Devex: `.nvmrc` = 24, `npm install` + `npm run dev:backend` + `npm run start:mobile` alcanzan, `.claude/launch.json` apunta al workspace correcto en el 3000, `npm test` corre solo el backend (lo único que tiene tests), `lint` limpio, `expo-doctor` 20/20, `expo install --check` al día, `.gitignore` cubre `.expo`, `ios`, `android` y `.env`.
