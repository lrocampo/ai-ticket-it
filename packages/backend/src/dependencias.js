import crearTokens, { SECRETO_DE_DESARROLLO } from "./auth/tokens.js"
import CategoriaController from "./controllers/CategoriaController.js"
import CompraController from "./controllers/CompraController.js"
import EventoController from "./controllers/EventoController.js"
import SesionController from "./controllers/SesionController.js"
import UsuarioController from "./controllers/UsuarioController.js"
import crearIdentificar from "./middlewares/identificar.js"
import crearRepositorios from "./repositories/crearRepositorios.js"
import CategoriaService from "./services/CategoriaService.js"
import CompraService from "./services/CompraService.js"
import EventoService from "./services/EventoService.js"
import UsuarioService from "./services/UsuarioService.js"

export const repositorios = crearRepositorios()
const { usuarios, categorias, eventos, compras } = repositorios

const usuarioService = new UsuarioService(usuarios)
const categoriaService = new CategoriaService(categorias)
const eventoService = new EventoService(eventos, categorias, compras)
const compraService = new CompraService(compras, eventos)

export const tokens = crearTokens({
  secreto: process.env.JWT_SECRET ?? SECRETO_DE_DESARROLLO,
})
export const identificar = crearIdentificar(usuarios, tokens)

export const usuarioController = new UsuarioController(usuarioService)
export const sesionController = new SesionController(usuarioService, tokens)
export const categoriaController = new CategoriaController(categoriaService)
export const eventoController = new EventoController(eventoService)
export const compraController = new CompraController(compraService)
