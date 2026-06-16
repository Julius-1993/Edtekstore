import { statusBadgeClass } from '../../utils/format'

export function StatusBadge({ status }) {
  return <span className={statusBadgeClass(status)}>{status?.replace(/-/g, ' ')}</span>
}

export function LoadingSpinner({ fullPage, size = 'md' }) {
  const s = { sm: 'loading-sm', md: 'loading-md', lg: 'loading-lg' }[size]
  if (fullPage) return (
    <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
      <div className="flex flex-col items-center gap-3">
       <img src="/logo.png" alt="EDTEK" className="w-16 h-16" />
        <span className={`loading loading-spinner loading-lg text-primary mt-2`} />
      </div>
    </div>
  )
  return <span className={`loading loading-spinner ${s} text-primary`} />
}

// EDTEK logo — SVG recreation of the arc logo with dark blue
export function EdtekLogo({ size = 36, dark = false }) {
  const color = dark ? '#ffffff' : '#1a56db'
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M78 15 A44 44 0 1 0 78 85" stroke={color} strokeWidth="8" strokeLinecap="round" fill="none"/>
      <path d="M70 27 A30 30 0 1 0 70 73" stroke={color} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.7"/>
    </svg>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
