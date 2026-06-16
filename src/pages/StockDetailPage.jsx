import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { fmtDate, fmtDateTime, fmtNum, categoryLabel, CATEGORIES, SCREEN_SIZES, PROCESSORS, RAM_OPTIONS, STORAGE_OPTIONS, RESOLUTIONS } from '../utils/format'
import { StatusBadge, LoadingSpinner, PageHeader } from '../components/shared'
import { ArrowLeft, Pencil, Save, TrendingUp, TrendingDown, Package } from 'lucide-react'
import toast from 'react-hot-toast'

export function StockDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [stock, setStock] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/stock/${id}`).then(r => setStock(r.data.stock)).finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!stock) return <div className="text-center py-12 text-slate-400">Stock item not found</div>

  const canEdit = ['storekeeper', 'admin'].includes(user?.role)

  return (
    <div className="fade-up max-w-4xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/stock" className="btn btn-ghost btn-sm gap-2 text-sm"><ArrowLeft className="w-4 h-4" /> Back</Link>
          <div>
            <h1 className="page-title">{stock.name}{stock.screenSize ? ` ${stock.screenSize}"` : ''}</h1>
            <span className="serial-tag">{stock.serialNumber}</span>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <StatusBadge status={stock.status} />
          {canEdit && <Link to={`/stock/${id}/edit`} className="btn btn-primary btn-sm text-white gap-2 text-xs"><Pencil className="w-3 h-3" /> Edit</Link>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="card-pad">
            <h3 className="font-bold text-sm mb-4" style={{ color: '#020c1b' }}>Item Details</h3>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                ['Serial Number', <span className="serial-tag">{stock.serialNumber}</span>],
                ['Category', categoryLabel(stock.category)],
                ['Name', stock.name],
                ['Screen Size', stock.screenSize ? `${stock.screenSize}"` : '—'],
                stock.processor && ['Processor', stock.processor],
                stock.ram && ['RAM', stock.ram],
                stock.storage && ['Storage', stock.storage],
                stock.resolution && ['Resolution', stock.resolution],
                stock.deviceSize && ['Device Size', stock.deviceSize],
                ['Specification', stock.specification],
                ['Unit', stock.unit],
                ['Date In', fmtDate(stock.dateIn)],
                ['Date Out', fmtDate(stock.dateOut) || '—'],
                ['Location', stock.location || '—'],
                ['Supplier', stock.supplier || '—'],
                ['Unit Price', stock.unitPrice ? `₦${stock.unitPrice.toLocaleString()}` : '—'],
                ['Min. Stock Level', stock.minStockLevel],
                ['Added by', stock.createdBy?.name || '—'],
                ['Added on', fmtDateTime(stock.createdAt)],
              ].filter(Boolean).map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#94a3b8' }}>{label}</dt>
                  <dd className="font-medium" style={{ color: '#334155' }}>{value}</dd>
                </div>
              ))}
              {stock.notes && (
                <div className="col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#94a3b8' }}>Notes</dt>
                  <dd style={{ color: '#334155' }}>{stock.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card-pad text-center">
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#94a3b8' }}>Remaining</p>
            <p className={`text-5xl font-bold ${stock.quantityRemaining === 0 ? 'text-red-500' : stock.quantityRemaining <= stock.minStockLevel ? 'text-amber-600' : 'text-green-600'}`}>
              {fmtNum(stock.quantityRemaining)}
            </p>
            <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{stock.unit}</p>
          </div>
          <div className="card-pad">
            <dl className="space-y-3 text-sm">
              {[['Initial', fmtNum(stock.quantityInitial)], ['Dispatched', fmtNum(stock.quantityDispatched)], ['Remaining', fmtNum(stock.quantityRemaining)]].map(([l, v]) => (
                <div key={l} className="flex justify-between">
                  <dt style={{ color: '#64748b' }}>{l}</dt>
                  <dd className="font-bold" style={{ color: '#020c1b' }}>{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="card-pad">
        <h3 className="font-bold text-sm mb-4" style={{ color: '#020c1b' }}>Stock History</h3>
        {!stock.history?.length ? (
          <p className="text-sm text-center py-6" style={{ color: '#94a3b8' }}>No history yet</p>
        ) : (
          <div className="space-y-2">
            {[...stock.history].reverse().map((h, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <div className={`mt-0.5 ${h.action === 'added' ? 'text-green-600' : 'text-red-500'}`}>
                  {h.action === 'added' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold capitalize" style={{ color: '#020c1b' }}>{h.action}</span>
                    {h.reference && <span className="serial-tag">{h.reference}</span>}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{h.notes}</p>
                  <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{fmtDateTime(h.createdAt)} · {h.performedBy?.name || 'System'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: '#94a3b8' }}>Before → After</p>
                  <p className="text-sm font-mono font-bold" style={{ color: '#334155' }}>
                    {h.quantityBefore} → <span className={h.action === 'added' ? 'text-green-600' : 'text-red-500'}>{h.quantityAfter}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function EditStockPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [stock, setStock] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [qtyAdd, setQtyAdd] = useState('')
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    api.get(`/stock/${id}`).then(r => {
      const s = r.data.stock
      setStock(s)
      setForm({
        name: s.name, specification: s.specification, category: s.category,
        screenSize: s.screenSize || '', processor: s.processor || '', ram: s.ram || '',
        storage: s.storage || '', deviceSize: s.deviceSize || '', resolution: s.resolution || '',
        unit: s.unit, dateIn: s.dateIn?.split('T')[0] || '', dateOut: s.dateOut?.split('T')[0] || '',
        minStockLevel: s.minStockLevel, location: s.location || '', supplier: s.supplier || '',
        unitPrice: s.unitPrice || '', notes: s.notes || ''
      })
    }).finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/stock/${id}`, { ...form, quantityAdded: qtyAdd ? parseInt(qtyAdd) : 0 })
      toast.success('Stock updated!')
      navigate(`/stock/${id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed')
    } finally { setSaving(false) }
  }

  if (loading) return <LoadingSpinner />

  const catInfo = CATEGORIES.find(c => c.value === form.category) || {}

  return (
    <div className="fade-up max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/stock/${id}`} className="btn btn-ghost btn-sm gap-2 text-sm"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <div>
          <h1 className="page-title">Edit Stock Item</h1>
          <p className="page-subtitle font-mono text-xs">{stock?.serialNumber}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Add Quantity */}
        <div className="card-pad" style={{ border: '2px solid #bfdbfe', background: '#eff6ff' }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: '#1e40af' }}>➕ Add New Stock</h3>
          <div className="grid sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="field-label">Last Quantity</label>
              <input className="input input-bordered w-full bg-white text-sm" value={stock?.quantityRemaining} disabled />
            </div>
            <div>
              <label className="field-label">Quantity to Add</label>
              <input type="number" min="0" className="input input-bordered w-full bg-white text-sm"
                placeholder="Enter amount" value={qtyAdd} onChange={e => setQtyAdd(e.target.value)} />
            </div>
            <div>
              <label className="field-label">New Total</label>
              <input className="input input-bordered w-full text-sm font-bold"
                style={{ background: '#dcfce7', color: '#16a34a' }}
                value={(stock?.quantityRemaining || 0) + (parseInt(qtyAdd) || 0)} disabled />
            </div>
          </div>
        </div>

        {/* Item Details */}
        <div className="card-pad">
          <h3 className="font-bold text-sm mb-4 pb-3 border-b border-slate-100" style={{ color: '#020c1b' }}>Item Details</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Category</label>
              <select className="select select-bordered w-full bg-white text-sm" value={form.category} onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Product Name *</label>
              <input className="input input-bordered w-full bg-white text-sm" value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            {catInfo.hasScreen && (
              <div>
                <label className="field-label">Screen Size</label>
                <select className="select select-bordered w-full bg-white text-sm" value={form.screenSize} onChange={e => set('screenSize', e.target.value)}>
                  <option value="">Select</option>
                  {SCREEN_SIZES.map(s => <option key={s} value={s}>{s}"</option>)}
                </select>
              </div>
            )}
            {catInfo.hasOps && (
              <>
                <div>
                  <label className="field-label">Processor</label>
                  <select className="select select-bordered w-full bg-white text-sm" value={form.processor} onChange={e => set('processor', e.target.value)}>
                    <option value="">Select</option>
                    {PROCESSORS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">RAM</label>
                  <select className="select select-bordered w-full bg-white text-sm" value={form.ram} onChange={e => set('ram', e.target.value)}>
                    <option value="">Select</option>
                    {RAM_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">Storage</label>
                  <select className="select select-bordered w-full bg-white text-sm" value={form.storage} onChange={e => set('storage', e.target.value)}>
                    <option value="">Select</option>
                    {STORAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}
            {catInfo.hasCamera && (
              <div>
                <label className="field-label">Resolution</label>
                <select className="select select-bordered w-full bg-white text-sm" value={form.resolution} onChange={e => set('resolution', e.target.value)}>
                  <option value="">Select</option>
                  {RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
            <div className="sm:col-span-2">
              <label className="field-label">Specification *</label>
              <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={2} value={form.specification} onChange={e => set('specification', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Date In</label>
              <input type="date" className="input input-bordered w-full bg-white text-sm" value={form.dateIn} onChange={e => set('dateIn', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Date Out</label>
              <input type="date" className="input input-bordered w-full bg-white text-sm" value={form.dateOut} onChange={e => set('dateOut', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Min. Stock Level</label>
              <input type="number" min="0" className="input input-bordered w-full bg-white text-sm" value={form.minStockLevel} onChange={e => set('minStockLevel', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Location</label>
              <input className="input input-bordered w-full bg-white text-sm" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Supplier</label>
              <input className="input input-bordered w-full bg-white text-sm" value={form.supplier} onChange={e => set('supplier', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Unit Price (₦)</label>
              <input type="number" min="0" step="0.01" className="input input-bordered w-full bg-white text-sm" value={form.unitPrice} onChange={e => set('unitPrice', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Notes</label>
              <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={saving} className="btn btn-primary text-white gap-2">
            {saving ? <span className="loading loading-spinner loading-sm" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
          <Link to={`/stock/${id}`} className="btn btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  )
}

export default StockDetailPage
