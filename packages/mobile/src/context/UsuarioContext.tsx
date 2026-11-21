import * as SecureStore from "expo-secure-store"
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"

import {
  crearSesion,
  obtenerSesion,
  onSesionVencida,
  setToken,
} from "../services/api"
import type { Usuario } from "../types"

const CLAVE = "sesion"

type UsuarioContextValue = {
  usuario: Usuario | null
  recuperando: boolean
  elegirUsuario: (usuario: Usuario) => Promise<void>
  salir: () => Promise<void>
}

const UsuarioContext = createContext<UsuarioContextValue | null>(null)

async function recuperarUsuario(): Promise<Usuario | null> {
  try {
    const token = await SecureStore.getItemAsync(CLAVE)
    if (!token) return null
    setToken(token)
    return await obtenerSesion()
  } catch {
    setToken(null)
    return null
  }
}

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [recuperando, setRecuperando] = useState(true)

  useEffect(() => {
    onSesionVencida(() => {
      setUsuario(null)
      SecureStore.deleteItemAsync(CLAVE).catch(() => {})
    })
    recuperarUsuario().then((recuperado) => {
      setUsuario(recuperado)
      setRecuperando(false)
    })
    return () => onSesionVencida(null)
  }, [])

  async function elegirUsuario(elegido: Usuario) {
    const sesion = await crearSesion(elegido.id)
    await SecureStore.setItemAsync(CLAVE, sesion.token).catch(() => {})
    setToken(sesion.token)
    setUsuario(sesion.usuario)
  }

  async function salir() {
    setToken(null)
    setUsuario(null)
    await SecureStore.deleteItemAsync(CLAVE)
  }

  return (
    <UsuarioContext.Provider
      value={{ usuario, recuperando, elegirUsuario, salir }}
    >
      {children}
    </UsuarioContext.Provider>
  )
}

export function useUsuario() {
  const contexto = useContext(UsuarioContext)
  if (!contexto) {
    throw new Error("useUsuario tiene que usarse dentro de UsuarioProvider")
  }
  return contexto
}

export function useUsuarioActual(): Usuario {
  const { usuario } = useUsuario()
  if (!usuario) {
    throw new Error("useUsuarioActual tiene que usarse con un usuario elegido")
  }
  return usuario
}
