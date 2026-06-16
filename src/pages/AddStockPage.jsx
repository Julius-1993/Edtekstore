import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { CATEGORIES, SCREEN_SIZES, PROCESSORS, RAM_OPTIONS, STORAGE_OPTIONS, RESOLUTIONS } from '../utils/format'
import { ArrowLeft, Save } from 'lucide-react'

const init = {
  serialNumber: '', name: '', category: 'teklite', screenSize: '', processor: '', ram: '',
  storage: '', deviceSize: '', resolution: '', specification: '', unit: 'pcs',
  dateIn: '', dateOut: '', quantityInitial: '', minStockLevel: '0',
  location: '', supplier: '', unitPrice: '', notes: ''
}

export default function AddStockPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(init)
  const [loading, setLoading] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const catInfo = CATEGORIES.find(c => c.value === form.category) || {}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/stock', {
        ...form,
        quantityInitial: parseInt(form.quantityInitial),
        minStockLevel: parseInt(form.minStockLevel) || 0,
        unitPrice: parseFloat(form.unitPrice) || 0,
        dateOut: form.dateOut || undefined
      })
      toast.success('Stock item added!')
      navigate(`/stock/${res.data.stock._id}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add stock')
    } finally { setLoading(false) }
  }

  return (
    <div className="fade-up max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/stock" className="btn btn-ghost btn-sm gap-2 text-sm"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <div>
          <h1 className="page-title">Add Stock Item</h1>
          <p className="page-subtitle">Enter new inventory item details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category & Identity */}
        <div className="card-pad">
          <h3 className="font-bold text-sm mb-4 pb-3 border-b border-slate-100" style={{ color: '#020c1b' }}>
            Product Identity
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Category *</label>
              <select className="select select-bordered w-full bg-white text-sm" value={form.category}
                onChange={e => set('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Serial Number *</label>
              <input className="input input-bordered w-full bg-white font-mono text-sm uppercase"
                placeholder="e.g. ZK2026-16Z-002"
                value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Product Name *</label>
              <input className="input input-bordered w-full bg-white text-sm"
                placeholder={catInfo.hasScreen ? 'e.g. Teklite' : 'e.g. OPS Module'}
                value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>

            {/* Screen size for display products */}
            {catInfo.hasScreen && (
              <div>
                <label className="field-label">Screen Size (inches) *</label>
                <select className="select select-bordered w-full bg-white text-sm" value={form.screenSize}
                  onChange={e => set('screenSize', e.target.value)} required>
                  <option value="">Select size</option>
                  {SCREEN_SIZES.map(s => <option key={s} value={s}>{s}"</option>)}
                </select>
              </div>
            )}

            {/* OPS fields */}
            {catInfo.hasOps && (
              <>
                <div>
                  <label className="field-label">Device Size</label>
                  <select className="select select-bordered w-full bg-white text-sm" value={form.deviceSize}
                    onChange={e => set('deviceSize', e.target.value)}>
                    <option value="">Select</option>
                    <option value="small">Small</option>
                    <option value="big">Big</option>
                  </select>
                </div>
                <div>
                  <label className="field-label">Processor</label>
                  <select className="select select-bordered w-full bg-white text-sm" value={form.processor}
                    onChange={e => set('processor', e.target.value)}>
                    <option value="">Select processor</option>
                    {PROCESSORS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">RAM</label>
                  <select className="select select-bordered w-full bg-white text-sm" value={form.ram}
                    onChange={e => set('ram', e.target.value)}>
                    <option value="">Select RAM</option>
                    {RAM_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">Storage</label>
                  <select className="select select-bordered w-full bg-white text-sm" value={form.storage}
                    onChange={e => set('storage', e.target.value)}>
                    <option value="">Select storage</option>
                    {STORAGE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </>
            )}

            {/* Camera fields */}
            {catInfo.hasCamera && (
              <div>
                <label className="field-label">Resolution</label>
                <select className="select select-bordered w-full bg-white text-sm" value={form.resolution}
                  onChange={e => set('resolution', e.target.value)}>
                  <option value="">Select resolution</option>
                  {RESOLUTIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}

            <div className={catInfo.hasScreen ? 'sm:col-span-2' : ''}>
              <label className="field-label">Specification *</label>
              <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={2}
                placeholder="Full product specification details..."
                value={form.specification} onChange={e => set('specification', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Unit</label>
              <select className="select select-bordered w-full bg-white text-sm" value={form.unit}
                onChange={e => set('unit', e.target.value)}>
                {['pcs', 'sets', 'boxes', 'units'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Dates & Quantity */}
        <div className="card-pad">
          <h3 className="font-bold text-sm mb-4 pb-3 border-b border-slate-100" style={{ color: '#020c1b' }}>
            Dates & Quantity
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Date In *</label>
              <input type="date" className="input input-bordered w-full bg-white text-sm"
                value={form.dateIn} onChange={e => set('dateIn', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Date Out (expected)</label>
              <input type="date" className="input input-bordered w-full bg-white text-sm"
                value={form.dateOut} onChange={e => set('dateOut', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Initial Quantity *</label>
              <input type="number" min="0" className="input input-bordered w-full bg-white text-sm"
                value={form.quantityInitial} onChange={e => set('quantityInitial', e.target.value)} required />
            </div>
            <div>
              <label className="field-label">Min. Stock Alert Level</label>
              <input type="number" min="0" className="input input-bordered w-full bg-white text-sm"
                value={form.minStockLevel} onChange={e => set('minStockLevel', e.target.value)} />
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="card-pad">
          <h3 className="font-bold text-sm mb-4 pb-3 border-b border-slate-100" style={{ color: '#020c1b' }}>
            Additional Information
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="field-label">Storage Location</label>
              <input className="input input-bordered w-full bg-white text-sm" placeholder="e.g. Shelf A-3"
                value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Supplier</label>
              <input className="input input-bordered w-full bg-white text-sm" placeholder="e.g. Tech Supplies Ltd"
                value={form.supplier} onChange={e => set('supplier', e.target.value)} />
            </div>
            <div>
              <label className="field-label">Unit Price (₦)</label>
              <input type="number" min="0" step="0.01" className="input input-bordered w-full bg-white text-sm"
                placeholder="0.00" value={form.unitPrice} onChange={e => set('unitPrice', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="field-label">Notes</label>
              <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={2}
                placeholder="Any additional notes..."
                value={form.notes} onChange={e => set('notes', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn btn-primary text-white gap-2">
            {loading ? <span className="loading loading-spinner loading-sm" /> : <Save className="w-4 h-4" />}
            Save Stock Item
          </button>
          <Link to="/stock" className="btn btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
