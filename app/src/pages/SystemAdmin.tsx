import { useState, useEffect, useCallback } from 'react'
import { useAuthStore, isSuperAdmin } from '../store/authStore'
import { userApi } from '../services/authApi'
import { cn, formatDate } from '../utils/helpers'
import Modal, { ConfirmModal } from '../components/ui/Modal'
import type { User } from '../types'

export default function SystemAdmin() {
  const { currentUser } = useAuthStore()
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [showClearData, setShowClearData] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState('')
  const [newUsername, setNewUsername] = useState('')
  const [newName, setNewName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<'member' | 'admin'>('member')
  const [resetPassword, setResetPassword] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'system'>('users')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const { users } = await userApi.list()
      setUsers(users)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (currentUser && isSuperAdmin(currentUser)) {
      fetchUsers()
    }
  }, [currentUser, fetchUsers])

  if (!currentUser || !isSuperAdmin(currentUser)) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center text-gray-400">
          <span className="text-4xl block mb-2">🔒</span>
          <p>仅超级管理员可访问此页面</p>
        </div>
      </div>
    )
  }

  const handleCreateUser = async () => {
    if (!newUsername.trim() || !newName.trim() || !newPassword.trim()) return
    try {
      await userApi.create({
        username: newUsername.trim(),
        password: newPassword,
        name: newName.trim(),
        role: newRole,
      })
      setNewUsername('')
      setNewName('')
      setNewPassword('')
      setNewRole('member')
      setShowCreateUser(false)
      fetchUsers()
    } catch (err: any) {
      alert(err.message || '创建失败')
    }
  }

  const handleResetPassword = async () => {
    if (!resetPassword.trim()) return
    try {
      await userApi.update(selectedUserId, { password: resetPassword })
      setResetPassword('')
      setShowResetPassword(false)
      alert('密码重置成功')
    } catch (err: any) {
      alert(err.message || '重置失败')
    }
  }

  const handleToggleStatus = async (user: User) => {
    try {
      await userApi.update(user.id, {
        status: user.status === 'active' ? 'disabled' : 'active',
      })
      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const selectedUser = users.find(u => u.id === selectedUserId)

  const roleLabel = (role: string) =>
    role === 'super_admin' ? '超级管理员' : role === 'admin' ? '管理员' : '普通成员'

  return (
    <div className="page-container">
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">系统管理</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'flex-1 py-2 text-sm rounded-md transition-colors',
              activeTab === 'users' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500'
            )}
          >
            用户管理
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={cn(
              'flex-1 py-2 text-sm rounded-md transition-colors',
              activeTab === 'system' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500'
            )}
          >
            系统信息
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowCreateUser(true)} className="card flex items-center gap-3 hover:shadow-md transition-shadow">
                <span className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">👤+</span>
                <span className="text-sm font-medium">新建用户</span>
              </button>
              <button
                onClick={() => { if (selectedUserId) setShowResetPassword(true) }}
                className={cn('card flex items-center gap-3 transition-shadow', selectedUserId ? 'hover:shadow-md' : 'opacity-50')}
              >
                <span className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center text-yellow-600">🔑</span>
                <span className="text-sm font-medium">重置密码</span>
              </button>
            </div>

            <div className="card">
              <h3 className="section-title">用户列表</h3>
              {loading ? (
                <div className="text-center py-8 text-gray-400 text-sm">加载中...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-gray-500 font-medium">选择</th>
                        <th className="text-left py-2 text-gray-500 font-medium">用户名</th>
                        <th className="text-left py-2 text-gray-500 font-medium">姓名</th>
                        <th className="text-left py-2 text-gray-500 font-medium">角色</th>
                        <th className="text-left py-2 text-gray-500 font-medium">状态</th>
                        <th className="text-left py-2 text-gray-500 font-medium">创建时间</th>
                        <th className="text-left py-2 text-gray-500 font-medium">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user.id} className={cn('border-b border-gray-50', selectedUserId === user.id && 'bg-primary-50')}>
                          <td className="py-2">
                            <input
                              type="radio"
                              name="selectedUser"
                              checked={selectedUserId === user.id}
                              onChange={() => setSelectedUserId(user.id)}
                              disabled={user.role === 'super_admin'}
                            />
                          </td>
                          <td className="py-2 font-mono text-xs">{user.username}</td>
                          <td className="py-2 font-medium">{user.name}</td>
                          <td className="py-2">
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              user.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                              user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            )}>
                              {roleLabel(user.role)}
                            </span>
                          </td>
                          <td className="py-2">
                            <span className={cn(
                              'px-2 py-0.5 rounded-full text-xs font-medium',
                              user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            )}>
                              {user.status === 'active' ? '正常' : '禁用'}
                            </span>
                          </td>
                          <td className="py-2 text-gray-400 text-xs">{formatDate(user.createdAt)}</td>
                          <td className="py-2">
                            {user.role !== 'super_admin' && user.id !== currentUser.id && (
                              <button
                                onClick={() => handleToggleStatus(user)}
                                className="text-xs text-blue-500 hover:text-blue-700"
                              >
                                {user.status === 'active' ? '禁用' : '启用'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-4">
            <div className="card">
              <h3 className="section-title">系统信息</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">系统版本</span>
                  <span className="font-medium">v1.0.0</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">用户总数</span>
                  <span className="font-medium">{users.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">系统状态</span>
                  <span className="badge-success">正常运行</span>
                </div>
              </div>
            </div>

            <div className="card border-red-200">
              <h3 className="section-title text-red-600">⚠️ 危险操作</h3>
              <button
                onClick={() => setShowClearData(true)}
                className="btn-danger w-full"
              >
                清空所有数据
              </button>
              <p className="text-xs text-red-400 mt-2">此操作将删除所有项目数据，且不可恢复，请谨慎操作</p>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={showCreateUser} onClose={() => setShowCreateUser(false)} title="新建用户" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <input type="text" value={newUsername} onChange={e => setNewUsername(e.target.value)} className="input-field" placeholder="请输入用户名" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)} className="input-field" placeholder="请输入姓名" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">初始密码</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field" placeholder="请输入初始密码" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value as any)} className="select-field">
              <option value="member">普通成员</option>
              <option value="admin">管理人员</option>
            </select>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreateUser(false)} className="btn-secondary">取消</button>
            <button onClick={handleCreateUser} disabled={!newUsername.trim() || !newName.trim() || !newPassword.trim()} className="btn-primary">创建</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showResetPassword} onClose={() => setShowResetPassword(false)} title="重置密码" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            为用户 <strong>{selectedUser?.name}</strong> 重置密码
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} className="input-field" placeholder="请输入新密码" />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowResetPassword(false)} className="btn-secondary">取消</button>
            <button onClick={handleResetPassword} disabled={!resetPassword.trim()} className="btn-primary">确认重置</button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={showClearData}
        onClose={() => setShowClearData(false)}
        onConfirm={() => setShowClearData(false)}
        title="清空所有数据"
        message="此操作将删除所有项目数据，且不可恢复。确定要继续吗？"
        confirmText="确认清空"
        confirmVariant="danger"
      />
    </div>
  )
}
