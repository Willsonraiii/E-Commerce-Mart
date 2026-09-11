import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let alive = true
    api.fetchMe()
      .then((d) => { if (alive) setUser(d?.user || null) })
      .catch(() => { if (alive) setUser(null) })
      .finally(() => { if (alive) setReady(true) })
    return () => { alive = false }
  }, [])

  const signIn = useCallback(async (creds) => {
    const d = await api.login(creds)
    setUser(d.user)
    return d.user
  }, [])

  const signUp = useCallback(async (body) => {
    const d = await api.register(body)
    setUser(d.user)
    return d.user
  }, [])

  const signOut = useCallback(async () => {
    await api.logout().catch(() => {})
    setUser(null)
  }, [])

  const saveProfile = useCallback(async (patch) => {
    const d = await api.updateProfile(patch)
    setUser(d.user)
    return d.user
  }, [])

  const value = useMemo(
    () => ({ user, ready, signIn, signUp, signOut, saveProfile, isAdmin: user?.role === 'admin' }),
    [user, ready, signIn, signUp, signOut, saveProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
