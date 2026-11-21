# Dominio

Modelo de AI Ticket It. Parte del diagrama tentativo del enunciado y agrega lo que hace falta para que las reglas de los casos de uso vivan en el dominio y no en los controllers.

## Entidades

- **Usuario**: `id`, `nombre`, `apellido`, `email`, `favoritos: Evento[]`. No tiene rol. Cualquier usuario compra entradas, y es organizador de los eventos que creó.
- **Categoria**: `id`, `nombre`, `descripcion`.
- **Evento**: `id`, `nombre`, `descripcion`, `categoria`, `fecha`, `tiposEntrada: TipoEntrada[]` (con nombres distintos, sin distinguir mayúsculas ni espacios alrededor), `multimedia: string[]` (URLs `http` o `https`; el orden importa y la primera es la portada), `organizador: Usuario`, `limitePorUsuario` (entero positivo, 6 si el organizador no lo indica).
  - `yaOcurrio(ahora)`: la fecha del evento es anterior a `ahora`.
  - `diasHasta(ahora)`: días enteros que faltan, redondeando hacia arriba.
  - `precioDesde()`: el menor precio entre sus tipos de entrada.
  - `entradasDe(usuario)`: cuántas entradas retiene ese usuario en el evento, sumando todos sus tipos de entrada. Lo lleva el evento en un contador privado por usuario.
  - `reservar(comprador, tipoEntrada, cantidad)`: lanza `DomainRuleError` si el comprador pasaría `limitePorUsuario`. Si no, reserva el cupo en el tipo de entrada (que puede fallar antes de que cambie nada) y suma al contador. `liberar(comprador, tipoEntrada, cantidad)` hace lo inverso.
- **TipoEntrada**: `id`, `nombre`, `descripcion`, `precio`, `cupo`, `vendidas`. El `id` es `<idEvento>-<posición>`, lo asigna el repositorio de eventos al guardar.
  - `disponibles()`: `cupo - vendidas`.
  - `hayCupoPara(cantidad)`.
  - `reservar(cantidad)` y `liberar(cantidad)`: mueven `vendidas`. `reservar` falla si no hay cupo.
- **Compra**: `id`, `comprador`, `evento`, `tipoEntrada`, `cantidad`, `total`, `estado`, `historial: CambioEstadoCompra[]`, `mensajes: Mensaje[]`, `resena: Resena | null`. `creada` es la fecha del primer cambio de estado.
- **CambioEstadoCompra**: `estado`, `quien: Usuario`, `fechaHora`.
- **Mensaje**: `id`, `usuario`, `texto`, `enviado`.
- **Resena**: `id` (el de su compra, porque hay a lo sumo una por compra), `compra`, `comprador`, `evento`, `puntuacion` (entero de 1 a 5), `detalle` (comentario obligatorio, no vacío), `fecha`.

La reseña vive solo en `Compra.resena`; no hay un repositorio de reseñas. `reputacion(resenas)` en el dominio calcula el puntaje de un organizador: el promedio de las puntuaciones de las reseñas de todos sus eventos, o `null` sin reseñas. `EventoService.reputacionDe` junta las reseñas recorriendo las compras.

## Ciclo de vida de la compra

Una compra nace `PENDIENTE` y reserva cupo en el momento de crearse. Las transiciones están en una tabla única en `Compra`, no en condicionales sueltos. Cada transición agrega un `CambioEstadoCompra` al historial. La creación también registra el primer cambio a `PENDIENTE`.

| Acción          | Desde                     | Hacia         | Quién          | Condiciones extra                                                                                             |
| --------------- | ------------------------- | ------------- | -------------- | ------------------------------------------------------------------------------------------------------------- |
| `crear`         | (compra nueva)            | `PENDIENTE`   | el comprador   | el evento no ocurrió, hay cupo, el comprador no es el organizador y no pasa del límite por usuario del evento |
| `confirmarPago` | `PENDIENTE`               | `CONFIRMADA`  | el comprador   | pago simulado, no hay pasarela                                                                                |
| `utilizar`      | `CONFIRMADA`              | `UTILIZADA`   | el organizador | se usa en la puerta del evento                                                                                |
| `cancelar`      | `PENDIENTE`, `CONFIRMADA` | `CANCELADA`   | el comprador   | el evento no ocurrió todavía; libera el cupo                                                                  |
| `reembolsar`    | `CANCELADA`               | `REEMBOLSADA` | el organizador | la compra pasó por `CONFIRMADA` (hubo pago)                                                                   |

Una transición desde un estado no listado lanza `DomainRuleError`. El dominio también responde quién puede hacer qué: `accionesPara(usuario)` lista las acciones que ese usuario tiene disponibles y `motivoDeNoAutorizado(usuario, accion)` devuelve el motivo por el que no puede, o `null`. La capa de servicios solo traduce ese motivo a `NoAutorizado`.

Derivados que expone la compra:

- `diasParaElEvento(ahora)`: solo cuando está `CONFIRMADA` y el evento todavía no ocurrió; si no, es `null`. Nunca es negativo.
- `accionesPara(usuario, ahora)`: las acciones de la tabla que ese usuario puede ejecutar ahora: las transiciones cuyo "quién" es él, cuyo estado de origen es el actual y cuya condición extra se cumple, más `resenar` si es el comprador, la compra está `UTILIZADA` y no tiene reseña. La columna "Quién" de la tabla vive una sola vez, en la tabla, y la lee `motivoDeNoAutorizado`, que usan tanto `accionesPara` como la autorización del servicio.
- `resenar(puntuacion, detalle)`: crea la reseña una sola vez. El enunciado pide puntaje y comentario escrito, así que las dos cosas son obligatorias.
- `enviarMensaje(usuario, texto)`: solo el comprador o el organizador del evento.

## Búsqueda

`buscar({ texto, categoriaId, orden })` sobre eventos. `texto` compara contra nombre y descripción sin distinguir mayúsculas ni tildes. `orden` es `precio` (ascendente por `precioDesde`), `fecha` (ascendente) o `puntaje` (descendente por puntaje del organizador, los `null` al final). Por defecto, `fecha`.

## Decisiones que se apartan del diagrama

- No hay `rol` en `Usuario`. El enunciado habla de "comprador" y "organizador" como roles de un caso de uso, no como tipos de usuario.
- `TipoEntrada` lleva `vendidas` para que `disponibles` sea una operación local y la regla de cupo viva en una sola entidad.
- `Evento` lleva las entradas que retiene cada usuario para que el límite por persona tenga el mismo ciclo de vida que el cupo: `Compra` lo reserva al crearse y lo libera al cancelarse, y la regla vive en una sola entidad sin recorrer las compras.
- `Compra` guarda la reseña para garantizar una sola por compra, y es su única fuente de verdad. `Resena` sigue apuntando a comprador y evento como en el diagrama.
- Reembolso como acción del organizador sobre una compra cancelada, para que `REEMBOLSADA` tenga un camino y el organizador tenga algo que hacer en la demo.
- El máximo de entradas por persona es configurable por evento (`limitePorUsuario`, 6 por defecto) en lugar de una constante global, porque lo decide el organizador según el tipo de evento. Cancelar o reembolsar libera ese máximo igual que libera el cupo.
