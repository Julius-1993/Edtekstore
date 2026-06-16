import { format, formatDistanceToNow } from 'date-fns'

export const fmtDate     = d => d ? format(new Date(d), 'dd MMM yyyy') : '—'
export const fmtDateTime = d => d ? format(new Date(d), 'dd MMM yyyy, HH:mm') : '—'
export const fmtRelative = d => d ? formatDistanceToNow(new Date(d), { addSuffix: true }) : '—'
export const fmtNum      = n => typeof n === 'number' ? n.toLocaleString() : (n ?? '—')

export const statusBadgeClass = (status) => {
  const map = {
    draft: 'badge-draft', pending:'badge-pending', approved:'badge-approved',
    rejected:'badge-rejected', processing:'badge-processing', shipped:'badge-shipped',
    confirmed:'badge-confirmed', completed:'badge-completed',
    'in-stock':'badge-in-stock', 'low-stock':'badge-low-stock', 'out-of-stock':'badge-out-of-stock'
  }
  return map[status] || 'badge-pending'
}

export const CATEGORIES = [
  { value:'teklite',     label:'Teklite',      hasScreen:true  },
  { value:'tekboost',    label:'Tekboost',     hasScreen:true  },
  { value:'tekpremium',  label:'Tekpremium',   hasScreen:true  },
  { value:'ops',         label:'OPS System',   hasOps:true     },
  { value:'camera',      label:'Camera',       hasCamera:true  },
  { value:'board_stand', label:'Board Stand',  plain:true      },
  { value:'accessory',   label:'Accessory',    plain:true      },
  { value:'other',       label:'Other',        plain:true      }
]

export const SCREEN_SIZES   = ['55','65','75','85','98','110']
export const PROCESSORS     = ['Core i3','Core i5','Core i7','Core i9']
export const RAM_OPTIONS    = ['4GB','8GB','16GB','32GB']
export const STORAGE_OPTIONS= ['128GB SSD','256GB SSD','512GB SSD','1TB SSD','256GB HDD','1TB HDD']
export const RESOLUTIONS    = ['1080p','2K','4K','8K']

export const SOFTWARE_LIST = [
  'Mozabook','Chorus','Microsoft Office','Note3','Norton',
  'Testdriller BECE','Testdriller NCE','Testdriller SSCE','Testdriller UTME',
  'Myviewboard','Other'
]
export const SOFTWARE_STATUSES = ['Activated','Non Activated','Nil']

export const WORKFLOW_STAGES = ['pending','approved','processing','shipped','confirmed','completed']

export const categoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat

export const priorityColor = p => ({
  urgent:'text-red-600', high:'text-orange-600', medium:'text-blue-600', low:'text-slate-500'
})[p] || 'text-slate-500'

export const softwareStatusColor = s => ({
  'Activated':'text-green-600 bg-green-50 border-green-200',
  'Non Activated':'text-red-600 bg-red-50 border-red-200',
  'Nil':'text-slate-500 bg-slate-50 border-slate-200'
})[s] || 'text-slate-500 bg-slate-50 border-slate-200'
