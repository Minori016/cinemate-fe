export default function Input({ label, error, icon, rightIcon, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1 w-full text-left">
      {/* Label phía trên input */}
      {label && (
        <label className="text-sm font-medium text-[var(--color-text-muted)] mb-1">
          {label}
        </label>
      )}
      
      {/* Khung chứa Input và Icon */}
      <div className="relative flex items-center">
        
        {/* Icon bên trái (Ví dụ: person, lock) */}
        {icon && (
          <span className="material-symbols-outlined absolute left-3 text-[var(--color-text-muted)] pointer-events-none text-xl">
            {icon}
          </span>
        )}
        
        {/* Ô Input chính */}
        <input
          className={`bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg py-2.5 text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-red-500 transition-colors w-full
            ${icon ? 'pl-10' : 'px-3'} 
            ${rightIcon ? 'pr-10' : 'pr-3'} 
            ${className}`}
          {...props}
        />
        
        {/* Icon bên phải (Ví dụ: Nút đóng mở mắt mật khẩu) */}
        {rightIcon && (
          <div className="absolute right-3 flex items-center justify-center text-[var(--color-text-muted)] hover:text-white transition-colors">
            {rightIcon}
          </div>
        )}
      </div>
      
      {/* Thông báo lỗi nếu có */}
      {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
  )
}