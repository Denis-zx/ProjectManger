import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import type { User } from '../types'

/**
 * 获取用户列表的 Hook
 * 替代原来直接引用 mockUsers 的方式
 */
export function useUsers() {
  const fetchUsers = useAuthStore(s => s.fetchUsers)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [fetchUsers])

  const getUserById = (id: string) => users.find(u => u.id === id)
  const getUserByName = (name: string) => users.find(u => u.name === name)

  return { users, loading, getUserById, getUserByName }
}
