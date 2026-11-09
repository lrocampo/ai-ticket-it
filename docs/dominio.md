# Dominio

Modelo de AI Ticket It. Parte del diagrama tentativo del enunciado y agrega lo que hace falta para que las reglas de los casos de uso vivan en el dominio y no en los controllers.

## Entidades

- **Usuario**: `id`, `nombre`, `apellido`, `email`, `favoritos: Evento[]`. No tiene rol. Cualquier usuario compra entradas, y es organizador de los eventos que creó.
- **Categoria**: `id`, `nombre`, `descripcion`.
- **Evento**: `id`, `nombre`, `descripcion`, `categoria`, `fecha`, `tiposEntrada: TipoEntrada[]`, `multimedia: string[]` (URLs), `organizador: Usuario`.
  - `yaOcurrio(ahora)`: la fecha del evento es anterior a `ahora`.
  - `diasHasta(ahora)`: días enteros que faltan, redondeando hacia arriba.
  - `precioDesde()`: el menor precio entre sus tipos de entrada.
- **TipoEntrada**: `id`, `nombre`, `descripcion`, `precio`, `cupo`, `vendidas`. El `id` es `<idEvento>-<posición>`, lo asigna el repositorio de eventos al guardar.
  - `disponibles()`: `cupo - vendidas`.
  - `hayCupoPara(cantidad)`.
  - `reservar(cantidad)` y `liberar(cantidad)`: mueven `vendidas`. `reservar` falla si no hay cupo.
- **Compra**: `id`, `comprador`, `evento`, `tipoEntrada`, `cantidad`, `total`, `estado`, `historial: CambioEstadoCompra[]`, `mensajes: Mensaje[]`, `resena: Resena | null`.
- **CambioEstadoCompra**: `estado`, `quien: Usuario`, `fechaHora`.
- **Mensaje**: `id`, `usuario`, `texto`, `enviado`.
- **Resena**: `id` (el de su compra, porque hay a lo sumo una por compra), `compra`, `comprador`, `evento`, `puntuacion` (entero de 1 a 5), `detalle`, `fecha`.

La reseña vive solo en `Compra.resena`; no hay un repositorio de reseñas. `reputacion(resenas)` en el dominio calcula el puntaje de un organizador: el promedio de las puntuaciones de las reseñas de todos sus eventos, o `null` sin reseñas. `EventoService.reputacionDe` junta las reseñas recorriendo las compras.

## Ciclo de vida de la compra

Una compra nace `PENDIENTE` y reserva cupo en el momento de crearse. Las transiciones están en una tabla única en `Compra`, no en condicionales sueltos. Cada transición agrega un `CambioEstadoCompra` al historial. La creación también registra el primer cambio a `PENDIENTE`.

| Acción          | Desde                     | Hacia         | Quién          | Condiciones extra                                                             |
| --------------- | ------------------------- | ------------- | -------------- | ----------------------------------------------------------------------------- |
| `crear`         | (compra nueva)            | `PENDIENTE`   | el comprador   | el evento no ocurrió, hay cupo y el comprador no es el organizador del evento |
| `confirmarPago` | `PENDIENTE`               | `CONFIRMADA`  | el comprador   | pago simulado, no hay pasarela                                                |
| `utilizar`      | `CONFIRMADA`              | `UTILIZADA`   | el organizador | se usa en la puerta del evento                                                |
| `cancelar`      | `PENDIENTE`, `CONFIRMADA` | `CANCELADA`   | el comprador   | el evento no ocurrió todavía; libera el cupo                                  |
| `reembolsar`    | `CANCELADA`               | `REEMBOLSADA` | el organizador | la compra pasó por `CONFIRMADA` (hubo pago)                                   |

Una transición desde un estado no listado lanza `DomainRuleError`. Una acción hecha por quien no corresponde lanza `NoAutorizado` en la capa de servicios, porque el dominio no sabe quién está pidiendo.

Derivados que expone la compra:

- `diasParaElEvento(ahora)`: solo cuando está `CONFIRMADA` y el evento todavía no ocurrió; si no, es `null`. Nunca es negativo.
- `puedeCancelarse(ahora)`: estado `PENDIENTE` o `CONFIRMADA` y el evento no ocurrió.
- `puedeResenarse()`: estado `UTILIZADA` y todavía no tiene reseña.
- `resenar(puntuacion, detalle)`: crea la reseña una sola vez.
- `enviarMensaje(usuario, texto)`: solo el comprador o el organizador del evento.

## Búsqueda

`buscar({ texto, categoriaId, orden })` sobre eventos. `texto` compara contra nombre y descripción sin distinguir mayúsculas ni tildes. `orden` es `precio` (ascendente por `precioDesde`), `fecha` (ascendente) o `puntaje` (descendente por puntaje del organizador, los `null` al final). Por defecto, `fecha`.

## Decisiones que se apartan del diagrama

- No hay `rol` en `Usuario`. El enunciado habla de "comprador" y "organizador" como roles de un caso de uso, no como tipos de usuario.
- `TipoEntrada` lleva `vendidas` para que `disponibles` sea una operación local y la regla de cupo viva en una sola entidad.
- `Compra` guarda la reseña para garantizar una sola por compra, y es su única fuente de verdad. `Resena` sigue apuntando a comprador y evento como en el diagrama.
- Reembolso como acción del organizador sobre una compra cancelada, para que `REEMBOLSADA` tenga un camino y el organizador tenga algo que hacer en la demo.
