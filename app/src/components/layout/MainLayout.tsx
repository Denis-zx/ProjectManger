import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore, isAdmin, isSuperAdmin } from '../../store/authStore'
import { cn } from '../../utils/helpers'

const navItems = [
  { path: '/team-kanban', label: '团队看板', icon: '📋' },
  { path: '/personal-kanban', label: '个人看板', icon: '👤' },
  { path: '/management-dashboard', label: '管理看板', icon: '📊', adminOnly: true },
  { path: '/system-admin', label: '系统管理', icon: '⚙️', superAdminOnly: true },
]

export default function MainLayout() {
  const { currentUser, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const filteredNavItems = navItems.filter(item => {
    if (item.superAdminOnly && !isSuperAdmin(currentUser)) return false
    if (item.adminOnly && !isAdmin(currentUser)) return false
    return true
  })

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              PM
            </div>
            <h1 className="text-lg font-semibold text-gray-900">项目管理系统</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium', `bg-primary-500`)}>
                {currentUser?.name?.slice(0, 1)}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-gray-900">{currentUser?.name}</div>
                <div className="text-xs text-gray-500">
                  {currentUser?.role === 'super_admin' ? '超级管理员' : currentUser?.role === 'admin' ? '管理人员' : '普通成员'}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              退出
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden md:flex flex-col w-56 bg-white border-r border-gray-200 p-4 gap-1">
          {filteredNavItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                )
              }
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          <NavLink
            to="/project/create"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
              )
            }
          >
            <span className="text-lg">➕</span>
            <span>创建项目</span>
          </NavLink>
          <NavLink
            to="/reserve-projects"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                isActive ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
              )
            }
          >
            <span className="text-lg">📦</span>
            <span>储备项目库</span>
          </NavLink>
        </nav>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex justify-around py-1">
          {filteredNavItems.slice(0, 4).map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center py-1 px-3 text-xs',
                  isActive ? 'text-primary-500' : 'text-gray-400'
                )
              }
            >
              <span className="text-lg mb-0.5">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
