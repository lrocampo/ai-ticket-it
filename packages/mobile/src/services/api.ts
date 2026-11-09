import axios, { isAxiosError } from "axios"
import Constants from "expo-constants"

import type {
  Categoria,
  Compra,
  ComprasDeEvento,
  Evento,
  EventoDetalle,
  FiltrosEventos,
  NuevaCompra,
  NuevaResena,
  NuevoEvento,
  Usuario,
} from "../types"

// Expo sirve el bundle desde la IP de la Mac; el backend corre en esa misma
// máquina, así que desde el teléfono se llega por ahí y no por localhost.
function urlDelBackend(): string {
  const hostUri = Constants.expoConfig?.hostUri
  const host = hostUri ? hostUri.split(":")[0] : "localhost"
  return `http://${host}:3000`
}

const api = axios.create({ baseURL: urlDelBackend(), timeout: 10000 })

let usuarioActualId: string | null = null

export function setUsuarioActualId(id: string | null) {
  usuarioActualId = id
}

api.interceptors.request.use((config) => {
  if (usuarioActualId) {
    config.headers.set("x-usuario-id", usuarioActualId)
  }
  return config
})

export function mensajeDe(error: unknown): string {
  if (isAxiosError<{ message?: string }>(error)) {
    if (error.response?.data?.message) return error.response.data.message
    if (!error.response) return "No pudimos conectarnos con el servidor."
  }
  return "Algo salió mal. Probá de nuevo."
}

export async function listarUsuarios() {
  return (await api.get<Usuario[]>("/usuarios")).data
}

export async function listarCategorias() {
  return (await api.get<Categoria[]>("/categorias")).data
}

export async function listarEventos({
  texto,
  categoriaId,
  orden,
}: FiltrosEventos) {
  const params = {
    texto: texto || undefined,
    categoriaId: categoriaId ?? undefined,
    orden,
  }
  return (await api.get<Evento[]>("/eventos", { params })).data
}

export async function obtenerEvento(id: string) {
  return (await api.get<EventoDetalle>(`/eventos/${id}`)).data
}

export async function crearEvento(evento: NuevoEvento) {
  return (await api.post<EventoDetalle>("/eventos", evento)).data
}

export async function listarComprasDeEvento(id: string) {
  return (await api.get<ComprasDeEvento>(`/eventos/${id}/compras`)).data
}

export async function listarMisEventos() {
  return (await api.get<Evento[]>("/mis-eventos")).data
}

export async function listarMisCompras() {
  return (await api.get<Compra[]>("/compras")).data
}

export async function crearCompra(compra: NuevaCompra) {
  return (await api.post<Compra>("/compras", compra)).data
}

export async function obtenerCompra(id: string) {
  return (await api.get<Compra>(`/compras/${id}`)).data
}

export async function confirmarPago(id: string) {
  return (await api.post<Compra>(`/compras/${id}/confirmacion`)).data
}

export async function utilizarCompra(id: string) {
  return (await api.post<Compra>(`/compras/${id}/uso`)).data
}

export async function cancelarCompra(id: string) {
  return (await api.post<Compra>(`/compras/${id}/cancelacion`)).data
}

export async function reembolsarCompra(id: string) {
  return (await api.post<Compra>(`/compras/${id}/reembolso`)).data
}

export async function enviarMensaje(id: string, texto: string) {
  return (await api.post<Compra>(`/compras/${id}/mensajes`, { texto })).data
}

export async function resenarCompra(id: string, resena: NuevaResena) {
  return (await api.post<Compra>(`/compras/${id}/resena`, resena)).data
}
