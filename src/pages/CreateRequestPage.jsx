import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { categoryLabel } from '../utils/format'
import { ArrowLeft, Search, Trash2, Send, Save, Eye } from 'lucide-react'

export default function CreateRequestPage() {
  const navigate = useNavigate()
  const [stockSearch, setStockSearch]   = useState('')
  const [stockResults, setStockResults] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [savingDraft, setSavingDraft]   = useState(false)
  const [showPreview, setShowPreview]   = useState(false)
  const [items, setItems]               = useState([])
  const [form, setForm] = useState({
    toOrganization:'', toDepartment:'', priority:'medium',
    requestNotes:'', contactPerson:'', contactPhone:'',
    contactEmail:'', deliveryAddress:'', expectedDeliveryDate:''
  })
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    if (stockSearch.length < 1) { setStockResults([]); return }
    const t = setTimeout(async () => {
      setLoadingSearch(true)
      try {
        const res = await api.get('/stock', { params:{ search:stockSearch, limit:8 } })
        setStockResults(res.data.stocks.filter(s => s.quantityRemaining > 0))
      } catch(e) { console.error(e) }
      finally { setLoadingSearch(false) }
    }, 600)
    return () => clearTimeout(t)
  }, [stockSearch])

  const addItem = (stock) => {
    if (items.find(i => i.stockId === stock._id)) { toast.error('Already added'); return }
    setItems(p => [...p, { stockId:stock._id, serialNumber:stock.serialNumber, name:stock.name, screenSize:stock.screenSize, specification:stock.specification, unit:stock.unit, available:stock.quantityRemaining, category:stock.category, quantity:1 }])
    setStockSearch(''); setStockResults([])
  }

  const validate = () => {
    if (!form.toOrganization || !form.toDepartment) { toast.error('Organization and department required'); return false }
    if (items.length === 0) { toast.error('Add at least one item'); return false }
    for (const i of items) {
      if (i.quantity < 1 || i.quantity > i.available) { toast.error(`Invalid quantity for "${i.name}". Max: ${i.available}`); return false }
    }
    return true
  }

  const buildPayload = (isDraft) => ({
    ...form,
    isDraft,
    items: items.map(i => ({ stockId:i.stockId, quantity:parseInt(i.quantity) }))
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
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      const res = await api.post('/requests', buildPayload(false))
      toast.success('Request submitted!')
      navigate(`/requests/${res.data.request._id}`)
    } catch (err) { toast.error(err.response?.data?.message || 'Submission failed') }
    finally { setSubmitting(false) }
  }

  const DestForm = () => (
    <div className="card-pad">
      <h3 className="font-bold text-sm mb-4 pb-3 border-b border-slate-100" style={{ color:'#020c1b' }}>Destination Details</h3>
      <div className="grid sm:grid-cols-2 gap-4">
        {[
          ['Organization Name *','text','toOrganization','e.g. Acme Corporation Ltd'],
          ['Department *','text','toDepartment','e.g. IT, Operations'],
          ['Contact Person','text','contactPerson','Recipient name'],
          ['Contact Phone','text','contactPhone','+234...'],
          ['Contact Email (delivery confirmation)','email','contactEmail','recipient@org.com'],
          ['Expected Delivery Date','date','expectedDeliveryDate',''],
        ].map(([label, type, key, ph]) => (
          <div key={key}>
            <label className="field-label">{label}</label>
            <input type={type} className="input input-bordered w-full bg-white text-sm" placeholder={ph}
              value={form[key]} onChange={e => set(key, e.target.value)}
              required={key === 'toOrganization' || key === 'toDepartment'} />
          </div>
        ))}
        <div className="sm:col-span-2">
          <label className="field-label">Delivery Address</label>
          <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={2} placeholder="Full delivery address"
            value={form.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} />
        </div>
        <div>
          <label className="field-label">Priority</label>
          <select className="select select-bordered w-full bg-white text-sm" value={form.priority} onChange={e => set('priority', e.target.value)}>
            {['low','medium','high','urgent'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Request Notes</label>
          <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={2} placeholder="Any special instructions..."
            value={form.requestNotes} onChange={e => set('requestNotes', e.target.value)} />
        </div>
      </div>
    </div>
  )

  const ItemsForm = () => (
    <div className="card-pad">
      <h3 className="font-bold text-sm mb-4 pb-3 border-b border-slate-100" style={{ color:'#020c1b' }}>
        Items to Request <span className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background:'rgba(26,86,219,0.1)', color:'#1a56db' }}>{items.length}</span>
      </h3>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input className="input input-bordered w-full pl-9 bg-white text-sm" placeholder="Search inventory to add items..."
          value={stockSearch} onChange={e => setStockSearch(e.target.value)} />
        {loadingSearch && <span className="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-sm text-primary" />}
        {stockResults.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
            {stockResults.map(s => (
              <button key={s._id} type="button" onClick={() => addItem(s)}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color:'#020c1b' }}>{s.name}{s.screenSize ? ` ${s.screenSize}"` : ''}</p>
                    <p className="text-xs mt-0.5" style={{ color:'#64748b' }}>
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
        )}
      </div>
      {items.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl">
          <p className="text-sm text-slate-400">Search and add items above</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.stockId} className="flex items-center gap-3 p-3 rounded-xl" style={{ background:'#f8fafc' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ background:'rgba(26,86,219,0.1)', color:'#1a56db' }}>{idx + 1}</div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color:'#020c1b' }}>{item.name}{item.screenSize ? ` ${item.screenSize}"` : ''}</p>
                <p className="text-xs font-mono" style={{ color:'#64748b' }}>{item.serialNumber}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs" style={{ color:'#94a3b8' }}>Max: {item.available}</span>
                <input type="number" min="1" max={item.available} className="input input-bordered input-sm w-20 text-center bg-white text-sm"
                  value={item.quantity} onChange={e => setItems(p => p.map(i => i.stockId === item.stockId ? {...i, quantity:parseInt(e.target.value)||1} : i))} />
                <span className="text-xs" style={{ color:'#94a3b8' }}>{item.unit}</span>
                <button type="button" onClick={() => setItems(p => p.filter(i => i.stockId !== item.stockId))}
                  className="btn btn-ghost btn-sm btn-circle text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  // ── PREVIEW MODAL ──────────────────────────────────────────────────────────
  if (showPreview) return (
    <div className="fade-up max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setShowPreview(false)} className="btn btn-ghost btn-sm gap-2 text-sm"><ArrowLeft className="w-4 h-4" /> Back to Edit</button>
        <div><h1 className="page-title">Preview Request</h1><p className="page-subtitle">Review before submitting</p></div>
      </div>
      <div className="space-y-5">
        <div className="card-pad">
          <h3 className="font-bold text-sm mb-4" style={{ color:'#020c1b' }}>Destination</h3>
          <dl className="grid sm:grid-cols-2 gap-3 text-sm">
            {[['Organization',form.toOrganization],['Department',form.toDepartment],['Contact',form.contactPerson||'—'],['Phone',form.contactPhone||'—'],['Email',form.contactEmail||'—'],['Priority',form.priority],['Expected Delivery',form.expectedDeliveryDate||'—'],['Address',form.deliveryAddress||'—']].map(([l,v])=>(
              <div key={l}><dt className="text-xs text-slate-400 font-semibold uppercase tracking-wide">{l}</dt><dd className="font-medium mt-0.5" style={{color:'#334155'}}>{v}</dd></div>
            ))}
            {form.requestNotes && <div className="sm:col-span-2"><dt className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Notes</dt><dd className="mt-0.5 text-slate-600">{form.requestNotes}</dd></div>}
          </dl>
        </div>
        <div className="card-pad">
          <h3 className="font-bold text-sm mb-4" style={{ color:'#020c1b' }}>Items ({items.length})</h3>
          <table className="table w-full text-sm"><thead className="bg-slate-50"><tr><th className="th">#</th><th className="th">Item</th><th className="th">Serial</th><th className="th">Spec</th><th className="th text-right">Qty</th></tr></thead>
            <tbody className="divide-y divide-slate-100">{items.map((item,i)=>(
              <tr key={item.stockId}><td className="td text-slate-400">{i+1}</td><td className="td font-semibold" style={{color:'#020c1b'}}>{item.name}{item.screenSize?` ${item.screenSize}"`:''}</td><td className="td"><span className="serial-tag">{item.serialNumber}</span></td><td className="td text-slate-500">{item.specification?.slice(0,40)}</td><td className="td text-right font-bold">{item.quantity} {item.unit}</td>
              </tr>))}
            </tbody>
          </table>
        </div>
        <div className="flex gap-3">
          <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary text-white gap-2">
            {submitting ? <span className="loading loading-spinner loading-sm" /> : <Send className="w-4 h-4" />} Confirm & Submit
          </button>
          <button onClick={() => setShowPreview(false)} className="btn btn-ghost">Back to Edit</button>
        </div>
      </div>
    </div>
  )

  // ── MAIN FORM ──────────────────────────────────────────────────────────────
  return (
    <div className="fade-up max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/requests" className="btn btn-ghost btn-sm gap-2 text-sm"><ArrowLeft className="w-4 h-4" /> Back</Link>
        <div><h1 className="page-title">New Request</h1><p className="page-subtitle">Submit a goods request for approval</p></div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <DestForm />
        <ItemsForm />
        <div className="flex gap-3 flex-wrap">
          <button type="submit" disabled={submitting || items.length === 0} className="btn btn-primary text-white gap-2">
            {submitting ? <span className="loading loading-spinner loading-sm" /> : <Send className="w-4 h-4" />} Submit Request
          </button>
          <button type="button" onClick={() => { if(validate()) setShowPreview(true) }} className="btn btn-outline gap-2">
            <Eye className="w-4 h-4" /> Preview
          </button>
          <button type="button" onClick={handleSaveDraft} disabled={savingDraft} className="btn btn-ghost gap-2">
            {savingDraft ? <span className="loading loading-spinner loading-sm" /> : <Save className="w-4 h-4" />} Save Draft
          </button>
          <Link to="/requests" className="btn btn-ghost">Cancel</Link>
        </div>
      </form>
    </div>
  )
}
