import { useState, useEffect } from 'react'
import { Settings, Save, CheckCircle, Ticket, Clock, Sparkles, Hash, Star, Brush, Tv, Film, CircleDollarSign } from 'lucide-react'
import { priceConfigService } from '../../../services/priceConfigService'
import { toast } from 'sonner'
import { systemConfigService } from '../../../services/systemConfigService'

function TicketStrip({ count = 14 }) {
  return (
    <div className="flex w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-2 bg-red-600" style={{ clipPath: 'polygon(0 0, 100% 0, 75% 100%, 25% 100%)' }} />
      ))}
    </div>
  )
}

const SYS_CONFIG_META = {
  OPENING_TIME: { label: 'Gio mo cua', icon: Clock, bg: 'bg-emerald-500', text: 'text-white', type: 'time', desc: 'Khung gio he thong bat dau phuc vu' },
  CLOSING_TIME: { label: 'Gio dong cua', icon: Clock, bg: 'bg-rose-500', text: 'text-white', type: 'time', desc: 'Khung gio he thong ngung phuc vu' },
  CLEANING_BUFFER_DEFAULT: { label: 'Don dep (2D / Thuong)', icon: Brush, bg: 'bg-amber-500', text: 'text-white', type: 'number', desc: 'Thoi gian don dep phong chieu 2D' },
  CLEANING_BUFFER_3D: { label: 'Don dep (Phong 3D)', icon: Brush, bg: 'bg-sky-500', text: 'text-white', type: 'number', desc: 'Thoi gian don dep phong chieu 3D' },
  CLEANING_BUFFER_4DX: { label: 'Don dep (Phong 4DX)', icon: Brush, bg: 'bg-violet-500', text: 'text-white', type: 'number', desc: 'Thoi gian don dep phong chieu 4DX' },
  CLEANING_BUFFER_IMAX: { label: 'Don dep (Phong IMAX)', icon: Brush, bg: 'bg-indigo-500', text: 'text-white', type: 'number', desc: 'Thoi gian don dep phong chieu IMAX' },
  TRAILER_BUFFER_DEFAULT: { label: 'Trailer mac dinh', icon: Film, bg: 'bg-orange-500', text: 'text-white', type: 'number', desc: 'Thoi gian chay trailer truoc khi bat film' },
}

const FORMAT_META = {
  '2D': { bg: 'bg-sky-500', border: 'border-sky-700', icon: Tv },
  '3D': { bg: 'bg-violet-500', border: 'border-violet-700', icon: Film },
  'IMAX': { bg: 'bg-rose-500', border: 'border-rose-700', icon: Tv },
  '4DX': { bg: 'bg-amber-500', border: 'border-amber-700', icon: Film },
}

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sysConfigs, setSysConfigs] = useState([])
  const [editPrices, setEditPrices] = useState({})
  const [editSysConfigs, setEditSysConfigs] = useState({})

  const fetchConfigs = async () => {
    setLoading(true)
    try {
      const [priceData, sysData] = await Promise.all([
        priceConfigService.getAll(),
        systemConfigService.getAll()
      ])
      setConfigs(priceData || [])
      setSysConfigs(sysData?.data?.result || sysData || [])

      const initialPriceEdits = {}
      ;(priceData || []).forEach(c => { initialPriceEdits[c.format] = c.basePrice })
      setEditPrices(initialPriceEdits)

      const initialSysEdits = {}
      ;(sysData?.data?.result || sysData || []).forEach(c => { initialSysEdits[c.configKey] = c.configValue })
      setEditSysConfigs(initialSysEdits)
    } catch (error) {
      toast.error('Loi khi tai cau hinh: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchConfigs()
  }, [])

  const handlePriceChange = (format, value) => {
    setEditPrices(prev => ({ ...prev, [format]: Number(value) || 0 }))
  }

  const handleSave = async (format) => {
    const newPrice = editPrices[format]
    if (!newPrice || newPrice <= 0) {
      toast.error('Gia ve khong hop le')
      return
    }
    setSaving(true)
    try {
      await priceConfigService.updatePrice(format, newPrice)
      toast.success(`Da cap nhat gia cho dinh dang ${format}`)
      setConfigs(prev => prev.map(c => c.format === format ? { ...c, basePrice: newPrice } : c))
    } catch (error) {
      toast.error('Loi khi luu gia: ' + (error.response?.data?.message || error.message))
    } finally {
      setSaving(false)
    }
  }

  const handleSysConfigChange = (key, value) => {
    setEditSysConfigs(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSysConfig = async (key) => {
    const newValue = editSysConfigs[key]
    if (!newValue) {
      toast.error('Gia tri khong duoc de trong')
      return
    }
    setSaving(true)
    try {
      await systemConfigService.updateConfigs([{ configKey: key, configValue: newValue }])
      toast.success(`Da cap nhat ${key === 'OPENING_TIME' ? 'Gio mo cua' : key === 'CLOSING_TIME' ? 'Gio dong cua' : key}`)
      setSysConfigs(prev => prev.map(c => c.configKey === key ? { ...c, configValue: newValue } : c))
    } catch (error) {
      toast.error('Loi khi luu cau hinh: ' + (error.response?.data?.message || error.message))
    } finally {
      setSaving(false)
    }
  }

  if (loading && configs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-red-600 rounded-full animate-spin" />
        <p className="text-sm font-black uppercase tracking-wider text-slate-700">Dang tai cau hinh...</p>
      </div>
    )
  }

  return (
    <div className="text-left space-y-6">

      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-2 border-slate-900 bg-gradient-to-br from-sky-50 via-violet-50 to-amber-50">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 1px, transparent 1px, transparent 12px)'
        }} />
        <div className="relative"><TicketStrip count={20} /></div>
        <div className="relative px-6 md:px-10 py-6 md:py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-slate-900 border-2 border-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
                <Settings size={26} className="text-amber-300" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 rounded-md text-[10px] font-black uppercase tracking-[0.15em] text-amber-300">
                    <Star size={10} fill="currentColor" /> SYSTEM CONFIG
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <Hash size={11} /> {sysConfigs.length} cau hinh
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-md text-[10px] font-black uppercase tracking-wider">
                    <CircleDollarSign size={10} strokeWidth={3} /> {configs.length} gia ve
                  </span>
                </div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 leading-[0.95]">
                  Cau hinh<br /><span className="text-red-600">he thong</span>
                </h1>
                <p className="text-sm text-slate-600 mt-3 max-w-md leading-relaxed">
                  Quan ly gio mo/dong cua va bang gia ve co ban cho toan he thong rap.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 bg-white border-2 border-slate-900 rounded-2xl shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="w-9 h-9 bg-emerald-500 border-2 border-slate-900 rounded-lg flex items-center justify-center">
                <CheckCircle size={16} className="text-white" strokeWidth={3} />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-slate-600 leading-none">Trang thai</p>
                <p className="text-sm font-black text-slate-900 mt-0.5">Dong bo</p>
              </div>
            </div>
          </div>
        </div>
        <TicketStrip count={20} />
      </div>

      {/* PART_TIME_HERE */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="flex items-stretch border-b-2 border-slate-900">
          <div className="bg-slate-900 text-amber-300 px-5 py-4 flex items-center gap-2 border-r-2 border-slate-900">
            <Clock size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-violet-50">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Cau hinh thoi gian & hoat dong</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Thoi gian hoat dong he thong va buffer cho cac phong chieu</p>
            </div>
            <Sparkles size={20} className="text-slate-900" strokeWidth={2.5} />
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(() => {
            const orderOfKeys = [
              'OPENING_TIME',
              'CLOSING_TIME',
              'CLEANING_BUFFER_DEFAULT',
              'CLEANING_BUFFER_3D',
              'CLEANING_BUFFER_4DX',
              'CLEANING_BUFFER_IMAX',
              'TRAILER_BUFFER_DEFAULT',
            ]
            return sysConfigs
              .filter(c => c.configKey !== 'CLEANING_BUFFER_SMALL')
              .sort((a, b) => orderOfKeys.indexOf(a.configKey) - orderOfKeys.indexOf(b.configKey))
              .map((config) => {
                const meta = SYS_CONFIG_META[config.configKey] || { label: config.configKey, icon: Settings, bg: 'bg-slate-500', text: 'text-white', type: 'text', desc: '' }
                const hasChanged = editSysConfigs[config.configKey] !== config.configValue
                const Icon = meta.icon
                return (
                  <div key={config.configKey} className="group relative overflow-hidden bg-violet-50/50 border-2 border-slate-200 hover:border-slate-900 rounded-2xl p-4 transition-all hover:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:-translate-x-[1px] hover:-translate-y-[1px]">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 ${meta.bg} ${meta.text} rounded-xl flex items-center justify-center border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] shrink-0`}>
                        <Icon size={18} strokeWidth={3} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">{config.configKey}</p>
                        <p className="text-sm font-black text-slate-900 mt-0.5 leading-tight">{meta.label}</p>
                      </div>
                    </div>

                    <input
                      type={meta.type}
                      value={editSysConfigs[config.configKey] || ''}
                      onChange={(e) => handleSysConfigChange(config.configKey, e.target.value)}
                      className="w-full bg-white border-2 border-slate-300 focus:border-slate-900 rounded-xl py-2.5 px-3 text-base font-black text-slate-900 focus:outline-none mb-2 shadow-[inset_2px_2px_0px_0px_rgba(15,23,42,0.05)] focus:bg-amber-50 transition-all font-mono"
                    />
                    <p className="text-[11px] font-bold text-slate-600 leading-snug mb-3 min-h-[28px]">{meta.desc || config.description}</p>

                    <button
                      onClick={() => handleSaveSysConfig(config.configKey)}
                      disabled={saving || !hasChanged}
                      className={`w-full py-2.5 px-4 rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 border-2 border-slate-900 transition-all cursor-pointer ${
                        hasChanged
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
                          : 'bg-emerald-100 text-emerald-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] cursor-default'
                      }`}
                    >
                      {saving && hasChanged ? (
                        <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : hasChanged ? (
                        <Save size={12} strokeWidth={3} />
                      ) : (
                        <CheckCircle size={12} strokeWidth={3} />
                      )}
                      {hasChanged ? 'Luu cap nhat' : 'Da luu'}
                    </button>
                  </div>
                )
              })
          })()}
        </div>
      </div>

      {/* PART_PRICE_HERE */}
      <div className="bg-white border-2 border-slate-900 rounded-3xl shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
        <div className="flex items-stretch border-b-2 border-slate-900">
          <div className="bg-slate-900 text-amber-300 px-5 py-4 flex items-center gap-2 border-r-2 border-slate-900">
            <Ticket size={20} strokeWidth={2.5} />
          </div>
          <div className="flex-1 px-5 py-3 flex items-center justify-between bg-amber-50">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-900">Cau hinh gia ve dinh dang</h2>
              <p className="text-[11px] text-slate-600 mt-0.5 font-medium">Bang gia ve co ban theo tung dinh dang chieu</p>
            </div>
            <Sparkles size={20} className="text-slate-900" strokeWidth={2.5} />
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {configs.map((config) => {
            const meta = FORMAT_META[config.format] || { bg: 'bg-slate-500', border: 'border-slate-700', icon: Ticket }
            const hasChanged = editPrices[config.format] !== config.basePrice
            const Icon = meta.icon
            return (
              <div key={config.format} className="group relative overflow-hidden bg-amber-50/50 border-2 border-slate-200 hover:border-slate-900 rounded-2xl p-5 transition-all hover:shadow-[5px_5px_0px_0px_rgba(15,23,42,1)] hover:-translate-x-[1px] hover:-translate-y-[1px]">
                <div className="absolute -right-6 -top-6 opacity-[0.07] text-slate-900 pointer-events-none">
                  <Ticket size={120} strokeWidth={2} />
                </div>

                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${meta.bg} text-white border-2 ${meta.border} rounded-lg shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] relative z-10 mb-4`}>
                  <Icon size={14} strokeWidth={3} />
                  <span className="text-xs font-black uppercase tracking-wider">{config.format}</span>
                </div>

                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 relative z-10">Gia co ban (VND)</p>
                <div className="flex items-end gap-1 mt-1 mb-4 relative z-10">
                  <span className="text-2xl md:text-3xl font-black text-slate-900 font-mono leading-none">
                    {new Intl.NumberFormat('vi-VN').format(editPrices[config.format] || 0)}
                  </span>
                  <span className="text-base font-black text-slate-700 mb-0.5">d</span>
                </div>

                <input
                  type="number"
                  value={editPrices[config.format] || ''}
                  onChange={(e) => handlePriceChange(config.format, e.target.value)}
                  className="w-full bg-white border-2 border-slate-300 focus:border-slate-900 rounded-xl py-2.5 px-3 text-base font-black text-slate-900 focus:outline-none mb-4 shadow-[inset_2px_2px_0px_0px_rgba(15,23,42,0.05)] focus:bg-amber-50 transition-all font-mono"
                />

                <button
                  onClick={() => handleSave(config.format)}
                  disabled={saving || !hasChanged}
                  className={`w-full py-2.5 px-4 rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 border-2 border-slate-900 transition-all relative z-10 cursor-pointer ${
                    hasChanged
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] hover:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px]'
                      : 'bg-emerald-100 text-emerald-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] cursor-default'
                  }`}
                >
                  {saving && hasChanged ? (
                    <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : hasChanged ? (
                    <Save size={12} strokeWidth={3} />
                  ) : (
                    <CheckCircle size={12} strokeWidth={3} />
                  )}
                  {hasChanged ? 'Luu cap nhat' : 'Da luu'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}