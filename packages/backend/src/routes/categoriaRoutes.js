import { Router } from "express"
import { categoriaController } from "../dependencias.js"

const routes = Router()

routes.get("/categorias", categoriaController.todas)

export default routes
