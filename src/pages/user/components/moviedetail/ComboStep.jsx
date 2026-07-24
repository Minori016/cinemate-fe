import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Minus, Ticket, Check, ChevronDown, ChevronUp, Sparkles, Coffee } from 'lucide-react'
import { FALLBACK_COMBOS, groupConcessionsByBaseName, DEFAULT_COMBO_OPTIONS } from '../../../../services/concessionService'
import { promotionService, getQuickDiscountText } from '../../../../services/promotionService'

export default function ComboStep({
  combos = [],
  selectedCombos = {},
  comboCustomizations: parentComboCustomizations,
  setComboCustomizations: parentSetComboCustomizations,
  onChangeCombo,
  promoCode,
  setPromoCode,
  discount,
  onApplyPromo,
  loading = false,
  orderAmount = 0,
}) {
  const [promoInput, setPromoInput] = useState(promoCode || '')
  const [promoError, setPromoError] = useState('')
  const [promoSuccess, setPromoSuccess] = useState(discount > 0 ? 'Đã áp dụng thành công!' : '')
  const [applying, setApplying] = useState(false)
  const [activePromos, setActivePromos] = useState([])
  
  // Track selected size variant per product family: { [groupBaseId]: sizeKey }
  const [selectedSizesMap, setSelectedSizesMap] = useState({})
  
  // Track expanded accordion state for combo details: { [comboId]: boolean }
  const [expandedCombos, setExpandedCombos] = useState({})
  
  // Track customizable options for sub-items in combo: { [comboId]: { [subItemId]: { flavor, extraFee, label } } }
  const [internalComboCustomizations, setInternalComboCustomizations] = useState({})
  const comboCustomizations = parentComboCustomizations || internalComboCustomizations
  const setComboCustomizations = parentSetComboCustomizations || setInternalComboCustomizations

  useEffect(() => {
    let cancelled = false
    promotionService.getActiveForUi()
      .then(list => {
        if (!cancelled) setActivePromos(Array.isArray(list) ? list.slice(0, 6) : [])
      })
      .catch(() => { if (!cancelled) setActivePromos([]) })
    return () => { cancelled = true }
  }, [])

  // Build dynamic popcorn/beverage options from active single concessions in Admin DB
  const dynamicComboOptions = useMemo(() => {
    const popcornItems = (combos || []).filter(i => {
      if (!i) return false
      const type = String(i.itemType || i.category || '').toLowerCase()
      const name = String(i.name || i.baseName || '').toLowerCase()
      return (type === 'popcorn' || name.includes('bắp') || name.includes('popcorn')) && type !== 'combo'
    })

    const drinkItems = (combos || []).filter(i => {
      if (!i) return false
      const type = String(i.itemType || i.category || '').toLowerCase()
      const name = String(i.name || i.baseName || '').toLowerCase()
      return (type === 'drink' || type === 'beverage' || name.includes('nước') || name.includes('coca') || name.includes('sprite') || name.includes('fanta')) && type !== 'combo'
    })

    let popcornFlavors = DEFAULT_COMBO_OPTIONS.popcornFlavors
    if (popcornItems.length > 0) {
      const minPrice = Math.min(...popcornItems.map(p => Number(p.price) || 0))
      popcornFlavors = popcornItems.map(p => {
        const price = Number(p.price) || 0
        const extraFee = Math.max(0, price - minPrice)
        const label = extraFee > 0
          ? `${p.name} (+${extraFee.toLocaleString('vi-VN')}đ)`
          : p.name
        return {
          id: p.id || p.uuid || p.name,
          label,
          extraFee,
          rawPrice: price,
          name: p.name
        }
      })
    }

    let drinkTypes = DEFAULT_COMBO_OPTIONS.drinkTypes
    if (drinkItems.length > 0) {
      const minPrice = Math.min(...drinkItems.map(d => Number(d.price) || 0))
      drinkTypes = drinkItems.map(d => {
        const price = Number(d.price) || 0
        const extraFee = Math.max(0, price - minPrice)
        const label = extraFee > 0
          ? `${d.name} (+${extraFee.toLocaleString('vi-VN')}đ)`
          : d.name
        return {
          id: d.id || d.uuid || d.name,
          label,
          extraFee,
          rawPrice: price,
          name: d.name
        }
      })
    }

    return { popcornFlavors, drinkTypes }
  }, [combos])

  // Group raw combos/products so multi-size items occupy only 1 single card
  const groupedProducts = useMemo(() => {
    return groupConcessionsByBaseName(combos)
  }, [combos])

  const toggleExpandCombo = (comboId) => {
    setExpandedCombos(prev => ({ ...prev, [comboId]: !prev[comboId] }))
  }

  const handleSubItemOptionChange = (comboId, subItemId, key, value, flavorsList = []) => {
    const chosenOption = (flavorsList || []).find(f => String(f.id) === String(value))
    const extraFee = chosenOption?.extraFee || 0

    setComboCustomizations(prev => ({
      ...prev,
      [comboId]: {
        ...(prev[comboId] || {}),
        [subItemId]: {
          ...(prev[comboId]?.[subItemId] || {}),
          [key]: value,
          extraFee: extraFee,
          label: chosenOption?.label || value
        }
      }
    }))
  }

  const getComboExtraFee = (comboId, subItemsList = []) => {
    const customState = comboCustomizations[comboId] || {}
    let totalExtra = 0
    const itemsToEvaluate = subItemsList.length > 0 ? subItemsList : [
      { id: 'popcorn_1', name: 'Bắp Rang Lớn', type: 'popcorn', defaultFlavor: 'sweet' },
      { id: 'drink_1', name: 'Nước Ngọt tùy chọn', type: 'drink', defaultFlavor: 'coca' }
    ]

    itemsToEvaluate.forEach(subItem => {
      const custom = customState[subItem.id]
      if (custom && custom.extraFee !== undefined) {
        totalExtra += Number(custom.extraFee) || 0
      } else {
        const isPopcorn = subItem.type === 'popcorn' || (subItem.name || '').toLowerCase().includes('bắp')
        const flavorsList = subItem.flavors && subItem.flavors.length > 0
          ? subItem.flavors
          : (isPopcorn ? dynamicComboOptions.popcornFlavors : dynamicComboOptions.drinkTypes)
        const defaultId = subItem.defaultFlavor || (isPopcorn ? 'sweet' : 'coca')
        const defaultOpt = flavorsList.find(f => String(f.id) === String(defaultId))
        if (defaultOpt && defaultOpt.extraFee) {
          totalExtra += Number(defaultOpt.extraFee) || 0
        }
      }
    })

    return totalExtra
  }

  const handleApply = async () => {
    setPromoError('')
    setPromoSuccess('')
    if (!promoInput.trim()) {
      setPromoError('Vui lòng nhập mã giảm giá')
      return
    }

    setApplying(true)
    try {
      const result = await promotionService.validateForUi(promoInput, orderAmount)
      if (!result.success) {
        setPromoError(result.message || 'Mã giảm giá không chính xác hoặc đã hết hạn')
        return
      }

      let applyVal = 0
      if (result.discountPercent != null && Number(result.discountPercent) > 0) {
        applyVal = Number(result.discountPercent) / 100
      } else if (result.discountAmount != null && Number(result.discountAmount) > 0) {
        applyVal = Number(result.discountAmount)
      }

      const code = result.promotionCode || promoInput.trim().toUpperCase()
      onApplyPromo?.(code, applyVal)
      setPromoCode?.(code)
      setPromoSuccess(result.message || `Áp dụng thành công mã ${code}!`)
    } catch (err) {
      setPromoError(err?.response?.data?.message || 'Không thể xác thực mã giảm giá')
    } finally {
      setApplying(false)
    }
  }

  const handleRemovePromo = () => {
    onApplyPromo?.('', 0)
    setPromoCode?.('')
    setPromoInput('')
    setPromoSuccess('')
    setPromoError('')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col gap-6 w-full text-left"
    >
      {/* Combos selection section */}
      <div>
        <h3 className="text-lg font-black uppercase text-white tracking-wider mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Chọn Bắp & Nước
        </h3>
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <span className="material-symbols-outlined animate-spin text-3xl text-red-500">progress_activity</span>
            </div>
          ) : groupedProducts.length === 0 ? (
            <p className="text-sm text-gray-500 italic py-4 text-center">Hiện chưa có bắp nước.</p>
          ) : groupedProducts.map(prod => {
            const isCombo = prod.itemType === 'combo'
            const currentSizeKey = selectedSizesMap[prod.id] || prod.sizes?.[0]?.key || 'STANDARD'
            const currentSizeObj = prod.sizes?.find(s => s.key === currentSizeKey) || prod.sizes?.[0]
            const activeVariantId = currentSizeObj?.variantId || prod.id
            const activePrice = currentSizeObj?.price || prod.price

            const subItemsList = (prod.subItems && prod.subItems.length > 0) ? prod.subItems : [
              { id: 'popcorn_1', name: 'Bắp Rang Lớn', type: 'popcorn', sizes: ['L'], defaultFlavor: 'sweet', defaultSize: 'L' },
              { id: 'drink_1', name: 'Nước Ngọt tùy chọn', type: 'drink', sizes: ['L'], defaultFlavor: 'coca', defaultSize: 'L' }
            ]

            const extraFeePerUnit = isCombo ? getComboExtraFee(prod.id, subItemsList) : 0
            const unitTotalPrice = activePrice + extraFeePerUnit

            const qty = selectedCombos[activeVariantId] || 0
            const isExpanded = !!expandedCombos[prod.id]
            const hasImg = prod.img && (String(prod.img).startsWith('http') || String(prod.img).startsWith('/') || String(prod.img).startsWith('data:'))

            return (
              <div
                key={prod.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:border-white/20 flex flex-col gap-3"
              >
                <div className="flex items-center gap-4">
                  {hasImg ? (
                    <img
                      src={prod.img}
                      alt={prod.name}
                      className="w-20 h-20 rounded-xl object-cover border border-white/5 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-4xl flex-shrink-0 select-none">
                      {prod.img || (isCombo ? '🎒' : '🍿')}
                    </div>
                  )}

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-white font-bold text-base">{prod.name}</h4>
                      {isCombo && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                          Combo Gói
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mb-2 leading-relaxed line-clamp-2">{prod.desc}</p>

                    {/* Size selector pills if multi-size product */}
                    {!isCombo && prod.sizes && prod.sizes.length > 1 && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Size:</span>
                        <div className="flex gap-1.5">
                          {prod.sizes.map(s => {
                            const isSelected = s.key === currentSizeKey
                            return (
                              <button
                                key={s.key}
                                type="button"
                                onClick={() => setSelectedSizesMap(prev => ({ ...prev, [prod.id]: s.key }))}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-red-600 text-white shadow-md'
                                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                                }`}
                              >
                                {s.label} ({Number(s.price).toLocaleString('vi-VN')}đ)
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <span className="text-red-500 font-extrabold text-sm">
                        {Number(unitTotalPrice).toLocaleString('vi-VN')} đ
                      </span>
                      {extraFeePerUnit > 0 && (
                        <span className="text-[10px] font-bold text-yellow-400 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                          (+{Number(extraFeePerUnit).toLocaleString('vi-VN')}đ phụ thu vị)
                        </span>
                      )}

                      {/* Accordion toggle button for Combos */}
                      {isCombo && (
                        <button
                          type="button"
                          onClick={() => toggleExpandCombo(prod.id)}
                          className="flex items-center gap-1.5 text-xs font-bold text-yellow-400 hover:text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-xs"
                        >
                          <Sparkles size={13} className="text-yellow-400 animate-pulse" />
                          <span>{isExpanded ? 'Thu gọn chi tiết' : 'Chọn vị bắp & loại nước'}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-1 shrink-0">
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => onChangeCombo(activeVariantId, -1)}
                      disabled={qty === 0}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed border-none cursor-pointer"
                    >
                      <Minus size={14} />
                    </motion.button>
                    <span className="w-6 text-center text-white font-extrabold text-sm select-none">
                      {qty}
                    </span>
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => {
                        onChangeCombo(activeVariantId, 1)
                        setExpandedCombos(prev => ({ ...prev, [prod.id]: true }))
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white bg-white/5 hover:bg-white/10 border-none cursor-pointer"
                    >
                      <Plus size={14} />
                    </motion.button>
                  </div>
                </div>

                {/* Expandable Combo Sub-Items Detail Section */}
                {isCombo && (isExpanded || qty > 0) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-white/10 pt-3 mt-1 space-y-3 bg-black/40 p-3.5 rounded-xl"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold uppercase text-yellow-400 tracking-wider flex items-center gap-1.5">
                        <Coffee size={15} className="text-yellow-400" /> Tùy chọn khẩu phần & vị từng món trong Combo:
                      </p>
                      <span className="text-[10px] text-gray-400 font-medium italic">
                        (Khách hàng tùy chọn vị bắp & loại nước ngọt theo ý thích)
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {subItemsList.map((subItem) => {
                        const isPopcorn = subItem.type === 'popcorn' || (subItem.name || '').toLowerCase().includes('bắp')
                        const flavorsList = (subItem.flavors && subItem.flavors.length > 0)
                          ? subItem.flavors
                          : (isPopcorn ? dynamicComboOptions.popcornFlavors : dynamicComboOptions.drinkTypes)

                        const customState = comboCustomizations[prod.id]?.[subItem.id] || {}
                        const selectedFlavor = customState.flavor || subItem.defaultFlavor || (flavorsList[0]?.id || 'sweet')
                        const selectedSize = customState.size || subItem.defaultSize || 'L'

                        return (
                          <div key={subItem.id} className="bg-white/5 p-3 rounded-xl border border-white/10 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                {isPopcorn ? '🍿' : '🥤'} {subItem.name}
                              </span>
                              <span className="text-[10px] bg-red-500/20 text-red-300 font-bold px-2 py-0.5 rounded border border-red-500/30 uppercase">
                                Size {selectedSize}
                              </span>
                            </div>

                            {/* Flavor Options Dropdown */}
                            <div>
                              <span className="text-[10px] text-gray-400 block mb-1 font-bold">
                                {isPopcorn ? 'Chọn vị bắp rang:' : 'Chọn loại nước ngọt / đồ uống:'}
                              </span>
                              <select
                                value={selectedFlavor}
                                onChange={(e) => handleSubItemOptionChange(prod.id, subItem.id, 'flavor', e.target.value, flavorsList)}
                                className="w-full bg-slate-900 border border-white/20 rounded-lg py-1.5 px-2.5 text-xs font-semibold text-white outline-none focus:border-red-500 transition-colors shadow-sm"
                              >
                                {flavorsList.map(f => (
                                  <option key={f.id} value={f.id} className="bg-slate-900 text-white py-1">
                                    {f.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Promos / Offers section */}
      <div className="border-t border-white/5 pt-6">
        <h3 className="text-lg font-black uppercase text-white tracking-wider mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          Mã Ưu Đãi / Khuyến Mãi
        </h3>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <p className="text-xs text-gray-400 mb-3 font-medium">Nhập mã ưu đãi hoặc thử mã mẫu bên dưới để nhận chiết khấu trực tiếp.</p>
          
          <div className="flex gap-3 mb-3">
            <div className="relative flex-grow">
              <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Ví dụ: CINEMATE10, BAPNUOC20"
                disabled={discount > 0}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-sm outline-none focus:border-red-500/50 transition-colors uppercase tracking-wider font-semibold"
              />
            </div>
            {discount > 0 ? (
              <button
                onClick={handleRemovePromo}
                className="px-6 rounded-xl border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer bg-transparent"
              >
                Hủy mã
              </button>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying}
                className="px-6 rounded-xl bg-red-600 text-white hover:bg-red-500 hover:scale-102 active:scale-95 transition-all text-xs font-bold uppercase tracking-wider cursor-pointer border-none disabled:opacity-60"
              >
                {applying ? 'Đang kiểm tra...' : 'Áp dụng'}
              </button>
            )}
          </div>

          {promoError && <p className="text-xs text-red-500 font-semibold m-0">{promoError}</p>}
          {promoSuccess && <p className="text-xs text-green-500 font-semibold m-0 flex items-center gap-1"><Check size={14} />{promoSuccess}</p>}

          {/* Quick suggestions from active promotions API */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-black shrink-0">Mã gợi ý:</span>
            {activePromos.length === 0 ? (
              <span className="text-[10px] text-gray-500 italic">Chưa có mã khuyến mãi đang chạy</span>
            ) : activePromos.map(p => (
              <button
                key={p.id || p.code}
                onClick={() => { if (discount === 0 && p.code) setPromoInput(p.code) }}
                disabled={discount > 0 || !p.code}
                title={getQuickDiscountText(p) || p.title}
                className="text-[10px] font-bold border border-dashed border-white/20 bg-white/5 rounded-full px-3 py-1 text-gray-300 hover:border-red-500 hover:text-red-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {p.code}{getQuickDiscountText(p) ? ` (${getQuickDiscountText(p)})` : ''}
              </button>
            ))}
          </div>
        </div>
      </div>

    </motion.div>
  )
}
