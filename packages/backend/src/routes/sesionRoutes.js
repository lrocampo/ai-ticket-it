import { Router } from "express"
import validar from "../middlewares/validar.js"
import { sesionSchema } from "../validations/sesion.js"
import { identificar, sesionController } from "../dependencias.js"

const routes = Router()

routes.post("/sesiones", validar(sesionSchema), sesionController.crear)
routes.get("/sesion", identificar, sesionController.actual)

export default routes
