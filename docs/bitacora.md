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
