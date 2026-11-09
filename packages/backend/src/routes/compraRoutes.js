import { Router } from "express"
import validar from "../middlewares/validar.js"
import {
  compraSchema,
  mensajeSchema,
  resenaSchema,
} from "../validations/compra.js"
import { compraController, identificar } from "../dependencias.js"

const routes = Router()

routes.get("/compras", identificar, compraController.mias)
routes.post(
  "/compras",
  identificar,
  validar(compraSchema),
  compraController.crear,
)
routes.get("/compras/:id", identificar, compraController.porId)
routes.post(
  "/compras/:id/confirmacion",
  identificar,
  compraController.confirmarPago,
)
routes.post("/compras/:id/uso", identificar, compraController.utilizar)
routes.post("/compras/:id/cancelacion", identificar, compraController.cancelar)
routes.post("/compras/:id/reembolso", identificar, compraController.reembolsar)
routes.post(
  "/compras/:id/mensajes",
  identificar,
  validar(mensajeSchema),
  compraController.enviarMensaje,
)
routes.post(
  "/compras/:id/resena",
  identificar,
  validar(resenaSchema),
  compraController.resenar,
)

export default routes
