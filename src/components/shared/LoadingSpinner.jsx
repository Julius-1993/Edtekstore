export default function LoadingSpinner({ fullPage, size = 'md' }) {
  const sizes = { sm: 'loading-sm', md: 'loading-md', lg: 'loading-lg' }
  const spinner = <span className={`loading loading-spinner ${sizes[size]} text-primary`} />

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col items-center gap-3">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-slate-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    )
  }
  return spinner
}
