import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { fmtDateTime, categoryLabel } from '../utils/format'
import { StatusBadge, LoadingSpinner } from '../components/shared'
import { 
  Package, 
  ClipboardList, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  XCircle, 
  Cpu, 
  Camera, 
  Monitor } from 'lucide-react'

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <div className="stat-card">
    <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
      <Icon className="w-5 h-5" style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-bold" style={{ color: '#020c1b' }}>{value ?? 0}</p>
      <p className="text-xs font-medium mt-0.5" style={{ color: '#64748b' }}>{label}</p>
    </div>
  </div>
)

const CATEGORY_ICONS = { teklite: Monitor, tekboost: Monitor, tekpremium: Monitor, ops: Cpu, camera: Camera, board_stand: Package, accessory: Package, other: Package }

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner />

  const { stats, recentRequests, recentStock, categoryBreakdown } = data || {}
  const s = stats || {}

  return (
    <div className="fade-up space-x-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span></p>
        </div>
        <span className="text-xs font-bold px-3 py-1.5 rounded-full capitalize"
          style={{ background: 'rgba(26,86,219,0.1)', color: '#1a56db' }}>
          {user?.role}
        </span>
      </div>

      {/* Stock Stats */}
      <div>
        <p className="section-label">Inventory Overview</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Package}       label="Total Items"   value={s.stock?.total}      color="#1a56db" bg="rgba(26,86,219,0.1)" />
          <StatCard icon={CheckCircle}   label="In Stock"      value={s.stock?.inStock}     color="#16a34a" bg="rgba(22,163,74,0.1)" />
          <StatCard icon={AlertTriangle} label="Low Stock"     value={s.stock?.lowStock}    color="#d97706" bg="rgba(217,119,6,0.1)" />
          <StatCard icon={XCircle}       label="Out of Stock"  value={s.stock?.outOfStock}  color="#dc2626" bg="rgba(220,38,38,0.1)" />
        </div>
      </div>

      {/* Request Stats */}
      <div>
        <p className="section-label">Request Pipeline</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Pending',    value: s.requests?.pending,    color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
            { label: 'Approved',   value: s.requests?.approved,   color: '#1a56db', bg: 'rgba(26,86,219,0.1)' },
            { label: 'Processing', value: s.requests?.processing, color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
            { label: 'Shipped',    value: s.requests?.shipped,    color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
            { label: 'Confirmed',  value: s.requests?.confirmed,  color: '#16a34a', bg: 'rgba(22,163,74,0.1)' },
            { label: 'Completed',  value: s.requests?.completed,  color: '#0a1628', bg: 'rgba(10,22,40,0.08)' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value ?? 0}</p>
              <p className="text-xs font-medium mt-1" style={{ color: '#64748b' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown?.length > 0 && (
        <div>
          <p className="section-label">Stock by Category</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryBreakdown.map(c => {
              const Icon = CATEGORY_ICONS[c._id] || Package
              return (
                <div key={c._id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(26,86,219,0.08)' }}>
                    <Icon className="w-4 h-4" style={{ color: '#1a56db' }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#020c1b' }}>{c.totalQty}</p>
                    <p className="text-xs capitalize" style={{ color: '#64748b' }}>{categoryLabel(c._id)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent Tables */}
      <div className="grid lg:grid-cols-2 gap-5 py-4 lg:py-6">
        {/* Recent Requests */}
        <div className="card-pad">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: '#020c1b' }}>Recent Requests</h3>
            <Link to="/requests" className="text-xs font-semibold" style={{ color: '#1a56db' }}>View all →</Link>
          </div>
          {recentRequests?.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>No requests yet</p>
          ) : (
            <div className="space-y-2">
              {recentRequests?.map(r => (
                <Link key={r._id} to={`/requests/${r._id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#020c1b' }}>{r.requestNumber}</p>
                    <p className="text-xs" style={{ color: '#64748b' }}>{r.toOrganization} · {fmtDateTime(r.createdAt)}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Stock */}
        <div className="card-pad">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: '#020c1b' }}>Recent Stock Entries</h3>
            <Link to="/stock" className="text-xs font-semibold" style={{ color: '#1a56db' }}>View all →</Link>
          </div>
          {recentStock?.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>No stock yet</p>
          ) : (
            <div className="space-y-2">
              {recentStock?.map(s => (
                <Link key={s._id} to={`/stock/${s._id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#020c1b' }}>
                      {s.name}{s.screenSize ? ` ${s.screenSize}"` : ''}
                    </p>
                    <p className="text-xs font-mono" style={{ color: '#64748b' }}>{s.serialNumber} · Qty: {s.quantityRemaining}</p>
                  </div>
                  <StatusBadge status={s.status} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
