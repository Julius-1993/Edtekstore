import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'

export default function ChangePasswordPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirm:'' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const set = (k,v) => setForm(p=>({...p,[k]:v}))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) { toast.error('Passwords do not match'); return }
    if (form.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      toast.success('Password changed! Please log in again.')
      logout()
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally { setLoading(false) }
  }

  const isTempPassword = user?.isTempPassword

  return (
    <div className="fade-up max-w-md mx-auto">
      <div className="card-pad">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:'rgba(26,86,219,0.1)' }}>
            <ShieldCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="page-title">{isTempPassword ? 'Set Your Password' : 'Change Password'}</h1>
            <p className="page-subtitle">
              {isTempPassword ? 'Your account uses a temporary password — please set a permanent one.' : 'Update your account password'}
            </p>
          </div>
        </div>

        {isTempPassword && (
          <div className="mb-5 p-3 rounded-xl flex items-start gap-2" style={{ background:'#fff7ed', border:'1px solid #fed7aa' }}>
            <span className="text-orange-500 mt-0.5">⚠</span>
            <p className="text-sm text-orange-700">You are using a temporary password. Please set a new permanent password to continue using the system.</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isTempPassword && (
            <div>
              <label className="field-label">Current Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input input-bordered w-full bg-white pr-10"
                  placeholder="Your current password" value={form.currentPassword}
                  onChange={e => set('currentPassword', e.target.value)} required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="field-label">New Password</label>
            <input type="password" className="input input-bordered w-full bg-white"
              placeholder="At least 6 characters" value={form.newPassword}
              onChange={e => set('newPassword', e.target.value)} minLength={6} required />
          </div>

          <div>
            <label className="field-label">Confirm New Password</label>
            <input type="password" className="input input-bordered w-full bg-white"
              placeholder="Repeat new password" value={form.confirm}
              onChange={e => set('confirm', e.target.value)} required />
          </div>

          <button type="submit" disabled={loading}
            className="btn btn-primary text-white w-full mt-2">
            {loading
              ? <span className="loading loading-spinner loading-sm" />
              : isTempPassword ? 'Set Permanent Password' : 'Change Password'
            }
          </button>
        </form>
      </div>
    </div>
  )
}
