import { Router } from "express"
import { usuarioController } from "../dependencias.js"

const routes = Router()

routes.get("/usuarios", usuarioController.todos)

export default routes
