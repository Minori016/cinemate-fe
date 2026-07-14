import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import gsap from 'gsap'
import * as THREE from 'three'
import { ChevronLeft, ChevronRight, Play, Ticket } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { movieService } from '../../services/movieService'

// ── Soft Glowing Background Scene ──
const ThreeBackground = () => {
  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    
    // Smooth grid lines of particles
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100)
    camera.position.set(0, 0, 8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    container.appendChild(renderer.domElement)

    // Colored soft lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.15)
    scene.add(ambientLight)

    const redLight = new THREE.PointLight(0xe50914, 2.5, 20)
    redLight.position.set(-4, 2, 2)
    scene.add(redLight)

    const blueLight = new THREE.PointLight(0x00d2ff, 2.5, 20)
    blueLight.position.set(4, -2, 2)
    scene.add(blueLight)

    const purpleLight = new THREE.PointLight(0x8b00ff, 2.0, 15)
    purpleLight.position.set(0, 3, -2)
    scene.add(purpleLight)

    // Soft reflective floor mesh to bounce color glows
    const floorGeo = new THREE.PlaneGeometry(30, 20)
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0x070707,
      roughness: 0.4,
      metalness: 0.1,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      transparent: true,
      opacity: 0.7,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2.5
    floor.position.y = -3.5
    floor.position.z = -2
    scene.add(floor)

    // Particles array
    const particleCount = 40
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(particleCount * 3)
    const speeds = []

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 14
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2
      speeds.push({
        y: 0.003 + Math.random() * 0.005,
        x: (Math.random() - 0.5) * 0.003,
      })
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // Canvas particle texture
    const pCanvas = document.createElement('canvas')
    pCanvas.width = 16
    pCanvas.height = 16
    const ctx = pCanvas.getContext('2d')
    const grad = ctx.createRadialGradient(8, 8, 0, 8, 8, 8)
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 16, 16)
    const pTexture = new THREE.CanvasTexture(pCanvas)

    const pMaterial = new THREE.PointsMaterial({
      size: 0.25,
      map: pTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    const pointSystem = new THREE.Points(geometry, pMaterial)
    scene.add(pointSystem)

    let animId
    let time = 0

    // Animation Loop
    const tick = () => {
      time += 0.01

      // Rotate point lights slightly in orbits
      redLight.position.x = Math.sin(time * 0.4) * 6
      redLight.position.y = Math.cos(time * 0.3) * 3
      blueLight.position.x = -Math.sin(time * 0.5) * 6
      blueLight.position.y = -Math.cos(time * 0.4) * 3

      // Float particles
      const posArr = pointSystem.geometry.attributes.position.array
      for (let i = 0; i < particleCount; i++) {
        posArr[i * 3 + 1] += speeds[i].y
        posArr[i * 3] += speeds[i].x
        
        // Wrap around boundaries
        if (posArr[i * 3 + 1] > 4) posArr[i * 3 + 1] = -4
        if (posArr[i * 3] > 7) posArr[i * 3] = -7
        if (posArr[i * 3] < -7) posArr[i * 3] = -7
      }
      pointSystem.geometry.attributes.position.needsUpdate = true

      renderer.render(scene, camera)
      animId = requestAnimationFrame(tick)
    }

    tick()

    const handleResize = () => {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      renderer.setSize(w, h)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }

    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return <div ref={containerRef} className="absolute inset-0 z-0 pointer-events-none" />
}

// ── Default high-quality mock movies for fallback ──
const MOCK_MOVIES = [
  { id: 1, title: 'Dune: Hành Tinh Cát - Phần Hai', duration: 166, rating: 'T16', genre: 'Hành động, Phiêu lưu, Khoa học viễn tưởng', format: 'IMAX 2D', poster: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=600&auto=format&fit=crop' },
  { id: 2, title: 'Oppenheimer: Kẻ Hủy Diệt Thế Giới', duration: 180, rating: 'T18', genre: 'Tiểu sử, Lịch sử, Chính kịch', format: 'Digital 2D', poster: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=600&auto=format&fit=crop' },
  { id: 3, title: 'Spider-Man: Du Hành Vũ Trụ Nhện', duration: 140, rating: 'K', genre: 'Hoạt hình, Hành động, Phiêu lưu', format: '3D', poster: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?q=80&w=600&auto=format&fit=crop' },
  { id: 4, title: 'Interstellar: Hố Đen Tử Thần', duration: 169, rating: 'T13', genre: 'Khoa học viễn tưởng, Phiêu lưu, Chính kịch', format: 'IMAX 2D', poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=600&auto=format&fit=crop' },
  { id: 5, title: 'Blade Runner 2049', duration: 164, rating: 'T18', genre: 'Khoa học viễn tưởng, Hành động, Bí ẩn', format: 'Digital 2D', poster: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=600&auto=format&fit=crop' }
]

export default function MovieArcCarousel3D({ movies: propMovies, onMovieChange }) {
  const navigate = useNavigate()
  const [movies, setMovies] = useState(propMovies || MOCK_MOVIES)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isCenterHovered, setIsCenterHovered] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  const cardRefs = useRef([])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setIsCenterHovered(false)
  }, [activeIndex])

  // Load from API if no propMovies passed
  useEffect(() => {
    if (!propMovies) {
      movieService.getAll({ status: 'ACTIVE', size: 10 })
        .then((res) => {
          if (res && res.data && res.data.length >= 3) {
            setMovies(res.data)
          }
        })
        .catch((err) => console.log('Using mock movies fallback.', err))
    } else {
      setMovies(propMovies)
    }
  }, [propMovies])

  // Call onMovieChange when index wraps
  useEffect(() => {
    if (movies.length > 0 && onMovieChange) {
      onMovieChange(movies[activeIndex])
    }
  }, [activeIndex, movies, onMovieChange])

  const nextMovie = () => {
    setActiveIndex(prev => (prev + 1) % movies.length)
  }

  const prevMovie = () => {
    setActiveIndex(prev => (prev - 1 + movies.length) % movies.length)
  }

  const handleDrag = (event, info) => {
    const cardEl = cardRefs.current[activeIndex]
    if (cardEl) {
      const offsetX = info.offset.x
      const rotation = offsetX * 0.15
      const clampedOffset = Math.min(Math.max(offsetX, -180), 180)
      const scale = 1.0 - (Math.abs(clampedOffset) / 180) * 0.06
      
      gsap.set(cardEl, {
        x: offsetX,
        rotationY: rotation,
        scale: scale
      })
    }
  }

  const handleDragEnd = (event, info) => {
    setIsDragging(false)
    const threshold = 90
    if (info.offset.x < -threshold) {
      nextMovie()
    } else if (info.offset.x > threshold) {
      prevMovie()
    } else {
      // Reset card if threshold not met
      const cardEl = cardRefs.current[activeIndex]
      if (cardEl) {
        gsap.to(cardEl, {
          x: 0,
          rotationY: 0,
          scale: 1.0,
          duration: 0.4,
          ease: 'power2.out',
          overwrite: 'auto'
        })
      }
    }
  }

  const handleDragStart = () => {
    setIsDragging(true)
  }

  // Auto play effect
  useEffect(() => {
    if (isHovered || isDragging || movies.length === 0) return

    const timer = setInterval(() => {
      nextMovie()
    }, 4000)

    return () => clearInterval(timer)
  }, [isHovered, isDragging, movies.length])

  // GSAP 3D Arc Positioning Choreography
  useEffect(() => {
    if (movies.length === 0) return
    const N = movies.length
    const isDesktop = windowWidth >= 768
    const sideX = isDesktop 
      ? (180 + windowWidth * 0.045) 
      : (110 + windowWidth * 0.05)
    const outerX = isDesktop 
      ? (330 + windowWidth * 0.08) 
      : (200 + windowWidth * 0.1)
    const scaleCenter = 1.0
    const scaleSide = isDesktop ? 0.82 : 0.8
    const scaleOuter = isDesktop ? 0.67 : 0.65
    const scaleCenterHovered = 1.05


    movies.forEach((_, i) => {
      let diff = i - activeIndex
      
      // Calculate wrapped shortest path distance
      if (diff > N / 2) diff -= N
      if (diff < -N / 2) diff += N

      const cardEl = cardRefs.current[i]
      if (!cardEl) return

      let x = 0
      let scale = 0.5
      let rotateY = 0
      let opacity = 0
      let zIndex = 0
      let brightness = 30
      let blur = 4
      let translateZ = -300

      // Fan Arc layout positions
      if (diff === 0) {
        x = 0
        scale = scaleCenter
        rotateY = 0
        opacity = 1
        zIndex = 10
        brightness = 100
        blur = 0
        translateZ = 0
      } else if (diff === -1) {
        x = -sideX
        scale = scaleSide
        rotateY = 30
        opacity = 0.85
        zIndex = 8
        brightness = 75
        blur = 0.5
        translateZ = isDesktop ? -150 : -100
      } else if (diff === 1) {
        x = sideX
        scale = scaleSide
        rotateY = -30
        opacity = 0.85
        zIndex = 8
        brightness = 75
        blur = 0.5
        translateZ = isDesktop ? -150 : -100
      } else if (diff === -2) {
        x = -outerX
        scale = scaleOuter
        rotateY = 50
        opacity = 0.45
        zIndex = 6
        brightness = 40
        blur = 1.5
        translateZ = isDesktop ? -280 : -180
      } else if (diff === 2) {
        x = outerX
        scale = scaleOuter
        rotateY = -50
        opacity = 0.45
        zIndex = 6
        brightness = 40
        blur = 1.5
        translateZ = isDesktop ? -280 : -180
      } else {
        // Move other cards completely into the background
        x = diff > 0 ? (outerX + 150) : -(outerX + 150)
        scale = 0.3
        rotateY = diff > 0 ? -65 : 65
        opacity = 0
        zIndex = 1
        brightness = 20
        blur = 6
        translateZ = -400
      }

      gsap.to(cardEl, {
        x: x,
        scale: scale,
        rotationY: rotateY,
        opacity: opacity,
        zIndex: zIndex,
        z: translateZ,
        filter: `brightness(${brightness}%) blur(${blur}px)`,
        duration: 0.8,
        ease: 'power3.out',
        overwrite: 'auto'
      })
    })
  }, [activeIndex, movies, windowWidth])

  return (
    <div 
      className="relative w-full min-h-[520px] md:min-h-[700px] bg-[#070707] flex flex-col items-center justify-center overflow-hidden py-12"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Ambient background refraction */}
      <ThreeBackground />

      {/* 3D Cards container */}
      <div 
        className="relative flex items-center justify-center w-full h-[420px] md:h-[600px] z-10"
        style={{
          perspective: '1200px',
          transformStyle: 'preserve-3d',
        }}
      >
        {movies.map((movie, i) => {
          const diff = i - activeIndex
          
          let shortestDiff = diff
          if (shortestDiff > movies.length / 2) shortestDiff -= movies.length
          if (shortestDiff < -movies.length / 2) shortestDiff += movies.length
          const isCenter = shortestDiff === 0
          const isVisible = Math.abs(shortestDiff) <= 2

          return (
            <motion.div
              key={movie.id}
              ref={el => cardRefs.current[i] = el}
              drag={isCenter ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragStart={isCenter ? handleDragStart : undefined}
              onDrag={isCenter ? handleDrag : undefined}
              onDragEnd={isCenter ? handleDragEnd : undefined}
              onMouseEnter={isCenter ? () => setIsCenterHovered(true) : undefined}
              onMouseLeave={isCenter ? () => setIsCenterHovered(false) : undefined}
              onClick={() => {
                if (shortestDiff === 0) navigate(`/movies/${movie.id}`)
                else if (shortestDiff === -1) prevMovie()
                else if (shortestDiff === 1) nextMovie()
                else if (shortestDiff === -2) { prevMovie(); setTimeout(prevMovie, 100); }
                else if (shortestDiff === 2) { nextMovie(); setTimeout(nextMovie, 100); }
              }}
              className="absolute w-[260px] h-[390px] md:w-[380px] md:h-[570px] rounded-2xl overflow-hidden cursor-pointer select-none bg-zinc-900 border border-white/5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]"

              style={{
                pointerEvents: isVisible ? 'auto' : 'none',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden'
              }}
            >
              <img 
                src={movie.poster || movie.image} 
                alt={movie.title}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
              {/* Highlight overlay border to simulate real plastic reflect */}
              <div className="absolute inset-0 border border-white/10 pointer-events-none rounded-2xl z-20" />

              {/* Hover overlay with details and buttons for active center poster */}
              <AnimatePresence>
                {isCenter && isCenterHovered && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 bg-black/80 z-30 flex flex-col items-center justify-center gap-4 px-6 pointer-events-auto text-center"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {/* Rating badge & duration */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black border border-red-500 bg-red-500/10 text-red-500">
                        {movie.rating || 'T16'}
                      </span>
                      <span className="text-[10px] text-white/40">•</span>
                      <span className="text-[10px] font-medium text-white/50 uppercase tracking-widest">
                        {movie.duration || '120'} phút
                      </span>
                      <span className="text-[10px] text-white/40">•</span>
                      <span className="text-[10px] font-medium text-white/50 uppercase tracking-widest">
                        {movie.format || 'Digital 2D'}
                      </span>
                    </div>

                    {/* Title */}
                    <h2 
                      className="text-white text-base sm:text-lg font-black uppercase tracking-wider line-clamp-2 px-2"
                      style={{ fontFamily: 'Montserrat, sans-serif' }}
                    >
                      {movie.title}
                    </h2>

                    {/* Genre */}
                    <p className="text-[10px] sm:text-[11px] text-white/40 max-w-[220px] font-medium tracking-wide mb-2 line-clamp-2">
                      {movie.genre}
                    </p>

                    <div className="w-full flex flex-col items-center gap-2.5 mt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/movies/${movie.id}?booking=true`)
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="w-full max-w-[170px] flex items-center justify-center gap-2 py-2.5 px-5 rounded-full text-[10px] font-black uppercase tracking-widest text-white bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 transition-all shadow-[0_4px_14px_rgba(229,9,20,0.4)] border-none cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <Ticket size={14} />
                        Đặt Vé Ngay
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          navigate(`/movies/${movie.id}`)
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="w-full max-w-[170px] flex items-center justify-center gap-2 py-2.5 px-5 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/40 bg-white/5 hover:bg-white/15 hover:border-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <Play size={12} className="fill-white" />
                        Chi Tiết
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}

        {/* Minimal Navigation Arrows */}
        <button 
          onClick={prevMovie}
          className="absolute left-4 sm:left-12 z-30 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <button 
          onClick={nextMovie}
          className="absolute right-4 sm:right-12 z-30 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}
