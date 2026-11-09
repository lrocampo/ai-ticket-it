# AI Ticket It

Plataforma de venta de entradas para eventos. Trabajo Práctico Individual de Desarrollo con Inteligencia Artificial, Desarrollo de Software, UTN FRBA, 2C 2026.

Dos módulos:

- `packages/backend`: API REST en Node + Express con persistencia en memoria.
- `packages/mobile`: app React Native con Expo.

## Cómo correrlo

Requiere Node 24 (`nvm use` lee el `.nvmrc`).

```bash
npm install
npm run dev:backend
```

El backend queda en `http://localhost:3000` con datos de ejemplo cargados. En otra terminal:

```bash
npm run start:mobile
```

Expo muestra un QR para abrir la app con Expo Go en el teléfono (hay que tener Expo Go instalado), o `i` para abrirla en el simulador de iOS. El backend tiene que estar corriendo antes de abrir la app, porque la primera pantalla lista los usuarios de ejemplo. Desde el teléfono, la app encuentra el backend usando la misma IP que Expo usa para servir el bundle, así que la Mac y el teléfono tienen que estar en la misma red. Si el backend corre en otro lado (otro puerto, o Expo en modo túnel), se le indica con `EXPO_PUBLIC_API_URL=http://host:puerto` al correr `npm run start:mobile`.

## Tests

```bash
npm test
```

## Documentación

- [Dominio](docs/dominio.md): entidades y ciclo de vida de la compra.
- [API](docs/api.md): rutas, formas y errores.
- [Bitácora](docs/bitacora.md): el proceso de desarrollo con IA, día a día.
