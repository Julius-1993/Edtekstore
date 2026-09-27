import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { EdtekLogo } from '../shared'
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  Truck,
  Users,
  LogOut,
  User,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

const NAV = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
    roles: ['admin', 'storekeeper', 'sales', 'technical'],
  },
  {
    to: '/users',
    label: 'Users',
    icon: Users,
    roles: ['admin'],
  },
  {
    to: '/stock',
    label: 'Inventory',
    icon: Package,
    roles: ['admin', 'storekeeper', 'sales', 'technical'],
  },
  {
    to: '/requests',
    label: 'Requests',
    icon: ClipboardList,
    roles: ['admin', 'storekeeper', 'sales', 'technical'],
  },
  {
    to: '/deliveries',
    label: 'Deliveries',
    icon: Truck,
    roles: ['admin', 'storekeeper', 'technical'],
  },
]

const ROLE_COLOR = {
  admin: '#4a9eff',
  storekeeper: '#34d399',
  sales: '#f59e0b',
  technical: '#a78bfa',
}

const ROLE_BG = {
  admin: 'rgba(74,158,255,0.12)',
  storekeeper: 'rgba(52,211,153,0.12)',
  sales: 'rgba(245,158,11,0.12)',
  technical: 'rgba(167,139,250,0.12)',
}

export default function Layout() {
  const { user, logout, mustResetPassword } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const filteredNav = NAV.filter((item) =>
    item.roles.includes(user?.role)
  )

  const handleLogout = () => {
    logout()
    setOpen(false)
    navigate('/login')
  }

  const sidebarContent = (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Logo */}
      <div
        className="px-5 py-5 border-b flex-shrink-0"
        style={{ borderColor: 'rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="EDTEK"
            style={{
              width: 48,
              height: 48,
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />

          <div className="min-w-0">
            <h1 className="text-white font-bold text-base leading-none">
              EDTEK StoreTrack
            </h1>

            <p
              className="text-xs mt-0.5 font-medium"
              style={{ color: '#4a9eff' }}
            >
              Inventory System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 py-4 space-y-0.5 overflow-y-auto">
        <p
          className="px-6 text-xs font-bold uppercase tracking-widest mb-3 mt-2"
          style={{ color: '#2d5080' }}
        >
          Menu
        </p>

        {filteredNav.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `nav-link ${isActive ? 'active' : ''}`
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User / Logout section */}
      <div
        className="p-3 border-t flex-shrink-0"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: '#020c1b',
        }}
      >
        <div
          className="rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.04)' }}
        >
          {/* User information */}
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background:
                  ROLE_BG[user?.role] || 'rgba(74,158,255,0.12)',
              }}
            >
              <User
                className="w-4 h-4"
                style={{
                  color:
                    ROLE_COLOR[user?.role] || '#4a9eff',
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {user?.name}
              </p>

              <p
                className="text-xs truncate"
                style={{ color: '#4a7aaa' }}
              >
                {user?.email}
              </p>
            </div>
          </div>

          {/* Role + Logout */}
          <div
            className="flex items-center justify-between gap-2 mt-2.5 pt-2.5"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <span
              className="text-xs font-bold capitalize px-2 py-0.5 rounded-full"
              style={{
                color:
                  ROLE_COLOR[user?.role] || '#4a9eff',
                background:
                  ROLE_BG[user?.role] ||
                  'rgba(74,158,255,0.12)',
              }}
            >
              {user?.role}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md hover:bg-red-500/10 transition-colors"
              style={{
                color: '#f87171',
                flexShrink: 0,
              }}
            >
              <LogOut className="w-3.5 h-3.5 flex-shrink-0" />

              <span className="whitespace-nowrap">
                Sign out
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:flex flex-col w-64 flex-shrink-0 sidebar"
        style={{
          height: '100dvh',
          maxHeight: '100dvh',
          overflow: 'hidden',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Dark overlay */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />

          {/* Mobile drawer */}
          <aside
            className="absolute left-0 top-0 z-10 w-72 sidebar"
            style={{
              height: '100dvh',
              maxHeight: '100dvh',
              overflow: 'hidden',
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-20 text-slate-400 hover:text-white transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>

            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-slate-200">
          <div className="h-16 px-4 sm:px-6 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page content / spacer */}
            <div className="flex-1" />

            {/* Desktop user info */}
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800">
                  {user?.name}
                </p>

                <p className="text-xs text-slate-500">
                  {user?.role}
                </p>
              </div>

              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background:
                    ROLE_BG[user?.role] ||
                    'rgba(74,158,255,0.12)',
                }}
              >
                <User
                  className="w-4 h-4"
                  style={{
                    color:
                      ROLE_COLOR[user?.role] ||
                      '#4a9eff',
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}