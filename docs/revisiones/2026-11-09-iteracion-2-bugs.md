# AI Ticket It: revisión de bugs y seguridad, segunda iteración (rango 8c67f20~1..HEAD)

Revisé solo el código agregado o modificado en los doce commits del rango (`git diff 8c67f20~1..HEAD`), contra `docs/dominio.md` y `docs/api.md`. No repito nada de `docs/revisiones/2026-11-09-*.md`; verifiqué que lo que esos reportes marcaron sigue arreglado donde toca el código nuevo (por ejemplo, el organizador no puede ser comprador, así que `rolDe` nunca tiene que desempatar).

Lo que corrí: `npm test` (backend 7 suites / 119 tests, mobile 5 suites / 24 tests, todo en verde), `tsc --noEmit` en mobile (limpio), `npm run lint` y `npm run format:check` (limpios), `npx expo install --check` ("Dependencies are up to date"). Levanté el backend en el puerto 3100 y reproduje con curl cada caso de autorización, transición y validación que se lista abajo; lo maté al terminar. Para la app no levanté el simulador (el iPhone 17 Pro booteado y el Metro en 8081 son de tu sesión y no quise pisarlos), así que lo que digo de la app sale del código y del código fuente de las librerías en `node_modules`; marco explícitamente qué quedó sin verificar en runtime. No toqué archivos del repo.

Intencionales y no reportados: sin login (`x-usuario-id`), persistencia en memoria, pago simulado, CORS abierto, demo local.

Resumen: 0 altos, 2 medios, 3 bajos.

---

## Medias

### M1. En Android la pantalla "Nuevo evento" no puede elegir la hora: `mode="datetime"` no existe en esa plataforma y el picker se abre solo, en bucle

**Archivo:** `packages/mobile/app/evento/nuevo.tsx:126-133`.

**Qué pasa.** `@react-native-community/datetimepicker` 9.2.1 define `AndroidMode = 'date' | 'time'` (`node_modules/@react-native-community/datetimepicker/src/index.d.ts:5` y `src/constants.js:33-37`). `tsc` lo acepta porque las props del componente son la unión `IOSNativeProps | AndroidNativeProps | WindowsNativeProps` (`index.d.ts:273`), así que un valor válido en iOS pasa aunque no lo sea en Android. En runtime Android, `getOpenPicker` (`src/androidUtils.js:53-80`) hace `switch (mode)` con un `case` para `time` y un `default` que abre el picker de **fecha**, así que `"datetime"` cae en el de fecha y la hora no se puede tocar: queda siempre la de `mananaALas21`, 21:00.

Peor que eso: en Android el componente no renderiza nada (`src/datetimepicker.android.js` devuelve `null`) y abre un diálogo nativo desde un `useEffect` cuyas dependencias incluyen `valueTimestamp` (`src/datetimepicker.android.js:50-100`). Como `nuevo.tsx` lo monta siempre, el flujo es:

1. Al cargar las categorías aparece el diálogo de fecha sin que el usuario haya tocado nada.
2. Si elige una fecha, `onChange` recibe un `Date` nuevo, `setFecha` cambia `valueTimestamp` y el efecto vuelve a abrir el diálogo con la fecha elegida. Para salir hay que apretar Cancelar.
3. Si cancela, `onChange` recibe el mismo objeto `originalValue` (`src/DateTimePickerAndroid.android.js:126-131`), `setFecha` con la misma referencia no re-renderiza, el diálogo se cierra y ya no hay forma de volver a abrirlo porque no hay ningún botón: la fecha queda fija en lo último elegido.

El evento igual se puede crear (con la hora 21:00 por defecto), por eso no es alto. Pero el README manda a abrir la app con Expo Go en "el teléfono" sin restringir plataforma, Expo Go para Android trae este mismo módulo (`node_modules/expo/bundledNativeModules.json:8` fija 9.2.1), y la experiencia es un diálogo que se abre solo, se reabre después de cada elección y no deja elegir hora.

**Reproducción.** Es lectura del código de la librería, no la corrí en un dispositivo Android (no hay emulador en esta máquina). Las tres citas de arriba son suficientes: `ANDROID_MODE` no tiene `datetime`, `getOpenPicker` cae al `default`, y el `useEffect` de `datetimepicker.android.js` se dispara con cada cambio de `value`.

**Arreglo propuesto.** Separar por plataforma. En iOS dejar el `DateTimePicker` inline como está. En Android no montar el componente: mostrar la fecha formateada con un botón "Cambiar" que llame a `DateTimePickerAndroid.open({ mode: "date", value, minimumDate, onChange })` y, en el `onChange` de tipo `set`, encadenar `DateTimePickerAndroid.open({ mode: "time", value: fechaElegida, is24Hour: true, onChange })`. Si preferís un solo camino, el mismo patrón de botón + `open` imperativo funciona en los dos sistemas.

### M2. `aNumero` convierte "15.000" en 15 y "1.000,50" en `NaN`: un precio escrito a la argentina crea el evento con otro valor, sin aviso

**Archivos:** `packages/mobile/src/features/eventos/armarNuevoEvento.ts:57-58` (`aNumero`), `packages/mobile/app/evento/nuevo.tsx:58-78` (`crear`).

**Qué pasa.** `aNumero` hace `Number(texto.trim().replace(",", "."))`. Está pensado para la coma decimal del teclado numérico de iOS, pero el mismo campo acepta el punto, y en Argentina el punto es el separador de miles. Resultado por entrada (verificado con `node`):

| Texto      | `aNumero` | Qué pasa en el backend                                            |
| ---------- | --------- | ----------------------------------------------------------------- |
| `15.000`   | `15`      | 201: el evento queda con entradas a $15 en vez de $15.000         |
| `1,000`    | `1`       | 201: entradas a $1                                                |
| `1.000,50` | `NaN`     | `JSON.stringify` manda `null`, zod responde 400 "Datos inválidos" |
| `2,5`      | `2.5`     | precio OK; como cupo, 422 "debe ser un entero positivo"           |
| `abc`      | `NaN`     | 400 "Datos inválidos"                                             |
| `1e3`      | `1000`    | 201                                                               |

El caso grave es el primero: no hay error, el evento se publica con un precio equivocado, y la API no tiene edición ni borrado de eventos, así que no se puede corregir sin reiniciar el backend. El placeholder "15000" ayuda pero no impide nada, y el test `acepta coma decimal en el precio` solo cubre `"1500,50"`.

**Reproducción.** `node -e 'console.log(Number("15.000"))'` imprime `15`. Con curl contra el backend en 3100, `POST /eventos` con `"precio": 15` responde 201 y `precioDesde: 15`; con `"precio": null` responde 400 `{"message":"Datos inválidos","details":[{"path":["tiposEntrada",0,"precio"],"message":"Invalid input: expected number, received null"}]}`.

**Arreglo propuesto.** Que `armarNuevoEvento` parsee con una regla explícita y devuelva `{ error }` cuando no cumpla, en vez de dejar pasar `NaN` o un número distinto al escrito. Por ejemplo: aceptar solo `/^\d+(,\d{1,2})?$/` para precio y `/^\d+$/` para cupo (la coma decimal es lo único que escribe el teclado numérico), y un mensaje del estilo "El precio de «VIP» tiene que ser un número; usá coma para los centavos y sin puntos de miles". Si querés tolerar los miles, sacá los puntos antes de convertir (`texto.replace(/\./g, "").replace(",", ".")`), pero entonces `"1.5"` pasa a ser 15, así que lo más honesto es rechazar el punto. Agregar a `armarNuevoEvento.test.ts` los casos `"15.000"`, `"1.000,50"` y `"abc"` con el resultado que elijas.

---

## Bajas

### B1. Los errores de validación del backend llegan a la app como "Datos inválidos" sin decir qué campo

**Archivos:** `packages/mobile/app/evento/nuevo.tsx:75-77`, `packages/mobile/src/services/api.ts:41-47` (`mensajeDe`), `packages/mobile/src/features/eventos/armarNuevoEvento.ts:24-31`.

**Qué pasa.** `armarNuevoEvento` solo chequea vacíos; todo lo demás se lo delega al backend ("un número que no parsea viaja como NaN para que lo rechace el backend", dice el test). Pero `mensajeDe` muestra `message` e ignora `details`, y el 400 de `validar.js` siempre dice "Datos inválidos". Entonces una URL de imagen sin `http`, un precio `abc` o un precio con punto de miles y coma (`1.000,50`) terminan en un `Alert` "No se pudo crear el evento: Datos inválidos", con el formulario intacto y sin pista. Los 422 del dominio sí llegan con texto útil ("El cupo de "G" debe ser un entero positivo.", "Los tipos de entrada deben tener nombres distintos.", "La fecha del evento debe ser futura.").

**Reproducción.** Con curl en 3100: `multimedia: ["foto"]` responde `400 {"message":"Datos inválidos","details":[{"path":["multimedia",0],"message":"Invalid URL"}]}`; `precio: null` responde el 400 citado en M2. En los dos casos la app muestra solo "Datos inválidos".

**Arreglo propuesto.** Validar en `armarNuevoEvento` lo que la app puede saber (número bien formado, URL con `http`/`https`) con mensajes propios, y dejar al backend las reglas que necesitan datos del servidor. Como red, `mensajeDe` podría concatenar `details[0].path.join(".")` cuando el status es 400.

### B2. `onChange` del `DateTimePicker` está deprecado en 9.2.1 y dispara un warning de LogBox al abrir "Nuevo evento"

**Archivo:** `packages/mobile/app/evento/nuevo.tsx:132`.

**Qué pasa.** Tanto `src/datetimepicker.ios.js:77` como `src/DateTimePickerAndroid.android.js:58` llaman `warnIfOnChangeIsUsed(onChange)`, que en `__DEV__` hace `console.warn("DateTimePicker: `onChange`is deprecated. Use`onValueChange`, `onDismiss`, and `onNeutralButtonPress` instead.")` una vez por sesión (`src/utils.js:72-79`). En Expo Go eso es un cartel amarillo de LogBox la primera vez que se entra a la pantalla. Funcionalmente no cambia nada hoy.

**Arreglo propuesto.** Usar `onValueChange={(_, fecha) => setFecha(fecha)}` (que ya garantiza `fecha` definida, así sobra el `elegida &&`). Si aplicás M1, el `open` imperativo también acepta `onValueChange`.

### B3. Dos taps rápidos en un botón de `AccionesDeCompra` encolan dos confirmaciones; la segunda termina en un 409 mostrado como "No se pudo"

**Archivo:** `packages/mobile/src/features/compras/AccionesDeCompra.tsx:70-91`.

**Qué pasa.** `enCurso` se pone en `true` recién dentro de `ejecutar`, o sea después de que el usuario confirma el `Alert`. Entre el tap y la confirmación los botones siguen habilitados, y en iOS `Alert.alert` encola los alerts en vez de reemplazarlos. Dos taps seguidos en "Confirmar pago" (o uno en "Confirmar pago" y otro en "Cancelar compra") abren dos diálogos; al confirmar el segundo, la compra ya cambió y el backend responde 409 ("No se puede confirmar el pago de una compra CONFIRMADA."), que la app muestra en un `Alert` "No se pudo". No se corrompe nada: el backend es la fuente de verdad y `onCompraActualizada` ya dejó la compra nueva en pantalla. También es confuso que el diálogo de cancelar tenga los botones "Cancelar" y "Cancelar compra".

**Reproducción.** La parte del backend está verificada con curl: segundo `POST /compras/9/confirmacion` como usuario 4 responde 409 con ese mensaje. La cola de alerts en iOS no la reproduje en simulador (ver nota al inicio); es el comportamiento documentado de `Alert` en iOS, y en Android el segundo alert reemplaza al primero, así que ahí no pasa.

**Arreglo propuesto.** Marcar `enCurso` (o un `confirmando`) al abrir el `Alert` y limpiarlo en el `onPress` de "Cancelar" y en el `finally` de `ejecutar`. Y renombrar el botón negativo del diálogo de cancelar a "Volver" o "No".

---

## Tests: lo que el comportamiento nuevo no cubre

Nada pasa por una razón equivocada; sí hay un test que fija un comportamiento débil: `un número que no parsea viaja como NaN para que lo rechace el backend` (`armarNuevoEvento.test.ts:58-70`) asegura que `abc` viaja como `NaN`, y eso es justamente lo que produce B1 y tapa M2. Si cambiás `aNumero`, ese test cambia con él.

Backend, sin cubrir vía HTTP (sí a nivel dominio):

- `POST /compras/:id/resena` por el organizador o por un tercero (403 "Solo el comprador puede reseñar esta compra.") y por el comprador sobre una compra no utilizada (409 "No se puede reseñar una compra CONFIRMADA."). Son justo las dos cosas que el refactor de `#autorizada` podía romper; los curl G, H e I de abajo las verifican, pero ningún test lo hace.
- `acciones` en `GET /eventos/:id/compras` para una compra CONFIRMADA o CANCELADA con pago (hoy solo se comprueba `[]` sobre una PENDIENTE).
- El mensaje de 403 con el verbo nuevo ("confirmar el pago de", "reembolsar") para cada acción; solo se afirma el código.

Mobile, sin cubrir:

- `ChatDeCompra`: botón deshabilitado con texto vacío o solo espacios, `trim` al enviar, limpieza del input después del envío, y el `Alert` en error.
- `AccionesDeCompra`: el camino completo tap → `Alert` → `ejecutar` → `onCompraActualizada`, y el camino de error. Hoy solo se prueba qué botones aparecen.
- `FormularioResena`: el envío exitoso (que `resenarCompra` recibe `detalle` con `trim`) y el error.
- `armarNuevoEvento`: nombre y descripción vacíos, `"15.000"`, `"1.000,50"`, cupo `"0"`/`"-1"`/`"2,5"` (hoy el parser los deja pasar a propósito; si adoptás M2 necesitan tests).
- `nuevo.tsx` y `FormularioTipoEntrada`: nada. Quitar un tipo del medio con `key={indice}` funciona porque los inputs son controlados, pero no hay test que lo demuestre.

---

## Revisado y sin problemas

**`accionesPara` contra la tabla de `docs/dominio.md`.** Comparé fila por fila y reproduje con curl contra el seed (usuarios 1-6, compras 1-16):

- PENDIENTE: comprador `["confirmarPago","cancelar"]`, organizador `[]` (compra 9, usuarios 4 y 1).
- CONFIRMADA: comprador `["cancelar"]`, organizador `["utilizar"]` (compra 12, usuarios 4 y 3).
- UTILIZADA sin reseña: comprador `["resenar"]`, organizador `[]` (compra 8, usuarios 5 y 3). Con reseña: `[]` para los dos (compra 1).
- CANCELADA con pago: organizador `["reembolsar"]` (compra 16, usuario 3); sin pago: `[]` (compra 14, usuario 2). Comprador `[]` en los dos.
- REEMBOLSADA: `[]` para todos (compra 15).
- Tercero: `GET /compras/:id` responde 403 "Esta compra no es tuya." antes de llegar al presentador; en el dominio `rolDe` devuelve `null` y el filtro no matchea ninguna fila (test unitario `un tercero nada`).
- Evento ya ocurrido: `cancelar` desaparece por `motivoDeRechazo` (test unitario con `sumarDias(HOY, 11)`); `utilizar` y `resenar` no tienen condición de fecha, lo que coincide con la tabla (la entrada se usa en la puerta, la reseña viene después). No hay compras PENDIENTE/CONFIRMADA de eventos pasados en el seed, y la API no permite crearlas, así que este borde solo tiene cobertura unitaria, lo cual es correcto.
- Orden de `acciones`: el de `Object.keys(acciones)`, estable (`confirmarPago, utilizar, cancelar, reembolsar, resenar`); los tests dependen de ese orden y el presentador no lo altera.

**`#autorizada`, 403 vs 409.** El rol se chequea antes que la transición, así que un tercero u organizador nunca recibe un 409 que revele el estado. Verificado con curl: G comprador reseña CONFIRMADA → 409 "No se puede reseñar una compra CONFIRMADA."; H organizador reseña → 403 "Solo el comprador puede reseñar esta compra."; I tercero reseña → 403 ídem; J comprador `uso` → 403 "Solo el organizador puede utilizar esta compra."; K y L tercero/organizador `confirmacion` → 403 "Solo el comprador puede confirmar el pago de esta compra."; M comprador `reembolso` → 403; N organizador `reembolso` sin pago → 409 "Solo se reembolsa una compra que había sido pagada."; O reseña duplicada → 409 "La compra ya tiene una reseña."; P organizador `uso` sobre PENDIENTE → 409 "No se puede utilizar una compra PENDIENTE."; Q tercero mensaje → 403. El único cambio observable respecto de la iteración anterior es el texto del 409 de reseña sobre compra no utilizada ("No se puede reseñar una compra X." en vez de "Solo se puede reseñar una compra utilizada."), que sigue el formato del resto de la tabla. `Compra.accion(nombre)` solo se llama con los cinco nombres fijos del servicio, así que el `TypeError` por nombre desconocido no es alcanzable. `resenar` no tiene `hacia` ni pasa por `#transicionar`, y ningún camino lo intenta.

**Contrato `docs/api.md` ↔ `presentarCompra` ↔ `types.ts`/`api.ts`.** `Compra`: los catorce campos coinciden uno a uno (`id, estado, cantidad, total, comprador, evento{id,nombre,fecha,organizador}, tipoEntrada{id,nombre,precio}, diasParaElEvento, acciones, historial, mensajes, resena`); `Accion` tiene los mismos cinco valores en los tres lados. `POST /eventos`: `NuevoEvento` (`nombre, descripcion, categoriaId, fecha, multimedia, tiposEntrada[{nombre, descripcion, precio, cupo}]`) coincide con `eventoSchema` y con el body documentado; `fecha` viaja como `toISOString()` que cumple `z.iso.datetime({ offset: true })`. Única asimetría, no es bug: la app exige `descripcion` ("Escribí una descripción.") mientras el schema la hace opcional con `default("")`; `docs/api.md` no dice nada. Todos los `presentarCompra` del backend reciben `req.usuario` (seis llamadas en `CompraController.js` y una en `EventoController.js`); no quedó ninguna llamada con un solo argumento.

**App, estado después de una acción.** `onCompraActualizada={carga.setDatos}` reemplaza la compra en el detalle sin segundo request. Las listas "Mis compras", "Compras del evento" y el detalle del evento usan `useCarga`, que recarga en `useFocusEffect`, así que al volver atrás se refrescan (cupo liberado tras cancelar, estado nuevo en las tarjetas). "Mis eventos" también recarga al enfocar, por eso después de `router.replace` al detalle del evento nuevo y luego back, el evento aparece. `FormularioResena` se desmonta al desaparecer `resenar` de `acciones`; el `setEnviando(false)` del `finally` sobre un componente desmontado no genera warning en React 19.

**Doble envío.** `nuevo.tsx` deshabilita "Crear evento" mientras `creando` y solo lo rehabilita en el `catch` (en éxito se navega). `ChatDeCompra` y `FormularioResena` deshabilitan el botón mientras `enviando`. `Boton` propaga `disabled` al `Pressable`. El único hueco es el de B3, que está entre el tap y la confirmación.

**`Alert` con callbacks async.** `onPress: () => ejecutar(accion)` devuelve una promesa que `ejecutar` ya envuelve en try/catch/finally; no hay rechazos sin atrapar. Lo mismo en `crear`, `enviar` del chat y `enviar` de la reseña.

**Chat con texto vacío o solo espacios.** `puedeEnviar = texto.trim() !== "" && !enviando` deshabilita el botón; se envía `texto.trim()`; el backend igualmente responde 400 a `"   "` (curl R). Mensaje con reseña: el backend responde 400 a `detalle: "  "` (curl S) y 422 a `puntuacion: 0` (curl T); la app no deja llegar a ninguno de los dos.

**`armarNuevoEvento`, resto de casos.** Vacíos de nombre, descripción, categoría y de cada tipo de entrada devuelven `{ error }` con texto propio. Cupo `"0"`, `"-1"` y `"2,5"` llegan al backend y vuelven como 422 "El cupo de "G" debe ser un entero positivo." (curl V y W), que la app muestra tal cual: aceptable. Fecha pasada: `minimumDate={new Date()}` en el spinner de iOS la impide, y el backend responde 422 "La fecha del evento debe ser futura." (curl Z). Categoría inexistente: 404 "La categoría no existe." Tipos repetidos ("G" y " g "): 422 "Los tipos de entrada deben tener nombres distintos." (curl Y). Imagen vacía o con espacios → `multimedia: []`. `key={indice}` en los tipos es seguro porque todos los inputs son controlados.

**`automaticallyAdjustKeyboardInsets` en vez de `KeyboardAvoidingView`.** Es una prop solo iOS; en Android Expo usa `adjustResize` por defecto (`@expo/config-plugins/build/android/WindowSoftInputMode.js`), así que el `ScrollView` se achica y Android desplaza al input enfocado por su cuenta. En iOS la prop ajusta el `contentInset` al alto del teclado y, si el scroll está al fondo, lo mantiene al fondo, que es el caso del chat (último bloque de la pantalla). No lo verifiqué en simulador; si ves que el input de la reseña (que está en el medio) queda tapado, el arreglo es `KeyboardAvoidingView behavior="padding"` con `keyboardVerticalOffset` igual al alto del header. Dejar las dos cosas a la vez es contraproducente.

**`router.replace` desde el modal.** `evento/nuevo` está declarado con `presentation: "modal"` en el Stack raíz y `crear` hace `router.replace(`/evento/${id}`)` a una pantalla con presentación por defecto. Expo Router reemplaza la ruta superior del stack; el modal se descarta y el detalle entra como card, con back hacia las tabs. No lo verifiqué en simulador. Si en iOS la animación se ve rara, la alternativa es `router.dismiss()` seguido de `router.push`, o `router.dismissTo("/mis-eventos")` como hace `BloqueCompra`.

**Navegación y layout.** `evento/nuevo` es ruta estática y tiene prioridad sobre `evento/[id]`. El `headerLeft` "Cancelar" llama `router.back()`, que en un modal lo cierra. El botón "+" solo aparece en la tab "Mis eventos". `Campo` saca `style` de las props antes del spread, así que el estilo externo no pisa el interno.

**Seguridad.** `acciones` se calcula con `req.usuario` del header en todas las rutas, incluida `GET /eventos/:id/compras` (solo organizador), así que el comprador nunca ve `utilizar`/`reembolsar` ni el organizador `confirmarPago`/`cancelar`/`resenar`. Las acciones no están en la lista siguen respondiendo 403/409 en el backend (todas las de arriba), que es lo que promete `docs/api.md`. `multimedia` sigue limitado a `http`/`https` por zod (curl X). No hay nada nuevo que exponga datos de otro usuario.

**Devex.** README sigue alcanzando: `npm install`, `npm run dev:backend`, `npm run start:mobile`. `@react-native-community/datetimepicker` 9.2.1 es exactamente la versión que Expo Go SDK 58 trae embebida, así que no hace falta dev build; el plugin en `app.json` solo importa para `prebuild` y es inofensivo. `.nvmrc` sigue en 24. `package-lock.json` queda consistente (`expo install --check` limpio). Ningún cambio de puertos, variables ni scripts.

**Tests existentes.** La tabla `test.each` de `accionesPara` en `Compra.test.js` cubre los cinco estados por los tres roles; `llevarA[CANCELADA]` pasa por CONFIRMADA, así que el `["reembolsar"]` del organizador es legítimo, y el test "reembolsar aparece solo si la compra pasó por CONFIRMADA" cubre la rama sin pago. `AccionesDeCompra.test` "reseñar no es un botón de acción" pasa por el `return null` temprano, que es exactamente lo que se quiere. `FormularioResena.test` usa `toBeDisabled` sobre el `Pressable` con `disabled`, correcto.

---

## Apéndice: curls ejecutados contra `PORT=3100`

Todos con `-H "x-usuario-id: N"` y, para POST con body, `content-type: application/json`.

| #   | Request                                                     | Respuesta                                                       |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| A   | `GET /compras/8` como 3 (organizador, UTILIZADA sin reseña) | 200 `acciones: []`                                              |
| B   | `GET /compras/16` como 3 (CANCELADA con pago)               | 200 `acciones: ["reembolsar"]`                                  |
| C   | `GET /compras/14` como 2 (CANCELADA sin pago)               | 200 `acciones: []`                                              |
| D   | `GET /compras/12` como 3 (CONFIRMADA)                       | 200 `acciones: ["utilizar"]`                                    |
| E   | `GET /compras/9` como 1 (PENDIENTE)                         | 200 `acciones: []`                                              |
| F   | `GET /compras/9` como 5 (tercero)                           | 403 "Esta compra no es tuya."                                   |
| G   | `POST /compras/12/resena` como 4 (comprador, CONFIRMADA)    | 409 "No se puede reseñar una compra CONFIRMADA."                |
| H   | `POST /compras/8/resena` como 3 (organizador)               | 403 "Solo el comprador puede reseñar esta compra."              |
| I   | `POST /compras/8/resena` como 6 (tercero)                   | 403 "Solo el comprador puede reseñar esta compra."              |
| J   | `POST /compras/12/uso` como 4 (comprador)                   | 403 "Solo el organizador puede utilizar esta compra."           |
| K   | `POST /compras/9/confirmacion` como 6 (tercero)             | 403 "Solo el comprador puede confirmar el pago de esta compra." |
| L   | `POST /compras/9/confirmacion` como 1 (organizador)         | 403 ídem                                                        |
| M   | `POST /compras/16/reembolso` como 5 (comprador)             | 403 "Solo el organizador puede reembolsar esta compra."         |
| N   | `POST /compras/14/reembolso` como 2 (sin pago)              | 409 "Solo se reembolsa una compra que había sido pagada."       |
| O   | `POST /compras/1/resena` como 4 (ya reseñada)               | 409 "La compra ya tiene una reseña."                            |
| P   | `POST /compras/9/uso` como 1 (PENDIENTE)                    | 409 "No se puede utilizar una compra PENDIENTE."                |
| Q   | `POST /compras/9/mensajes` como 6 (tercero)                 | 403 "Esta compra no es tuya."                                   |
| R   | `POST /compras/9/mensajes` `{"texto":"   "}`                | 400 "Datos inválidos" (`texto`)                                 |
| S   | `POST /compras/3/resena` `{"puntuacion":4,"detalle":"  "}`  | 400 "Datos inválidos" (`detalle`)                               |
| T   | `POST /compras/3/resena` `{"puntuacion":0,"detalle":"ok"}`  | 422 "La puntuación debe ser un entero entre 1 y 5."             |
| U   | `POST /eventos` con `precio: null`                          | 400 "Datos inválidos" (`tiposEntrada.0.precio`)                 |
| V   | `POST /eventos` con `cupo: 2.5`                             | 422 "El cupo de "G" debe ser un entero positivo."               |
| W   | `POST /eventos` con `cupo: 0`                               | 422 ídem                                                        |
| X   | `POST /eventos` con `multimedia: ["foto"]`                  | 400 "Datos inválidos" (`multimedia.0`, "Invalid URL")           |
| Y   | `POST /eventos` con tipos "G" y " g "                       | 422 "Los tipos de entrada deben tener nombres distintos."       |
| Z   | `POST /eventos` con fecha 2020                              | 422 "La fecha del evento debe ser futura."                      |
| ZZ  | `POST /eventos` con `categoriaId: "999"`                    | 404 "La categoría no existe."                                   |
