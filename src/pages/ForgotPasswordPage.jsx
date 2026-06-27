import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { EdtekLogo } from '../components/shared'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const API = import.meta.env.VITE_API_URL

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const data = await res.json()
      if (data.success) setSent(true)
      else toast.error(data.message || 'Something went wrong')
    } catch { toast.error('Failed to send reset email') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f1f5f9' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-7">
          <img src="/edtek-logo.png" alt="EDTEK Interactive" className="w-8 h-8" />
          <span className="font-bold" style={{ color: '#020c1b' }}>EDTEK StoreTrack</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {!sent ? (
            <>
              <h1 className="text-xl font-bold mb-1" style={{ color: '#020c1b' }}>Forgot Password</h1>
              <p className="text-sm mb-6" style={{ color: '#64748b' }}>Enter your email to receive a reset link</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="field-label">Email address</label>
                  <input type="email" className="input input-bordered w-full bg-white" placeholder="you@company.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <button type="submit" disabled={loading} className="btn w-full text-white font-semibold" style={{ background: '#020c1b', border: 'none' }}>
                  {loading ? <span className="loading loading-spinner loading-sm" /> : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#eff6ff' }}>
                <span className="text-2xl">📧</span>
              </div>
              <h2 className="text-lg font-bold mb-2" style={{ color: '#020c1b' }}>Check your email</h2>
              <p className="text-sm mb-4" style={{ color: '#64748b' }}>
                If <strong>{email}</strong> is registered, you'll receive a reset link shortly.
              </p>
              <p className="text-xs" style={{ color: '#94a3b8' }}>
                Didn't get it?{' '}
                <button onClick={() => setSent(false)} className="font-semibold" style={{ color: '#1a56db' }}>Try again</button>
              </p>
            </div>
          )}
        </div>
        <div className="text-center mt-4">
          <Link to="/login" className="text-sm flex items-center justify-center gap-1" style={{ color: '#64748b' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const API = import.meta.env.VITE_API_URL

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/reset-password/${token}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      const data = await res.json()
      if (data.success) { toast.success('Password reset! Please sign in.'); navigate('/login') }
      else toast.error(data.message || 'Reset failed')
    } catch { toast.error('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#f1f5f9' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-7">
          <img src="/edtek-logo.png" alt="EDTEK Interactive" className="w-8 h-8" />
          <span className="font-bold" style={{ color: '#020c1b' }}>EDTEK StoreTrack</span>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <h1 className="text-xl font-bold mb-1" style={{ color: '#020c1b' }}>Reset Password</h1>
          <p className="text-sm mb-6" style={{ color: '#64748b' }}>Enter your new password</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">New Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input input-bordered w-full bg-white pr-10"
                  placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="field-label">Confirm Password</label>
              <input type="password" className="input input-bordered w-full bg-white" placeholder="Re-enter password"
                value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <button type="submit" disabled={loading} className="btn w-full text-white font-semibold" style={{ background: '#020c1b', border: 'none' }}>
              {loading ? <span className="loading loading-spinner loading-sm" /> : 'Reset Password'}
            </button>
          </form>
        </div>
        <div className="text-center mt-4">
          <Link to="/login" className="text-sm flex items-center justify-center gap-1" style={{ color: '#64748b' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
