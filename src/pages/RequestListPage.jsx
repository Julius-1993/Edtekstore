import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { fmtDateTime, priorityColor } from '../utils/format'
import { StatusBadge, LoadingSpinner, PageHeader } from '../components/shared'
import { Plus, Eye, ChevronLeft, ChevronRight, CheckCircle, XCircle, ClipboardList, Laptop } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['draft','pending','approved','processing','shipped','confirmed','completed','rejected']

export default function RequestListPage() {
  const { user } = useAuth()
  const [requests, setRequests]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)
  const [selected, setSelected]     = useState([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const canCreate = ['sales','admin'].includes(user?.role)
  const canReview = ['storekeeper','admin'].includes(user?.role)

  const fetchRequests = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/requests', { params:{ status:statusFilter, page, limit:15 } })
      setRequests(res.data.requests)
      setTotalPages(res.data.pages)
      setTotal(res.data.total)
      setSelected([])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [statusFilter, page])

  useEffect(() => { fetchRequests() }, [fetchRequests])

  const pending = requests.filter(r => r.status === 'pending')
  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(i=>i!==id) : [...p,id])
  const toggleAll = () => setSelected(selected.length === pending.length ? [] : pending.map(r=>r._id))

  const handleBulkAction = async (action) => {
    if (selected.length === 0) return
    if (action === 'reject' && !rejectReason.trim()) { toast.error('Rejection reason required'); return }
    setBulkLoading(true)
    try {
      const res = await api.put('/requests/bulk/approve', { requestIds:selected, action, rejectionReason:rejectReason })
      toast.success(res.data.message)
      setRejectModal(false); setRejectReason('')
      fetchRequests()
    } catch (err) { toast.error(err.response?.data?.message || 'Bulk action failed') }
    finally { setBulkLoading(false) }
  }

  return (
    <div className="fade-up space-y-5">
      <PageHeader title="Requests" subtitle={`${total} total`}
        action={canCreate && (
          <Link to="/requests/create" className="btn btn-primary text-white gap-2 text-sm"><Plus className="w-4 h-4" /> New Request</Link>
        )} />

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setStatusFilter(''); setPage(1) }} className={`btn btn-sm ${statusFilter===''?'btn-primary text-white':'btn-ghost'}`}>All</button>
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }} className={`btn btn-sm capitalize ${statusFilter===s?'btn-primary text-white':'btn-ghost'}`}>{s}</button>
        ))}
      </div>

      {canReview && selected.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background:'#eff6ff', border:'1px solid #bfdbfe' }}>
          <span className="text-sm font-semibold" style={{ color:'#1e40af' }}>{selected.length} selected</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => handleBulkAction('approve')} disabled={bulkLoading} className="btn btn-success btn-sm text-white gap-1 text-xs">
              {bulkLoading ? <span className="loading loading-spinner loading-xs" /> : <CheckCircle className="w-3.5 h-3.5" />} Approve All
            </button>
            <button onClick={() => setRejectModal(true)} disabled={bulkLoading} className="btn btn-error btn-sm text-white gap-1 text-xs"><XCircle className="w-3.5 h-3.5" /> Reject All</button>
            <button onClick={() => setSelected([])} className="btn btn-ghost btn-sm text-xs">Clear</button>
          </div>
        </div>
      )}

      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {canReview && (statusFilter===''||statusFilter==='pending') && (
                  <th className="px-4 py-3 w-10"><input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={selected.length===pending.length && pending.length>0} onChange={toggleAll} /></th>
                )}
                <th className="th">Request #</th>
                <th className="th">Organization</th>
                <th className="th">Department</th>
                <th className="th">Requested By</th>
                <th className="th">Items</th>
                <th className="th">Priority</th>
                <th className="th">Date</th>
                <th className="th">Status</th>
                <th className="th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="py-12 text-center"><LoadingSpinner /></td></tr>
              ) : requests.length===0 ? (
                <tr><td colSpan={10} className="py-16 text-center"><ClipboardList className="w-10 h-10 mx-auto mb-2 text-slate-300" /><p className="text-sm text-slate-400">No requests found</p></td></tr>
              ) : requests.map(r => (
                <tr key={r._id} className={`hover:bg-slate-50 transition-colors ${selected.includes(r._id)?'bg-blue-50':''}`}>
                  {canReview && (statusFilter===''||statusFilter==='pending') && (
                    <td className="px-4 py-3">{r.status==='pending' && <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={selected.includes(r._id)} onChange={()=>toggleSelect(r._id)} />}</td>
                  )}
                  <td className="td"><span className="serial-tag">{r.requestNumber}</span></td>
                  <td className="td font-semibold" style={{color:'#020c1b'}}>{r.toOrganization}</td>
                  <td className="td">{r.toDepartment}</td>
                  <td className="td">{r.requestedBy?.name}</td>
                  <td className="td text-center font-bold">{r.items?.length}</td>
                  <td className="td"><span className={`text-xs font-semibold capitalize ${priorityColor(r.priority)}`}>{r.priority}</span></td>
                  <td className="td text-slate-500 text-xs">{fmtDateTime(r.createdAt)}</td>
                  <td className="td"><StatusBadge status={r.status} /></td>
                  <td className="td">
                    <Link to={`/requests/${r._id}`} className="btn btn-ghost btn-xs gap-1 text-xs"><Eye className="w-3 h-3" /> View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages>1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="join">
              <button className="join-item btn btn-xs" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}><ChevronLeft className="w-3 h-3" /></button>
              <button className="join-item btn btn-xs" onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}><ChevronRight className="w-3 h-3" /></button>
            </div>
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold mb-1" style={{color:'#020c1b'}}>Reject {selected.length} Request{selected.length>1?'s':''}</h3>
            <p className="text-sm mb-4" style={{color:'#64748b'}}>This will notify all requesters.</p>
            <textarea className="textarea textarea-bordered w-full bg-white text-sm mb-4" rows={3} placeholder="Rejection reason (required)..." value={rejectReason} onChange={e=>setRejectReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={()=>handleBulkAction('reject')} disabled={bulkLoading} className="btn btn-error flex-1 text-white text-sm">
                {bulkLoading ? <span className="loading loading-spinner loading-sm" /> : 'Confirm Reject'}
              </button>
              <button onClick={()=>{setRejectModal(false);setRejectReason('')}} className="btn btn-ghost flex-1 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
