import { useState, useEffect, useCallback } from 'react'
import api from '../utils/api'
import { fmtDateTime, fmtRelative } from '../utils/format'
import { LoadingSpinner, PageHeader, StatusBadge } from '../components/shared'
import toast from 'react-hot-toast'
import { Plus, Search, User, Pencil, Trash2, Flag, Key, Eye, ShieldAlert, ShieldCheck, Send } from 'lucide-react'

const ROLES = ['admin','storekeeper','sales','technical']
const ROLE_COLOR = { admin:'#4a9eff', storekeeper:'#34d399', sales:'#f59e0b', technical:'#a78bfa' }
const ROLE_BG    = { admin:'rgba(74,158,255,0.12)', storekeeper:'rgba(52,211,153,0.12)', sales:'rgba(245,158,11,0.12)', technical:'rgba(167,139,250,0.12)' }

const initForm = { name:'', email:'', password:'', role:'sales', department:'', phone:'' }

export default function UsersPage() {
  const [users, setUsers]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selected, setSelected]   = useState(null)

  // Modals
  const [createModal, setCreateModal]   = useState(false)
  const [editModal, setEditModal]       = useState(false)
  const [deleteModal, setDeleteModal]   = useState(false)
  const [flagModal, setFlagModal]       = useState(false)
  const [pwdModal, setPwdModal]         = useState(false)
  const [activityModal, setActivityModal] = useState(false)

  const [form, setForm]         = useState(initForm)
  const [flagReason, setFlagReason] = useState('')
  const [newPwd, setNewPwd]     = useState('')
  const [saving, setSaving]     = useState(false)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/auth/users')
      setUsers(res.data.users)
    } catch (e) { toast.error('Failed to load users') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.department?.toLowerCase().includes(q)
    const matchRole = !roleFilter || u.role === roleFilter
    return matchSearch && matchRole
  })

  const openEdit = (u) => { setSelected(u); setForm({ name:u.name, email:u.email, password:'', role:u.role, department:u.department||'', phone:u.phone||'' }); setEditModal(true) }
  const openDelete = (u) => { setSelected(u); setDeleteModal(true) }
  const openFlag = (u) => { setSelected(u); setFlagReason(''); setFlagModal(true) }
  const openPwd = (u) => { setSelected(u); setNewPwd(''); setPwdModal(true) }
  const openActivity = (u) => { setSelected(u); setActivityModal(true) }

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/auth/create-user', form)
      toast.success('User created & notified by email')
      setCreateModal(false); setForm(initForm); fetchUsers()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleEdit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { name:form.name, email:form.email, role:form.role, department:form.department, phone:form.phone }
      await api.put(`/auth/users/${selected._id}`, payload)
      toast.success('User updated'); setEditModal(false); fetchUsers()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await api.delete(`/auth/users/${selected._id}`)
      toast.success('User deleted'); setDeleteModal(false); fetchUsers()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleFlag = async () => {
    setSaving(true)
    try {
      const res = await api.put(`/auth/users/${selected._id}/flag`, { reason:flagReason })
      toast.success(res.data.message); setFlagModal(false); fetchUsers()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handlePwd = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.put(`/auth/users/${selected._id}/reset-password`, { newPassword:newPwd })
      toast.success('Password reset & email sent'); setPwdModal(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const handleResendReset = async (u) => {
    try {
      await api.post(`/auth/users/${u._id}/resend-reset`)
      toast.success('Reset link resent (valid 24h)')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to resend') }
  }

  const toggleActive = async (u) => {
    try {
      await api.put(`/auth/users/${u._id}`, { isActive: !u.isActive })
      toast.success(u.isActive ? 'User deactivated' : 'User activated')
      fetchUsers()
    } catch (err) { toast.error('Failed') }
  }

  return (
    <div className="fade-up space-y-5">
      <PageHeader
        title="User Management"
        subtitle={`${users.length} total users`}
        action={
          <button onClick={() => { setForm(initForm); setCreateModal(true) }}
            className="btn btn-primary text-white gap-2 text-sm">
            <Plus className="w-4 h-4" /> Create User
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input input-bordered w-full pl-9 bg-white text-sm" placeholder="Search name, email, department..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select select-bordered bg-white text-sm" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card-base overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">Role</th>
                <th className="th">Department</th>
                <th className="th">Status</th>
                <th className="th">Last Login</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center"><LoadingSpinner /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-slate-400 text-sm">No users found</td></tr>
              ) : filtered.map(u => (
                <tr key={u._id} className={`hover:bg-slate-50 transition-colors ${u.isFlagged ? 'bg-red-50' : ''}`}>
                  <td className="td">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: ROLE_BG[u.role] }}>
                        <User className="w-4 h-4" style={{ color: ROLE_COLOR[u.role] }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color:'#020c1b' }}>{u.name}</p>
                        {u.isFlagged && <span className="text-xs text-red-600 font-bold flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Flagged</span>}
                      </div>
                    </div>
                  </td>
                  <td className="td text-slate-500">{u.email}</td>
                  <td className="td">
                    <span className="text-xs font-bold capitalize px-2.5 py-1 rounded-full"
                      style={{ color: ROLE_COLOR[u.role], background: ROLE_BG[u.role] }}>
                      {u.role}
                    </span>
                  </td>
                  <td className="td text-slate-500">{u.department || '—'}</td>
                  <td className="td">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="td text-slate-400 text-xs">{u.lastLogin ? fmtRelative(u.lastLogin) : 'Never'}</td>
                  <td className="td">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button onClick={() => openActivity(u)} title="View Activity" className="btn btn-ghost btn-xs p-1"><Eye className="w-3.5 h-3.5 text-slate-400" /></button>
                      <button onClick={() => openEdit(u)} title="Edit" className="btn btn-ghost btn-xs p-1"><Pencil className="w-3.5 h-3.5 text-blue-500" /></button>
                      <button onClick={() => openPwd(u)} title="Reset Password" className="btn btn-ghost btn-xs p-1"><Key className="w-3.5 h-3.5 text-amber-500" /></button>
                      <button onClick={() => handleResendReset(u)} title="Resend Reset Link (24h)" className="btn btn-ghost btn-xs p-1"><Send className="w-3.5 h-3.5 text-indigo-500" /></button>
                      <button onClick={() => openFlag(u)} title={u.isFlagged ? 'Unflag' : 'Flag'} className="btn btn-ghost btn-xs p-1">
                        {u.isFlagged ? <ShieldCheck className="w-3.5 h-3.5 text-green-500" /> : <Flag className="w-3.5 h-3.5 text-orange-500" />}
                      </button>
                      <button onClick={() => toggleActive(u)} title={u.isActive ? 'Deactivate' : 'Activate'} className="btn btn-ghost btn-xs text-xs px-2">
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => openDelete(u)} title="Delete" className="btn btn-ghost btn-xs p-1"><Trash2 className="w-3.5 h-3.5 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE MODAL ── */}
      {createModal && (
        <Modal title="Create New User" onClose={() => setCreateModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="field-label">Full Name *</label>
                <input className="input input-bordered w-full bg-white text-sm" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required /></div>
              <div><label className="field-label">Email *</label>
                <input type="email" className="input input-bordered w-full bg-white text-sm" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} required /></div>
              <div><label className="field-label">Password *</label>
                <input type="password" className="input input-bordered w-full bg-white text-sm" placeholder="Min. 6 chars" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} minLength={6} required /></div>
              <div><label className="field-label">Role *</label>
                <select className="select select-bordered w-full bg-white text-sm" value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}>
                  {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select></div>
              <div><label className="field-label">Department</label>
                <input className="input input-bordered w-full bg-white text-sm" placeholder="e.g. Sales, Technical" value={form.department} onChange={e => setForm(p=>({...p,department:e.target.value}))} /></div>
              <div><label className="field-label">Phone</label>
                <input className="input input-bordered w-full bg-white text-sm" placeholder="+234..." value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} /></div>
            </div>
            <p className="text-xs text-slate-400">User will receive login credentials by email.</p>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn btn-primary text-white flex-1">
                {saving ? <span className="loading loading-spinner loading-sm" /> : 'Create User'}
              </button>
              <button type="button" onClick={() => setCreateModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── EDIT MODAL ── */}
      {editModal && selected && (
        <Modal title={`Edit — ${selected.name}`} onClose={() => setEditModal(false)}>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div><label className="field-label">Full Name</label>
                <input className="input input-bordered w-full bg-white text-sm" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required /></div>
              <div><label className="field-label">Email</label>
                <input type="email" className="input input-bordered w-full bg-white text-sm" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} required /></div>
              <div><label className="field-label">Role</label>
                <select className="select select-bordered w-full bg-white text-sm" value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}>
                  {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select></div>
              <div><label className="field-label">Department</label>
                <input className="input input-bordered w-full bg-white text-sm" value={form.department} onChange={e => setForm(p=>({...p,department:e.target.value}))} /></div>
              <div><label className="field-label">Phone</label>
                <input className="input input-bordered w-full bg-white text-sm" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} /></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn btn-primary text-white flex-1">
                {saving ? <span className="loading loading-spinner loading-sm" /> : 'Save Changes'}
              </button>
              <button type="button" onClick={() => setEditModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {pwdModal && selected && (
        <Modal title={`Reset Password — ${selected.name}`} onClose={() => setPwdModal(false)}>
          <form onSubmit={handlePwd} className="space-y-4">
            <p className="text-sm text-slate-500">Enter a new password. The user will be notified by email.</p>
            <div><label className="field-label">New Password *</label>
              <input type="password" className="input input-bordered w-full bg-white text-sm" placeholder="Min. 6 characters"
                value={newPwd} onChange={e => setNewPwd(e.target.value)} minLength={6} required /></div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn btn-warning text-white flex-1">
                {saving ? <span className="loading loading-spinner loading-sm" /> : 'Reset Password'}
              </button>
              <button type="button" onClick={() => setPwdModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── FLAG MODAL ── */}
      {flagModal && selected && (
        <Modal title={selected.isFlagged ? `Unflag — ${selected.name}` : `Flag — ${selected.name}`} onClose={() => setFlagModal(false)}>
          <div className="space-y-4">
            {selected.isFlagged ? (
              <div className="p-3 rounded-xl bg-green-50 border border-green-200">
                <p className="text-sm text-green-700">This user is currently flagged. Unflagging will restore access.</p>
                {selected.flagReason && <p className="text-xs text-green-600 mt-1"><strong>Flag reason:</strong> {selected.flagReason}</p>}
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700">Flagging this user will deactivate their account immediately.</p>
                </div>
                <div><label className="field-label">Reason for flagging</label>
                  <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={3} placeholder="e.g. Left the company, suspicious activity..."
                    value={flagReason} onChange={e => setFlagReason(e.target.value)} /></div>
              </>
            )}
            <div className="flex gap-3">
              <button onClick={handleFlag} disabled={saving}
                className={`btn flex-1 text-white ${selected.isFlagged ? 'btn-success' : 'btn-error'}`}>
                {saving ? <span className="loading loading-spinner loading-sm" /> : selected.isFlagged ? 'Unflag User' : 'Flag User'}
              </button>
              <button onClick={() => setFlagModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteModal && selected && (
        <Modal title={`Delete — ${selected.name}`} onClose={() => setDeleteModal(false)}>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">This action is <strong>permanent</strong>. All data associated with this user cannot be recovered.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={saving} className="btn btn-error flex-1 text-white">
                {saving ? <span className="loading loading-spinner loading-sm" /> : 'Delete Permanently'}
              </button>
              <button onClick={() => setDeleteModal(false)} className="btn btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── ACTIVITY LOG MODAL ── */}
      {activityModal && selected && (
        <Modal title={`Activity — ${selected.name}`} onClose={() => setActivityModal(false)} wide>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {selected.activityLog?.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">No activity recorded</p>
            ) : [...(selected.activityLog || [])].reverse().map((log, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 text-sm">
                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-blue-500" />
                <div className="flex-1">
                  <p className="font-semibold capitalize" style={{ color:'#020c1b' }}>{log.action?.replace(/_/g,' ')}</p>
                  {log.details && <p className="text-xs text-slate-500">{log.details}</p>}
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0">{fmtDateTime(log.timestamp)}</p>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, children, onClose, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} p-6 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base" style={{ color:'#020c1b' }}>{title}</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle text-slate-400">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}
