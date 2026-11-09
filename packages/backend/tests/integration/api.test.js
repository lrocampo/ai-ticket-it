import { describe, expect, test } from "@jest/globals"
import request from "supertest"
import app from "../../src/app.js"
import { repositorios } from "../../src/dependencias.js"
import cargarSeed from "../../src/seeds/cargarSeed.js"

// Los tests comparten el estado del seed y lo van modificando.
const seed = cargarSeed(repositorios)
const { lucia, nicolas, valentina, tomas } = seed.usuarios

const usuarioForma = {
  id: expect.any(String),
  nombre: expect.any(String),
  apellido: expect.any(String),
  email: expect.any(String),
}

const como = (usuario) => ({ "x-usuario-id": usuario.id })

describe("identificación", () => {
  test("GET /usuarios y /categorias no la necesitan", async () => {
    const usuarios = await request(app).get("/usuarios").expect(200)
    expect(usuarios.body[0]).toEqual({
      id: lucia.id,
      nombre: lucia.nombre,
      apellido: lucia.apellido,
      email: lucia.email,
    })
    // La app guarda el id del usuario elegido y cuenta con estos seis.
    expect(usuarios.body.map((u) => u.id)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
    ])

    const categorias = await request(app).get("/categorias").expect(200)
    expect(categorias.body.map((c) => c.nombre)).toContain("Recitales")
  })

  test("sin x-usuario-id responde 401", async () => {
    const respuesta = await request(app).get("/eventos").expect(401)
    expect(respuesta.body).toEqual({
      message: expect.any(String),
      details: [],
    })
  })

  test("con un x-usuario-id inexistente responde 401", async () => {
    await request(app)
      .get("/eventos")
      .set({ "x-usuario-id": "999" })
      .expect(401)
  })
})

describe("catálogo", () => {
  test("GET /eventos devuelve la forma Evento ordenada por fecha", async () => {
    const { body } = await request(app)
      .get("/eventos")
      .set(como(nicolas))
      .expect(200)

    expect(body.length).toBeGreaterThan(0)
    expect(body[0]).toEqual({
      id: expect.any(String),
      nombre: expect.any(String),
      descripcion: expect.any(String),
      categoria: {
        id: expect.any(String),
        nombre: expect.any(String),
        descripcion: expect.any(String),
      },
      fecha: expect.any(String),
      multimedia: expect.arrayContaining([expect.stringMatching(/^https:/)]),
      organizador: {
        ...usuarioForma,
        puntaje: expect.any(Number),
        cantidadResenas: expect.any(Number),
      },
      tiposEntrada: expect.arrayContaining([
        {
          id: expect.any(String),
          nombre: expect.any(String),
          descripcion: expect.any(String),
          precio: expect.any(Number),
          cupo: expect.any(Number),
          disponibles: expect.any(Number),
        },
      ]),
      precioDesde: expect.any(Number),
      yaOcurrio: expect.any(Boolean),
    })
    const fechas = body.map((evento) => evento.fecha)
    expect(fechas).toEqual([...fechas].sort())
  })

  test("GET /eventos?orden=puntaje deja los mejores organizadores primero y los sin reseñas al final", async () => {
    const { body } = await request(app)
      .get("/eventos?orden=puntaje")
      .set(como(nicolas))
      .expect(200)

    const puntajes = body.map((evento) => evento.organizador.puntaje)
    const conPuntaje = puntajes.filter((puntaje) => puntaje !== null)
    const sinPuntaje = puntajes.filter((puntaje) => puntaje === null)
    expect(conPuntaje.length).toBeGreaterThan(0)
    expect(sinPuntaje.length).toBeGreaterThan(0)
    expect(puntajes).toEqual([
      ...[...conPuntaje].sort((a, b) => b - a),
      ...sinPuntaje,
    ])
    expect(body.at(-1).organizador.puntaje).toBeNull()
    expect(
      body
        .filter((evento) => evento.organizador.puntaje === null)
        .map((evento) => evento.id),
    ).toContain(seed.eventos.ajedrez.id)
  })

  test("GET /eventos busca sin distinguir tildes", async () => {
    for (const texto of ["marat%C3%B3n", "maraton", "MARATON"]) {
      const { body } = await request(app)
        .get(`/eventos?texto=${texto}`)
        .set(como(nicolas))
        .expect(200)
      expect(body.map((evento) => evento.id)).toEqual([seed.eventos.maraton.id])
    }
  })

  test("GET /eventos con una categoría inexistente devuelve []", async () => {
    const { body } = await request(app)
      .get("/eventos?categoriaId=999")
      .set(como(nicolas))
      .expect(200)
    expect(body).toEqual([])
  })

  test("GET /eventos?orden=otro responde 400 con details", async () => {
    const { body } = await request(app)
      .get("/eventos?orden=otro")
      .set(como(nicolas))
      .expect(400)

    expect(body.message).toEqual(expect.any(String))
    expect(body.details[0].path).toEqual(["orden"])
  })

  test("GET /eventos/:id trae las reseñas del organizador", async () => {
    const { body } = await request(app)
      .get(`/eventos/${seed.eventos.rock.id}`)
      .set(como(nicolas))
      .expect(200)

    expect(body.resenasDelOrganizador.length).toBe(
      body.organizador.cantidadResenas,
    )
    expect(body.resenasDelOrganizador[0]).toEqual({
      id: expect.any(String),
      puntuacion: expect.any(Number),
      detalle: expect.any(String),
      fecha: expect.any(String),
      comprador: usuarioForma,
      evento: { id: expect.any(String), nombre: expect.any(String) },
    })
  })

  test("GET /eventos/:id inexistente responde 404", async () => {
    await request(app).get("/eventos/999").set(como(nicolas)).expect(404)
  })

  test("POST /eventos crea el evento con quien pide como organizador", async () => {
    const { body } = await request(app)
      .post("/eventos")
      .set(como(valentina))
      .send({
        nombre: "Charla de prueba",
        descripcion: "Creada desde el test",
        categoriaId: seed.categorias.Conferencias.id,
        fecha: "2030-01-01T21:00:00.000Z",
        multimedia: [],
        tiposEntrada: [
          { nombre: "General", descripcion: "", precio: 0, cupo: 50 },
        ],
      })
      .expect(201)

    expect(body.organizador).toMatchObject({ id: valentina.id, puntaje: null })
    expect(body.tiposEntrada[0]).toMatchObject({ cupo: 50, disponibles: 50 })
    expect(body.resenasDelOrganizador).toEqual([])

    // Valentina no organiza nada en el seed.
    const mios = await request(app)
      .get("/mis-eventos")
      .set(como(valentina))
      .expect(200)
    expect(mios.body.map((evento) => evento.id)).toEqual([body.id])
  })

  test("POST /eventos con body inválido responde 400 con details", async () => {
    const { body } = await request(app)
      .post("/eventos")
      .set(como(valentina))
      .send({ nombre: "Sin nada" })
      .expect(400)

    expect(body.details.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(["categoriaId", "fecha", "tiposEntrada"]),
    )
  })

  test("POST /eventos con tipos de entrada del mismo nombre responde 422", async () => {
    await request(app)
      .post("/eventos")
      .set(como(valentina))
      .send({
        nombre: "Repetido",
        categoriaId: seed.categorias.Conferencias.id,
        fecha: "2030-01-01T21:00:00.000Z",
        tiposEntrada: [
          { nombre: "General", precio: 10, cupo: 5 },
          { nombre: "general", precio: 20, cupo: 5 },
        ],
      })
      .expect(422)
  })

  test("POST /eventos con una URL que no es http(s) responde 400", async () => {
    const { body } = await request(app)
      .post("/eventos")
      .set(como(valentina))
      .send({
        nombre: "Con javascript",
        categoriaId: seed.categorias.Conferencias.id,
        fecha: "2030-01-01T21:00:00.000Z",
        multimedia: ["https://ejemplo.com/foto.jpg", "javascript:alert(1)"],
        tiposEntrada: [{ nombre: "General", precio: 10, cupo: 5 }],
      })
      .expect(400)

    expect(body.details.map((issue) => issue.path)).toEqual([["multimedia", 1]])
  })

  test("POST /eventos con fecha pasada responde 422", async () => {
    await request(app)
      .post("/eventos")
      .set(como(valentina))
      .send({
        nombre: "Viejo",
        categoriaId: seed.categorias.Conferencias.id,
        fecha: "2020-01-01T21:00:00.000Z",
        tiposEntrada: [{ nombre: "General", precio: 10, cupo: 5 }],
      })
      .expect(422)
  })
})

describe("compras", () => {
  const comprador = tomas
  const organizador = lucia
  const evento = seed.eventos.jazz
  const general = evento.tiposEntrada[0]

  const crearCompra = async (cantidad = 1) => {
    const { body } = await request(app)
      .post("/compras")
      .set(como(comprador))
      .send({ eventoId: evento.id, tipoEntradaId: general.id, cantidad })
      .expect(201)
    return body
  }

  test("flujo completo: comprar, confirmar, usar y reseñar", async () => {
    const compra = await crearCompra(2)
    expect(compra).toEqual({
      id: expect.any(String),
      estado: "PENDIENTE",
      cantidad: 2,
      total: 2 * general.precio,
      comprador: { ...usuarioForma, id: comprador.id },
      evento: {
        id: evento.id,
        nombre: evento.nombre,
        fecha: evento.fecha.toISOString(),
        organizador: { ...usuarioForma, id: organizador.id },
      },
      tipoEntrada: {
        id: general.id,
        nombre: general.nombre,
        precio: general.precio,
      },
      diasParaElEvento: null,
      puedeCancelarse: true,
      puedeResenarse: false,
      historial: [
        {
          estado: "PENDIENTE",
          quien: { ...usuarioForma, id: comprador.id },
          fechaHora: expect.any(String),
        },
      ],
      mensajes: [],
      resena: null,
    })

    const confirmada = await request(app)
      .post(`/compras/${compra.id}/confirmacion`)
      .set(como(comprador))
      .expect(200)
    expect(confirmada.body).toMatchObject({
      estado: "CONFIRMADA",
      diasParaElEvento: expect.any(Number),
      puedeCancelarse: true,
    })

    await request(app)
      .post(`/compras/${compra.id}/uso`)
      .set(como(comprador))
      .expect(403)

    const utilizada = await request(app)
      .post(`/compras/${compra.id}/uso`)
      .set(como(organizador))
      .expect(200)
    expect(utilizada.body).toMatchObject({
      estado: "UTILIZADA",
      diasParaElEvento: null,
      puedeCancelarse: false,
      puedeResenarse: true,
    })

    const resenada = await request(app)
      .post(`/compras/${compra.id}/resena`)
      .set(como(comprador))
      .send({ puntuacion: 5, detalle: "Impecable" })
      .expect(201)
    expect(resenada.body.resena).toMatchObject({
      puntuacion: 5,
      detalle: "Impecable",
      comprador: { id: comprador.id },
      evento: { id: evento.id },
    })
    expect(resenada.body.puedeResenarse).toBe(false)
    expect(resenada.body.historial.map((c) => c.estado)).toEqual([
      "PENDIENTE",
      "CONFIRMADA",
      "UTILIZADA",
    ])

    await request(app)
      .post(`/compras/${compra.id}/resena`)
      .set(como(comprador))
      .send({ puntuacion: 1, detalle: "Otra" })
      .expect(409)

    const detalle = await request(app)
      .get(`/eventos/${evento.id}`)
      .set(como(comprador))
      .expect(200)
    expect(
      detalle.body.resenasDelOrganizador.map((resena) => resena.detalle),
    ).toContain("Impecable")
  })

  test("cancelar libera el cupo y reembolsar cierra la compra", async () => {
    const antes = await request(app)
      .get(`/eventos/${evento.id}`)
      .set(como(comprador))
    const disponibles = antes.body.tiposEntrada[0].disponibles

    const compra = await crearCompra(3)
    await request(app)
      .post(`/compras/${compra.id}/confirmacion`)
      .set(como(comprador))
      .expect(200)

    const durante = await request(app)
      .get(`/eventos/${evento.id}`)
      .set(como(comprador))
    expect(durante.body.tiposEntrada[0].disponibles).toBe(disponibles - 3)

    await request(app)
      .post(`/compras/${compra.id}/reembolso`)
      .set(como(organizador))
      .expect(409)

    const cancelada = await request(app)
      .post(`/compras/${compra.id}/cancelacion`)
      .set(como(comprador))
      .expect(200)
    expect(cancelada.body).toMatchObject({
      estado: "CANCELADA",
      puedeCancelarse: false,
    })

    const despues = await request(app)
      .get(`/eventos/${evento.id}`)
      .set(como(comprador))
    expect(despues.body.tiposEntrada[0].disponibles).toBe(disponibles)

    const reembolsada = await request(app)
      .post(`/compras/${compra.id}/reembolso`)
      .set(como(organizador))
      .expect(200)
    expect(reembolsada.body.estado).toBe("REEMBOLSADA")
    expect(reembolsada.body.historial.map((c) => c.estado)).toEqual([
      "PENDIENTE",
      "CONFIRMADA",
      "CANCELADA",
      "REEMBOLSADA",
    ])
  })

  test("el organizador no puede comprar su propio evento: 409", async () => {
    await request(app)
      .post("/compras")
      .set(como(organizador))
      .send({ eventoId: evento.id, tipoEntradaId: general.id, cantidad: 1 })
      .expect(409)
  })

  test("sin cupo responde 409 y no crea la compra", async () => {
    const mias = await request(app).get("/compras").set(como(comprador))

    await request(app)
      .post("/compras")
      .set(como(comprador))
      .send({
        eventoId: evento.id,
        tipoEntradaId: evento.tiposEntrada[1].id,
        cantidad: 999,
      })
      .expect(409)

    const despues = await request(app).get("/compras").set(como(comprador))
    expect(despues.body).toHaveLength(mias.body.length)
  })

  test("mensajes ida y vuelta entre comprador y organizador", async () => {
    const compra = await crearCompra()

    await request(app)
      .post(`/compras/${compra.id}/mensajes`)
      .set(como(comprador))
      .send({ texto: "¿Hay estacionamiento?" })
      .expect(201)
    const { body } = await request(app)
      .post(`/compras/${compra.id}/mensajes`)
      .set(como(organizador))
      .send({ texto: "Sí, a la vuelta." })
      .expect(201)

    expect(body.mensajes).toEqual([
      {
        id: expect.any(String),
        usuario: { ...usuarioForma, id: comprador.id },
        texto: "¿Hay estacionamiento?",
        enviado: expect.any(String),
      },
      {
        id: expect.any(String),
        usuario: { ...usuarioForma, id: organizador.id },
        texto: "Sí, a la vuelta.",
        enviado: expect.any(String),
      },
    ])

    await request(app)
      .post(`/compras/${compra.id}/mensajes`)
      .set(como(valentina))
      .send({ texto: "Hola" })
      .expect(403)
    await request(app)
      .post(`/compras/${compra.id}/mensajes`)
      .set(como(comprador))
      .send({})
      .expect(400)
  })

  test("GET /compras/:id la ven comprador y organizador, otro recibe 403", async () => {
    const compra = await crearCompra()

    await request(app)
      .get(`/compras/${compra.id}`)
      .set(como(comprador))
      .expect(200)
    await request(app)
      .get(`/compras/${compra.id}`)
      .set(como(organizador))
      .expect(200)
    await request(app)
      .get(`/compras/${compra.id}`)
      .set(como(valentina))
      .expect(403)
    await request(app).get("/compras/999").set(como(comprador)).expect(404)
  })

  test("GET /eventos/:id/compras solo para el organizador", async () => {
    const compra = await crearCompra()

    const { body } = await request(app)
      .get(`/eventos/${evento.id}/compras`)
      .set(como(organizador))
      .expect(200)
    expect(body.evento.id).toBe(evento.id)
    expect(body.compras.map((c) => c.id)).toContain(compra.id)

    await request(app)
      .get(`/eventos/${evento.id}/compras`)
      .set(como(comprador))
      .expect(403)
  })

  test("POST /compras con body inválido responde 400 con details", async () => {
    const { body } = await request(app)
      .post("/compras")
      .set(como(comprador))
      .send({ eventoId: evento.id })
      .expect(400)

    expect(body.details.map((issue) => issue.path[0])).toEqual(
      expect.arrayContaining(["tipoEntradaId", "cantidad"]),
    )
  })

  test.each([1.5, 0])("una cantidad %p responde 422", async (cantidad) => {
    await request(app)
      .post("/compras")
      .set(como(comprador))
      .send({ eventoId: evento.id, tipoEntradaId: general.id, cantidad })
      .expect(422)
  })

  test("una cantidad que no es número responde 400", async () => {
    const { body } = await request(app)
      .post("/compras")
      .set(como(comprador))
      .send({ eventoId: evento.id, tipoEntradaId: general.id, cantidad: "2" })
      .expect(400)
    expect(body.details.map((issue) => issue.path)).toEqual([["cantidad"]])
  })

  test("comprar para un evento que ya ocurrió responde 409", async () => {
    const pasado = seed.eventos.indie
    await request(app)
      .post("/compras")
      .set(como(comprador))
      .send({
        eventoId: pasado.id,
        tipoEntradaId: pasado.tiposEntrada[0].id,
        cantidad: 1,
      })
      .expect(409)
  })
})

test("una ruta desconocida responde 404", async () => {
  const { body } = await request(app).get("/no-existe").expect(404)
  expect(body).toEqual({ message: "Ruta no encontrada", details: [] })
})
