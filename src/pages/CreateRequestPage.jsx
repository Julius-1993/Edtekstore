import { useState, useEffect, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { categoryLabel } from '../utils/format'
import { ArrowLeft, Search, Trash2, Send, Save, Eye } from 'lucide-react'

// Defined OUTSIDE the parent so it NEVER gets recreated on re-render
function StockDropdown({ results, onAdd }) {
  if (!results.length) return null
  return (
    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
      {results.map(s => (
        <button key={s._id} type="button" onClick={() => onAdd(s)}
          className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#020c1b' }}>
                {s.name}{s.screenSize ? ` ${s.screenSize}"` : ''}
              </p>
              <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                <span className="font-mono">{s.serialNumber}</span> · {categoryLabel(s.category)}
              </p>
            </div>
            <div className="text-right ml-3 flex-shrink-0">
              <p className="text-sm font-bold text-green-600">{s.quantityRemaining}</p>
              <p className="text-xs text-slate-400">available</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}

export default function CreateRequestPage() {
  const navigate = useNavigate()

  const [stockSearch, setStockSearch]     = useState('')
  const [stockResults, setStockResults]   = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [submitting, setSubmitting]       = useState(false)
  const [savingDraft, setSavingDraft]     = useState(false)
  const [showPreview, setShowPreview]     = useState(false)
  const [items, setItems]                 = useState([])

  // Individual state per field — avoids the remount bug caused by nested component functions
  const [toOrganization, setToOrganization]             = useState('')
  const [toDepartment, setToDepartment]                 = useState('')
  const [contactPerson, setContactPerson]               = useState('')
  const [contactPhone, setContactPhone]                 = useState('')
  const [contactEmail, setContactEmail]                 = useState('')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [deliveryAddress, setDeliveryAddress]           = useState('')
  const [priority, setPriority]                         = useState('medium')
  const [requestNotes, setRequestNotes]                 = useState('')

  // ── Stock search ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (stockSearch.length < 1) { setStockResults([]); return }
    const t = setTimeout(async () => {
      setLoadingSearch(true)
      try {
        const res = await api.get('/stock', { params: { search: stockSearch, limit: 8 } })
        setStockResults(res.data.stocks.filter(s => s.quantityRemaining > 0))
      } catch (e) { console.error(e) }
      finally { setLoadingSearch(false) }
    }, 600)
    return () => clearTimeout(t)
  }, [stockSearch])

  const addItem = useCallback((stock) => {
    setItems(prev => {
      if (prev.find(i => i.stockId === stock._id)) { toast.error('Already added'); return prev }
      return [...prev, {
        stockId: stock._id, serialNumber: stock.serialNumber,
        name: stock.name, screenSize: stock.screenSize,
        specification: stock.specification, unit: stock.unit,
        available: stock.quantityRemaining, category: stock.category, quantity: 1
      }]
    })
    setStockSearch('')
    setStockResults([])
  }, [])

  const removeItem = useCallback((stockId) => {
    setItems(p => p.filter(i => i.stockId !== stockId))
  }, [])

  const updateQty = useCallback((stockId, qty) => {
    setItems(p => p.map(i => i.stockId === stockId ? { ...i, quantity: parseInt(qty) || 1 } : i))
  }, [])

  const getFormValues = () => ({
    toOrganization, toDepartment, priority, requestNotes,
    contactPerson, contactPhone, contactEmail,
    deliveryAddress, expectedDeliveryDate
  })

  const validate = () => {
    if (!toOrganization || !toDepartment) { toast.error('Organization and department required'); return false }
    if (items.length === 0) { toast.error('Add at least one item'); return false }
    for (const i of items) {
      if (i.quantity < 1 || i.quantity > i.available) {
        toast.error(`Invalid quantity for "${i.name}". Max: ${i.available}`); return false
      }
    }
    return true
  }

  const buildPayload = (isDraft) => ({
    ...getFormValues(),
    isDraft,
    items: items.map(i => ({ stockId: i.stockId, quantity: parseInt(i.quantity) }))
  })

  const handleSaveDraft = async () => {
    if (items.length === 0) { toast.error('Add at least one item to save draft'); return }
    setSavingDraft(true)
    try {
      const res = await api.post('/requests', buildPayload(true))
      toast.success('Draft saved!')
      navigate(`/requests/${res.data.request._id}`)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save draft') }
    finally { setSavingDraft(false) }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await api.post('/requests', buildPayload(false))
      toast.success('Request submitted!')
      navigate(`/requests/${res.data.request._id}`)
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed') }
    finally { setSubmitting(false) }
  }

  // Preview mode
  if (showPreview) return (
    <div className="fade-up max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setShowPreview(false)} className="btn btn-ghost btn-sm gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Edit
        </button>
        <div>
          <h1 className="page-title">Preview Request</h1>
          <p className="page-subtitle">Review before submitting</p>
        </div>
      </div>
      <div className="space-y-5">
        <div className="card-pad">
          <h3 className="font-bold text-sm mb-4" style={{ color: '#020c1b' }}>Destination</h3>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            {[
              ['Organization', toOrganization], ['Department', toDepartment],
              ['Contact', contactPerson || '—'], ['Phone', contactPhone || '—'],
              ['Email', contactEmail || '—'], ['Priority', priority],
              ['Expected Delivery', expectedDeliveryDate || '—'], ['Address', deliveryAddress || '—']
            ].map(([l, v]) => (
              <div key={l}>
                <dt className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{l}</dt>
                <dd className="font-medium mt-0.5" style={{ color: '#334155' }}>{v}</dd>
              </div>
            ))}
            {requestNotes && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Notes</dt>
                <dd className="mt-0.5 text-slate-600">{requestNotes}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="card-pad">
          <h3 className="font-bold text-sm mb-4" style={{ color: '#020c1b' }}>Items ({items.length})</h3>
          <table className="table w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="th">#</th><th className="th">Item</th>
                <th className="th">Serial</th><th className="th">Spec</th>
                <th className="th text-right">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, i) => (
                <tr key={item.stockId}>
                  <td className="td text-slate-400">{i + 1}</td>
                  <td className="td font-semibold" style={{ color: '#020c1b' }}>
                    {item.name}{item.screenSize ? ` ${item.screenSize}"` : ''}
                  </td>
                  <td className="td"><span className="serial-tag">{item.serialNumber}</span></td>
                  <td className="td text-slate-500">{item.specification?.slice(0, 40)}</td>
                  <td className="td text-right font-bold">{item.quantity} {item.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary text-white gap-2">
            {submitting ? <span className="loading loading-spinner loading-sm" /> : <Send className="w-4 h-4" />}
            Confirm & Submit
          </button>
          <button onClick={() => setShowPreview(false)} className="btn btn-ghost">Back to Edit</button>
        </div>
      </div>
    </div>
  )

  // Main form
  return (
    <div className="fade-up max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/requests" className="btn btn-ghost btn-sm gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div>
          <h1 className="page-title">New Request</h1>
          <p className="page-subtitle">Submit a goods request for approval</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Destination */}
        <div className="card-pad">
          <h3 className="font-bold text-sm mb-4 pb-3 border-b border-slate-100" style={{ color: '#020c1b' }}>
            Destination Details
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">

            <div>
              <label className="field-label">Organization Name *</label>
              <input className="input input-bordered w-full bg-white text-sm"
                placeholder="e.g. Great Heights Academy"
                value={toOrganization} onChange={e => setToOrganization(e.target.value)} required />
            </div>

            <div>
              <label className="field-label">Department *</label>
              <input className="input input-bordered w-full bg-white text-sm"
                placeholder="e.g. IT, Operations"
                value={toDepartment} onChange={e => setToDepartment(e.target.value)} required />
            </div>

            <div>
              <label className="field-label">Contact Person</label>
              <input className="input input-bordered w-full bg-white text-sm"
                placeholder="Recipient name"
                value={contactPerson} onChange={e => setContactPerson(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Contact Phone</label>
              <input className="input input-bordered w-full bg-white text-sm"
                placeholder="+234..."
                value={contactPhone} onChange={e => setContactPhone(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Contact Email (delivery confirmation)</label>
              <input type="email" className="input input-bordered w-full bg-white text-sm"
                placeholder="recipient@org.com"
                value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Expected Delivery Date</label>
              <input type="date" className="input input-bordered w-full bg-white text-sm"
                value={expectedDeliveryDate} onChange={e => setExpectedDeliveryDate(e.target.value)} />
            </div>

            <div className="sm:col-span-2">
              <label className="field-label">Delivery Address</label>
              <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={2}
                placeholder="Full delivery address"
                value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} />
            </div>

            <div>
              <label className="field-label">Priority</label>
              <select className="select select-bordered w-full bg-white text-sm"
                value={priority} onChange={e => setPriority(e.target.value)}>
                {['low', 'medium', 'high', 'urgent'].map(p => (
                  <option key={p} value={p} className="capitalize">{p}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="field-label">Request Notes</label>
              <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={2}
                placeholder="Any special instructions..."
                value={requestNotes} onChange={e => setRequestNotes(e.target.value)} />
            </div>

          </div>
        </div>

        {/* Items */}
        <div className="card-pad">
          <h3 className="font-bold text-sm mb-4 pb-3 border-b border-slate-100" style={{ color: '#020c1b' }}>
            Items to Request{' '}
            <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(26,86,219,0.1)', color: '#1a56db' }}>
              {items.length}
            </span>
          </h3>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input className="input input-bordered w-full pl-9 bg-white text-sm"
              placeholder="Search inventory to add items..."
              value={stockSearch} onChange={e => setStockSearch(e.target.value)} />
            {loadingSearch && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-sm text-primary" />
            )}
            <StockDropdown results={stockResults} onAdd={addItem} />
          </div>

          {items.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-sm text-slate-400">Search and add items above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={item.stockId} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: '#f8fafc' }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                    style={{ background: 'rgba(26,86,219,0.1)', color: '#1a56db' }}>
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: '#020c1b' }}>
                      {item.name}{item.screenSize ? ` ${item.screenSize}"` : ''}
                    </p>
                    <p className="text-xs font-mono" style={{ color: '#64748b' }}>{item.serialNumber}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs" style={{ color: '#94a3b8' }}>Max: {item.available}</span>
                    <input
                      type="number" min="1" max={item.available}
                      className="input input-bordered input-sm w-20 text-center bg-white text-sm"
                      value={item.quantity}
                      onChange={e => updateQty(item.stockId, e.target.value)}
                    />
                    <span className="text-xs" style={{ color: '#94a3b8' }}>{item.unit}</span>
                    <button type="button" onClick={() => removeItem(item.stockId)}
                      className="btn btn-ghost btn-sm btn-circle text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <button type="submit" disabled={submitting || items.length === 0}
            className="btn btn-primary text-white gap-2">
            {submitting ? <span className="loading loading-spinner loading-sm" /> : <Send className="w-4 h-4" />}
            Submit Request
          </button>
          <button type="button" onClick={() => { if (validate()) setShowPreview(true) }}
            className="btn btn-outline gap-2">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button type="button" onClick={handleSaveDraft} disabled={savingDraft}
            className="btn btn-ghost gap-2">
            {savingDraft ? <span className="loading loading-spinner loading-sm" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <Link to="/requests" className="btn btn-ghost">Cancel</Link>
        </div>

      </form>
    </div>
  )
}
