import axios from 'axios'

/**
 * Axios 实例 - 统一配置
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * 请求拦截器：自动附加 JWT token
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pm_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/**
 * 响应拦截器：统一错误处理
 */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response

      // 401: token 过期或未登录，清除登录状态并跳转登录页
      if (status === 401) {
        localStorage.removeItem('pm_token')
        localStorage.removeItem('pm_user')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }

      const message = data?.error || `请求失败 (${status})`
      return Promise.reject(new Error(message))
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('请求超时，请检查网络'))
    }

    return Promise.reject(new Error('网络错误，请稍后重试'))
  }
)

export default api
