import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { fmtDate, fmtDateTime, categoryLabel, priorityColor, WORKFLOW_STAGES, SOFTWARE_LIST, SOFTWARE_STATUSES, softwareStatusColor } from '../utils/format'
import { StatusBadge, LoadingSpinner } from '../components/shared'
import toast from 'react-hot-toast'
import { ArrowLeft, CheckCircle, XCircle, Package, Settings, Truck, Mail, AlertTriangle, Building2, User, Laptop, Plus, Trash2, Save, Send, Pencil, Printer } from 'lucide-react'

const STAGE_ORDER = ['pending','approved','processing','shipped','confirmed','completed']

export default function RequestDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [request, setRequest]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [approveModal, setApproveModal]   = useState(false)
  const [rejectModal, setRejectModal]     = useState(false)
  const [processModal, setProcessModal]   = useState(false)
  const [shipModal, setShipModal]         = useState(false)
  const [softwareModal, setSoftwareModal] = useState(false)
  const [softwarePopup, setSoftwarePopup] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [approvedQtys, setApprovedQtys]   = useState({})
  const [technicalNotes, setTechnicalNotes] = useState('')
  const [shippingNotes, setShippingNotes]   = useState('')
  const [resendEmail, setResendEmail]       = useState('')
  const [softwareList, setSoftwareList]     = useState([])
  const [savingSw, setSavingSw]             = useState(false)
  const [waybillUrl, setWaybillUrl]         = useState('')
  const [generatingWaybill, setGeneratingWaybill] = useState(false)

  useEffect(() => { fetchRequest() }, [id])

  const fetchRequest = async () => {
    try {
      const res = await api.get(`/requests/${id}`)
      setRequest(res.data.request)
      if (res.data.request.waybillToken) setWaybillUrl(`${window.location.origin}/waybill/${res.data.request.waybillToken}`)
      const qtys = {}
      res.data.request.items?.forEach(i => { qtys[i._id] = i.quantityRequested })
      setApprovedQtys(qtys)
      setSoftwareList(res.data.request.softwareChecklist || [])
    } catch { toast.error('Failed to load request') }
    finally { setLoading(false) }
  }

  const doAction = async (endpoint, body, successMsg, closeModal) => {
    setActionLoading(true)
    try {
      await api.put(`/requests/${id}/${endpoint}`, body)
      toast.success(successMsg)
      closeModal?.()
      fetchRequest()
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed') }
    finally { setActionLoading(false) }
  }

  const handleResendEmail = async () => {
    setActionLoading(true)
    try { await api.post(`/requests/${id}/resend-email`, { email: resendEmail }); toast.success('Email resent!') }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setActionLoading(false) }
  }

  const addSoftware = () => setSoftwareList(p => [...p, { name: SOFTWARE_LIST[0], status: 'Nil', notes: '' }])
  const removeSw = (i) => setSoftwareList(p => p.filter((_,idx) => idx !== i))
  const updateSw = (i, k, v) => setSoftwareList(p => p.map((item, idx) => idx === i ? {...item, [k]:v} : item))

  const saveSoftware = async () => {
    setSavingSw(true)
    try {
      await api.put(`/requests/${id}/software`, { softwareChecklist: softwareList })
      toast.success('Software checklist saved!')
      setSoftwareModal(false)
      fetchRequest()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSavingSw(false) }
  }

  const generateWaybill = async () => {
    setGeneratingWaybill(true)
    try {
      const res = await api.post(`/requests/${id}/waybill`)
      const url = `${window.location.origin}/waybill/${res.data.waybillToken}`
      setWaybillUrl(url)
      toast.success('Waybill ready!')
      window.open(url, '_blank')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to generate waybill') }
    finally { setGeneratingWaybill(false) }
  }

  const handleSubmitDraft = async () => {
    setActionLoading(true)
    try {
      await api.put(`/requests/${id}/submit`)
      toast.success('Request submitted!')
      fetchRequest()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setActionLoading(false) }
  }

  if (loading) return <LoadingSpinner />
  if (!request) return <div className="text-center py-12 text-slate-400">Request not found</div>

  const isStorekeeper = ['storekeeper','admin'].includes(user?.role)
  const isTechnical   = ['technical','admin'].includes(user?.role)
  const isSales       = ['sales','admin'].includes(user?.role)
  const isOwner       = request.requestedBy?._id === user?._id || user?.role === 'admin'
  const stageIdx      = STAGE_ORDER.indexOf(request.status)
  const hasSoftware   = request.softwareChecklist?.length > 0

  // Software status badge class
  const swBadge = (s) => ({ 'Activated':'sw-activated', 'Non Activated':'sw-non-activated', 'Nil':'sw-nil' })[s] || 'sw-nil'

  return (
    <div className="fade-up max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/requests" className="btn btn-ghost btn-sm gap-2 text-sm"><ArrowLeft className="w-4 h-4" /> Back</Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="page-title">{request.requestNumber}</h1>
              <StatusBadge status={request.status} />
              <span className={`text-xs font-bold capitalize ${priorityColor(request.priority)}`}>{request.priority}</span>
            </div>
            <p className="page-subtitle">{fmtDateTime(request.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {/* Draft actions — owner only */}
          {request.status === 'draft' && isOwner && (
            <>
              <Link to={`/requests/${id}/edit`} className="btn btn-outline btn-sm gap-1 text-xs"><Pencil className="w-3.5 h-3.5" /> Edit Draft</Link>
              <button onClick={handleSubmitDraft} disabled={actionLoading} className="btn btn-primary btn-sm text-white gap-1 text-xs">
                {actionLoading ? <span className="loading loading-spinner loading-xs" /> : <Send className="w-3.5 h-3.5" />} Submit
              </button>
            </>
          )}
          {isStorekeeper && request.status === 'pending' && (
            <>
              <button onClick={() => setApproveModal(true)} className="btn btn-success btn-sm text-white gap-1 text-xs"><CheckCircle className="w-3.5 h-3.5" /> Approve</button>
              <button onClick={() => setRejectModal(true)} className="btn btn-error btn-sm text-white gap-1 text-xs"><XCircle className="w-3.5 h-3.5" /> Reject</button>
            </>
          )}
          {isTechnical && request.status === 'approved' && (
            <button onClick={() => setProcessModal(true)} className="btn btn-primary btn-sm text-white gap-1 text-xs"><Settings className="w-3.5 h-3.5" /> Start Processing</button>
          )}
          {isTechnical && ['processing','shipped'].includes(request.status) && (
            <button onClick={() => setSoftwareModal(true)} className="btn btn-outline btn-sm gap-1 text-xs"><Laptop className="w-3.5 h-3.5" /> Software Checklist</button>
          )}
          {isTechnical && request.status === 'processing' && (
            <button onClick={() => setShipModal(true)} className="btn btn-primary btn-sm text-white gap-1 text-xs"><Truck className="w-3.5 h-3.5" /> Mark Shipped</button>
          )}
          {hasSoftware && (
            <button onClick={() => setSoftwarePopup(true)} className="btn btn-ghost btn-sm gap-1 text-xs text-purple-600"><Laptop className="w-3.5 h-3.5" /> View Software</button>
          )}
          {/* Waybill button — available from processing stage onwards */}
          {['processing','shipped','confirmed','completed'].includes(request.status) && (isStorekeeper || isTechnical) && (
            waybillUrl ? (
              <a href={waybillUrl} target="_blank" rel="noreferrer"
                className="btn btn-outline btn-sm gap-1 text-xs text-green-700 border-green-300">
                <Printer className="w-3.5 h-3.5" /> Print Waybill
              </a>
            ) : (
              <button onClick={generateWaybill} disabled={generatingWaybill}
                className="btn btn-outline btn-sm gap-1 text-xs text-green-700 border-green-300">
                {generatingWaybill ? <span className="loading loading-spinner loading-xs" /> : <Printer className="w-3.5 h-3.5" />}
                Generate Waybill
              </button>
            )
          )}
        </div>
      </div>

      {/* Workflow Progress */}
      <div className="card-pad">
        <h3 className="font-bold text-sm mb-4" style={{ color:'#020c1b' }}>Workflow Progress</h3>
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STAGE_ORDER.map((stage, i) => {
            const done   = i < stageIdx
            const active = i === stageIdx
            const isRej  = request.status === 'rejected'
            return (
              <div key={stage} className="flex items-center gap-1 flex-shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done?'bg-green-500 text-white':active?(isRej?'bg-red-500 text-white':'text-white'):'bg-slate-100 text-slate-400'}`}
                    style={active && !isRej ? { background:'#1a56db' } : {}}>
                    {done ? '✓' : i+1}
                  </div>
                  <span className={`text-xs font-medium capitalize whitespace-nowrap ${done?'text-green-600':active?(isRej?'text-red-600':'text-blue-600'):'text-slate-400'}`}>{stage}</span>
                </div>
                {i < STAGE_ORDER.length-1 && <div className={`h-0.5 w-8 sm:w-14 mb-4 flex-shrink-0 ${i<stageIdx?'bg-green-400':'bg-slate-200'}`} />}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Destination */}
          <div className="card-pad">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color:'#020c1b' }}>
              <Building2 className="w-4 h-4" style={{ color:'#1a56db' }} /> Destination
            </h3>
            <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[['Organization',request.toOrganization],['Department',request.toDepartment],['Contact',request.contactPerson||'—'],['Phone',request.contactPhone||'—'],['Email',request.contactEmail||'—'],['Address',request.deliveryAddress||'—'],['Expected Delivery',fmtDate(request.expectedDeliveryDate)||'—']].map(([l,v])=>(
                <div key={l}><dt className="text-xs font-semibold uppercase tracking-wide mb-0.5" style={{color:'#94a3b8'}}>{l}</dt><dd className="font-medium" style={{color:'#334155'}}>{v}</dd></div>
              ))}
            </dl>
          </div>

          {/* Items */}
          <div className="card-pad">
            <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color:'#020c1b' }}>
              <Package className="w-4 h-4" style={{ color:'#1a56db' }} /> Items ({request.items?.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead className="bg-slate-50"><tr>
                  <th className="th">#</th><th className="th">Serial</th><th className="th">Item</th>
                  <th className="th">Category</th><th className="th">Spec</th>
                  <th className="th text-right">Requested</th><th className="th text-right">Approved</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {request.items?.map((item, idx) => (
                    <tr key={item._id}>
                      <td className="td text-slate-400">{idx+1}</td>
                      <td className="td"><span className="serial-tag">{item.serialNumber}</span></td>
                      <td className="td font-semibold" style={{color:'#020c1b'}}>{item.name}{item.screenSize?` ${item.screenSize}"`:''}</td>
                      <td className="td text-xs text-slate-500 capitalize">{categoryLabel(item.category)}</td>
                      <td className="td text-slate-500 max-w-[100px] truncate">{item.specification}</td>
                      <td className="td text-right font-mono font-bold">{item.quantityRequested} <span className="text-xs text-slate-400">{item.unit}</span></td>
                      <td className="td text-right">
                        {request.status==='pending'||request.status==='draft' ? <span className="text-xs text-slate-400">—</span>
                          : <span className={`font-mono font-bold ${item.quantityApproved>0?'text-green-600':'text-red-500'}`}>{item.quantityApproved} <span className="text-xs text-slate-400">{item.unit}</span></span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {(request.requestNotes||request.approvalNotes||request.rejectionReason||request.technicalNotes||request.shippingNotes||request.deliveryNotes||request.missingItemsNote) && (
            <div className="card-pad space-y-3">
              {[['Request Notes',request.requestNotes,null],['Approval Notes',request.approvalNotes,null],['Rejection Reason',request.rejectionReason,'red'],['Technical Notes',request.technicalNotes,null],['Shipping Notes',request.shippingNotes,null],['Delivery Notes',request.deliveryNotes,null],['Missing Items',request.missingItemsNote,'red']].filter(([,v])=>v).map(([label,value,color])=>(
                <div key={label}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{color:color==='red'?'#dc2626':'#94a3b8'}}>{label}</p>
                  <p className="text-sm p-3 rounded-lg" style={{background:color==='red'?'#fef2f2':'#f8fafc',color:color==='red'?'#991b1b':'#334155'}}>{value}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          <div className="card-pad">
            <h3 className="font-bold text-sm mb-3" style={{color:'#020c1b'}}>People</h3>
            <div className="space-y-3 text-sm">
              {[['Requested by',request.requestedBy],request.approvedBy&&['Approved by',request.approvedBy],request.technicalBy&&['Technical by',request.technicalBy],request.shippedBy&&['Shipped by',request.shippedBy],request.deliveryConfirmedBy&&['Confirmed by',{name:request.deliveryConfirmedBy}]].filter(Boolean).map(([label,person])=>(
                <div key={label} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{background:'rgba(26,86,219,0.1)'}}>
                    <User className="w-3.5 h-3.5" style={{color:'#1a56db'}} />
                  </div>
                  <div><p className="text-xs" style={{color:'#94a3b8'}}>{label}</p><p className="text-xs font-semibold" style={{color:'#020c1b'}}>{person?.name}</p>{person?.email&&<p className="text-xs" style={{color:'#64748b'}}>{person.email}</p>}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card-pad">
            <h3 className="font-bold text-sm mb-3" style={{color:'#020c1b'}}>Timeline</h3>
            <div className="space-y-1 text-xs">
              {[['Requested',request.createdAt],['Approved',request.approvedAt],['Processing',request.processingStartedAt],['Shipped',request.shippedAt],['Confirmed',request.confirmedAt],['Completed',request.completedAt]].filter(([,d])=>d).map(([l,d])=>(
                <div key={l} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
                  <span style={{color:'#64748b'}}>{l}</span>
                  <span className="font-medium" style={{color:'#334155'}}>{fmtDate(d)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery confirmation */}
          {['shipped','confirmed','completed'].includes(request.status) && (
            <div className={`card-pad border-2 ${['confirmed','completed'].includes(request.status)?'border-green-200':'border-blue-100'}`}
              style={{background:['confirmed','completed'].includes(request.status)?'#f0fdf4':'#eff6ff'}}>
              <h3 className="font-bold text-sm mb-2" style={{color:['confirmed','completed'].includes(request.status)?'#15803d':'#1e40af'}}>
                {['confirmed','completed'].includes(request.status)?'✅ Delivery Confirmed':'📧 Awaiting Confirmation'}
              </h3>
              {['confirmed','completed'].includes(request.status) ? (
                <div className="text-xs space-y-1">
                  <p style={{color:'#15803d'}}>By: <strong>{request.deliveryConfirmedBy}</strong></p>
                  <p style={{color:'#15803d'}}>On: {fmtDateTime(request.confirmedAt)}</p>
                  {request.missingItemsNote && <p className="text-red-600 mt-1"><strong>Missing:</strong> {request.missingItemsNote}</p>}
                  {request.deliveryNotes && <p style={{color:'#166534'}} className="italic mt-1">"{request.deliveryNotes}"</p>}
                </div>
              ) : (
                <p className="text-xs" style={{color:'#3b82f6'}}>Waiting for recipient to confirm...</p>
              )}
              {(isStorekeeper||isTechnical) && request.status==='shipped' && (
                <div className="mt-3 pt-3" style={{borderTop:'1px solid #bfdbfe'}}>
                  <p className="text-xs mb-1.5" style={{color:'#64748b'}}>Resend to:</p>
                  <div className="flex gap-2">
                    <input type="email" className="input input-bordered input-xs flex-1 bg-white text-xs" placeholder="email@org.com" value={resendEmail} onChange={e=>setResendEmail(e.target.value)} />
                    <button onClick={handleResendEmail} disabled={actionLoading} className="btn btn-xs btn-primary text-white gap-1"><Mail className="w-3 h-3" /> Send</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {user?.role==='admin' && request.status==='confirmed' && (
            <button onClick={() => doAction('complete', {}, 'Marked as completed!')} disabled={actionLoading} className="btn btn-primary btn-sm text-white w-full">
              Mark as Completed
            </button>
          )}
        </div>
      </div>

      {/* Workflow Log */}
      {request.workflowLog?.length > 0 && (
        <div className="card-pad">
          <h3 className="font-bold text-sm mb-4" style={{color:'#020c1b'}}>Activity Log</h3>
          <div className="space-y-0">
            {[...request.workflowLog].reverse().map((log,i) => (
              <div key={i} className="workflow-step">
                <div className="workflow-dot" style={{background:'rgba(26,86,219,0.1)',color:'#1a56db'}}>✓</div>
                <div className="pt-1">
                  <p className="text-sm font-semibold" style={{color:'#020c1b'}}>{log.stage}</p>
                  {log.notes && <p className="text-xs mt-0.5" style={{color:'#64748b'}}>{log.notes}</p>}
                  <p className="text-xs mt-0.5" style={{color:'#94a3b8'}}>{fmtDateTime(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SOFTWARE POPUP (read-only) ── */}
      {softwarePopup && hasSoftware && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base flex items-center gap-2" style={{color:'#020c1b'}}><Laptop className="w-4 h-4 text-purple-600" /> Software Checklist</h3>
              <button onClick={() => setSoftwarePopup(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>
            <div className="space-y-2">
              {request.softwareChecklist.map((sw, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
                  <div>
                    <p className="text-sm font-semibold" style={{color:'#020c1b'}}>{sw.name === 'Other' && sw.customName ? sw.customName : sw.name}</p>
                    {sw.notes && <p className="text-xs text-slate-500 mt-0.5">{sw.notes}</p>}
                  </div>
                  <span className={swBadge(sw.status)}>{sw.status}</span>
                </div>
              ))}
            </div>
            {request.softwareUpdatedAt && (
              <p className="text-xs text-slate-400 mt-4">Last updated: {fmtDateTime(request.softwareUpdatedAt)} by {request.softwareUpdatedBy?.name||'Technical'}</p>
            )}
          </div>
        </div>
      )}

      {/* ── SOFTWARE EDIT MODAL ── */}
      {softwareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base flex items-center gap-2" style={{color:'#020c1b'}}><Laptop className="w-4 h-4 text-purple-600" /> Software Checklist</h3>
              <button onClick={() => setSoftwareModal(false)} className="btn btn-ghost btn-sm btn-circle">✕</button>
            </div>
            <p className="text-sm text-slate-500 mb-4">Record which software has been installed and its activation status.</p>
            <div className="space-y-3 mb-4">
              {softwareList.map((sw, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-start p-3 rounded-xl bg-slate-50">
                  <div className="col-span-4">
                    <label className="field-label">Software</label>
                    <select className="select select-bordered select-sm w-full bg-white text-xs" value={sw.name} onChange={e => updateSw(i,'name',e.target.value)}>
                      {SOFTWARE_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {sw.name === 'Other' && <input className="input input-bordered input-sm w-full bg-white text-xs mt-1" placeholder="Custom name" value={sw.customName||''} onChange={e => updateSw(i,'customName',e.target.value)} />}
                  </div>
                  <div className="col-span-3">
                    <label className="field-label">Status</label>
                    <select className="select select-bordered select-sm w-full bg-white text-xs" value={sw.status} onChange={e => updateSw(i,'status',e.target.value)}>
                      {SOFTWARE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-4">
                    <label className="field-label">Notes</label>
                    <input className="input input-bordered input-sm w-full bg-white text-xs" placeholder="Optional note" value={sw.notes||''} onChange={e => updateSw(i,'notes',e.target.value)} />
                  </div>
                  <div className="col-span-1 pt-5">
                    <button type="button" onClick={() => removeSw(i)} className="btn btn-ghost btn-xs btn-circle text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addSoftware} className="btn btn-ghost btn-sm gap-2 mb-4 text-purple-600">
              <Plus className="w-4 h-4" /> Add Software
            </button>
            <div className="flex gap-3 border-t border-slate-100 pt-4">
              <button onClick={saveSoftware} disabled={savingSw} className="btn btn-primary text-white flex-1 gap-2">
                {savingSw ? <span className="loading loading-spinner loading-sm" /> : <Save className="w-4 h-4" />} Save Checklist
              </button>
              <button onClick={() => setSoftwareModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── APPROVE MODAL ── */}
      {approveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold mb-1" style={{color:'#020c1b'}}>Approve Request</h3>
            <p className="text-sm mb-4" style={{color:'#64748b'}}>{request.requestNumber} → {request.toOrganization}</p>
            <div className="rounded-xl p-3 mb-4 flex gap-2" style={{background:'#fffbeb',border:'1px solid #fde68a'}}>
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">Approving will deduct quantities from inventory and forward to Technical Team. An email notification will be sent to the requester.</p>
            </div>
            <h4 className="text-xs font-bold uppercase tracking-wide mb-3" style={{color:'#64748b'}}>Set Approved Quantities</h4>
            <div className="space-y-2 mb-4">
              {request.items?.map(item => (
                <div key={item._id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="flex-1"><p className="text-sm font-semibold" style={{color:'#020c1b'}}>{item.name}{item.screenSize?` ${item.screenSize}"`:''}</p><p className="text-xs font-mono" style={{color:'#64748b'}}>{item.serialNumber}</p></div>
                  <div className="flex items-center gap-2 text-sm flex-shrink-0">
                    <span className="text-xs" style={{color:'#64748b'}}>Req: <strong>{item.quantityRequested}</strong></span>
                    <span className="text-xs text-slate-300">|</span>
                    <span className="text-xs" style={{color:'#64748b'}}>Approve:</span>
                    <input type="number" min="0" max={item.quantityRequested} className="input input-bordered input-sm w-16 text-center bg-white text-sm"
                      value={approvedQtys[item._id]??item.quantityRequested} onChange={e => setApprovedQtys(p=>({...p,[item._id]:parseInt(e.target.value)||0}))} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <label className="field-label">Approval Notes</label>
              <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={2} placeholder="Optional notes..." value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => doAction('approve', {action:'approve',approvalNotes,approvedItems:approvedQtys},'Request approved! Email sent.', ()=>setApproveModal(false))} disabled={actionLoading} className="btn btn-success flex-1 text-white">
                {actionLoading ? <span className="loading loading-spinner loading-sm" /> : '✓ Approve & Notify'}
              </button>
              <button onClick={() => setApproveModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold mb-1" style={{color:'#020c1b'}}>Reject Request</h3>
            <p className="text-sm mb-4" style={{color:'#64748b'}}>{request.requestNumber}</p>
            <div className="mb-4">
              <label className="field-label">Rejection Reason *</label>
              <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={3} placeholder="Explain why..." value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { if(!rejectionReason.trim()){toast.error('Reason required');return} doAction('approve',{action:'reject',rejectionReason},'Request rejected',()=>setRejectModal(false)) }} disabled={actionLoading} className="btn btn-error flex-1 text-white">
                {actionLoading ? <span className="loading loading-spinner loading-sm" /> : 'Confirm Rejection'}
              </button>
              <button onClick={() => setRejectModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── PROCESS MODAL ── */}
      {processModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold mb-1" style={{color:'#020c1b'}}>Start Processing</h3>
            <p className="text-sm mb-4" style={{color:'#64748b'}}>Mark this request as being handled by the Technical Team.</p>
            <div className="mb-4">
              <label className="field-label">Technical Notes</label>
              <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={3} placeholder="Processing notes..." value={technicalNotes} onChange={e => setTechnicalNotes(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => doAction('process',{technicalNotes},'Processing started!',()=>setProcessModal(false))} disabled={actionLoading} className="btn btn-primary flex-1 text-white">
                {actionLoading ? <span className="loading loading-spinner loading-sm" /> : 'Start Processing'}
              </button>
              <button onClick={() => setProcessModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHIP MODAL ── */}
      {shipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold mb-1" style={{color:'#020c1b'}}>Mark as Shipped</h3>
            <p className="text-sm mb-1" style={{color:'#64748b'}}>A delivery confirmation email will be sent to the recipient.</p>
            <p className="text-xs mb-4 font-medium" style={{color:'#1a56db'}}>📧 {request.contactEmail || request.requestedBy?.email}</p>
            <div className="mb-4">
              <label className="field-label">Shipping Notes</label>
              <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={3} placeholder="Courier, tracking number..." value={shippingNotes} onChange={e => setShippingNotes(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button onClick={() => doAction('ship',{shippingNotes},'Shipped! Confirmation email sent.',()=>setShipModal(false))} disabled={actionLoading} className="btn btn-primary flex-1 text-white">
                {actionLoading ? <span className="loading loading-spinner loading-sm" /> : '🚚 Mark Shipped & Send Email'}
              </button>
              <button onClick={() => setShipModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
