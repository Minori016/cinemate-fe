export default function Skeleton({ className = '', variant = 'rect', lines = 1 }) {
  const shimmer =
    'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/[0.04] before:to-transparent'

  if (variant === 'circle') {
    return (
      <div className={`relative rounded-full overflow-hidden ${shimmer} ${className}`}>
        <div className="w-full h-full rounded-full bg-white/[0.04]" />
      </div>
    )
  }

  if (variant === 'text') {
    return (
      <div className={`flex flex-col gap-2.5 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`relative rounded-lg overflow-hidden ${shimmer}`}
            style={{
              height: '14px',
              width: i === lines - 1 && lines > 1 ? '65%' : '100%',
              backgroundColor: 'rgba(255,255,255,0.03)',
            }}
          />
        ))}
      </div>
    )
  }

  if (variant === 'poster') {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden ${shimmer} ${className}`}
        style={{ aspectRatio: '2/3', backgroundColor: 'rgba(255,255,255,0.03)' }}
      />
    )
  }

  return (
    <div
      className={`relative rounded-xl overflow-hidden ${shimmer} ${className}`}
      style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
    />
  )
}
