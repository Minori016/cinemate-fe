import { useState, useEffect } from 'react'
import { Settings, Save, CheckCircle, Ticket } from 'lucide-react'
import { priceConfigService } from '../../../services/priceConfigService'
import { toast } from 'sonner'
import { systemConfigService } from '../../../services/systemConfigService'

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  
  const [sysConfigs, setSysConfigs] = useState([])
  const [editPrices, setEditPrices] = useState({})
  const [editSysConfigs, setEditSysConfigs] = useState({})

  useEffect(() => {
    fetchConfigs()
  }, [])

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
      ;(priceData || []).forEach(c => {
        initialPriceEdits[c.format] = c.basePrice
      })
      setEditPrices(initialPriceEdits)

      const initialSysEdits = {}
      ;(sysData?.data?.result || sysData || []).forEach(c => {
        initialSysEdits[c.configKey] = c.configValue
      })
      setEditSysConfigs(initialSysEdits)
      
    } catch (error) {
      toast.error('Lỗi khi tải cấu hình: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handlePriceChange = (format, value) => {
    setEditPrices(prev => ({
      ...prev,
      [format]: Number(value) || 0
    }))
  }

  const handleSave = async (format) => {
    const newPrice = editPrices[format]
    if (!newPrice || newPrice <= 0) {
      toast.error('Giá vé không hợp lệ')
      return
    }

    setSaving(true)
    try {
      await priceConfigService.updatePrice(format, newPrice)
      toast.success(`Đã cập nhật giá cho định dạng ${format}`)
      
      // Update local state
      setConfigs(prev => prev.map(c => c.format === format ? { ...c, basePrice: newPrice } : c))
    } catch (error) {
      toast.error('Lỗi khi lưu giá: ' + (error.response?.data?.message || error.message))
    } finally {
      setSaving(false)
    }
  }

  const handleSysConfigChange = (key, value) => {
    setEditSysConfigs(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveSysConfig = async (key) => {
    const newValue = editSysConfigs[key]
    if (!newValue) {
      toast.error('Giá trị không được để trống')
      return
    }

    setSaving(true)
    try {
      await systemConfigService.updateConfigs([{ configKey: key, configValue: newValue }])
      toast.success(`Đã cập nhật ${key === 'OPENING_TIME' ? 'Giờ mở cửa' : 'Giờ đóng cửa'}`)
      
      setSysConfigs(prev => prev.map(c => c.configKey === key ? { ...c, configValue: newValue } : c))
    } catch (error) {
      toast.error('Lỗi khi lưu cấu hình: ' + (error.response?.data?.message || error.message))
    } finally {
      setSaving(false)
    }
  }

  if (loading && configs.length === 0) {
    return <div className="flex-1 flex justify-center items-center"><span className="material-symbols-outlined animate-spin text-4xl text-[#b80035]">progress_activity</span></div>
  }

  return (
    <div className="flex-1 flex flex-col bg-[#f7f9fb] text-[#191c1e] font-sans -m-6 p-6 min-h-[calc(100vh-80px)] overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-[32px] leading-tight font-semibold text-[#191c1e] flex items-center gap-3">
            <Settings className="text-[#b80035]" size={28} />
            Cấu hình Hệ thống
          </h2>
          <p className="text-[#5c647a] text-sm mt-2 font-medium">
            Quản lý giờ mở/đóng cửa và bảng giá vé cơ bản cho toàn hệ thống rạp.
          </p>
        </div>
      </div>

      {/* System Configs (Operating Hours) */}
      <h3 className="text-xl font-bold text-[#191c1e] mb-4">Giờ Hoạt Động Rạp</h3>
      <div className="bg-white border border-[#e0e3e5] rounded-2xl p-6 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sysConfigs.map((config) => {
            const hasChanged = editSysConfigs[config.configKey] !== config.configValue;
            const label = config.configKey === 'OPENING_TIME' ? 'Giờ Mở Cửa' : config.configKey === 'CLOSING_TIME' ? 'Giờ Đóng Cửa' : config.configKey;
            
            return (
              <div key={config.configKey} className="flex flex-col gap-4 p-5 bg-[#f7f9fb] rounded-xl border border-[#e0e3e5] relative overflow-hidden group hover:border-[#b80035] transition-colors">
                <div className="flex flex-col gap-2 relative z-10">
                  <label className="text-xs text-[#5c647a] font-bold uppercase tracking-wide">{label}</label>
                  <input 
                    type="time" 
                    value={editSysConfigs[config.configKey] || ''} 
                    onChange={(e) => handleSysConfigChange(config.configKey, e.target.value)}
                    className="bg-white border border-[#e0e3e5] rounded-xl py-3 px-4 text-base font-bold text-[#191c1e] focus:border-[#b80035] outline-none w-full shadow-sm"
                  />
                  <span className="text-xs text-[#5c647a]">{config.description}</span>
                </div>
                
                <div className="mt-2 relative z-10">
                  <button 
                    onClick={() => handleSaveSysConfig(config.configKey)}
                    disabled={saving || !hasChanged}
                    className={`w-full py-2 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      hasChanged 
                        ? 'bg-blue-600 text-white shadow-md hover:bg-blue-700' 
                        : 'bg-[#eceef0] text-[#5c647a] cursor-not-allowed border border-[#e0e3e5]'
                    }`}
                  >
                    {saving && hasChanged ? (
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    ) : hasChanged ? (
                      <Save size={16} />
                    ) : (
                      <CheckCircle size={16} className="text-[#00836c]" />
                    )}
                    {hasChanged ? 'Lưu Cập Nhật' : 'Đã Lưu'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pricing Content */}
      <h3 className="text-xl font-bold text-[#191c1e] mb-4">Cấu hình Giá vé Định dạng</h3>
      <div className="bg-white border border-[#e0e3e5] rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {configs.map((config) => {
            const hasChanged = editPrices[config.format] !== config.basePrice;
            
            return (
              <div key={config.format} className="flex flex-col gap-4 p-5 bg-[#f7f9fb] rounded-xl border border-[#e0e3e5] relative overflow-hidden group hover:border-[#e5bdbe] transition-colors">
                
                {/* Decorative Icon */}
                <div className="absolute -right-4 -top-4 opacity-5 text-[#b80035]">
                  <Ticket size={100} />
                </div>
                
                <div className="flex items-center justify-between relative z-10">
                  <h3 className="text-2xl font-black text-[#191c1e] uppercase tracking-wider">{config.format}</h3>
                </div>
                
                <div className="flex flex-col gap-2 relative z-10 mt-2">
                  <label className="text-xs text-[#5c647a] font-bold uppercase tracking-wide">Giá Cơ Bản (VNĐ)</label>
                  <input 
                    type="number" 
                    value={editPrices[config.format] || ''} 
                    onChange={(e) => handlePriceChange(config.format, e.target.value)}
                    className="bg-white border border-[#e0e3e5] rounded-xl py-3 px-4 text-base font-bold text-[#191c1e] focus:border-[#b80035] outline-none w-full shadow-sm"
                  />
                </div>
                
                <div className="mt-4 relative z-10">
                  <button 
                    onClick={() => handleSave(config.format)}
                    disabled={saving || !hasChanged}
                    className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      hasChanged 
                        ? 'bg-[#b80035] text-white shadow-md hover:opacity-90' 
                        : 'bg-[#eceef0] text-[#5c647a] cursor-not-allowed border border-[#e0e3e5]'
                    }`}
                  >
                    {saving && hasChanged ? (
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    ) : hasChanged ? (
                      <Save size={18} />
                    ) : (
                      <CheckCircle size={18} className="text-[#00836c]" />
                    )}
                    {hasChanged ? 'Lưu Cập Nhật' : 'Đã Lưu'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
