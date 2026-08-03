import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Star, Gift, Check, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { promotionService, REDEMPTION_TYPE_LABELS, PROMOTION_STATUS } from '../../../../services/promotionService'

const toNumber = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export default function PointsRedemption({
  userId,
  orderAmount = 0,
  onApplyPoints,
  disabled = false,
}) {
  const [myPoints, setMyPoints] = useState(0)
  const [pointsOptions, setPointsOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMyPoints, setLoadingMyPoints] = useState(true)
  const [redeemingId, setRedeemingId] = useState(null)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [redeemedOption, setRedeemedOption] = useState(null)

  const loadMyPoints = async () => {
    try {
      const data = await promotionService.getMyPoints()
      setMyPoints(toNumber(data?.loyaltyPoints, 0))
    } catch (err) {
      console.error('Failed to load my points:', err)
      setMyPoints(0)
    } finally {
      setLoadingMyPoints(false)
    }
  }

  const loadPointsOptions = async () => {
    try {
      const list = await promotionService.getPointsOptions()
      setPointsOptions(Array.isArray(list) ? list : [])
      setLoadError('')
    } catch (err) {
      console.error('Failed to load points options:', err)
      setPointsOptions([])
      const status = err?.response?.status
      setLoadError(
        err?.response?.data?.message ||
          (status ? `Không thể tải quà đổi điểm (${status})` : 'Không thể tải quà đổi điểm')
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMyPoints()
    loadPointsOptions()
  }, [])

  const handleRedeem = async (promotion) => {
    if (!userId) {
      setError('Vui lòng đăng nhập để đổi điểm')
      return
    }

    setRedeemingId(promotion.id)
    setError('')

    try {
      const result = await promotionService.redeemPoints(promotion.id)
      if (result?.success) {
        setRedeemedOption(promotion.id)

        // Calculate discount amount
        let discountAmount = 0
        if (promotion.redemptionType === 'MONEY_FIXED' && promotion.discountValue) {
          discountAmount = Number(promotion.discountValue)
        } else if (promotion.redemptionType === 'MONEY_PERCENT' && promotion.discountPercent) {
          discountAmount = (Number(orderAmount) * Number(promotion.discountPercent)) / 100
          // Apply max discount if discountValue is set as cap
          if (promotion.discountValue && discountAmount > Number(promotion.discountValue)) {
            discountAmount = Number(promotion.discountValue)
          }
        }

        // Update parent's loyalty points display
        if (result.remainingPoints !== undefined && result.remainingPoints !== null) {
          setMyPoints(toNumber(result.remainingPoints, myPoints))
        }

        onApplyPoints?.(promotion.id, discountAmount, {
          promotionId: promotion.id,
          promotionTitle: promotion.title,
          pointsSpent: toNumber(result.pointsSpent, promotion.minLoyaltyPoints),
          redemptionType: promotion.redemptionType,
          discountAmount: discountAmount,
        })
      } else {
        setError(result?.message || 'Không thể đổi điểm. Vui lòng thử lại.')
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Không thể đổi điểm. Vui lòng thử lại.'
      setError(message)
    } finally {
      setRedeemingId(null)
    }
  }

  const canRedeem = (promotion) => {
    if (!promotion) return false
    if (promotion.isValid === false) return false
    if (promotion.status && promotion.status !== PROMOTION_STATUS.ACTIVE) return false
    const required = toNumber(promotion.minLoyaltyPoints, 0)
    return myPoints >= required
  }

  const getRedemptionLabel = (promotion) => {
    if (promotion.redemptionType === 'MONEY_FIXED') {
      return `${Number(promotion.discountValue || 0).toLocaleString('vi-VN')}đ`
    }
    if (promotion.redemptionType === 'MONEY_PERCENT') {
      let label = `Giảm ${promotion.discountPercent}%`
      if (promotion.discountValue) {
        label += ` (Tối đa ${Number(promotion.discountValue).toLocaleString('vi-VN')}đ)`
      }
      return label
    }
    if (promotion.redemptionType === 'PRODUCT') {
      return 'Sản phẩm'
    }
    if (promotion.redemptionType === 'COMBO') {
      return 'Combo'
    }
    return ''
  }

  const formatPoints = (points) => {
    return Number(points || 0).toLocaleString('vi-VN')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-red-500 text-2xl" />
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col gap-4"
    >
      {/* Points Balance */}
      <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-yellow-300 font-bold uppercase tracking-wider mb-1">
              Điểm Tích Lũy Của Bạn
            </p>
            <div className="flex items-center gap-2">
              <Star className="text-yellow-400 fill-yellow-400" size={24} />
              <span className="text-3xl font-black text-white">
                {loadingMyPoints ? (
                  <Loader2 className="animate-spin text-yellow-400 inline" size={24} />
                ) : (
                  formatPoints(myPoints)
                )}
              </span>
              <span className="text-yellow-400 font-bold">điểm</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-yellow-300/70 uppercase tracking-wider font-bold">
              Đổi được
            </p>
            <p className="text-lg font-bold text-white">
              {pointsOptions.filter(p => canRedeem(p)).length} ưu đãi
            </p>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl p-3">
          <AlertCircle size={16} />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      {/* Load error for options list */}
      {loadError && !error && (
        <div className="flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
          <AlertCircle size={16} />
          <p className="text-xs font-semibold">{loadError}</p>
        </div>
      )}

      {/* Redeemed success message */}
      {redeemedOption && !disabled && (
        <div className="flex items-center gap-2 text-green-400 bg-green-500/10 border border-green-500/30 rounded-xl p-3">
          <Check size={16} />
          <p className="text-xs font-semibold">Đã đổi điểm thành công!</p>
        </div>
      )}

      {/* Points Options */}
      <div>
        <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Gift size={16} className="text-yellow-400" />
          Quà Đổi Điểm
        </h4>

        {pointsOptions.length === 0 ? (
          <div className="text-center py-6 text-gray-500 text-sm">
            <Sparkles size={32} className="mx-auto mb-2 opacity-50" />
            <p>Chưa có ưu đãi đổi điểm nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pointsOptions.map((promotion) => {
              const isRedeemed = redeemedOption === promotion.id
              const canUse = canRedeem(promotion) && !isRedeemed && !disabled

              return (
                <motion.div
                  key={promotion.id}
                  whileHover={canUse ? { scale: 1.02 } : {}}
                  whileTap={canUse ? { scale: 0.98 } : {}}
                  className={`
                    relative border rounded-xl p-4 transition-all
                    ${isRedeemed
                      ? 'bg-green-500/20 border-green-500/50'
                      : canUse
                        ? 'bg-white/5 border-white/20 hover:border-yellow-500/50 cursor-pointer'
                        : 'bg-white/5 border-white/10 opacity-60'
                    }
                  `}
                  onClick={() => canUse && handleRedeem(promotion)}
                >
                  {isRedeemed && (
                    <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                      <Check size={14} className="text-white" />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <h5 className="text-white font-bold text-sm leading-tight">
                        {promotion.title}
                      </h5>
                      <span className={`
                        text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                        ${promotion.redemptionType === 'MONEY_FIXED' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : ''}
                        ${promotion.redemptionType === 'MONEY_PERCENT' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : ''}
                        ${promotion.redemptionType === 'PRODUCT' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : ''}
                        ${promotion.redemptionType === 'COMBO' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : ''}
                      `}>
                        {REDEMPTION_TYPE_LABELS[promotion.redemptionType] || promotion.redemptionType}
                      </span>
                    </div>

                    <p className="text-xs text-gray-400 line-clamp-2">
                      {getRedemptionLabel(promotion)}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                        <span className="text-yellow-400 font-bold text-sm">
                          {formatPoints(promotion.minLoyaltyPoints)} điểm
                        </span>
                      </div>

                      {isRedeemed ? (
                        <span className="text-green-400 text-xs font-bold flex items-center gap-1">
                          <Check size={12} /> Đã đổi
                        </span>
                      ) : redeemingId === promotion.id ? (
                        <span className="text-gray-400 text-xs font-bold flex items-center gap-1">
                          <Loader2 size={12} className="animate-spin" /> Đang xử lý...
                        </span>
                      ) : !canRedeem(promotion) ? (
                        <span className="text-red-400 text-xs font-bold">
                          Không đủ điểm
                        </span>
                      ) : disabled ? (
                        <span className="text-gray-400 text-xs font-bold">
                          Đã sử dụng coupon
                        </span>
                      ) : (
                        <span className="text-yellow-400 text-xs font-bold hover:underline">
                          Đổi ngay
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Note */}
      {pointsOptions.length > 0 && (
        <p className="text-[10px] text-gray-500 italic text-center">
          * Điểm sẽ được trừ khi xác nhận đặt vé thành công
        </p>
      )}
    </motion.div>
  )
}
