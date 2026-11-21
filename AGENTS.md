# AGENTS.md

Guía para agentes de código (Claude Code, Codex, Cursor y similares) que trabajen en este repo. Para qué es la app y cómo se corre, leé el [README](README.md). Para las reglas de negocio, [docs/dominio.md](docs/dominio.md). Para el contrato HTTP, [docs/api.md](docs/api.md).

## El proyecto en 30 segundos

AI Ticket It es una app de venta de entradas: hay eventos con tipos de entrada, cupo y un límite por persona, y compras que pasan por PENDIENTE → CONFIRMADA → UTILIZADA, o CANCELADA → REEMBOLSADA. Es un monorepo con npm workspaces:

- `packages/backend`: Express 5 en ESM, con validación en zod, persistencia **en memoria** y un seed que se carga al arrancar. Tests con Jest y supertest.
- `packages/mobile`: Expo (SDK 58) con TypeScript y Expo Router, corriendo en Expo Go. Tests con jest-expo y React Native Testing Library. Tests end-to-end con Maestro.

Todo el código, los nombres, los mensajes de error y la documentación están en **español rioplatense**. Seguí esa convención: `Compra`, `reservar`, `motivoDeRechazo`, nunca `Purchase` ni `reserve`.

## Comandos

Usá Node 24: corré `nvm use` en la raíz antes de cualquier otra cosa. Todo lo demás se corre desde la raíz:

| Qué                                                   | Comando                                                     |
| ----------------------------------------------------- | ----------------------------------------------------------- |
| Instalar                                              | `npm ci`                                                    |
| Backend en desarrollo (puerto 3000, se recarga solo)  | `npm run dev:backend`                                       |
| App                                                   | `cd packages/mobile && npx expo start --ios`                |
| Tests unitarios y de integración (los dos workspaces) | `npm test`                                                  |
| Lint del backend                                      | `npm run lint`                                              |
| Formato                                               | `npx prettier . --check` (o `npm run format` para corregir) |
| Tipos de la app                                       | `cd packages/mobile && npx tsc --noEmit`                    |
| End-to-end con Maestro                                | `npm run e2e` (ver más abajo)                               |

Antes de dar algo por terminado tienen que pasar `npm test`, `npm run lint`, `npx prettier . --check` y `tsc --noEmit` en mobile.

## Arquitectura

### Backend: por dónde entra un pedido

```
routes → middlewares (identificar, validar) → controller → service → domain
                                                               ↕
                                                     repositorios en memoria
controller → presentador (JSON) · errores → errorHandler (código HTTP)
```

- **`src/domain/`** tiene las reglas. Es un modelo rico: cada entidad valida sus invariantes en el constructor, y las reglas viven en quien tiene el dato.
  - El cupo vive en `TipoEntrada.reservar/liberar`.
  - El límite por persona vive en `Evento.reservar/liberar`, con un contador privado por usuario.
  - Los estados de la compra son una tabla de transiciones en `Compra.js`. `accionesPara(usuario)` lee esa misma tabla para decirle a la app qué botones mostrar.
  - **Agregar una transición es agregar una fila a esa tabla, no un `if`.**
- **`src/services/`** orquesta: busca en los repositorios, autoriza, llama al dominio y **guarda con `guardar` después de cada cambio**. Aunque el repositorio en memoria comparta las referencias, el `guardar` explícito tiene que estar.
- **`src/presentadores/`** arma el JSON. Nunca devuelvas una entidad cruda. Los campos derivados (`disponibles`, `acciones`, `entradasDelUsuario`, `creada`) se calculan acá a partir del dominio.
- **Errores:** el dominio lanza `DomainValidationError` (responde 422) o `DomainRuleError` (409). Los services lanzan `EntityNotFound` (404), `NoAutorizado` (403) o `NoAutenticado` (401). `errorHandler` hace la traducción. No armes respuestas de error a mano en los controllers.
- **Autenticación:** usa JWT Bearer y no hay login, a propósito, porque el enunciado no lo pide. `POST /sesiones { usuarioId }` emite el token y el middleware `identificar` lo verifica. El secreto sale de `JWT_SECRET`, con una clave de desarrollo como valor por defecto.
- **Cableado:** `src/dependencias.js` arma las instancias a mano, en un solo lugar.

### Mobile

```
app/                   pantallas (Expo Router: cada archivo es una ruta)
src/features/          componentes con la lógica de un caso de uso (BloqueCompra, AccionesDeCompra…)
src/components/        piezas visuales genéricas (Boton, Campo, Chip, SelectorOrden…)
src/services/api.ts    EL ÚNICO lugar que habla con el backend: cliente axios + token + una función por endpoint
src/hooks/             useCarga (lecturas, recarga al enfocar, descarta respuestas viejas) · useEnvio (escrituras)
src/context/           sesión del usuario (token en expo-secure-store)
src/types.ts           forma de las respuestas del backend
src/theme.ts           colores, espacios, tipografía y margen táctil
```

- **La app no sabe reglas de negocio.** Dibuja lo que manda el backend: por ejemplo, un botón por cada elemento de `compra.acciones`. Si estás por escribir en la app un `if` sobre el estado de una compra, la regla va en el dominio del backend.
- **Llamadas al backend:** nunca uses `fetch` ni axios desde una pantalla. Agregá una función en `api.ts` y tipá la respuesta en `types.ts`.
- **Accesibilidad:** es obligatoria y además es lo que usan los tests de Maestro para encontrar elementos.
  - Todo control lleva `accessibilityLabel` y `accessibilityRole`.
  - Las áreas táctiles son de 44 pt como mínimo (usá `theme.margenTactil`).
  - Los errores y los resultados de las acciones se anuncian con `AccessibilityInfo.announceForAccessibility`.

## Tests

- **Probá comportamiento, no implementación.** Afirmá lo que ve quien usa el código: respuestas HTTP, texto en pantalla, errores del dominio. No espíes métodos internos.
- **Dominio:** sin fechas reales. Todo lo que depende del tiempo recibe `ahora` como parámetro. Los tests usan `HOY` de `tests/fixtures.js` y **tienen que pasárselo a cada llamada**. Si una llamada se queda sin `ahora`, usa el reloj real y el test se rompe solo con el paso de los días. Ya pasó una vez.
- **Integración:** `tests/integration/api.test.js` recarga el seed en cada test. El helper `como(usuario)` arma el header `Authorization`. El `describe("recorrido de compra")` es el flujo completo por la API.
- **App:** los tests con React Native Testing Library mockean `src/services/api` y `expo-secure-store`.
- **End-to-end:** `packages/mobile/e2e/*.yaml` son flujos de Maestro que manejan la app real contra el backend real. Antes de correr `npm run e2e` necesitás:
  1. El backend recién levantado, porque los datos están en memoria y reiniciarlo vuelve al seed. Si no, Nicolás ya no tiene sus 2 entradas y el flujo cambia.
  2. Expo en el puerto 8082 y el simulador iOS abierto con Expo Go.
  3. El "Tools button" de Expo Go apagado, porque su engranaje flotante tapa el botón de cambiar de usuario.
  4. Tener en cuenta que Maestro interpreta los textos como **expresiones regulares**: escapá `?`, `$` y `.` (por ejemplo `"¿Quién sos\\?"`). Las tarjetas exponen una sola etiqueta con todo su texto, así que usá `".*Nicolás Acosta.*"`.

## Datos de ejemplo

El seed (`packages/backend/src/seeds/cargarSeed.js`) arma las fechas relativas a hoy, así que la demo nunca queda vieja. Lo usan los tests y los flujos de Maestro:

- **Nicolás Acosta** (id 4): comprador. Tiene 2 entradas de "Noche de rock en el Gran Rex", que tiene un límite de 4.
- **Lucía Fernández** (id 1): organiza "Noche de rock".

Si cambiás el seed, corré los tests de integración y el flujo de Maestro. Cuidá también que en cada categoría los eventos no queden en el mismo orden por fecha, precio y puntaje, porque si coinciden el selector de orden parece roto.

## Problemas conocidos que ya costaron tiempo

- **Lo que pasa en Node no garantiza que pase en el teléfono.** Hermes, el motor de React Native, formatea distinto: `Intl.DateTimeFormat.formatToParts` devuelve partes vacías. Las fechas se formatean a mano en `src/utils/fechas.ts`. Verificá en el simulador, no solo con Jest.
- **Desconfiá de los errores de Fast Refresh.** Si aparece un error raro en el log de Expo después de un cambio grande, recargá la app de cero (`npx expo start --clear`) antes de investigar. Ya pasó dos veces que el error venía de una recarga a mitad de una edición, o de una pantalla abierta que conservaba un estado con otra forma.
- **El teclado del simulador autocorrige en inglés.** Si escribís en un campo desde un test, desactivá el autocorrector o verificá el texto final.
- **Los precios se escriben a la argentina.** `15.000` es ambiguo, así que el formulario solo acepta un separador decimal. No cambies eso sin mirar `aNumero` en `armarNuevoEvento.ts`.

## Proceso

- **Commits:** en español, con estilo convencional (`feat(backend): …`, `fix(mobile): …`, `test: …`, `docs: …`), chicos y ordenados. **No agregues líneas de atribución a IA** (`Co-Authored-By`, "Generated with…").
- **Cambios de dominio:** actualizá en el mismo cambio `docs/dominio.md` y, si cambia el contrato, `docs/api.md`.
- **Revisión:** cada iteración pasó por revisiones independientes (bugs y seguridad, calidad, comentarios) antes de mergear, y los reportes quedan en `docs/revisiones/`. Si hacés un cambio grande, seguí el mismo criterio.
- **Bitácora:** `docs/bitacora.md` registra el proceso de desarrollo con IA. Si tomás una decisión de diseño que valga la pena contar, agregala ahí.
