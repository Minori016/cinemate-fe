import React, { useRef, useState, useEffect, useCallback } from 'react'
import { 
  motion, 
  AnimatePresence, 
  useMotionValue, 
  useSpring, 
  useMotionValueEvent,
  useVelocity,
  useTransform,
  useMotionTemplate
} from 'motion/react'

// Constants
const INTRO_SEEN_KEY = 'cinemate_intro_seen'
const TOTAL_FRAMES = 192

export default function VideoIntro({ onComplete, onExplore, onBuyTicket }) {
  const containerRef = useRef(null)
  const canvasRef = useRef(null)
  const audioRef = useRef(null)
  const canReplayRef = useRef(true)
  
  const [images, setImages] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const currentFrameFloatRef = useRef(1)
  const [showCTA, setShowCTA] = useState(false)

  // 1. PHYSICS ENGINE: Ultra-premium cinematic inertia
  const targetFrame = useMotionValue(1)
  const smoothFrame = useSpring(targetFrame, {
    damping: 50,      // High damping to stop smoothly without bounce
    stiffness: 100,   // Low stiffness for a heavier, cinematic feel
    mass: 1.5         // High mass for momentum
  })

  // 2. MOTION FX: Dynamic Blur based on scroll velocity (Motion Blur)
  const frameVelocity = useVelocity(smoothFrame)
  const blurAmount = useTransform(frameVelocity, [-150, 0, 150], [3, 0, 3]) // Subtle max 3px blur
  const blurFilter = useMotionTemplate`blur(${blurAmount}px)`

  // 3. CINEMATIC ZOOM: Slow dolly-in effect as the sequence progresses
  const canvasScale = useTransform(smoothFrame, [1, TOTAL_FRAMES], [1, 1.15])

  // Image Preloader
  useEffect(() => {
    let isMounted = true;
    
    const loadImages = async () => {
      const loadedImages = new Array(TOTAL_FRAMES + 1);
      let loadedCount = 0;
      
      const promises = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
        const frameNumber = i + 1;
        return new Promise((resolve) => {
          const img = new Image();
          img.src = `/frames/frame_${frameNumber.toString().padStart(3, '0')}.jpg`;
          
          img.onload = () => {
            if (!isMounted) return;
            loadedImages[frameNumber] = img;
            loadedCount++;
            setLoadProgress(Math.round((loadedCount / TOTAL_FRAMES) * 100));
            resolve();
          };
          img.onerror = resolve; 
        });
      });
      
      await Promise.all(promises);
      if (isMounted) {
        setImages(loadedImages);
        // Small delay before showing to ensure smooth transition
        setTimeout(() => setLoaded(true), 400); 
      }
    };
    
    loadImages();
    return () => { isMounted = false; };
  }, []);

  // Frame Renderer (with Frame Blending)
  const renderFrame = useCallback((frameFloat) => {
    if (!canvasRef.current || images.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    const frame1 = Math.floor(frameFloat);
    const frame2 = Math.min(frame1 + 1, TOTAL_FRAMES);
    const blendFactor = frameFloat - frame1; 

    const img1 = images[frame1];
    const img2 = images[frame2];
    if (!img1) return;

    const drawImageScaled = (img, alpha = 1.0) => {
      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;
      
      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      }

      ctx.globalAlpha = alpha;
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    // Optimization: avoid clearRect if we draw full opacity
    drawImageScaled(img1, 1.0);
    
    if (img2 && blendFactor > 0.02) { // 2% threshold to save GPU
      drawImageScaled(img2, blendFactor);
    }
  }, [images]);

  // Event Listeners (Scroll-jacking)
  useEffect(() => {
    if (!loaded) return;

    const handleWheel = (e) => {
      e.preventDefault();
      // Ultra-fine sensitivity tuning
      const delta = e.deltaY * 0.08;
      
      let next = targetFrame.get() + delta;
      next = Math.max(1, Math.min(next, TOTAL_FRAMES));
      targetFrame.set(next);
    };

    let lastTouchY = 0;
    const handleTouchStart = (e) => lastTouchY = e.touches[0].clientY;
    const handleTouchMove = (e) => {
      e.preventDefault();
      const currentY = e.touches[0].clientY;
      const deltaY = lastTouchY - currentY;
      lastTouchY = currentY;
      
      let next = targetFrame.get() + (deltaY * 0.25);
      next = Math.max(1, Math.min(next, TOTAL_FRAMES));
      targetFrame.set(next);
    };

    const options = { passive: false };
    window.addEventListener('wheel', handleWheel, options);
    window.addEventListener('touchstart', handleTouchStart, options);
    window.addEventListener('touchmove', handleTouchMove, options);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [loaded, targetFrame]);

  // Audio Scrubbing Logic
  useMotionValueEvent(smoothFrame, "change", (latest) => {
    if (!loaded) return;
    
    let nextFrameFloat = Math.max(1, Math.min(latest, TOTAL_FRAMES));
    
    // Smart Audio Replay Logic
    if (nextFrameFloat < 3 && !canReplayRef.current) {
      // User scrolled all the way back to the start. Arm the replay.
      canReplayRef.current = true;
      if (audioRef.current && !audioRef.current.paused) {
        let vol = audioRef.current.volume;
        const fade = setInterval(() => {
          vol -= 0.1;
          if (vol <= 0) {
            clearInterval(fade);
            if (audioRef.current) audioRef.current.pause();
          } else if (audioRef.current) audioRef.current.volume = Math.max(0, vol);
        }, 50);
      }
    } else if (nextFrameFloat >= 5 && canReplayRef.current && audioRef.current) {
      // User started scrolling forward. Trigger audio.
      canReplayRef.current = false;
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0;
      audioRef.current.play().catch(() => {});
      
      let vol = 0;
      const fade = setInterval(() => {
        vol += 0.05;
        if (vol >= 0.5) {
          clearInterval(fade);
        } else if (audioRef.current) {
          audioRef.current.volume = Math.max(0, Math.min(1, vol));
        }
      }, 100);
    }

    if (Math.abs(nextFrameFloat - currentFrameFloatRef.current) > 0.005) {
      currentFrameFloatRef.current = nextFrameFloat;
      renderFrame(nextFrameFloat);
      
      // CTA Logic
      if (nextFrameFloat >= TOTAL_FRAMES - 12 && !showCTA) {
        setShowCTA(true);
      } else if (nextFrameFloat < TOTAL_FRAMES - 12 && showCTA) {
        setShowCTA(false);
      }
    }
  });

  // Canvas Sizing
  useEffect(() => {
    if (loaded && canvasRef.current) {
      const resizeCanvas = () => {
        // Double resolution for Retina displays (super crisp)
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = window.innerWidth * dpr;
        canvasRef.current.height = window.innerHeight * dpr;
        // Fix: Do NOT use ctx.scale(dpr, dpr) because renderFrame already uses canvas.width (physical pixels).
        renderFrame(currentFrameFloatRef.current);
      };
      
      window.addEventListener('resize', resizeCanvas);
      resizeCanvas();
      return () => window.removeEventListener('resize', resizeCanvas);
    }
  }, [loaded, renderFrame]);

  // Lock body scroll
  useEffect(() => {
    window.scrollTo(0, 0);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const handleComplete = useCallback((action) => {
    // Fade out audio before completing
    if (audioRef.current) {
      let vol = audioRef.current.volume;
      const fade = setInterval(() => {
        vol -= 0.1;
        if (vol <= 0) {
          clearInterval(fade);
          if (audioRef.current) audioRef.current.pause();
        } else if (audioRef.current) {
          audioRef.current.volume = vol;
        }
      }, 50);
    }

    try { (import.meta.env.DEV ? sessionStorage : localStorage).setItem(INTRO_SEEN_KEY, 'true'); } catch {}
    if (action === 'buy' && onBuyTicket) {
      sessionStorage.setItem('intro_scroll_to_booking', 'true');
      onBuyTicket();
    } else if (action === 'explore' && onExplore) {
      onExplore();
    } else if (onComplete) onComplete();
  }, [onBuyTicket, onExplore, onComplete]);

  return (
    <motion.div 
      ref={containerRef} 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 1.2, ease: "easeInOut" } }}
      className="fixed inset-0 w-full h-full bg-[#050505] z-[9999] overflow-hidden flex items-center justify-center overscroll-none touch-none"
    >
      {/* Background Audio from MP4 */}
      <audio ref={audioRef} src="/Intro.mp4" preload="auto" />

      {/* 4. FILM GRAIN OVERLAY: Adds cinematic texture */}
      <div 
        className="absolute inset-0 pointer-events-none z-10 opacity-[0.04]" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' 
        }}
      />

      {/* Loading State */}
      <AnimatePresence>
        {!loaded && (
          <motion.div 
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#050505]"
          >
            <div className="relative w-20 h-20 mb-8">
              <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                <circle 
                  cx="50" cy="50" r="45" fill="transparent" 
                  stroke="#e50914" strokeWidth="2" 
                  strokeDasharray="283" 
                  strokeDashoffset={283 - (283 * loadProgress) / 100}
                  style={{ transition: 'stroke-dashoffset 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium font-inter tracking-widest">
                {loadProgress}
              </div>
            </div>
            <p className="text-white/40 font-inter text-[10px] tracking-[0.5em] uppercase">Khởi tạo không gian</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas Frame Renderer with GPU Blur & Scale */}
      <motion.canvas 
        ref={canvasRef}
        className="absolute inset-0 w-full h-full origin-center"
        style={{ 
          opacity: loaded ? 1 : 0,
          filter: blurFilter,
          scale: canvasScale,
        }}
        initial={{ filter: "blur(20px)", scale: 1.1 }}
        animate={{ filter: loaded ? "blur(0px)" : "blur(20px)", scale: loaded ? 1 : 1.1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />

      {/* Premium Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-10" 
        style={{
          background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(0,0,0,0.7) 120%), linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 15%, transparent 70%, rgba(0,0,0,0.9) 100%)'
        }}
      />

      {/* Brand Logo */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: loaded ? 1 : 0, y: loaded ? 0 : -20 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        className="absolute top-10 left-10 z-30 pointer-events-none"
      >
        <h1 className="text-2xl font-black tracking-[0.15em] text-white drop-shadow-2xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          CINE<span className="text-[#e50914]">MATE</span>
        </h1>
      </motion.div>

      {/* Skip Button */}
      <motion.button 
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 1, delay: 1 }}
        onClick={() => handleComplete('explore')}
        className="absolute top-10 right-10 z-50 px-6 py-3 text-[9px] font-bold tracking-[0.3em] uppercase text-white/50 hover:text-white transition-colors duration-500 font-inter"
      >
        Bỏ qua
      </motion.button>

      {/* Scroll Indicator */}
      <AnimatePresence>
        {!showCTA && loaded && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
            transition={{ duration: 0.8 }}
            className="absolute bottom-16 flex flex-col items-center gap-6 z-20 pointer-events-none"
          >
            <span className="text-white/40 font-inter text-[9px] tracking-[0.5em] uppercase text-center">
              Lăn chuột
            </span>
            <div className="w-[1px] h-16 bg-white/10 relative overflow-hidden">
              <motion.div 
                animate={{ y: ['-100%', '100%'] }} 
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-b from-transparent via-white/80 to-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ultra-Premium CTA Overlay */}
      <AnimatePresence>
        {showCTA && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <div className="flex flex-col items-center max-w-4xl px-6">
              <motion.p
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                className="text-[#e50914] text-[10px] font-bold tracking-[0.6em] uppercase mb-6"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Hành Trình Bắt Đầu
              </motion.p>
              
              <motion.h2
                initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="text-5xl md:text-7xl text-white text-center leading-[1.1] mb-8 tracking-tighter font-black"
                style={{ fontFamily: 'Montserrat, sans-serif' }}
              >
                Tuyệt Tác <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white/80 to-white/40">
                  Màn Ảnh Rộng
                </span>
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex flex-col sm:flex-row gap-6 mt-8"
              >
                <button
                  onClick={() => handleComplete('explore')}
                  className="group relative px-12 py-5 bg-white text-black overflow-hidden rounded-none font-bold text-xs tracking-[0.2em] uppercase transition-all duration-500"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span className="relative z-10 group-hover:text-white transition-colors duration-500">Khám Phá Ngay</span>
                  <div className="absolute inset-0 bg-[#e50914] translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.16,1,0.3,1]" />
                </button>
                
                <button
                  onClick={() => handleComplete('buy')}
                  className="group relative px-12 py-5 bg-transparent text-white border border-white/20 overflow-hidden rounded-none font-bold text-xs tracking-[0.2em] uppercase transition-all duration-500"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <span className="relative z-10">Mua Vé Ngay</span>
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
