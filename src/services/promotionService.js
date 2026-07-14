import api from './api'

/**
 * Promotion Service
 * Public GET: /api/v1/promotions, /active, /code/{code}, /{id}
 * Auth POST: /api/v1/promotions/validate
 */
export const promotionService = {
  getAll: (params) => api.get('/api/v1/promotions', { params }),
  getById: (id) => api.get(`/api/v1/promotions/${id}`),
  getByCode: (code) => api.get(`/api/v1/promotions/code/${encodeURIComponent(code)}`),
  getActive: () => api.get('/api/v1/promotions/active'),
  validate: (data) => api.post('/api/v1/promotions/validate', data),
  create: (data) => api.post('/api/v1/admin/promotions', data),
  update: (id, data) => api.put(`/api/v1/admin/promotions/${id}`, data),
  delete: (id) => api.delete(`/api/v1/admin/promotions/${id}`),

  /**
   * User pages: load active promotions, mapped for UI.
   * Falls back to empty list (no mock fake discounts).
   */
  getActiveForUi: async () => {
    try {
      const res = await api.get('/api/v1/promotions/active')
      const list = unwrapList(res.data)
      return list.map(mapPromotionForUi).filter(p => p.id || p.code)
    } catch (err) {
      console.error('Failed to load active promotions:', err)
      // Fallback: try paged list and filter client-side
      try {
        const res = await api.get('/api/v1/promotions', { params: { page: 0, size: 50 } })
        const list = unwrapList(res.data)
        return list
          .map(mapPromotionForUi)
          .filter(p => {
            const s = computePromotionStatus(p)
            return s === PROMOTION_STATUS.ACTIVE || s === 'ACTIVE'
          })
      } catch (err2) {
        console.error('Failed to load promotions list:', err2)
        return []
      }
    }
  },

  /**
   * Validate promo code against order amount.
   * Returns { success, message, discountAmount, discountPercent, promotionCode }
   */
  validateForUi: async (code, orderAmount) => {
    const payload = {
      code: String(code || '').trim().toUpperCase(),
      orderAmount: Number(orderAmount) || 0,
    }
    if (!payload.code) {
      return { success: false, message: 'Vui lòng nhập mã giảm giá' }
    }
    if (payload.orderAmount <= 0) {
      return { success: false, message: 'Chưa có tổng tiền đơn hàng để áp dụng mã' }
    }
    try {
      const res = await api.post('/api/v1/promotions/validate', payload)
      const data = res.data?.result || res.data || {}
      return {
        success: data.success !== false && (data.discountAmount != null || data.discountPercent != null),
        message: data.message || (data.success === false ? 'Mã không hợp lệ' : 'Áp dụng thành công'),
        discountAmount: data.discountAmount != null ? Number(data.discountAmount) : 0,
        discountPercent: data.discountPercent != null ? Number(data.discountPercent) : null,
        promotionCode: data.promotionCode || payload.code,
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Mã giảm giá không chính xác hoặc đã hết hạn'
      return { success: false, message, discountAmount: 0, discountPercent: null, promotionCode: payload.code }
    }
  },
}

const unwrapList = (payload) => {
  const data = payload?.result ?? payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.result)) return data.result
  return []
}

/** Map BE PromotionResponse → UI-friendly shape used across pages */
export const mapPromotionForUi = (p = {}) => {
  const discountPercent = p.discountPercent != null ? Number(p.discountPercent) : null
  const discountValue = p.discountValue != null ? Number(p.discountValue) : null
  const discountType = discountPercent != null && discountPercent > 0
    ? DISCOUNT_TYPES.PERCENT
    : DISCOUNT_TYPES.FIXED_AMOUNT

  return {
    ...p,
    id: p.id,
    code: p.code || '',
    title: p.title || p.code || 'Khuyến mãi',
    // aliases used by various UIs
    detail: p.detail || p.description || p.content || '',
    description: p.detail || p.description || p.content || '',
    content: p.detail || p.content || p.description || '',
    discountPercent,
    discountValue,
    discountType,
    discountTypeNormalized: discountType,
    startTime: p.startTime,
    endTime: p.endTime,
    imageUrl: p.imageUrl || '',
    status: p.status || computePromotionStatus(p),
    isValid: p.isValid,
    maxTotalUsage: p.maxTotalUsage,
    currentTotalUsage: p.currentTotalUsage,
    remainingTotalUsage: p.remainingTotalUsage,
  }
}

/**
 * Các hằng số dùng chung cho UI
 */
export const PROMOTION_TYPES = {
  VOUCHER: 'VOUCHER',
  FLASH_SALE: 'FLASH_SALE',
  COMBO: 'COMBO',
  MOVIE_SPECIFIC: 'MOVIE_SPECIFIC',
  BIRTHDAY: 'BIRTHDAY',
  MEMBER_ONLY: 'MEMBER_ONLY',
}

export const PROMOTION_TYPE_LABELS = {
  VOUCHER: 'Voucher',
  FLASH_SALE: 'Flash Sale',
  COMBO: 'Combo bắp nước',
  MOVIE_SPECIFIC: 'Theo phim',
  BIRTHDAY: 'Sinh nhật',
  MEMBER_ONLY: 'Hội viên',
}

export const DISCOUNT_TYPES = {
  PERCENT: 'PERCENT',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
}

export const DISCOUNT_TYPE_LABELS = {
  PERCENT: 'Giảm theo %',
  FIXED_AMOUNT: 'Giảm tiền mặt (VNĐ)',
}

/** Backend PromotionStatus enum: ACTIVE / EXPIRED / DISABLED */
export const PROMOTION_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  DISABLED: 'DISABLED',
}

export const PROMOTION_STATUS_LABELS = {
  ACTIVE: 'Đang hoạt động',
  EXPIRED: 'Đã hết hạn',
  DISABLED: 'Đã bị vô hiệu hóa',
}

export const PROMOTION_STATUS_COLORS = {
  ACTIVE: 'bg-green-500/20 text-green-300 border-green-500/30',
  EXPIRED: 'bg-red-500/20 text-red-300 border-red-500/30',
  DISABLED: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
}

/**
 * Helper: Tính trạng thái hiệu lực từ data (nếu backend chưa trả về field status)
 */
export function computePromotionStatus(promo) {
  if (promo?.status) return promo.status
  const now = new Date()
  const end = promo?.endTime ? new Date(promo.endTime) : null
  if (end && end < now) return PROMOTION_STATUS.EXPIRED
  // Backend v2: maxTotalUsage + currentTotalUsage
  const max = promo?.maxTotalUsage
  const used = promo?.currentTotalUsage ?? promo?.usedCount ?? 0
  if (max != null && used >= max) {
    return PROMOTION_STATUS.EXPIRED
  }
  return PROMOTION_STATUS.ACTIVE
}

/**
 * Helper: Format hiển thị giá trị giảm giá
 */
export function formatDiscountValue(promo) {
  if (promo?.discountPercent != null && promo.discountPercent !== '') {
    return `${promo.discountPercent}%`
  }
  if (promo?.discountValue != null && promo.discountValue !== '') {
    return new Intl.NumberFormat('vi-VN').format(promo.discountValue) + 'đ'
  }
  // fallback cho schema cũ (discountType + discountValue)
  if (promo?.discountType === DISCOUNT_TYPES.PERCENT) {
    return `${promo.discountValue}%`
  }
  if (promo?.discountValue != null) {
    return new Intl.NumberFormat('vi-VN').format(promo.discountValue) + 'đ'
  }
  return ''
}

/**
 * Helper: Tính % giảm cho hiển thị nhanh
 */
export function getQuickDiscountText(promo) {
  if (promo?.discountPercent) {
    return `Giảm ${promo.discountPercent}%`
  }
  if (promo?.discountValue) {
    return `Giảm ${new Intl.NumberFormat('vi-VN').format(promo.discountValue)}đ`
  }
  // fallback schema cũ
  if (promo?.discountType === DISCOUNT_TYPES.PERCENT && promo?.discountValue) {
    return `Giảm ${promo.discountValue}%`
  }
  if (promo?.discountType === DISCOUNT_TYPES.FIXED_AMOUNT && promo?.discountValue) {
    return `Giảm ${new Intl.NumberFormat('vi-VN').format(promo.discountValue)}đ`
  }
  return ''
}

/**
 * Helper: Tính số ngày còn lại
 */
export function getDaysRemaining(endTime) {
  if (!endTime) return null
  const end = new Date(endTime)
  const now = new Date()
  const diffMs = end - now
  if (diffMs <= 0) return 0
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

/** Home / promo cards: short date label */
export function formatPromoDateRange(promo) {
  const fmt = (d) => {
    if (!d) return ''
    try {
      const x = new Date(d)
      return `${String(x.getDate()).padStart(2, '0')}/${String(x.getMonth() + 1).padStart(2, '0')}/${x.getFullYear()}`
    } catch {
      return ''
    }
  }
  const start = fmt(promo?.startTime)
  const end = fmt(promo?.endTime)
  if (start && end) return `${start} - ${end}`
  if (end) return `Đến ${end}`
  if (start) return `Từ ${start}`
  return 'Đang diễn ra'
}
