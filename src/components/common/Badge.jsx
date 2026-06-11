export default function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
    success: 'bg-green-900/50 text-green-400',
    warning: 'bg-yellow-900/50 text-yellow-400',
    danger: 'bg-red-900/50 text-red-400',
    info: 'bg-blue-900/50 text-blue-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${variants[variant]}`}>{children}</span>
  )
}
