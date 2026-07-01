import React, { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { motion, useMotionValue, useTransform } from 'motion/react'
import { gsap } from 'gsap'
import { ChevronLeft, ChevronRight, Play, Star, Calendar, Clock, Film } from 'lucide-react'

// ── Mock Movie Data ──
const MOCK_MOVIES = [
  {
    id: 1,
    title: 'Dune: Part Two',
    titleVn: 'Dune: Hành Tinh Cát - Phần 2',
    genre: 'Khoa học viễn tưởng / Hành động',
    rating: '9.0',
    duration: '166 phút',
    releaseDate: '01/03/2024',
    desc: 'Paul Atreides hợp lực cùng Chani và người Fremen khi đang trên con đường trả thù những kẻ đã hủy hoại gia đình mình.',
    poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&h=900&fit=crop',
    color: '#d97706', // warm amber
  },
  {
    id: 2,
    title: 'Spider-Man: Across the Spider-Verse',
    titleVn: 'Người Nhện: Du Hành Vũ Trụ Nhện',
    genre: 'Hoạt hình / Phiêu lưu',
    rating: '9.2',
    duration: '140 phút',
    releaseDate: '02/06/2023',
    desc: 'Miles Morales du hành qua đa vũ trụ, nơi cậu gặp gỡ một nhóm Người Nhện chịu trách nhiệm bảo vệ sự tồn tại của vũ trụ.',
    poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=600&h=900&fit=crop',
    color: '#e50914', // vibrant red
  },
  {
    id: 3,
    title: 'Oppenheimer',
    titleVn: 'Oppenheimer',
    genre: 'Tiểu sử / Kịch tính',
    rating: '8.9',
    duration: '180 phút',
    releaseDate: '21/07/2023',
    desc: 'Câu chuyện về nhà vật lý lý thuyết J. Robert Oppenheimer, người đã lãnh đạo Dự án Manhattan chế tạo ra quả bom nguyên tử đầu tiên.',
    poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&h=900&fit=crop',
    color: '#2563eb', // deep blue
  },
  {
    id: 4,
    title: 'Interstellar',
    titleVn: 'Hố Đen Vũ Trụ',
    genre: 'Khoa học viễn tưởng / Phiêu lưu',
    rating: '9.3',
    duration: '169 phút',
    releaseDate: '07/11/2014',
    desc: 'Một nhóm phi hành gia du hành qua một lỗ giun ngoài vũ trụ để tìm kiếm một hành tinh mới có thể duy trì sự sống của nhân loại.',
    poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&h=900&fit=crop',
    color: '#8b5cf6', // purple
  },
]

// ── Three.js Particle Background ──
const ThreeBackground = () => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
    camera.position.z = 30

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Particles Geometry
    const particlesCount = 100
    const positions = new Float32Array(particlesCount * 3)

    for (let i = 0; i < particlesCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 60
      positions[i + 1] = (Math.random() - 0.5) * 40
      positions[i + 2] = (Math.random() - 0.5) * 30
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // Canvas Texture for Round Particles
    const createParticleTexture = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 16
      canvas.height = 16
      const ctx = canvas.getContext('2d')
      const gradient = ctx.createRadialGradient(8, 8, 0, 8, 8, 8)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)')
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 16, 16)
      return new THREE.CanvasTexture(canvas)
    }

    const material = new THREE.PointsMaterial({
      size: 0.8,
      map: createParticleTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.5,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // Moving Lights for Bokeh Glowing Color Fields
    const colors = [0xd97706, 0xe50914, 0x2563eb, 0x8b5cf6]
    const lights = []

    colors.forEach((color, idx) => {
      const light = new THREE.PointLight(color, 25, 40)
      light.position.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 10
      )
      scene.add(light)
      lights.push({
        light,
        angle: Math.random() * Math.PI * 2,
        speed: 0.003 + Math.random() * 0.004,
        radius: 12 + Math.random() * 8,
        yOffset: (Math.random() - 0.5) * 8,
      })
    })

    // Parallax logic
    let mouseX = 0, mouseY = 0
    let targetMouseX = 0, targetMouseY = 0

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect()
      targetMouseX = ((e.clientX - rect.left) / width - 0.5) * 2
      targetMouseY = -((e.clientY - rect.top) / height - 0.5) * 2
    }

    window.addEventListener('mousemove', onMouseMove)

    // Resize logic
    const onResize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }

    window.addEventListener('resize', onResize)

    // Animation Loop
    let animationFrameId
    const clock = new THREE.Clock()

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()

      particles.rotation.y = elapsedTime * 0.015
      particles.rotation.x = elapsedTime * 0.008

      lights.forEach((item) => {
        item.angle += item.speed
        item.light.position.x = Math.cos(item.angle) * item.radius
        item.light.position.z = Math.sin(item.angle) * item.radius
        item.light.position.y = item.yOffset + Math.sin(elapsedTime * 0.8 + item.angle) * 2
      })

      mouseX += (targetMouseX - mouseX) * 0.05
      mouseY += (targetMouseY - mouseY) * 0.05
      particles.position.x = mouseX * 4
      particles.position.y = mouseY * 4

      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none opacity-60" />
}

// ── Main React Component ──
export default function MovieStack3D({ movies = MOCK_MOVIES, onMovieChange }) {
  const [stack, setStack] = useState(movies)
  const [isAnimating, setIsAnimating] = useState(false)
  const topCardRef = useRef(null)
  const containerRef = useRef(null)

  // Framer Motion values for drag tracking
  const dragX = useMotionValue(0)
  
  // Dynamic transformations based on drag offset
  const rotateTop = useTransform(dragX, [-200, 200], [-25, 25])
  const skewTop = useTransform(dragX, [-200, 200], [-8, 8])
  const opacityTop = useTransform(dragX, [-200, 0, 200], [0.6, 1, 0.6])

  // Call onMovieChange when the top movie changes
  useEffect(() => {
    if (onMovieChange && stack.length > 0) {
      onMovieChange(stack[0])
    }
  }, [stack, onMovieChange])

  // Handle Swipe/Flyout sequence via GSAP
  const handleSwipe = (direction) => {
    if (isAnimating) return
    setIsAnimating(true)

    const card = topCardRef.current
    if (!card) return

    const flyX = direction === 'right' ? 800 : -800
    const flyRot = direction === 'right' ? 45 : -45
    const currentDragX = dragX.get()

    // 1. Create a GSAP timeline for perfect coordination
    const tl = gsap.timeline({
      onComplete: () => {
        // Recycle the state: move top card to the back of the stack
        setStack((prev) => {
          const next = [...prev]
          const first = next.shift()
          next.push(first)
          return next
        })
        
        // Reset properties of the reused DOM element
        gsap.set(card, { x: 0, y: 0, rotation: 0, opacity: 1, scale: 1, skewX: 0 })
        dragX.set(0)
        setIsAnimating(false)
      }
    })

    // 2. Animate the top card flying out of the screen
    tl.fromTo(card,
      {
        x: currentDragX,
        rotation: (currentDragX / 200) * 25,
        opacity: 1,
        scale: 1,
        skewX: (currentDragX / 200) * 8
      },
      {
        x: flyX,
        y: 100,
        rotation: flyRot,
        opacity: 0,
        scale: 0.85,
        duration: 0.5,
        ease: 'power3.out'
      }
    )

    // 3. Stagger-animate the cards behind so they morph into position
    const otherCards = containerRef.current?.querySelectorAll('.movie-card-stacked:not(.top-card)')
    if (otherCards && otherCards.length > 0) {
      tl.to(otherCards, {
        y: (i) => i * 14,
        scale: (i) => 1 - (i * 0.06),
        rotation: (i) => (i % 2 === 0 ? 3 : -3) * i,
        duration: 0.45,
        ease: 'back.out(1.5)',
      }, '<0.08')
    }
  }

  // Handle Drag release
  const handleDragEnd = (event, info) => {
    const threshold = 130
    if (info.offset.x > threshold) {
      handleSwipe('right')
    } else if (info.offset.x < -threshold) {
      handleSwipe('left')
    } else {
      // Return to center smoothly
      gsap.to(topCardRef.current, {
        x: 0,
        rotation: 0,
        skewX: 0,
        duration: 0.4,
        ease: 'power2.out',
        onUpdate: () => {
          // Sync motion value with GSAP animate back
          dragX.set(gsap.getProperty(topCardRef.current, 'x'))
        }
      })
    }
  }

  const activeMovie = stack[0]

  return (
    <div className="relative w-full min-h-[580px] flex flex-col items-center justify-center py-12 overflow-hidden select-none">
      {/* Subtle 3D Canvas Background */}
      <ThreeBackground />

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-5xl px-4 flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-20">
        
        {/* Left Section: Details with Custom Animation */}
        <div className="w-full md:w-1/2 flex flex-col text-left px-2 max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] px-2 py-1 rounded bg-white/5 border border-white/10 text-white/50">
              Đang chiếu
            </span>
            <div className="flex items-center gap-1 text-amber-500 text-xs font-semibold">
              <Star size={12} fill="currentColor" />
              <span>{activeMovie.rating}</span>
            </div>
          </div>

          <h2 
            className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-1 transition-all duration-300"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {activeMovie.titleVn}
          </h2>
          <p className="text-sm font-medium text-white/40 mb-4 tracking-wide font-mono">
            {activeMovie.title}
          </p>

          <div className="flex flex-wrap gap-4 text-xs text-white/60 mb-5 font-medium">
            <span className="flex items-center gap-1">
              <Film size={12} />
              {activeMovie.genre}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {activeMovie.duration}
            </span>
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {activeMovie.releaseDate}
            </span>
          </div>

          <p className="text-sm text-white/70 leading-relaxed mb-8 max-w-[40ch]">
            {activeMovie.desc}
          </p>

          <div className="flex items-center gap-4">
            <button 
              className="px-6 py-3 rounded-xl font-bold text-sm tracking-wide text-white transition-all flex items-center justify-center gap-2 transform active:scale-95 shadow-[0_4px_24px_rgba(229,9,20,0.3)]"
              style={{ 
                background: 'linear-gradient(135deg, #e50914 0%, #b80710 100%)',
              }}
            >
              <Play size={14} fill="currentColor" />
              <span>Mua Vé Ngay</span>
            </button>
            <button className="px-5 py-3 rounded-xl font-semibold text-sm text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all">
              Chi tiết
            </button>
          </div>
        </div>

        {/* Right Section: 3D Poster Stack */}
        <div className="relative w-full md:w-1/2 flex items-center justify-center py-6">
          
          {/* Arrow Buttons - Floating */}
          <button 
            onClick={() => handleSwipe('left')}
            className="absolute left-[-20px] md:left-[-40px] z-30 w-11 h-11 rounded-full flex items-center justify-center bg-black/60 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all transform active:scale-90"
            aria-label="Previous poster"
          >
            <ChevronLeft size={20} />
          </button>

          <button 
            onClick={() => handleSwipe('right')}
            className="absolute right-[-20px] md:right-[-40px] z-30 w-11 h-11 rounded-full flex items-center justify-center bg-black/60 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/70 hover:text-white transition-all transform active:scale-90"
            aria-label="Next poster"
          >
            <ChevronRight size={20} />
          </button>

          {/* Stack Container */}
          <div 
            ref={containerRef} 
            className="relative w-[280px] h-[420px] sm:w-[300px] sm:h-[450px] flex items-center justify-center"
          >
            {stack.slice(0, 4).reverse().map((movie, index) => {
              // Note: list is reversed so that index 0 (top card) is rendered LAST in DOM (appearing on top)
              // Since slice(0, 4).reverse() is used, the top card corresponds to the last element of this mapped array
              const isTop = index === 3
              const stackIndex = 3 - index // 0 for top, 1 for second, 2 for third, 3 for fourth

              if (isTop) {
                return (
                  <motion.div
                    key={movie.id}
                    ref={topCardRef}
                    className="movie-card-stacked top-card absolute w-full h-full rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
                    style={{
                      x: dragX,
                      rotate: rotateTop,
                      skewX: skewTop,
                      opacity: opacityTop,
                      zIndex: 20,
                      transformOrigin: 'bottom center',
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.7}
                    onDragEnd={handleDragEnd}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Visual poster inside card */}
                    <div className="absolute inset-0 bg-cover bg-center select-none" style={{ backgroundImage: `url(${movie.poster})` }}>
                      {/* Gradient border tint based on movie color */}
                      <div 
                        className="absolute inset-0 opacity-40 pointer-events-none transition-all duration-300" 
                        style={{
                          background: `radial-gradient(circle at 50% 0%, ${movie.color}22 0%, rgba(0,0,0,0.7) 100%)`,
                        }}
                      />
                    </div>
                  </motion.div>
                )
              }

              // Stack cards underneath (non-interactive, styled statically but ready to animate up)
              return (
                <div
                  key={movie.id}
                  className="movie-card-stacked absolute w-full h-full rounded-2xl overflow-hidden shadow-[0_12px_32px_rgba(0,0,0,0.4)] border border-white/5"
                  style={{
                    backgroundImage: `url(${movie.poster})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    transform: `translateY(${stackIndex * 14}px) scale(${1 - (stackIndex * 0.06)}) rotate(${(stackIndex % 2 === 0 ? 3 : -3) * stackIndex}deg)`,
                    zIndex: 10 - stackIndex,
                    filter: `brightness(${1 - stackIndex * 0.15}) blur(${stackIndex * 0.5}px)`,
                    pointerEvents: 'none',
                    transformOrigin: 'bottom center',
                  }}
                />
              )
            })}
          </div>

        </div>

      </div>
    </div>
  )
}
