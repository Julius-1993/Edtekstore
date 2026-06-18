import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { EdtekLogo } from '../shared'
import { LayoutDashboard, Package, ClipboardList, Truck, Users, LogOut, User, Menu, X, ShieldAlert } from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { to:'/',           label:'Dashboard',  icon:LayoutDashboard, exact:true, roles:['admin','storekeeper','sales','technical'] },
  { to:'/users',      label:'Users',      icon:Users,                       roles:['admin'] },
  { to:'/stock',      label:'Inventory',  icon:Package,                     roles:['admin','storekeeper','sales','technical'] },
  { to:'/requests',   label:'Requests',   icon:ClipboardList,               roles:['admin','storekeeper','sales','technical'] },
  { to:'/deliveries', label:'Deliveries', icon:Truck,                       roles:['admin','storekeeper','technical'] },
]

const ROLE_COLOR = { admin:'#4a9eff', storekeeper:'#34d399', sales:'#f59e0b', technical:'#a78bfa' }
const ROLE_BG    = { admin:'rgba(74,158,255,0.12)', storekeeper:'rgba(52,211,153,0.12)', sales:'rgba(245,158,11,0.12)', technical:'rgba(167,139,250,0.12)' }

export default function Layout() {
  const { user, logout, mustResetPassword } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const filteredNav = NAV.filter(n => n.roles.includes(user?.role))

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b" style={{ borderColor:'rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="EDTEK" style={{ width:48, height:48, objectFit:'contain', flexShrink:0 }} />
          <div>
            <h1 className="text-white font-bold text-base leading-none">EDTEK StoreTrack</h1>
            <p className="text-xs mt-0.5 font-medium" style={{ color:'#4a9eff' }}>Inventory System</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-6 text-xs font-bold uppercase tracking-widest mb-3 mt-2" style={{ color:'#2d5080' }}>Menu</p>
        {filteredNav.map(({ to, label, icon:Icon, exact }) => (
          <NavLink key={to} to={to} end={exact} onClick={() => setOpen(false)}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon className="w-4 h-4 flex-shrink-0" /><span className="text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
        <div className="rounded-xl p-3" style={{ background:'rgba(255,255,255,0.04)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:ROLE_BG[user?.role] }}>
              <User className="w-4 h-4" style={{ color:ROLE_COLOR[user?.role] }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{user?.name}</p>
              <p className="text-xs truncate" style={{ color:'#4a7aaa' }}>{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2.5 pt-2.5" style={{ borderTop:'1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-xs font-bold capitalize px-2 py-0.5 rounded-full" style={{ color:ROLE_COLOR[user?.role], background:ROLE_BG[user?.role] }}>{user?.role}</span>
            <button onClick={() => { logout(); navigate('/login') }} className="flex items-center gap-1 text-xs font-medium" style={{ color:'#4a7aaa' }}
              onMouseEnter={e => e.currentTarget.style.color='#f87171'} onMouseLeave={e => e.currentTarget.style.color='#4a7aaa'}>
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 sidebar">{sidebarContent}</aside>
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="relative z-10 w-72 sidebar">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            {sidebarContent}
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center gap-4 flex-shrink-0">
          <button onClick={() => setOpen(true)} className="lg:hidden text-slate-500"><Menu className="w-5 h-5" /></button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background:ROLE_BG[user?.role] }}>
              <User className="w-4 h-4" style={{ color:ROLE_COLOR[user?.role] }} />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-700 leading-none">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role}</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {mustResetPassword && (
            <div className="flex items-center gap-3 px-6 py-2.5" style={{background:'#fff7ed',borderBottom:'1px solid #fed7aa'}}>
              <ShieldAlert className="w-4 h-4 text-orange-500 flex-shrink-0" />
              <p className="text-sm text-orange-700 font-medium flex-1">
                You are using a temporary password — it will expire in 48 hours.
              </p>
              <a href="/change-password" className="btn btn-sm text-white text-xs" style={{background:'#ea580c',border:'none'}}>
                Set Password Now
              </a>
            </div>
          )}
          <div className="p-6 max-w-7xl mx-auto"><Outlet /></div>
        </main>
      </div>
    </div>
  )
}
