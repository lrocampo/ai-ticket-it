import { Router } from "express"
import validar, { validarQuery } from "../middlewares/validar.js"
import { busquedaEventosSchema, eventoSchema } from "../validations/evento.js"
import { eventoController, identificar } from "../dependencias.js"

const routes = Router()

routes.get(
  "/eventos",
  identificar,
  validarQuery(busquedaEventosSchema),
  eventoController.buscar,
)
routes.get("/eventos/:id", identificar, eventoController.porId)
routes.post(
  "/eventos",
  identificar,
  validar(eventoSchema),
  eventoController.crear,
)
routes.get("/eventos/:id/compras", identificar, eventoController.compras)
routes.get("/mis-eventos", identificar, eventoController.misEventos)

export default routes
