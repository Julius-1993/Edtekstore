import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { fmtDate } from '../utils/format'

const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://edtekstorebackend.onrender.com'

// Waybill number box 
const WBBox = ({ label, value }) => (
  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
    <span style={{ fontWeight:700, fontSize:13, color:'#1a3a1a', minWidth:100 }}>{label}:</span>
    <span style={{ fontWeight:700, fontSize:14, color:'#000', fontFamily:'monospace' }}>{value}</span>
  </div>
)

// Signature block
const SigBlock = ({ title }) => (
  <div style={{ flex:1, minWidth:200 }}>
    <p style={{ fontWeight:800, fontSize:14, marginBottom:32, color:'#000' }}>{title}</p>
    <div style={{ borderBottom:'1px solid #555', marginBottom:8 }} />
    <p style={{ fontSize:12, color:'#333', marginBottom:20 }}>Name</p>
    <div style={{ borderBottom:'1px solid #555', marginBottom:8 }} />
    <p style={{ fontSize:12, color:'#333', marginBottom:20 }}>Signature</p>
    <div style={{ borderBottom:'1px solid #555', marginBottom:8 }} />
    <p style={{ fontSize:12, color:'#333' }}>Date</p>
  </div>
)

export default function WaybillPage() {
  const { token }       = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const printRef = useRef()

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/waybill/${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d.request)
        else setError(d.message || 'Waybill not found')
      })
      .catch(() => setError('Failed to load waybill'))
      .finally(() => setLoading(false))
  }, [token])

  const handlePrint = () => window.print()

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:40, height:40, border:'4px solid #1a56db', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite', margin:'0 auto 16px' }} />
        <p style={{ color:'#64748b', fontSize:14 }}>Loading waybill...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f1f5f9' }}>
      <div style={{ background:'white', borderRadius:12, padding:40, textAlign:'center', maxWidth:400 }}>
        <div style={{ fontSize:48, marginBottom:16 }}>⚠️</div>
        <p style={{ color:'#dc2626', fontWeight:700, fontSize:16, marginBottom:8 }}>Waybill Not Found</p>
        <p style={{ color:'#64748b', fontSize:14 }}>{error}</p>
      </div>
    </div>
  )

  const r = data
  const shippedDate = r.shippedAt ? fmtDate(r.shippedAt) : fmtDate(r.updatedAt)

  return (
    <div style={{ background:'#fff', minHeight:'100vh', padding:'24px 16px', fontFamily:"'Arial', sans-serif" }}>

      {/* Print button — hidden when printing */}
      <div className="no-print" style={{ maxWidth:750, margin:'0 auto 16px', display:'flex', gap:12, justifyContent:'flex-end' }}>
        <button onClick={handlePrint}
          style={{ background:'#1a56db', color:'white', border:'none', padding:'10px 28px', borderRadius:8, fontWeight:700, fontSize:14, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
          🖨️ Print Waybill
        </button>
      </div>

      {/* ── WAYBILL DOCUMENT ── */}
      <div ref={printRef} className="waybill-doc" style={{
        maxWidth:750, margin:'0 auto', background:'white',
        boxShadow:'0 4px 24px rgba(0,0,0,0.15)',
        fontFamily:"'Arial', sans-serif"
      }}>

        {/* ── HEADER ── */}
        <div style={{ display:'flex', alignItems:'center', padding:'16px 28px 12px', borderBottom:'3px solid #2d7a2d' }}>
          {/* Logo area */}
          <div style={{ display:'flex', alignItems:'center', gap:12, flex:1 }}>
            <div style={{
              background:'#fff',
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
            }}>
              <span style={{ fontSize:20, fontWeight:900, letterSpacing:1 }}>
                <img src="/edtek-logo.png" alt="EDTEK" style={{ width:60, height:50, objectFit:'contain', flexShrink:0 }} />
                </span>
              <span style={{ fontSize:7, fontWeight:700, color:'#555', letterSpacing:0.5, textTransform:'uppercase' }}>INTERACTIVE BOARD</span>
            </div>
            <div style={{ width:3, height:50, background:'#2d7a2d' }} />
            <div style={{ width:60, height:12, background:'#2d7a2d', borderRadius:2 }} />
          </div>
          {/* Waybill title */}
          <div style={{ textAlign:'right' }}>
            <h1 style={{ fontSize:32, fontWeight:900, color:'#000', margin:0, letterSpacing:2 }}>WAYBILL</h1>
          </div>
        </div>

        {/* ── BILL TO + DATE ROW ── */}
        <div style={{ display:'flex', justifyContent:'space-between', padding:'18px 28px 0', gap:24 }}>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:12, fontWeight:700, color:'#555', marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>Bill To:</p>
            <p style={{ fontSize:14, fontWeight:800, color:'#000', margin:'0 0 4px', textDecoration:'underline' }}>
              The Director/Proprietor,
            </p>
            <p style={{ fontSize:13, color:'#333', margin:0, lineHeight:1.6 }}>
              {r.toOrganization},<br />
              {r.deliveryAddress || r.toDepartment}<br />
              {r.contactPerson && <><br />{r.contactPerson}</>},
              <br />{r.Phone || r.contactPhone}
            </p>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <p style={{ fontSize:12, fontWeight:700, color:'#555', marginBottom:2 }}>DATE:</p>
            <p style={{ fontSize:13, fontWeight:600, color:'#000', margin:0 }}>{shippedDate}</p>
          </div>
        </div>

        {/* ── WAYBILL NUMBER + ITEMS TABLE ── */}
        <div style={{ display:'flex', padding:'18px 0 0', margin:'0 28px' }}>
          {/* Waybill No sidebar */}
          <div style={{ paddingRight:16, paddingTop:40, minWidth:90 }}>
            <p style={{ fontSize:11, fontWeight:700, color:'#2d7a2d', marginBottom:2 }}>Waybill No:</p>
            <p style={{ fontSize:15, fontWeight:900, color:'#000', fontFamily:'monospace' }}>
              {r.waybillNumber || r.requestNumber?.replace('REQ-','WB-')}
            </p>
          </div>

          {/* Items table */}
          <div style={{ flex:1 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #ccc' }}>
              <thead>
                <tr>
                  <th style={{ background:'#2d7a2d', color:'white', padding:'10px 14px', textAlign:'left', fontSize:13, fontWeight:700, width:'70%', borderRight:'1px solid #1a5c1a' }}>
                    DESCRIPTION
                  </th>
                  <th style={{ background:'#2d7a2d', color:'white', padding:'10px 14px', textAlign:'center', fontSize:13, fontWeight:700 }}>
                    QTY (UNIT)
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Group header — product category */}
                <tr>
                  <td colSpan={2} style={{ padding:'10px 14px 4px', borderBottom:'1px solid #e2e8f0' }}>
                    <p style={{ fontWeight:900, fontSize:14, color:'#000', margin:0, textTransform:'uppercase', lineHeight:1.3 }}>
                      EDTEK SMART INTERACTIVE<br />LEARNING BOARD
                    </p>
                  </td>
                </tr>

                {/* Items */}
                {r.items?.map((item, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #e8e8e8' }}>
                    <td style={{ padding:'8px 14px', fontSize:13, color:'#222', borderRight:'1px solid #e2e8f0' }}>
                      {item.name}
                      {item.screenSize ? ` ${item.screenSize}"` : ''}
                      {item.specification ? ` (${item.specification})` : ''}
                    </td>
                    <td style={{ padding:'8px 14px', fontSize:14, fontWeight:700, color:'#000', textAlign:'center' }}>
                      {item.quantityApproved || item.quantityRequested}
                    </td>
                  </tr>
                ))}

                {/* Empty rows for visual padding (like real waybill) */}
                {Array.from({ length: Math.max(0, 4 - (r.items?.length || 0)) }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    <td style={{ padding:'10px 14px', borderRight:'1px solid #e2e8f0', borderBottom:'1px solid #f0f0f0' }}>&nbsp;</td>
                    <td style={{ padding:'10px 14px', borderBottom:'1px solid #f0f0f0' }}>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── WATERMARK TEXT ── */}
        <div style={{ textAlign:'center', padding:'4px 28px 0', position:'relative', overflow:'hidden', height:36 }}>
          <p style={{ fontSize:28, fontWeight:900, color:'rgba(45,122,45,0.08)', letterSpacing:6, margin:0, textTransform:'uppercase', userSelect:'none' }}>
            INTERACTIVE BOARD
          </p>
        </div>

        {/* ── SIGNATURE ROW ── */}
        <div style={{ display:'flex', gap:40, padding:'24px 28px 20px', borderTop:'1px solid #e2e8f0', marginTop:8 }}>
          <SigBlock title="RECEIVED BY" />
          <SigBlock title="DELIVERED BY" />
        </div>

        {/* ── FOOTER ── */}
        <div style={{ background:'#f8f9fa', borderTop:'3px solid #2d7a2d', padding:'14px 28px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:16 }}>📞</span>
              <div>
                <p style={{ margin:0, fontSize:10, color:'#555' }}>+234806 075 7622</p>
                <p style={{ margin:0, fontSize:10, color:'#555' }}>+234806 890 4666</p>
                <p style={{ margin:0, fontSize:10, color:'#555' }}>+234704 762 3891</p>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:16 }}>✉️</span>
              <div>
                <p style={{ margin:0, fontSize:10, color:'#555' }}>edtekboards@gmail.com</p>
                <p style={{ margin:0, fontSize:10, color:'#555' }}>www.edtekboards.com</p>
              </div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:16 }}>📍</span>
            <p style={{ margin:0, fontSize:10, color:'#555', maxWidth:200, lineHeight:1.4 }}>
              3 Omolade Oguntade Crescent, Behind Justrite Superstore, Off Idiroko Road, Ota, Ogun State.
            </p>
          </div>
        </div>

        {/* ── METADATA (shown on screen, hidden on print) ── */}
        <div className="no-print" style={{ background:'#eff6ff', borderTop:'1px solid #bfdbfe', padding:'12px 28px', display:'flex', gap:24, flexWrap:'wrap' }}>
          <div style={{ fontSize:12, color:'#1e40af' }}>
            <strong>Request No:</strong> {r.requestNumber}
          </div>
          <div style={{ fontSize:12, color:'#1e40af' }}>
            <strong>Requested by:</strong> {r.requestedBy?.name}
          </div>
          {r.shippedBy && (
            <div style={{ fontSize:12, color:'#1e40af' }}>
              <strong>Shipped by:</strong> {r.shippedBy?.name}
            </div>
          )}
          <div style={{ fontSize:12, color:'#1e40af' }}>
            <strong>Status:</strong> {r.status?.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { margin: 0; background: white !important; }
          .no-print { display: none !important; }
          .waybill-doc { box-shadow: none !important; max-width: 100% !important; }
          @page { size: A4; margin: 9mm; }
        }
      `}</style>
    </div>
  )
}
