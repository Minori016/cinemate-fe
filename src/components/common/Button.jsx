export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center font-semibold rounded transition-all duration-200 cursor-pointer disabled:opacity-50'
  const variants = {
    primary: 'bg-red-600 hover:bg-red-700 text-white',
    secondary: 'bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] text-white border border-[var(--color-border)]',
    danger: 'bg-red-800 hover:bg-red-900 text-white',
    ghost: 'hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-white',
  }
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base' }
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
