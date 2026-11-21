import express from "express"
import cors from "cors"
import sesionRoutes from "./routes/sesionRoutes.js"
import usuarioRoutes from "./routes/usuarioRoutes.js"
import categoriaRoutes from "./routes/categoriaRoutes.js"
import eventoRoutes from "./routes/eventoRoutes.js"
import compraRoutes from "./routes/compraRoutes.js"
import errorHandler from "./middlewares/errorHandler.js"

const app = express()

app.use(cors())
app.use(express.json())
app.use(sesionRoutes)
app.use(usuarioRoutes)
app.use(categoriaRoutes)
app.use(eventoRoutes)
app.use(compraRoutes)

app.use((_req, _res, next) => {
  const error = new Error("Ruta no encontrada")
  error.status = 404
  error.expose = true
  next(error)
})

app.use(errorHandler)

export default app
