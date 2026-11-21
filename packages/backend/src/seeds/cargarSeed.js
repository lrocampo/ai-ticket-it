import Categoria from "../domain/Categoria.js"
import Compra from "../domain/Compra.js"
import Evento from "../domain/Evento.js"
import TipoEntrada from "../domain/TipoEntrada.js"
import Usuario from "../domain/Usuario.js"
import { sumarDias } from "../utils/fechas.js"

const enDias = (dias, horas = 21) => {
  const fecha = sumarDias(new Date(), dias)
  fecha.setHours(horas, 0, 0, 0)
  return fecha
}

const imagen = (semilla) => `https://picsum.photos/seed/${semilla}/800/500`

export default function cargarSeed({ usuarios, categorias, eventos, compras }) {
  const categoria = Object.fromEntries(
    [
      ["Recitales", "Bandas y solistas en vivo"],
      ["Teatro", "Obras, stand up y espectáculos de sala"],
      ["Festivales", "Varios artistas, varios escenarios, todo el día"],
      ["Conferencias", "Charlas, jornadas y encuentros profesionales"],
      ["Deportes", "Partidos, carreras y torneos"],
    ].map(([nombre, descripcion]) => [
      nombre,
      categorias.guardar(new Categoria({ nombre, descripcion })),
    ]),
  )

  const [lucia, martin, sofia, nicolas, valentina, tomas] = [
    ["Lucía", "Fernández", "lucia.fernandez@ejemplo.com"],
    ["Martín", "Pereyra", "martin.pereyra@ejemplo.com"],
    ["Sofía", "Giménez", "sofia.gimenez@ejemplo.com"],
    ["Nicolás", "Acosta", "nicolas.acosta@ejemplo.com"],
    ["Valentina", "Romero", "valentina.romero@ejemplo.com"],
    ["Tomás", "Ledesma", "tomas.ledesma@ejemplo.com"],
  ].map(([nombre, apellido, email]) =>
    usuarios.guardar(new Usuario({ nombre, apellido, email })),
  )

  const tipos = (lista) =>
    lista.map(
      ([nombre, precio, cupo, descripcion]) =>
        new TipoEntrada({ nombre, descripcion, precio, cupo }),
    )

  const evento = (datos, creado = enDias(-1)) =>
    eventos.guardar(
      new Evento(
        {
          ...datos,
          multimedia: [
            imagen(datos.semilla),
            imagen(`${datos.semilla}-2`),
            imagen(`${datos.semilla}-3`),
          ],
        },
        creado,
      ),
    )

  const futuros = {
    rock: evento({
      nombre: "Noche de rock en el Gran Rex",
      descripcion:
        "Tres bandas de rock nacional en una misma noche, con apertura de un grupo emergente de Rosario.",
      categoria: categoria.Recitales,
      fecha: enDias(12),
      organizador: lucia,
      limitePorUsuario: 4,
      semilla: "rock-gran-rex",
      tiposEntrada: tipos([
        ["Platea", 25000, 300, "Butaca numerada en planta baja"],
        ["Pullman", 15000, 200, "Sector alto, sin numerar"],
        ["VIP", 48000, 40, "Primeras filas y acceso al after"],
      ]),
    }),
    jazz: evento({
      nombre: "Jazz en el Konex",
      descripcion:
        "Ciclo de jazz con un cuarteto porteño y una cantante invitada de Montevideo.",
      categoria: categoria.Recitales,
      fecha: enDias(25),
      organizador: lucia,
      semilla: "jazz-konex",
      tiposEntrada: tipos([
        ["General", 9000, 250, "Entrada de pie"],
        ["Mesa", 16000, 60, "Mesa para cuatro cerca del escenario"],
      ]),
    }),
    tango: evento({
      nombre: "Milonga de verano en San Telmo",
      descripcion:
        "Orquesta típica en vivo y clase abierta de tango antes de la milonga.",
      categoria: categoria.Festivales,
      fecha: enDias(40),
      organizador: lucia,
      semilla: "milonga-san-telmo",
      tiposEntrada: tipos([
        ["General", 6000, 400, "Acceso a la milonga"],
        ["Con clase", 9500, 80, "Incluye la clase previa"],
      ]),
    }),
    obra: evento({
      nombre: "La casa de Bernarda Alba",
      descripcion:
        "Versión contemporánea del clásico de Lorca con elenco de ocho actrices, en el Teatro San Martín.",
      categoria: categoria.Teatro,
      fecha: enDias(8, 20),
      organizador: martin,
      semilla: "bernarda-alba",
      tiposEntrada: tipos([
        ["Platea", 18000, 500, "Butaca numerada"],
        ["Pullman", 11000, 300, "Sector alto"],
      ]),
    }),
    standup: evento({
      nombre: "Stand up: Cosas que pasan",
      descripcion:
        "Tres comediantes, una hora y media, sin intervalo. Público mayor de 16.",
      categoria: categoria.Teatro,
      fecha: enDias(18, 22),
      organizador: martin,
      semilla: "stand-up-cosas",
      tiposEntrada: tipos([
        ["General", 8000, 150, "Ubicación libre"],
        ["Mesa", 12000, 40, "Mesa para dos con consumición"],
      ]),
    }),
    folklore: evento({
      nombre: "Festival de folklore en Cosquín Chico",
      descripcion:
        "Dos jornadas con peñas, feria de artesanos y cierre con una chacarera multitudinaria.",
      categoria: categoria.Festivales,
      fecha: enDias(55, 18),
      organizador: martin,
      semilla: "folklore-cosquin",
      tiposEntrada: tipos([
        ["Campo", 14000, 2000, "Acceso general a las dos jornadas"],
        ["Platea", 22000, 500, "Sillas frente al escenario mayor"],
        ["Camping", 30000, 150, "Dos noches de camping incluidas"],
      ]),
    }),
    jornadas: evento({
      nombre: "Jornadas de Ingeniería de Software",
      descripcion:
        "Charlas sobre arquitectura, testing y desarrollo con IA. Incluye almuerzo y certificado de asistencia.",
      categoria: categoria.Conferencias,
      fecha: enDias(30, 9),
      organizador: sofia,
      semilla: "jornadas-software",
      tiposEntrada: tipos([
        ["Estudiante", 5000, 200, "Con libreta o constancia de alumno"],
        ["Profesional", 20000, 150, "Incluye material impreso"],
      ]),
    }),
    futbol: evento({
      nombre: "Clásico de fútbol femenino",
      descripcion:
        "Fecha decisiva del torneo en el estadio de Villa Crespo. Apto para toda la familia.",
      categoria: categoria.Deportes,
      fecha: enDias(5, 16),
      organizador: sofia,
      semilla: "clasico-femenino",
      tiposEntrada: tipos([
        ["Popular", 4000, 3000, "Tribuna de pie"],
        ["Platea", 9000, 800, "Platea cubierta con asiento"],
      ]),
    }),
    maraton: evento({
      nombre: "Maratón nocturna de Palermo",
      descripcion:
        "Diez kilómetros por los bosques de Palermo, con kit de corredor y medalla de finisher.",
      categoria: categoria.Deportes,
      fecha: enDias(45, 20),
      organizador: sofia,
      semilla: "maraton-palermo",
      tiposEntrada: tipos([
        ["Corredor", 12000, 1500, "Incluye kit y chip"],
        ["Acompañante", 2000, 500, "Acceso a la zona de largada"],
      ]),
    }),
    ajedrez: evento({
      nombre: "Torneo de ajedrez relámpago",
      descripcion:
        "Partidas de tres minutos a sistema suizo en el club de Villa del Parque. Abierto a todos los niveles.",
      categoria: categoria.Deportes,
      fecha: enDias(20, 10),
      organizador: tomas,
      semilla: "ajedrez-relampago",
      tiposEntrada: tipos([
        ["Jugador", 3000, 64, "Inscripción al torneo"],
        ["Espectador", 0, 100, "Acceso a la sala"],
      ]),
    }),
  }

  const pasados = {
    indie: evento(
      {
        nombre: "Ciclo indie en Niceto",
        descripcion:
          "Cuatro bandas nuevas de la escena porteña en una sola noche.",
        categoria: categoria.Recitales,
        fecha: enDias(-20),
        organizador: lucia,
        semilla: "indie-niceto",
        tiposEntrada: tipos([
          ["General", 7000, 300, "Entrada de pie"],
          ["VIP", 15000, 30, "Balcón con barra propia"],
        ]),
      },
      enDias(-60),
    ),
    monologo: evento(
      {
        nombre: "Monólogo: Lo que no te dije",
        descripcion:
          "Unipersonal dramático con una sola función en el Picadero.",
        categoria: categoria.Teatro,
        fecha: enDias(-35),
        organizador: martin,
        semilla: "monologo-picadero",
        tiposEntrada: tipos([
          ["Platea", 12000, 200, "Butaca numerada"],
          ["Pullman", 8000, 100, "Sector alto"],
        ]),
      },
      enDias(-70),
    ),
    ia: evento(
      {
        nombre: "Meetup de desarrollo con IA",
        descripcion:
          "Encuentro mensual para mostrar herramientas y proyectos hechos con asistentes de código.",
        categoria: categoria.Conferencias,
        fecha: enDias(-10, 19),
        organizador: sofia,
        semilla: "meetup-ia",
        tiposEntrada: tipos([
          ["General", 0, 120, "Entrada gratuita con inscripción"],
          ["Con cena", 9000, 30, "Cena posterior con los disertantes"],
        ]),
      },
      enDias(-40),
    ),
  }

  const comprar = (comprador, evento, indiceTipo, cantidad, cuando) =>
    compras.guardar(
      new Compra(
        {
          comprador,
          evento,
          tipoEntrada: evento.tiposEntrada[indiceTipo],
          cantidad,
        },
        cuando,
      ),
    )

  const utilizada = (comprador, evento, indiceTipo, cantidad, resena) => {
    const compra = comprar(
      comprador,
      evento,
      indiceTipo,
      cantidad,
      sumarDias(evento.fecha, -15),
    )
    compra.confirmarPago(comprador, sumarDias(evento.fecha, -14))
    compra.utilizar(evento.organizador, evento.fecha)
    if (resena) {
      const [puntuacion, detalle] = resena
      compra.resenar(puntuacion, detalle, sumarDias(evento.fecha, 1))
    }
    return compra
  }

  utilizada(nicolas, pasados.indie, 0, 2, [
    5,
    "Sonido impecable y las bandas salieron puntuales. Volvería sin dudarlo.",
  ])
  utilizada(valentina, pasados.indie, 1, 1, [
    4,
    "El balcón VIP valió la pena, aunque la barra se quedó sin hielo.",
  ])
  utilizada(tomas, pasados.indie, 0, 1)

  utilizada(valentina, pasados.monologo, 0, 2, [
    3,
    "La actuación es muy buena pero la función arrancó cuarenta minutos tarde.",
  ])
  utilizada(nicolas, pasados.monologo, 1, 1, [
    4,
    "Me emocionó. El pullman se escucha perfecto.",
  ])

  utilizada(tomas, pasados.ia, 0, 1, [
    2,
    "Las charlas estuvieron bien pero el lugar era chico y no entramos todos.",
  ])
  utilizada(nicolas, pasados.ia, 1, 1, [
    3,
    "La cena fue lo mejor. Las demos se cayeron un par de veces.",
  ])
  utilizada(valentina, pasados.ia, 0, 2)

  const pendiente = comprar(nicolas, futuros.rock, 0, 2, enDias(-2))
  pendiente.enviarMensaje(
    nicolas,
    "Hola Lucía, ¿las butacas de platea son contiguas si compro dos?",
    enDias(-2, 22),
  )
  pendiente.enviarMensaje(
    lucia,
    "Hola Nicolás, sí, se asignan juntas al confirmar el pago.",
    enDias(-1, 10),
  )

  const confirmada = comprar(valentina, futuros.obra, 0, 2, enDias(-5))
  confirmada.confirmarPago(valentina, enDias(-5, 22))
  confirmada.enviarMensaje(
    valentina,
    "¿A qué hora abren las puertas? Vengo con mi mamá que camina despacio.",
    enDias(-3),
  )
  confirmada.enviarMensaje(
    martin,
    "Abrimos una hora antes y hay acceso sin escaleras por la puerta lateral.",
    enDias(-3, 23),
  )

  const confirmadaFutbol = comprar(tomas, futuros.futbol, 1, 3, enDias(-4))
  confirmadaFutbol.confirmarPago(tomas, enDias(-4, 22))

  const confirmadaJornadas = comprar(
    nicolas,
    futuros.jornadas,
    0,
    1,
    enDias(-6),
  )
  confirmadaJornadas.confirmarPago(nicolas, enDias(-6, 22))

  comprar(valentina, futuros.jazz, 1, 1, enDias(-1))

  const cancelada = comprar(tomas, futuros.standup, 0, 2, enDias(-7))
  cancelada.cancelar(tomas, enDias(-6))

  const reembolsada = comprar(nicolas, futuros.folklore, 2, 1, enDias(-9))
  reembolsada.confirmarPago(nicolas, enDias(-9, 22))
  reembolsada.cancelar(nicolas, enDias(-4))
  reembolsada.enviarMensaje(
    nicolas,
    "Tuve que cancelar por trabajo, ¿me pueden devolver el dinero?",
    enDias(-4, 12),
  )
  reembolsada.enviarMensaje(
    martin,
    "Sin problema, en estos días te hacemos el reembolso.",
    enDias(-3, 9),
  )
  reembolsada.reembolsar(martin, enDias(-2))

  const canceladaConPago = comprar(valentina, futuros.maraton, 0, 1, enDias(-8))
  canceladaConPago.confirmarPago(valentina, enDias(-8, 22))
  canceladaConPago.cancelar(valentina, enDias(-1))

  return {
    usuarios: { lucia, martin, sofia, nicolas, valentina, tomas },
    categorias: categoria,
    eventos: { ...futuros, ...pasados },
  }
}
