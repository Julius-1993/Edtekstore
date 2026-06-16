import { statusColor } from '../../utils/format'

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${statusColor(status)}`}>
      {status?.replace(/-/g, ' ')}
    </span>
  )
}
