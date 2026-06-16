import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { EdtekLogo } from '../components/shared'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed', { duration: 5000 })
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#f1f5f9' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 p-12" style={{ background: '#020c1b' }}>
        <div className="flex items-center gap-3">
          <img src="logo.png" alt="logo" className="w-25 h-20" />
          
          <div>
            <p className="text-white font-bold text-lg leading-none">EDTEK Interactive</p>
            <p className="text-xs mt-1 font-medium" style={{ color: '#4a9eff' }}>StoreTrack System</p>
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Inventory<br />Management<br /><span style={{ color: '#4a9eff' }}>System</span>
          </h2>
          <p className="text-base leading-relaxed" style={{ color: '#7ca3cc' }}>
            Track stock, manage transfers, and confirm deliveries with confidence.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Stock Items', value: 'Real-time' },
            { label: 'Workflow', value: '6 Stages' },
            { label: 'Categories', value: '8 Types' },
            { label: 'Delivery', value: 'Confirmed' }
          ].map(s => (
            <div key={s.label} className="rounded-xl p-4" style={{ background: 'rgba(26,86,219,0.12)', border: '1px solid rgba(26,86,219,0.2)' }}>
              <p className="text-lg font-bold" style={{ color: '#60a5fa' }}>{s.value}</p>
              <p className="text-xs mt-0.5" style={{ color: '#7ca3cc' }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden  justify-center gap-2 mb-8">
              <img src="logo.png" alt="EDTEK" className="w-20 h-10 bg-blue-950 rounded-sm" />
            <span className="font-bold text-lg mt-2" style={{ color: '#020c1b' }}>EDTEK StoreTrack</span>
          </div>

          <h1 className="text-2xl font-bold mb-1" style={{ color: '#020c1b' }}>Sign in</h1>
          <p className="text-sm mb-7" style={{ color: '#64748b' }}>Access your inventory dashboard</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="field-label">Email address</label>
              <input type="email" className="input input-bordered w-full bg-white"
                placeholder="you@company.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="field-label mb-0">Password</label>
    
              </div>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className="input input-bordered w-full bg-white pr-10"
                  placeholder="••••••••"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-6 -translate-y-1/2 text-slate-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Link to="/forgot-password" className="text-xs font-medium" style={{ color: '#1a56db' }}>
                  Forgot password?
                </Link>
            </div>
            <button type="submit" disabled={loading} className="btn bg-blue-950 text-white w-full">
              {loading
                ? <span className="loading loading-spinner loading-sm" />
                : 'Sign in'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
