export default function Modal({ open, onClose, title, children }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {title && <h3 className="text-xl mb-4 text-white" style={{fontFamily:'Bebas Neue'}}>{title}</h3>}
        {children}
      </div>
    </div>
  )
}
