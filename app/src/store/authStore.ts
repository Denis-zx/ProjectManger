import { create } from 'zustand'
import type { User, UserRole } from '../types'
import { authApi, userApi } from '../services/authApi'

interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null

  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  updatePassword: (oldPassword: string, newPassword: string) => Promise<boolean>
  restoreSession: () => Promise<void>
  fetchUsers: () => Promise<User[]>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  loading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const { token, user } = await authApi.login(username, password)
      localStorage.setItem('pm_token', token)
      localStorage.setItem('pm_user', JSON.stringify(user))
      set({ currentUser: user, isAuthenticated: true, loading: false })
      return true
    } catch (err: any) {
      set({ loading: false, error: err.message })
      return false
    }
  },

  logout: () => {
    authApi.logout().catch(() => {})
    localStorage.removeItem('pm_token')
    localStorage.removeItem('pm_user')
    set({ currentUser: null, isAuthenticated: false })
  },

  updatePassword: async (oldPassword: string, newPassword: string) => {
    try {
      await authApi.changePassword(oldPassword, newPassword)
      return true
    } catch (err: any) {
      set({ error: err.message })
      return false
    }
  },

  restoreSession: async () => {
    const token = localStorage.getItem('pm_token')
    if (!token) {
      set({ isAuthenticated: false, currentUser: null })
      return
    }
    try {
      const { user } = await authApi.me()
      set({ currentUser: user, isAuthenticated: true })
    } catch {
      localStorage.removeItem('pm_token')
      localStorage.removeItem('pm_user')
      set({ isAuthenticated: false, currentUser: null })
    }
  },

  fetchUsers: async () => {
    const { users } = await userApi.list()
    return users
  },
}))

export const hasRole = (user: User | null, role: UserRole): boolean => {
  if (!user) return false
  const rolePriority: UserRole[] = ['member', 'admin', 'super_admin']
  return rolePriority.indexOf(user.role) >= rolePriority.indexOf(role)
}

export const isAdmin = (user: User | null): boolean => hasRole(user, 'admin')
export const isSuperAdmin = (user: User | null): boolean => hasRole(user, 'super_admin')
