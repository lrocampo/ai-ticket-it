import AsyncStorage from "@react-native-async-storage/async-storage"
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"

import { listarUsuarios, setUsuarioActualId } from "../services/api"
import type { Usuario } from "../types"

const CLAVE = "usuarioActualId"

type UsuarioContextValue = {
  usuario: Usuario | null
  recuperando: boolean
  elegirUsuario: (usuario: Usuario) => Promise<void>
  salir: () => Promise<void>
}

const UsuarioContext = createContext<UsuarioContextValue | null>(null)

// Guardamos solo el id y al arrancar buscamos al usuario en el backend: si el
// seed cambió y el id ya no existe, la app vuelve a "¿Quién sos?" sola.
async function recuperarUsuario(): Promise<Usuario | null> {
  const id = await AsyncStorage.getItem(CLAVE)
  if (!id) return null
  try {
    const usuarios = await listarUsuarios()
    return usuarios.find((u) => u.id === id) ?? null
  } catch {
    return null
  }
}

export function UsuarioProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [recuperando, setRecuperando] = useState(true)

  useEffect(() => {
    recuperarUsuario().then((recuperado) => {
      setUsuarioActualId(recuperado?.id ?? null)
      setUsuario(recuperado)
      setRecuperando(false)
    })
  }, [])

  async function elegirUsuario(elegido: Usuario) {
    setUsuarioActualId(elegido.id)
    setUsuario(elegido)
    await AsyncStorage.setItem(CLAVE, elegido.id)
  }

  async function salir() {
    setUsuarioActualId(null)
    setUsuario(null)
    await AsyncStorage.removeItem(CLAVE)
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
