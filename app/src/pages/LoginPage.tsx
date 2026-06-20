import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const success = await login(username, password)
    if (success) {
      navigate('/team-kanban')
    } else {
      setError('用户名或密码错误')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-white font-bold">PM</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">项目管理系统</h1>
          <p className="text-white/70 text-sm">团队协作 · 高效管理 · 数据驱动</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">登录</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-field"
                placeholder="请输入用户名"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="请输入密码"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center mb-3">测试账号</p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="font-medium text-gray-700">超级管理员</div>
                <div className="text-gray-400">superadmin</div>
                <div className="text-gray-400">admin123</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="font-medium text-gray-700">管理员</div>
                <div className="text-gray-400">admin</div>
                <div className="text-gray-400">admin123</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <div className="font-medium text-gray-700">普通成员</div>
                <div className="text-gray-400">zhangsan</div>
                <div className="text-gray-400">123456</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
