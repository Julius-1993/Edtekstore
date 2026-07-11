import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { fmtDateTime, fmtDate } from '../utils/format'
import { StatusBadge, LoadingSpinner, PageHeader } from '../components/shared'
import { Truck, CheckCircle, Clock, Eye, Package, X  } from 'lucide-react'

export default function DeliveryListPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [viewModal, setViewModal] = useState(false)
  const [viewLoading, setViewLoading] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)

  const openView = async (id) => {
    setViewModal(true)
    setViewLoading(true)
    try {
      const res = await api.get(`/requests/${id}`)
      setSelectedRequest(res.data.request)
    } catch {
      setSelectedRequest(null)
    } finally {
      setViewLoading(false)
    }
  }

  const closeView = () => {
    setViewModal(false)
    setSelectedRequest(null)
  }

  useEffect(() => {
    setLoading(true)
    api.get('/deliveries', { params: { status: statusFilter } })
      .then(r => setRequests(r.data.requests))
      .finally(() => setLoading(false))
  }, [statusFilter])

  const total = requests.length
  const processing = requests.filter(r => r.status === 'processing').length
  const shipped = requests.filter(r => r.status === 'shipped').length
  const confirmed = requests.filter(r => r.status === 'confirmed').length
  const completed = requests.filter(r => r.status === 'completed').length

  return (
    <div className="fade-up space-y-5">
      <PageHeader title="Deliveries" subtitle="Track outgoing goods and delivery confirmations" />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: total, color: '#1a56db', bg: 'rgba(26,86,219,0.08)' },
          { label: 'Processing', value: processing, color: '#7c3aed', bg: 'rgba(124,58,237,0.08)' },
          { label: 'Shipped', value: shipped, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
          { label: 'Confirmed', value: confirmed, color: '#16a34a', bg: 'rgba(22,163,74,0.08)' },
          { label: 'Completed', value: completed, color: '#020c1b', bg: 'rgba(10,22,40,0.06)' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
              <Truck className="w-4 h-4" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs font-medium" style={{ color: '#64748b' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['', 'approved', 'processing', 'shipped', 'confirmed', 'completed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`btn btn-sm capitalize ${statusFilter === s ? 'btn-primary text-white' : 'btn-ghost'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="th">Request #</th>
                <th className="th">Organization</th>
                <th className="th">Department</th>
                <th className="th">Items</th>
                <th className="th">Shipped At</th>
                <th className="th">Confirmed At</th>
                <th className="th">Missing Items</th>
                <th className="th">Status</th>
                <th className="th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={9} className="py-12 text-center"><LoadingSpinner /></td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center">
                  <Truck className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-400">No deliveries found</p>
                </td></tr>
              ) : requests.map(r => (
                <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                  <td className="td"><span className="serial-tag">{r.requestNumber}</span></td>
                  <td className="td font-semibold" style={{ color: '#020c1b' }}>{r.toOrganization}</td>
                  <td className="td">{r.toDepartment}</td>
                  <td className="td text-center font-bold">{r.items?.length}</td>
                  <td className="td text-xs text-slate-500">{fmtDateTime(r.shippedAt) || '—'}</td>
                  <td className="td text-xs">
                    {r.confirmedAt ? (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle className="w-3.5 h-3.5" />{fmtDateTime(r.confirmedAt)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-amber-500">
                        <Clock className="w-3.5 h-3.5" />Pending
                      </span>
                    )}
                  </td>
                  <td className="td">
                    {r.missingItemsNote ? (
                      <span className="text-xs text-red-600 font-medium">⚠ {r.missingItemsNote.slice(0, 30)}{r.missingItemsNote.length > 30 ? '...' : ''}</span>
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                  <td className="td"><StatusBadge status={r.status} /></td>
                  <td className="td">
                    <button onClick={() => openView(r._id)} className="btn btn-ghost btn-xs gap-1 text-xs">
                      <Eye className="w-3 h-3" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── VIEW MODAL ── */}
      {viewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base" style={{ color: '#020c1b' }}>
                {selectedRequest ? selectedRequest.requestNumber : 'Request Details'}
              </h3>
              <button onClick={closeView} className="btn btn-ghost btn-sm btn-circle"><X className="w-4 h-4" /></button>
            </div>

            {viewLoading ? (
              <div className="py-10"><LoadingSpinner /></div>
            ) : !selectedRequest ? (
              <p className="text-sm text-slate-400 text-center py-10">Failed to load request</p>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedRequest.status} />
                </div>

                <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                  {[
                    ['Organization', selectedRequest.toOrganization],
                    ['Department', selectedRequest.toDepartment || '—'],
                    ['Contact', selectedRequest.contactPerson || '—'],
                    ['Phone', selectedRequest.contactPhone || '—'],
                    ['Email', selectedRequest.contactEmail || '—'],
                    ['Expected Delivery', fmtDate(selectedRequest.expectedDeliveryDate) || '—'],
                    ['Shipped At', fmtDateTime(selectedRequest.shippedAt) || '—'],
                    ['Confirmed At', fmtDateTime(selectedRequest.confirmedAt) || '—'],
                  ].map(([l, v]) => (
                    <div key={l}>
                      <dt className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#94a3b8' }}>{l}</dt>
                      <dd className="font-medium" style={{ color: '#334155' }}>{v}</dd>
                    </div>
                  ))}
                </dl>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#94a3b8' }}>
                    Items ({selectedRequest.items?.length || 0})
                  </p>
                  <div className="overflow-x-auto">
                    <table className="table w-full text-sm">
                      <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                          <th className="th">Item</th>
                          <th className="th">Serial</th>
                          <th className="th text-right">Requested</th>
                          <th className="th text-right">Approved</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedRequest.items?.map(item => (
                          <tr key={item._id}>
                            <td className="td font-semibold" style={{ color: '#020c1b' }}>
                              {item.name}{item.screenSize ? ` ${item.screenSize}"` : ''}
                            </td>
                            <td className="td"><span className="serial-tag">{item.serialNumber}</span></td>
                            <td className="td text-right font-mono">{item.quantityRequested} {item.unit}</td>
                            <td className="td text-right font-mono">{item.quantityApproved ?? '—'} {item.unit}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {selectedRequest.missingItemsNote && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: '#dc2626' }}>Missing Items</p>
                    <p className="text-sm p-3 rounded-lg" style={{ background: '#fef2f2', color: '#991b1b' }}>
                      {selectedRequest.missingItemsNote}
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-100">
                  <Link to={`/requests/${selectedRequest._id}`} className="text-xs font-medium text-blue-600 hover:underline">
                    Open full request page →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
