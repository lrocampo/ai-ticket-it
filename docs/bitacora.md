# Bitácora

Registro del proceso de desarrollo con IA. Es la materia prima de la conclusión del video: qué le pedí a la IA, qué decidí yo, qué salió mal y qué aprendí.

## 2026-11-09

**Lectura del enunciado y decisiones de base.** Le pasé el PDF a Claude Code (Claude Fable 5.1) en la sesión del TP grupal, porque la cátedra es la misma y quería reusar la forma de trabajar. Decisiones que tomamos:

- Repo aparte, público, monorepo con `packages/backend` y `packages/mobile`, mismas convenciones que el grupal (ESM, Express 5, zod, Jest, prettier sin punto y coma, commits en español).
- Persistencia en memoria como pide el enunciado. Sin Mongo, sin Docker. El seed carga datos al arrancar.
- App mobile con Expo y TypeScript, Expo Router para navegación, axios para hablar con el backend.
- Sin login. Un selector de "quién soy" al abrir la app que manda `x-usuario-id`. Alcanza para cambiar de comprador a organizador durante la demo y no agrega complejidad que el enunciado no pide.
- El dominio se diseñó antes de escribir código, con la máquina de estados de la compra como tabla de transiciones. Está en `docs/dominio.md`. El contrato de la API está en `docs/api.md` y lo escribí antes de que existieran backend y app para que los dos se construyan contra lo mismo en paralelo.
- Node 24 (`.nvmrc`), porque el Expo SDK actual pide un Node 20 más nuevo que el que tenía instalado.

**Cómo trabaja la IA acá.** Yo converso con una sesión que diseña y revisa. Esa sesión delega la escritura de backend y de app a dos agentes en paralelo, cada uno en su worktree de git, y después mergea y verifica corriendo los tests, el backend y la app en el simulador. El diseño y las decisiones son míos y de la sesión principal; los agentes implementan contra el contrato.

**Primera iteración armada y probada.** Los dos agentes terminaron en unos 15 minutos cada uno, en paralelo. El backend llegó con 100 tests en verde y el flujo comprar→confirmar→usar→reseñar verificado por HTTP; la app con `tsc`, `expo export` y `expo-doctor` limpios. Después del merge, lo que las pruebas automáticas no vieron y el simulador sí:

- El catálogo mostraba primero los eventos que ya habían ocurrido, porque el contrato decía "todos los eventos" y el orden por defecto es fecha ascendente. Arreglo en el backend: el catálogo deja afuera lo que ya pasó. Lección: el contrato lo escribí yo y la IA lo cumplió al pie de la letra; el error era de diseño, no de implementación.
- Las fechas cortas de las reseñas salían como "6 undefined undefined". El agente había usado `Intl.DateTimeFormat.formatToParts`, probado en Node, pero Hermes (el motor de JavaScript de React Native) devuelve partes vacías para ese formato en español. Arreglo: formatear a mano con arreglos de días y meses. Lección: lo que la IA prueba en Node no es lo que corre en el teléfono; hay que verificar en el dispositivo.
- Con los dos workspaces instalados, npm dejaba dos copias de React. Un `overrides` en el `package.json` raíz lo resuelve.

Pendiente para la próxima iteración: acciones sobre la compra (confirmar pago, cancelar, usar, reembolsar), chat, reseña y crear evento desde la app. El backend ya expone todo eso; es trabajo solo de la app.

**Revisión de la primera iteración antes de avanzar.** En vez de seguir con funcionalidades, pasé la iteración por los gates de revisión que había salteado. Dos agentes revisores independientes, uno de bugs y seguridad (Fable) y otro de calidad de código (Opus), auditaron todo el rango sin editar nada; sus reportes completos están en `docs/revisiones/`. Después un tercer agente (comment-sicko) revisó los comentarios. Resultado:

- Bugs: cero altos, uno medio y diez bajos. El medio: el organizador podía comprar entradas de su propio evento, usarlas y reseñarse a sí mismo, subiendo su puntaje. El revisor lo reprodujo con cuatro curls. Ni el enunciado ni mi `docs/dominio.md` lo prohibían: fue un hueco de diseño, no de implementación. Ahora es una regla del dominio.
- Calidad: diez hallazgos estructurales, ninguno un bug. Los dos grandes del backend borraban conceptos enteros: las reseñas estaban guardadas en dos lugares (en la compra y en un repositorio propio que solo servía para el promedio), y el servicio de compras tenía una tabla de permisos que repetía la tabla de transiciones del dominio. En la app, el tema definía tamaños de texto sin color y cada pantalla volvía a escribir los mismos estilos; y la ramificación "datos, error o cargando" estaba copiada en seis pantallas y perdía el error cuando fallaba un refresco con datos viejos en pantalla.
- Comentarios: de 50 líneas borradas, ocho señalaban código que debería explicarse solo. Siete las apliqué (el orden por puntaje trata el `null` explícitamente, la tabla de transiciones nombra `motivoDeRechazo` y `alAplicar`, los tests de API recargan el seed en cada test). Una la rechacé: distinguir en el tipo por qué `diasParaElEvento` es `null`; eso lo dice el contrato.

Las remediaciones las hicieron de nuevo dos agentes en paralelo contra los reportes, y después verifiqué en el simulador. Lección para el video: la revisión multi-agente encontró cosas que ni los 101 tests ni mi lectura del diff vieron, y las encontró porque cada revisor tenía un solo objetivo y permiso para reproducir. Los tests pasaron de 101 a 117 en el backend y de 0 a 11 en la app.

**Segunda iteración: acciones, chat, reseña y crear evento.** Mismo proceso que la primera, ya como rutina: contrato primero, dos agentes en paralelo, revisiones, remediación, simulador. La decisión de diseño de esta vuelta: las acciones disponibles sobre una compra (confirmar pago, usar, cancelar, reembolsar, reseñar) las decide el backend por usuario y las devuelve en `acciones`; la app solo dibuja un botón por cada una. La columna "quién" de la tabla de transiciones pasó al dominio y la autorización del servicio se deriva de ahí. El agente del backend mejoró mi pedido: puso `resenar` como una fila más de la tabla en vez de un caso especial.

Lo que las revisiones encontraron esta vez: cero bugs altos, dos medios y tres bajos, y seis hallazgos de calidad. Los medios: `mode="datetime"` del picker de fecha no existe en Android (TypeScript no lo detecta porque las props son una unión de plataformas), y el parseo de precios tomaba "15.000" como 15. Este segundo lo reproduje yo en el simulador antes de la remediación, y el evento quedó creado con precio $15; después de la remediación, el mismo input muestra "El precio de General no es un número válido. Escribilo sin puntos de miles". De calidad, lo más valioso: el patrón "enviando + try/catch + Alert" estaba copiado cinco veces y pasó a un hook `useEnvio`, el par de `useCarga` para las escrituras; y la autorización del backend quedó en un solo método del dominio, `motivoDeNoAutorizado`, simétrico a `motivoDeRechazo`.

Dos lecciones del simulador que no son de la app: el autocorrector inglés del teclado del simulador convierte "Recital de prueba" en "Recital de prunes", y Fast Refresh no toma un merge grande; hay que recargar el bundle para probar lo nuevo. Tests: backend de 117 a 121, app de 11 a 46.
