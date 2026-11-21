# AI Ticket It: revisión del orden de compras y el límite por persona (rama `feature/orden-y-limite`)

Alcance: la rama que agrega el límite de entradas por persona en cada evento y el selector "Más recientes / Más antiguas" en Mis compras y Compras del evento. Pasó por tres revisiones independientes sobre `git diff main...HEAD`: bugs y seguridad, calidad de código y comentarios. Después de aplicar los cambios, verifiqué contra la API y en el simulador (iPhone 16e con Expo Go).

## Bugs y seguridad

No encontró nada que frene el merge. Revisó las formas de saltearse el límite (cancelar, reembolsar, el seed, el orden de los chequeos frente a la reserva de cupo), los casos de borde por uno, el comprador que también organiza, el stepper de `BloqueCompra` y el contrato de la API. Marcó cuatro cosas de severidad baja:

- **El dominio confiaba en un número que le pasaba el service.** El constructor de `Compra` recibía `entradasPrevias = 0`, y con ese valor por defecto cualquier caller nuevo se salteaba la regla sin error. Se resolvió con el cambio estructural de la revisión de calidad.
- **Después de un 409 por el límite, la pantalla mantiene los números viejos** hasta que vuelve a tomar foco. Quedó así porque el mensaje del backend es claro y con el cupo pasa lo mismo.
- **La app repetía la cuenta del dominio con un `Math.max`.** Se sacó el clamp cuando el dominio dejó de poder pasarse del límite.
- **Dos compras creadas en el mismo milisegundo salían en orden de servidor en las dos direcciones.** Se agregó el desempate por id.

## Calidad de código

No la aprobaba tal como estaba. Estos fueron los hallazgos y lo que se hizo con cada uno:

1. **La regla del límite estaba repartida en cinco lugares.** El service recorría todas las compras con `entradasRetenidas`, `Compra` pasaba ese número a `Evento.verificarLimite`, y `Compra.retieneEntradas` decidía qué estados contaban. Además `EventoService.entradasDe` repetía el recorrido para la pantalla de detalle. Lo cambié al mismo mecanismo del cupo: `Evento` lleva un contador privado por persona, `Evento.reservar` chequea el límite, reserva el cupo y anota, y la transición `cancelar` llama a `Evento.liberar`. Con eso se borraron `entradasRetenidas`, `retieneEntradas`, `entradasPrevias`, los recorridos de los dos services y sus tests. Ahora la regla vive entera en el dominio, y el seed también pasa por ella.
2. **`SelectorOrdenCompras` copiaba la fila "Ordenar por" de la búsqueda.** Ahora hay un solo `SelectorOrden` genérico que usan la búsqueda y las dos listas de compras.
3. **`BloqueCompra` preguntaba dos veces si había un tipo elegido.** Quedó en dos líneas, y la cantidad se vuelve a acotar si el tipo elegido se agota al refrescar.
4. **El formulario de alta tenía un placeholder que nunca se veía, un segundo parser de números y no avisaba al salir si solo se había cambiado el límite.** Se sacó el placeholder, el campo usa `aEntero` y la misma tabla de mensajes que precio y cupo, y `formularioTieneDatos` cuenta el límite cuando no es 6.
5. **La misma regla estaba testeada en cuatro o cinco capas.** Quedaron los tests de comportamiento: dominio, un test de service, integración, la pantalla de Mis compras, el tope de `BloqueCompra` y la validación del formulario.

Al revisar esa ronda corregí un mensaje: para un límite de 0, el formulario decía "No es un número válido", y 0 sí es un número. Ahora dice "Tiene que ser un número entero de 1 en adelante, por ejemplo 6."

## Comentarios

No encontró nada para sacar. La rama no agrega comentarios en el código, ni supresiones, ni código comentado.

## Verificación

- Pasan `npm test` (backend 142, mobile 83), `npm run lint`, `prettier --check` y `tsc --noEmit` en mobile.
- **API:**
  - Con límite 4, comprar 4 entradas y después 1 más devuelve 409 con el mensaje "Hasta 4 entradas por persona para este evento: ya tenés 4."
  - Al cancelar, `entradasDelUsuario` vuelve a 0 y se pueden comprar 4 de nuevo.
- **Simulador:**
  - En "Noche de rock", el stepper frena en 4 y se ve "Hasta 4 por persona".
  - Después de comprar 3 se ve "ya tenés 3".
  - En Mis compras, la compra nueva aparece primera y "Más antiguas" invierte el orden.
  - La búsqueda se ve igual que antes con el selector genérico.
- No revisé a ojo la pantalla Compras del evento del organizador. Usa el mismo componente y la misma función de orden, que tienen tests.
