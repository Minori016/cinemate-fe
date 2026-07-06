import { motion, useMotionValue, useSpring } from 'motion/react'

export default function Card({
  children,
  className = '',
  hover = true,
  glow = false,
  padding = 'p-5',
  onClick,
}) {
  const mouseX = useMotionValue(50)
  const mouseY = useMotionValue(50)
  const springX = useSpring(mouseX, { stiffness: 300, damping: 25 })
  const springY = useSpring(mouseY, { stiffness: 300, damping: 25 })

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(((e.clientX - rect.left) / rect.width) * 100)
    mouseY.set(((e.clientY - rect.top) / rect.height) * 100)
  }

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      whileHover={hover ? {
        y: -4,
        borderColor: 'rgba(229,9,20,0.25)',
        boxShadow: '0 8px 40px rgba(229,9,20,0.08), 0 4px 24px rgba(0,0,0,0.3)',
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      } : undefined}
      className={`relative rounded-2xl overflow-hidden bg-[#171717]/80 backdrop-blur-sm border border-white/[0.06] ${hover ? 'cursor-pointer' : ''} ${padding} ${className}`}
      style={{
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        '--mouse-x': `${springX}%`,
        '--mouse-y': `${springY}%`,
      } as React.CSSProperties}
      onClick={onClick}
    >
      {glow && (
        <motion.div
          className="absolute inset-0 pointer-events-none opacity-0"
          whileHover={{ opacity: 1, transition: { duration: 0.4 } }}
          style={{
            background: 'radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(229,9,20,0.06), transparent 40%)',
          }}
        />
      )}
      {children}
    </motion.div>
  )
}
