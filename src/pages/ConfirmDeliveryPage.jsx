import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { fmtDate, fmtDateTime } from '../utils/format'
import { EdtekLogo } from '../components/shared'
import { CheckCircle, XCircle, Loader, Laptop } from 'lucide-react'
import toast from 'react-hot-toast'

// MOVED OUTSIDE COMPONENT TO PREVENT REMOUNTING
const Wrapper = ({ children }) => (
  <div className="min-h-screen py-10 px-4" style={{ background: '#f1f5f9' }}>
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-7">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#020c1b' }}>
            <EdtekLogo size={26} dark />
          </div>
          <div className="text-left">
            <p className="font-bold text-lg leading-none" style={{ color: '#020c1b' }}>EDTEK Interactive</p>
            <p className="text-xs" style={{ color: '#64748b' }}>StoreTrack System</p>
          </div>
        </div>
        <h1 className="text-xl font-bold" style={{ color: '#020c1b' }}>Delivery Confirmation</h1>
        <p className="text-sm mt-1" style={{ color: '#64748b' }}>Please verify and confirm receipt of goods</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
        {children}
      </div>

      <p className="text-center text-xs mt-5" style={{ color: '#94a3b8' }}>
        EDTEK Interactive · Inventory Management System · Automated Delivery Verification
      </p>
    </div>
  </div>
)

// Software status badge classes (matching index.css)
const swBadgeClass = (status) => ({
  'Activated': 'sw-activated',
  'Non Activated': 'sw-non-activated',
  'Nil': 'sw-nil'
})[status] || 'sw-nil'

// Software checklist popup — shown to delivery recipient
const SoftwarePopup = ({ checklist, onClose, updatedAt, updatedBy }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[80vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-base flex items-center gap-2" style={{ color: '#020c1b' }}>
          <Laptop className="w-4 h-4 text-purple-600" /> Software Installation Status
        </h3>
        <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">✕</button>
      </div>
      <p className="text-sm mb-4" style={{ color: '#64748b' }}>
        The technical team has set up the following software on your device(s):
      </p>
      <div className="space-y-2">
        {checklist.map((sw, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50">
            <div>
              <p className="text-sm font-semibold" style={{ color: '#020c1b' }}>
                {sw.name === 'Other' && sw.customName ? sw.customName : sw.name}
              </p>
              {sw.notes && <p className="text-xs text-slate-500 mt-0.5">{sw.notes}</p>}
            </div>
            <span className={swBadgeClass(sw.status)}>{sw.status}</span>
          </div>
        ))}
      </div>
      {updatedAt && (
        <p className="text-xs text-slate-400 mt-4">
          Last updated: {fmtDateTime(updatedAt)}{updatedBy ? ` by ${updatedBy}` : ''}
        </p>
      )}
      <button onClick={onClose} className="btn btn-primary text-white w-full mt-4">Close</button>
    </div>
  </div>
)

export default function ConfirmDeliveryPage() {
  const { token } = useParams()

  const [state, setState] = useState('loading')
  const [request, setRequest] = useState(null)

  const [notes, setNotes] = useState('')
  const [missingNote, setMissingNote] = useState('')
  const [confirmedBy, setConfirmedBy] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [hasMissing, setHasMissing] = useState(false)
  const [showSoftware, setShowSoftware] = useState(false)

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const response = await fetch(`/api/deliveries/confirm/${token}`)
        const data = await response.json()

        if (!data.success) {
          setState('invalid')
          return
        }

        if (data.alreadyConfirmed) {
          setRequest(data.request)
          setState('already')
          return
        }

        setRequest(data.request)
        setState('valid')

        // Auto-show software popup if checklist exists
        if (data.request?.softwareChecklist?.length > 0) {
          setShowSoftware(true)
        }
      } catch (error) {
        console.error(error)
        setState('invalid')
      }
    }

    fetchRequest()
  }, [token])

  const handleConfirm = async (e) => {
    e.preventDefault()

    if (!confirmedBy.trim()) {
      toast.error('Please enter your name')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/deliveries/confirm/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryNotes: notes,
          missingItemsNote: hasMissing ? missingNote : '',
          confirmedBy,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setRequest((prev) => ({ ...prev, ...data.request }))
        setState('success')
        toast.success('Delivery confirmed successfully')
      } else {
        toast.error(data.message || 'Confirmation failed')
      }
    } catch (error) {
      console.error(error)
      toast.error('Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const hasSoftware = request?.softwareChecklist?.length > 0

  // Software popup is available on top of any state (valid, already, success)
  const SoftwareModal = () => (
    showSoftware && hasSoftware ? (
      <SoftwarePopup
        checklist={request.softwareChecklist}
        onClose={() => setShowSoftware(false)}
        updatedAt={request.softwareUpdatedAt}
        updatedBy={request.softwareUpdatedBy?.name}
      />
    ) : null
  )

  // LOADING
  if (state === 'loading') {
    return (
      <Wrapper>
        <div className="flex flex-col items-center gap-3 py-10">
          <Loader className="w-8 h-8 animate-spin" style={{ color: '#1a56db' }} />
          <p style={{ color: '#64748b' }}>Verifying link...</p>
        </div>
      </Wrapper>
    )
  }

  // INVALID
  if (state === 'invalid') {
    return (
      <Wrapper>
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#fee2e2' }}>
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#020c1b' }}>Link Invalid or Expired</h2>
            <p style={{ color: '#64748b' }}>
              This confirmation link is no longer valid.<br />
              Please contact the store to resend a new confirmation email.
            </p>
          </div>
        </div>
      </Wrapper>
    )
  }

  // ALREADY CONFIRMED
  if (state === 'already') {
    return (
      <Wrapper>
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#020c1b' }}>Already Confirmed</h2>
            <p style={{ color: '#64748b' }}>
              Delivery for <strong>{request?.toOrganization}</strong> was already confirmed.
            </p>
            {request?.deliveryConfirmedAt && (
              <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>on {fmtDateTime(request.deliveryConfirmedAt)}</p>
            )}
          </div>
          {hasSoftware && (
            <button onClick={() => setShowSoftware(true)} className="btn btn-outline gap-2 text-purple-600 border-purple-300">
              <Laptop className="w-4 h-4" /> View Software Installation Status
            </button>
          )}
        </div>
        <SoftwareModal />
      </Wrapper>
    )
  }

  // SUCCESS
  if (state === 'success') {
    return (
      <Wrapper>
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#dcfce7' }}>
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2 text-green-700">Delivery Confirmed!</h2>
            <p style={{ color: '#475569' }}>Thank you for confirming receipt of goods.</p>
            <p className="text-sm mt-1" style={{ color: '#64748b' }}>The store has been notified of the successful delivery.</p>
          </div>
          <div className="mt-2 p-4 rounded-xl text-left w-full" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <p className="text-sm font-semibold text-green-700 mb-1">Request #{request?.requestNumber}</p>
            <p className="text-xs text-green-600">Organization: {request?.toOrganization}</p>
            <p className="text-xs text-green-600">Confirmed at: {fmtDateTime(new Date())}</p>
            {hasMissing && missingNote && (
              <p className="text-xs text-red-600 mt-1">Missing items noted: {missingNote}</p>
            )}
          </div>
          {hasSoftware && (
            <button onClick={() => setShowSoftware(true)} className="btn btn-outline gap-2 text-purple-600 border-purple-300">
              <Laptop className="w-4 h-4" /> View Software Installation Status
            </button>
          )}
        </div>
        <SoftwareModal />
      </Wrapper>
    )
  }

  // VALID PAGE
  return (
    <Wrapper>
      <form onSubmit={handleConfirm} className="space-y-6">
        {/* Software status banner — shown if technical team filled it in */}
        {hasSoftware && (
          <div className="p-4 rounded-xl flex items-center justify-between gap-3" style={{ background: '#faf5ff', border: '1px solid #e9d5ff' }}>
            <div className="flex items-center gap-2">
              <Laptop className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-semibold" style={{ color: '#581c87' }}>Software Installation Status</p>
                <p className="text-xs" style={{ color: '#7e22ce' }}>The technical team has recorded what's installed on your device(s)</p>
              </div>
            </div>
            <button type="button" onClick={() => setShowSoftware(true)} className="btn btn-sm gap-1 text-white flex-shrink-0" style={{ background: '#7c3aed', border: 'none' }}>
              View
            </button>
          </div>
        )}

        {/* Request Info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#94a3b8' }}>Request Details</p>
            <dl className="space-y-2">
              <div className="flex justify-between gap-2">
                <dt style={{ color: '#64748b' }}>Request #</dt>
                <dd className="font-mono font-bold" style={{ color: '#020c1b' }}>{request?.requestNumber}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt style={{ color: '#64748b' }}>Organization</dt>
                <dd className="font-medium text-right" style={{ color: '#334155' }}>{request?.toOrganization}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt style={{ color: '#64748b' }}>Department</dt>
                <dd className="font-medium text-right" style={{ color: '#334155' }}>{request?.toDepartment}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt style={{ color: '#64748b' }}>Shipped On</dt>
                <dd className="font-medium text-right" style={{ color: '#334155' }}>{fmtDate(request?.shippedAt)}</dd>
              </div>
            </dl>
          </div>

          <div className="p-4 rounded-xl text-sm" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#94a3b8' }}>Requested By</p>
            <p className="font-semibold" style={{ color: '#020c1b' }}>{request?.requestedBy?.name}</p>
            <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>{request?.requestedBy?.email}</p>
          </div>
        </div>

        {/* Items */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#94a3b8' }}>
            Items Dispatched ({request?.items?.length})
          </p>
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="table table-sm w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="th">#</th>
                  <th className="th">Serial No.</th>
                  <th className="th">Item</th>
                  <th className="th">Spec</th>
                  <th className="th text-right">Qty</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {request?.items?.map((item, i) => (
                  <tr key={item._id}>
                    <td className="td text-slate-400">{i + 1}</td>
                    <td className="td"><span className="serial-tag">{item.serialNumber}</span></td>
                    <td className="td font-semibold" style={{ color: '#020c1b' }}>
                      {item.name}{item.screenSize ? ` ${item.screenSize}"` : ''}
                    </td>
                    <td className="td text-xs text-slate-500">{item.specification}</td>
                    <td className="td text-right font-mono font-bold">
                      {item.quantityApproved} <span className="text-xs text-slate-400">{item.unit}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Missing Items */}
        <div className="p-4 rounded-xl" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" className="checkbox checkbox-warning checkbox-sm" checked={hasMissing} onChange={(e) => setHasMissing(e.target.checked)} />
            <span className="text-sm font-semibold text-orange-700">⚠ Some items are missing or incomplete</span>
          </label>
          {hasMissing && (
            <textarea className="textarea textarea-bordered w-full bg-white text-sm mt-3" rows={2}
              placeholder="Describe which items are missing or damaged..."
              value={missingNote} onChange={(e) => setMissingNote(e.target.value)} />
          )}
        </div>

        {/* Form */}
        <div className="pt-4" style={{ borderTop: '1px solid #e2e8f0' }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: '#020c1b' }}>Confirm Delivery</h3>
          <div className="space-y-4">
            <div>
              <label className="field-label">Your Full Name *</label>
              <input type="text" className="input input-bordered w-full bg-white text-sm" placeholder="Enter your name"
                value={confirmedBy} onChange={(e) => setConfirmedBy(e.target.value)} />
            </div>
            <div>
              <label className="field-label">Delivery Notes (optional)</label>
              <textarea className="textarea textarea-bordered w-full bg-white text-sm" rows={2}
                placeholder="Any notes about the delivery..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <button type="submit" disabled={submitting} className="btn w-full text-white gap-2 text-base font-semibold" style={{ background: '#020c1b', border: 'none' }}>
              {submitting ? <span className="loading loading-spinner loading-sm" /> : (<><CheckCircle className="w-5 h-5" /> Confirm Successful Delivery</>)}
            </button>
          </div>
        </div>
      </form>
      <SoftwareModal />
    </Wrapper>
  )
}
