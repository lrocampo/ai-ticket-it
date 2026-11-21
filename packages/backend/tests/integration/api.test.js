import { beforeEach, describe, expect, test } from "@jest/globals"
import request from "supertest"
import app from "../../src/app.js"
import { repositorios } from "../../src/dependencias.js"
import cargarSeed from "../../src/seeds/cargarSeed.js"

const seed = cargarSeed(repositorios)
const { lucia, nicolas, valentina, tomas } = seed.usuarios

beforeEach(() => {
  Object.values(repositorios).forEach((repositorio) => repositorio.limpiar())
  cargarSeed(repositorios)
})

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

    const categorias = await request(app).get("/categorias").expect(200)
    expect(categorias.body.map((c) => c.nombre)).toContain("Recitales")
  })

  test("los usuarios del seed tienen los ids 1 a 6 que la app guarda", async () => {
    const { body } = await request(app).get("/usuarios").expect(200)
    expect(body.map((u) => u.id)).toEqual(["1", "2", "3", "4", "5", "6"])
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
  test("GET /eventos devuelve tres imágenes distintas por evento del seed", async () => {
    const { body } = await request(app)
      .get("/eventos")
      .set(como(nicolas))
      .expect(200)

    for (const evento of body) {
      expect(new Set(evento.multimedia).size).toBe(3)
    }
  })

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
      limitePorUsuario: expect.any(Number),
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
    expect(body.details).toEqual([
      {
        path: ["orden"],
        message: "El orden tiene que ser precio, fecha o puntaje",
      },
    ])
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

  test("GET /eventos/:id trae el límite y cuántas entradas tiene quien pide", async () => {
    const pedir = async (usuario) => {
      const { body } = await request(app)
        .get(`/eventos/${seed.eventos.rock.id}`)
        .set(como(usuario))
        .expect(200)
      return body
    }

    expect(await pedir(nicolas)).toMatchObject({
      limitePorUsuario: 4,
      entradasDelUsuario: 2,
    })
    expect(await pedir(tomas)).toMatchObject({
      limitePorUsuario: 4,
      entradasDelUsuario: 0,
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

    const mios = await request(app)
      .get("/mis-eventos")
      .set(como(valentina))
      .expect(200)
    expect(mios.body.map((evento) => evento.id)).toEqual([body.id])
  })

  test("POST /eventos guarda el máximo por persona, y sin él usa 6", async () => {
    const crear = (extra) =>
      request(app)
        .post("/eventos")
        .set(como(valentina))
        .send({
          nombre: "Con límite",
          categoriaId: seed.categorias.Conferencias.id,
          fecha: "2030-01-01T21:00:00.000Z",
          tiposEntrada: [{ nombre: "General", precio: 10, cupo: 50 }],
          ...extra,
        })

    const propio = await crear({ limitePorUsuario: 2 }).expect(201)
    expect(propio.body).toMatchObject({
      limitePorUsuario: 2,
      entradasDelUsuario: 0,
    })
    const porDefecto = await crear({}).expect(201)
    expect(porDefecto.body.limitePorUsuario).toBe(6)

    await crear({ limitePorUsuario: 0 }).expect(422)
    await crear({ limitePorUsuario: 1.5 }).expect(422)
    await crear({ limitePorUsuario: "dos" }).expect(400)
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
    expect(body.details).toContainEqual({
      path: ["tiposEntrada"],
      message: "Hace falta al menos un tipo de entrada",
    })
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

  const accionesDe = async (id, usuario) => {
    const { body } = await request(app)
      .get(`/compras/${id}`)
      .set(como(usuario))
      .expect(200)
    return body.acciones
  }

  test("flujo completo: comprar, confirmar, usar y reseñar", async () => {
    const compra = await crearCompra(2)
    expect(compra).toEqual({
      id: expect.any(String),
      creada: expect.any(String),
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
      acciones: ["confirmarPago", "cancelar"],
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
      acciones: ["cancelar"],
    })
    expect(await accionesDe(compra.id, organizador)).toEqual(["utilizar"])

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
      acciones: [],
    })
    expect(await accionesDe(compra.id, comprador)).toEqual(["resenar"])

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
    expect(resenada.body.acciones).toEqual([])
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
      acciones: [],
    })
    expect(await accionesDe(compra.id, organizador)).toEqual(["reembolsar"])

    const despues = await request(app)
      .get(`/eventos/${evento.id}`)
      .set(como(comprador))
    expect(despues.body.tiposEntrada[0].disponibles).toBe(disponibles)

    const reembolsada = await request(app)
      .post(`/compras/${compra.id}/reembolso`)
      .set(como(organizador))
      .expect(200)
    expect(reembolsada.body).toMatchObject({
      estado: "REEMBOLSADA",
      acciones: [],
    })
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
    const chico = await request(app)
      .post("/eventos")
      .set(como(organizador))
      .send({
        nombre: "Cupo chico",
        categoriaId: seed.categorias.Conferencias.id,
        fecha: "2030-01-01T21:00:00.000Z",
        tiposEntrada: [{ nombre: "General", precio: 10, cupo: 3 }],
      })
      .expect(201)

    const { body } = await request(app)
      .post("/compras")
      .set(como(comprador))
      .send({
        eventoId: chico.body.id,
        tipoEntradaId: chico.body.tiposEntrada[0].id,
        cantidad: 4,
      })
      .expect(409)

    expect(body.message).toContain("No hay cupo")
    const mias = await request(app).get("/compras").set(como(comprador))
    expect(mias.body.map((c) => c.evento.id)).not.toContain(chico.body.id)
  })

  test("superar el límite por persona responde 409 y no crea la compra", async () => {
    const mias = await request(app).get("/compras").set(como(comprador))

    const { body } = await request(app)
      .post("/compras")
      .set(como(comprador))
      .send({ eventoId: evento.id, tipoEntradaId: general.id, cantidad: 7 })
      .expect(409)

    expect(body.message).toContain("Hasta 6 entradas por persona")
    const despues = await request(app).get("/compras").set(como(comprador))
    expect(despues.body).toHaveLength(mias.body.length)
  })

  test("el límite cuenta lo ya comprado y se libera al cancelar", async () => {
    const entradasDelUsuario = async () => {
      const { body } = await request(app)
        .get(`/eventos/${evento.id}`)
        .set(como(comprador))
        .expect(200)
      return body.entradasDelUsuario
    }
    const compra = await crearCompra(4)
    expect(await entradasDelUsuario()).toBe(4)

    const { body } = await request(app)
      .post("/compras")
      .set(como(comprador))
      .send({ eventoId: evento.id, tipoEntradaId: general.id, cantidad: 3 })
      .expect(409)
    expect(body.message).toContain("ya tenés 4")

    await request(app)
      .post(`/compras/${compra.id}/cancelacion`)
      .set(como(comprador))
      .expect(200)
    expect(await entradasDelUsuario()).toBe(0)
    await crearCompra(6)
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

  test("GET /compras/:id la ven comprador y organizador con sus acciones, otro recibe 403", async () => {
    const compra = await crearCompra()

    expect(await accionesDe(compra.id, comprador)).toEqual([
      "confirmarPago",
      "cancelar",
    ])
    expect(await accionesDe(compra.id, organizador)).toEqual([])
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
    expect(body.compras.find((c) => c.id === compra.id).acciones).toEqual([])

    const mias = await request(app)
      .get("/compras")
      .set(como(comprador))
      .expect(200)
    expect(mias.body.find((c) => c.id === compra.id).acciones).toEqual([
      "confirmarPago",
      "cancelar",
    ])

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
