import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cinemaRoomService } from '../../../services/cinemaRoomService'
import Button from '../../../components/common/Button'
import { ArrowLeft, Plus, MapPin, Users, CheckCircle, AlertCircle, X, Star, Hash, Film, Sparkles, Save, LayoutGrid, Layers, Eye } from 'lucide-react'
import { motion } from 'motion/react'

const AVAILABLE_FORMATS = ['2D', '3D', '4DX', 'IMAX']

const FORMAT_META = {
  '2D': { color: 'sky', label: '2D', desc: 'Chuan HD' },
  '3D': { color: 'violet', label: '3D', desc: 'Dang 3 chieu' },
  '4DX': { color: 'rose', label: '4DX', desc: 'Chuyen dong da giac' },
  'IMAX': { color: 'amber', label: 'IMAX', desc: 'Man hinh lon' },
}

const LAYOUT_META = {
  NONE: { label: 'Khong khoi tao', desc: 'Ve tay sau', seats: 0, rows: 0, cols: 0, emoji: '✋' },
  SMALL: { label: 'Mau tieu chuan', desc: '80 Ghe - 8 x 10', seats: 80, rows: 8, cols: 10, emoji: '🎬' },
  IMAX: { label: 'Mau IMAX', desc: '140 Ghe - 10 x 14', seats: 140, rows: 10, cols: 14, emoji: '🎥' },
  '4DX': { label: 'Mau 4DX VIP', desc: '48 Ghe - 6 x 8', seats: 48, rows: 6, cols: 8, emoji: '🎞️' },
}

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
}

export default function CinemaRoomFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditMode = !!id

  const [name, setName] = useState('')
  const [cinemaId, setCinemaId] = useState('')
  const [supportedFormats, setSupportedFormats] = useState(['2D'])
  const [layoutTemplate, setLayoutTemplate] = useState('NONE')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState(null)
  const [errors, setErrors] = useState({})

  const validateForm = () => {
    const tempErrors = {}
    if (!name.trim()) tempErrors.name = 'Ten phong chieu khong duoc de trong'
    if (supportedFormats.length === 0) tempErrors.formats = 'Phai chon it nhat 1 dinh dang'
    setErrors(tempErrors)
    return Object.keys(tempErrors).length === 0
  }

  const handleFormatToggle = (fmt) => {
    setSupportedFormats(prev =>
      prev.includes(fmt)
        ? prev.filter(f => f !== fmt)
        : [...prev, fmt]
    )
  }

  const generateLayoutPayload = (template) => {
    let rows, cols
    if (template === 'SMALL') { rows = 8; cols = 10 }
    else if (template === 'IMAX') { rows = 10; cols = 14 }
    else if (template === '4DX') { rows = 6; cols = 8 }
    else return null

    const seats = []
    for (let i = 0; i < rows; i++) {
      const rowLabel = String.fromCharCode(65 + i)
      const isLastRow = i === rows - 1

      let j = 1
      while (j <= cols) {
        if (isLastRow) {
          seats.push({ row: rowLabel, number: j, type: 'COUPLE', status: 'ACTIVE' })
          j += 2
        } else {
          let type = 'STANDARD'
          if (template === '4DX') {
            type = 'VIP'
          } else if (template === 'IMAX') {
            if (i >= 3 && i <= 7 && j >= 3 && j <= cols - 2) type = 'VIP'
            else if (i === 8) type = 'VIP'
          } else {
            if (i >= rows - 3) type = 'VIP'
          }
          seats.push({ row: rowLabel, number: j, type, status: 'ACTIVE' })
          j++
        }
      }
    }
    return { rows, cols, seats }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      setToast({ message: 'Vui long kiem tra lai thong tin.', type: 'danger' })
      return
    }

    setIsSubmitting(true)
    const payload = {
      name: name.trim(),
      supportedFormats,
      ...(cinemaId && { cinemaId })
    }

    try {
      if (isEditMode) {
        await cinemaRoomService.updateInfo(id, payload)
        setToast({ message: 'Cap nhat phong chieu thanh cong!', type: 'success' })
      } else {
        const res = await cinemaRoomService.create(payload)
        const newRoomId = res.data?.result?.id || res.data?.id

        if (newRoomId && layoutTemplate !== 'NONE') {
          const layoutPayload = generateLayoutPayload(layoutTemplate)
          if (layoutPayload) {
            await cinemaRoomService.updateLayout(newRoomId, layoutPayload)
          }
        }

        setToast({ message: 'Them phong chieu moi thanh cong!', type: 'success' })
      }
      setTimeout(() => {
        navigate('/admin/cinema-rooms')
      }, 1500)
    } catch (err) {
      console.error('Failed to save cinema room', err)
      const serverMsg = err.response?.data?.message || err.message || 'Loi he thong'
      setToast({ message: `Khong the luu: ${serverMsg}`, type: 'danger' })
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    if (isEditMode) {
      cinemaRoomService.getById(id)
        .then(res => {
          const room = res.data?.result || res.data
          if (room) {
            setName(room.name || '')
            setCinemaId(room.cinemaId || '')
            setSupportedFormats(room.supportedFormats && room.supportedFormats.length > 0 ? room.supportedFormats : ['2D'])
          }
        })
        .catch(err => {
          console.error('Failed to load room', err)
          setToast({ message: 'Khong the tai thong tin phong chieu', type: 'danger' })
        })
    }
  }, [id, isEditMode])

  const handleCancel = () => {
    navigate('/admin/cinema-rooms')
  }

  return (
    <div className="text-left space-y-6">
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border-2 text-sm max-w-sm font-bold ${toast.type === 'danger' ? 'bg-rose-50 border-rose-300 text-rose-900' : 'bg-emerald-50 border-emerald-300 text-emerald-900'}`}
        >
          {toast.type === 'danger' ? <AlertCircle size={20} /> : <CheckCircle size={20} />}
          <span>{toast.message}</span>
        </motion.div>
      )}

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-sky-50 via-amber-50 to-rose-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <button
                onClick={handleCancel}
                className="group w-12 h-12 bg-slate-900 hover:bg-red-600 border-2 border-slate-900 rounded-2xl flex items-center justify-center text-white transition-all cursor-pointer shadow-lg hover:shadow-red-500/30 hover:scale-105"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </button>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Star size={10} fill="currentColor" />
                    {isEditMode ? 'EDIT MODE' : 'NEW ENTRY'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <Film size={11} /> Cinema Room
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  {isEditMode ? <>Cap nhat<br /><span className="text-red-600">phong chieu</span></> : <>Them phong chieu<br /><span className="text-red-600">moi cho rap</span></>}
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  {isEditMode ? 'Chinh sua thong tin phong chieu hien co.' : 'Tao phong chieu moi va thiet lap cac dinh dang ho tro.'}
                </p>
              </div>
            </div>
            <div className="hidden lg:flex flex-col items-end gap-2">
              <div className="bg-slate-900 text-white px-4 py-2 rounded-xl border-2 border-slate-900 shadow-lg">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  <Hash size={11} /> Room ID
                </div>
                <div className="text-xl font-black font-mono tracking-tight">
                  {isEditMode ? id?.slice(0, 8) : 'NEW'}
                </div>
              </div>
            </div>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* SECTION 01 - BASIC INFO */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
          >
            <div className="flex items-stretch border-b-2 border-slate-900">
              <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                <span className="text-xl font-black">01</span>
              </div>
              <div className="flex-1 px-5 py-3 flex items-center justify-between bg-rose-50">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Thong tin phong chieu</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Ten phong va cac tuy chon co ban</p>
                </div>
                <MapPin size={20} className="text-slate-900" strokeWidth={2.5} />
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-5 bg-white">
              <div>
                <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-2 flex items-center gap-1.5">
                  <MapPin size={11} strokeWidth={2.5} className="text-red-600" />
                  Ten phong chieu <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Vi du: Phong chieu 5 (IMAX)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full bg-rose-50/50 border-2 rounded-xl py-3 px-4 outline-none text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-slate-900 focus:bg-rose-50 font-bold ${errors.name ? 'border-red-600' : 'border-slate-200'}`}
                />
                {errors.name && <span className="text-[10px] text-red-600 font-bold mt-1 block">{errors.name}</span>}
              </div>

              {/* SECTION 02 - FORMATS */}
              <div className="pt-2">
                <label className="text-[11px] font-black tracking-[0.15em] text-slate-900 uppercase block mb-3 flex items-center gap-1.5">
                  <Film size={11} strokeWidth={2.5} className="text-red-600" />
                  Dinh dang ho tro <span className="text-red-600">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {AVAILABLE_FORMATS.map(fmt => {
                    const isActive = supportedFormats.includes(fmt)
                    const meta = FORMAT_META[fmt]
                    const colorClass = {
                      sky: 'border-sky-700 bg-sky-200 text-sky-900',
                      violet: 'border-violet-700 bg-violet-200 text-violet-900',
                      rose: 'border-rose-700 bg-rose-200 text-rose-900',
                      amber: 'border-amber-700 bg-amber-200 text-amber-900',
                    }[meta.color]
                    const inactiveClass = 'border-slate-300 bg-white text-slate-500 hover:border-slate-500 hover:bg-slate-50'
                    return (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => handleFormatToggle(fmt)}
                        className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] ${isActive ? colorClass : inactiveClass}`}
                      >
                        {isActive && (
                          <div className="absolute top-2 right-2 w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center shadow-md">
                            <CheckCircle size={14} className="text-amber-300" strokeWidth={3} />
                          </div>
                        )}
                        <div className="text-2xl font-black mb-1">{meta.label}</div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'opacity-80' : 'opacity-60'}`}>{meta.desc}</div>
                      </button>
                    )
                  })}
                </div>
                {errors.formats && <span className="text-[10px] text-red-600 font-bold mt-2 block">{errors.formats}</span>}
                <p className="text-[10px] text-slate-500 font-bold mt-2">
                  Da chon: <span className="text-red-600">{supportedFormats.length}</span> / {AVAILABLE_FORMATS.length} dinh dang
                </p>
              </div>
            </div>
          </motion.div>

          {!isEditMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="relative bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
            >
              <div className="flex items-stretch border-b-2 border-slate-900">
                <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                  <span className="text-xl font-black">02</span>
                </div>
                <div className="flex-1 px-5 py-3 flex items-center justify-between bg-sky-50">
                  <div>
                    <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Mau so do ghe</h2>
                    <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Tuy chon - khoi tao ghe tu dong theo mau co san</p>
                  </div>
                  <LayoutGrid size={20} className="text-slate-900" strokeWidth={2.5} />
                </div>
              </div>

              <div className="p-6 md:p-8 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(LAYOUT_META).map(([key, meta]) => {
                    const isActive = layoutTemplate === key
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setLayoutTemplate(key)}
                        className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer text-left shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] ${isActive ? 'border-slate-900 bg-amber-100' : 'border-slate-300 bg-white hover:bg-slate-50'}`}
                      >
                        {isActive && (
                          <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-md">
                            <CheckCircle size={14} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 border-2 ${isActive ? 'bg-slate-900 border-slate-900' : 'bg-slate-100 border-slate-300'}`}>
                            <span className={isActive ? '' : 'grayscale'}>{meta.emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <p className="text-sm font-black text-slate-900 uppercase tracking-wide">{meta.label}</p>
                              {meta.seats > 0 && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 text-amber-300 rounded text-[10px] font-black">
                                  <Users size={9} strokeWidth={3} /> {meta.seats}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-bold text-slate-600 leading-tight">{meta.desc}</p>
                            {meta.rows > 0 && (
                              <div className="flex items-center gap-1 mt-2">
                                {Array.from({ length: Math.min(meta.rows, 5) }).map((_, i) => (
                                  <div key={i} className="w-2 h-2 bg-slate-300 rounded-sm" />
                                ))}
                                {meta.rows > 5 && <span className="text-[9px] font-black text-slate-400 ml-1">+{meta.rows - 5}</span>}
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider ml-2">{meta.cols} cot</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* TOM TAT */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative bg-white border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
          >
            <div className="flex items-stretch border-b-2 border-slate-900">
              <div className="bg-slate-900 text-amber-300 px-5 py-3 flex items-center gap-2 border-r-2 border-slate-900">
                <span className="text-xl font-black">S</span>
              </div>
              <div className="flex-1 px-5 py-3 flex items-center justify-between bg-violet-50">
                <div>
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Tom tat</h2>
                  <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Thong tin chinh cua phong</p>
                </div>
                <Sparkles size={20} className="text-slate-900" strokeWidth={2.5} />
              </div>
            </div>
            <div className="p-6 space-y-3 bg-white">
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin size={14} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ten phong</p>
                  <p className="text-sm font-black text-slate-900 truncate">{name || 'Chua nhap'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border-2 border-slate-200">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Film size={14} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Dinh dang</p>
                  {supportedFormats.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {supportedFormats.map(f => (
                        <span key={f} className="px-2 py-0.5 bg-slate-900 text-amber-300 rounded text-[10px] font-black">
                          {f}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-black text-slate-400">Chua chon</p>
                  )}
                </div>
              </div>
              {!isEditMode && (
                <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-amber-50 to-rose-50 rounded-xl border-2 border-slate-900">
                  <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <LayoutGrid size={14} className="text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-slate-700">Mau so do</p>
                    <p className="text-sm font-black text-slate-900 truncate">{LAYOUT_META[layoutTemplate].label}</p>
                    {LAYOUT_META[layoutTemplate].seats > 0 && (
                      <p className="text-[10px] font-bold text-slate-600 mt-0.5">
                        {LAYOUT_META[layoutTemplate].seats} ghe - {LAYOUT_META[layoutTemplate].rows}x{LAYOUT_META[layoutTemplate].cols}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* LUU Y */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative bg-amber-100 border-2 border-slate-900 rounded-3xl overflow-hidden shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]"
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={16} className="text-amber-300" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-900 mb-1">Luu y</p>
                  <ul className="text-xs text-slate-800 space-y-1 font-bold leading-relaxed">
                    <li>-- Ten phong chieu phai la duy nhat</li>
                    <li>-- He thong se tu tao so do ghe mac dinh</li>
                    <li>-- Co the tuy chinh layout sau khi tao</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-3"
          >
            <Button
              variant="secondary"
              onClick={handleCancel}
              className="flex-1 py-4 !rounded-2xl !border-2 !border-dashed !border-slate-500 !bg-slate-600 hover:!bg-slate-500 !text-white hover:!text-white font-black uppercase tracking-wider text-xs !shadow-none transition-all"
              type="button"
            >
              <X size={14} className="inline mr-1.5 -mt-0.5" strokeWidth={3} /> Huy bo
            </Button>
            <Button
              className="flex-1 py-4 rounded-2xl border-2 border-slate-900 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-wider text-xs shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              disabled={isSubmitting} type="submit"
            >
              {isSubmitting ? 'Dang luu...' : <><Save size={14} className="inline mr-1.5 -mt-0.5" strokeWidth={2.5} />{isEditMode ? 'Cap nhat' : 'Them moi'}</>}
            </Button>
          </motion.div>
        </div>
      </form>
    </div>
  )
}