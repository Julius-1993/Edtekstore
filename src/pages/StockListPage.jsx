import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { fmtDate, fmtNum, CATEGORIES, categoryLabel } from '../utils/format'
import { StatusBadge, LoadingSpinner, PageHeader } from '../components/shared'
import { Plus, Search, Package, Eye, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function StockListPage() {
  const { user } = useAuth()
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const canEdit   = ['storekeeper','admin'].includes(user?.role)
  const canDelete = ['storekeeper','admin'].includes(user?.role)

  const fetchStocks = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/stock', { params: { search, category: catFilter, status: statusFilter, page, limit: 15 } })
      setStocks(res.data.stocks)
      setTotalPages(res.data.pages)
      setTotal(res.data.total)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [search, catFilter, statusFilter, page])

  useEffect(() => { fetchStocks() }, [fetchStocks])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await api.delete(`/stock/${deleteTarget._id}`)
      toast.success('Stock item deleted')
      setDeleteTarget(null)
      fetchStocks()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete')
    } finally { setDeleting(false) }
  }

  return (
    <div className="fade-up space-y-5">
      <PageHeader
        title="Inventory"
        subtitle={`${total} items total`}
        action={canEdit && (
          <Link to="/stock/add" className="btn btn-primary gap-2 text-white text-sm">
            <Plus className="w-4 h-4" /> Add Stock
          </Link>
        )}
      />

      {/* Category Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => { setCatFilter(''); setPage(1) }}
          className={`btn btn-sm ${catFilter === '' ? 'btn-primary text-white' : 'btn-ghost'}`}>
          All
        </button>
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => { setCatFilter(c.value); setPage(1) }}
            className={`btn btn-sm ${catFilter === c.value ? 'btn-primary text-white' : 'btn-ghost'}`}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input input-bordered w-full pl-9 bg-white text-sm"
            placeholder="Search by name, serial number, specification..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="select select-bordered bg-white text-sm" value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
          <option value="">All Status</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
      </div>

      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="th">Serial No.</th>
                <th className="th">Name</th>
                <th className="th">Category</th>
                <th className="th">Specification</th>
                <th className="th">Date In</th>
                <th className="th text-right">Qty Initial</th>
                <th className="th text-right">Remaining</th>
                <th className="th text-right">Dispatched</th>
                <th className="th">Status</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={10} className="py-12 text-center"><LoadingSpinner /></td></tr>
              ) : stocks.length === 0 ? (
                <tr><td colSpan={10} className="py-16 text-center">
                  <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm text-slate-400 font-medium">No stock items found</p>
                </td></tr>
              ) : stocks.map(s => (
                <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                  <td className="td"><span className="serial-tag">{s.serialNumber}</span></td>
                  <td className="td font-semibold" style={{ color: '#020c1b' }}>
                    {s.name}{s.screenSize ? ` ${s.screenSize}"` : ''}
                  </td>
                  <td className="td">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                      style={{ background: 'rgba(26,86,219,0.08)', color: '#1a56db' }}>
                      {categoryLabel(s.category)}
                    </span>
                  </td>
                  <td className="td text-slate-500 max-w-[160px] truncate">{s.specification}</td>
                  <td className="td text-slate-500">{fmtDate(s.dateIn)}</td>
                  <td className="td text-right font-mono">{fmtNum(s.quantityInitial)}</td>
                  <td className="td text-right">
                    <span className={`font-mono font-bold ${s.quantityRemaining === 0 ? 'text-red-500' : s.quantityRemaining <= s.minStockLevel ? 'text-amber-600' : 'text-green-600'}`}>
                      {fmtNum(s.quantityRemaining)}
                    </span>
                  </td>
                  <td className="td text-right font-mono text-slate-500">{fmtNum(s.quantityDispatched)}</td>
                  <td className="td"><StatusBadge status={s.status} /></td>
                  <td className="td">
                    <div className="flex gap-1">
                      <Link to={`/stock/${s._id}`} className="btn btn-ghost btn-xs gap-1 text-xs">
                        <Eye className="w-3 h-3" /> View
                      </Link>
                      {canEdit && (
                        <Link to={`/stock/${s._id}/edit`} className="btn btn-ghost btn-xs gap-1 text-xs">
                          <Pencil className="w-3 h-3" /> Edit
                        </Link>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteTarget(s)} className="btn btn-ghost btn-xs gap-1 text-xs text-red-500">
                          <Trash2 className="w-3 h-3" /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="join">
              <button className="join-item btn btn-xs" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button className="join-item btn btn-xs" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-bold mb-1" style={{ color:'#020c1b' }}>Delete Stock Item?</h3>
            <p className="text-sm mb-4" style={{ color:'#64748b' }}>
              <strong>{deleteTarget.name}{deleteTarget.screenSize ? ` ${deleteTarget.screenSize}"` : ''}</strong>{' '}
              (<span className="font-mono">{deleteTarget.serialNumber}</span>)
            </p>
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 mb-4">
              <p className="text-sm text-red-700">This action is permanent and cannot be undone. Use this only to correct data-entry mistakes.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting} className="btn btn-error flex-1 text-white">
                {deleting ? <span className="loading loading-spinner loading-sm" /> : 'Delete Permanently'}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
