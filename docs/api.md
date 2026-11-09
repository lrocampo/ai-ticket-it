# API

Backend Express en `http://localhost:3000`. Todo es JSON. La persistencia es en memoria y se carga con el seed al arrancar, así que reiniciar el backend vuelve todo al estado inicial.

## Identificación

No hay login. El cliente manda el header `x-usuario-id` con el id del usuario que está usando la app. Si falta o no existe, el backend responde `401`. Las rutas `GET /usuarios` y `GET /categorias` no lo necesitan.

## Errores

```json
{ "message": "texto para mostrar", "details": [] }
```

| Código | Cuándo                                                                                                     |
| ------ | ---------------------------------------------------------------------------------------------------------- |
| 400    | body o query inválidos (zod); `details` lista los campos                                                   |
| 401    | falta `x-usuario-id` o no corresponde a un usuario                                                         |
| 403    | el usuario no es quien puede hacer la acción                                                               |
| 404    | entidad inexistente                                                                                        |
| 409    | regla de negocio (sin cupo, transición inválida, reseña duplicada, el organizador compra su propio evento) |
| 422    | validación de dominio (valores fuera de rango)                                                             |

## Formas

```ts
Usuario   = { id, nombre, apellido, email }
Categoria = { id, nombre, descripcion }
TipoEntrada = { id, nombre, descripcion, precio, cupo, disponibles }
Organizador = Usuario & { puntaje: number | null, cantidadResenas: number }
Evento = {
  id, nombre, descripcion, categoria: Categoria, fecha: ISO,
  multimedia: string[], organizador: Organizador,
  tiposEntrada: TipoEntrada[], precioDesde: number, yaOcurrio: boolean
}
EventoDetalle = Evento & { resenasDelOrganizador: Resena[] }
Resena = { id, puntuacion, detalle, fecha: ISO, comprador: Usuario, evento: { id, nombre } }
CambioEstado = { estado, quien: Usuario, fechaHora: ISO }
Mensaje = { id, usuario: Usuario, texto, enviado: ISO }
Compra = {
  id, estado, cantidad, total,
  comprador: Usuario,
  evento: { id, nombre, fecha: ISO, organizador: Usuario },
  tipoEntrada: { id, nombre, precio },
  diasParaElEvento: number | null,   // solo CONFIRMADA con evento futuro
  puedeCancelarse: boolean,
  puedeResenarse: boolean,
  historial: CambioEstado[],
  mensajes: Mensaje[],
  resena: Resena | null
}
```

`estado` es uno de `PENDIENTE`, `CONFIRMADA`, `UTILIZADA`, `CANCELADA`, `REEMBOLSADA`.

## Rutas

### Catálogo

| Método | Ruta                   | Quién       | Body / query                                        | Respuesta                                         |
| ------ | ---------------------- | ----------- | --------------------------------------------------- | ------------------------------------------------- |
| GET    | `/usuarios`            | nadie       |                                                     | `Usuario[]` (para elegir quién soy)               |
| GET    | `/categorias`          | nadie       |                                                     | `Categoria[]`                                     |
| GET    | `/eventos`             | cualquiera  | `?texto=&categoriaId=&orden=precio\|fecha\|puntaje` | `Evento[]`, solo los que todavía no ocurrieron    |
| GET    | `/eventos/:id`         | cualquiera  |                                                     | `EventoDetalle`                                   |
| POST   | `/eventos`             | cualquiera  | ver abajo                                           | `201 EventoDetalle`, el organizador es quien pide |
| GET    | `/eventos/:id/compras` | organizador |                                                     | `{ evento: Evento, compras: Compra[] }`           |
| GET    | `/mis-eventos`         | cualquiera  |                                                     | `Evento[]` donde soy organizador                  |

Body de `POST /eventos`:

```json
{
  "nombre": "...",
  "descripcion": "...",
  "categoriaId": "...",
  "fecha": "2026-12-20T21:00:00.000Z",
  "multimedia": ["https://..."],
  "tiposEntrada": [
    { "nombre": "General", "descripcion": "...", "precio": 15000, "cupo": 200 }
  ]
}
```

Reglas: fecha futura, al menos un tipo de entrada, precios no negativos, cupo entero positivo, nombres de tipo únicos dentro del evento (sin distinguir mayúsculas ni espacios alrededor). `multimedia` solo admite URLs `http` o `https`.

### Compras

| Método | Ruta                        | Quién                              | Body                                    | Respuesta       |
| ------ | --------------------------- | ---------------------------------- | --------------------------------------- | --------------- |
| GET    | `/compras`                  | comprador                          |                                         | `Compra[]` mías |
| POST   | `/compras`                  | comprador                          | `{ eventoId, tipoEntradaId, cantidad }` | `201 Compra`    |
| GET    | `/compras/:id`              | comprador u organizador del evento |                                         | `Compra`        |
| POST   | `/compras/:id/confirmacion` | comprador                          |                                         | `Compra`        |
| POST   | `/compras/:id/uso`          | organizador                        |                                         | `Compra`        |
| POST   | `/compras/:id/cancelacion`  | comprador                          |                                         | `Compra`        |
| POST   | `/compras/:id/reembolso`    | organizador                        |                                         | `Compra`        |
| POST   | `/compras/:id/mensajes`     | comprador u organizador            | `{ texto }`                             | `201 Compra`    |
| POST   | `/compras/:id/resena`       | comprador                          | `{ puntuacion, detalle }`               | `201 Compra`    |

Las acciones sobre una compra devuelven la compra completa actualizada, así la app reemplaza lo que tiene en pantalla sin un segundo request. Las rutas usan sustantivos (`/confirmacion`, no `/confirmar`).
