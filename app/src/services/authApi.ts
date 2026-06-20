import api from './api'
import type { User } from '../types'

export const authApi = {
  /** 用户登录 */
  login(username: string, password: string) {
    return api.post('/auth/login', { username, password }) as Promise<{
      token: string
      user: User
    }>
  },

  /** 获取当前登录用户信息 */
  me() {
    return api.get('/auth/me') as Promise<{ user: User }>
  },

  /** 修改密码 */
  changePassword(oldPassword: string, newPassword: string) {
    return api.put('/auth/password', { oldPassword, newPassword }) as Promise<{
      message: string
    }>
  },

  /** 退出登录 */
  logout() {
    return api.post('/auth/logout') as Promise<{ message: string }>
  },
}

export const userApi = {
  /** 获取所有用户 */
  list() {
    return api.get('/users') as Promise<{ users: User[] }>
  },

  /** 创建用户 */
  create(data: {
    username: string
    password: string
    name: string
    role?: string
    phone?: string
  }) {
    return api.post('/users', data) as Promise<{ user: User }>
  },

  /** 更新用户 */
  update(id: string, data: Partial<User> & { password?: string }) {
    return api.put(`/users/${id}`, data) as Promise<{ user: User }>
  },

  /** 禁用用户 */
  disable(id: string) {
    return api.delete(`/users/${id}`) as Promise<{ message: string }>
  },
}
