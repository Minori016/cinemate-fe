import api from './api'

/**
 * Promotion Service
 * Public GET: /api/v1/promotions, /active, /code/{code}, /{id}
 * Auth POST: /api/v1/promotions/validate
 */
export const promotionService = {
  getAll: (params = {}) => api.get('/api/v1/promotions', { params: { page: 0, size: 100, sortBy: 'createdAt', ...params } }),
  getAdminAll: (params = {}) => api.get('/api/v1/admin/promotions', { params: { page: 0, size: 100, sortBy: 'createdAt', ...params } }),
  getById: (id) => api.get(`/api/v1/promotions/${id}`),
  getByCode: (code) => api.get(`/api/v1/promotions/code/${encodeURIComponent(code)}`),
  getActive: () => api.get('/api/v1/promotions/active'),
  validate: (data) => api.post('/api/v1/promotions/validate', data),
  create: (data) => api.post('/api/v1/admin/promotions', data),
  update: (id, data) => api.put(`/api/v1/admin/promotions/${id}`, data),
  toggleStatus: (id) => api.patch(`/api/v1/admin/promotions/${id}/toggle`),
  delete: (id) => api.delete(`/api/v1/admin/promotions/${id}`),

  // Get active campaigns for a specific movie (auto-apply feature)
  getActiveCampaignsForMovie: async (movieId) => {
    try {
      const res = await api.get('/api/v1/promotions/active', {
        params: { type: 'CAMPAIGN', movieId }
      })
      const list = unwrapList(res.data)
      return Array.isArray(list) ? list : []
    } catch (err) {
      console.error('Failed to load active campaigns for movie:', err)
      return []
    }
  },

  // === Points Redemption ===
  // All endpoints wrap data in ApiResponse{ code, result }; expose unwrapped data to callers.
  getPointsOptions: async () => {
    const res = await api.get('/api/v1/promotions/points/options')
    const list = unwrapList(res?.data)
    return Array.isArray(list) ? list : []
  },
  getMyPoints: async () => {
    const res = await api.get('/api/v1/promotions/points/my')
    const body = unwrapObject(res?.data)
    return body
  },
  redeemPoints: async (promotionId) => {
    const res = await api.post('/api/v1/promotions/points/redeem', { promotionId })
    return unwrapObject(res?.data)
  },

  /**
   * User pages: load active promotions, mapped for UI.
   * Falls back to empty list (no mock fake discounts).
   */
  getActiveForUi: async () => {
    try {
      const res = await api.get('/api/v1/promotions/active')
      const list = unwrapList(res.data)
      if (Array.isArray(list) && list.length > 0) {
        return list.map(mapPromotionForUi).filter(p => p.id || p.code || p.title)
      }
    } catch (err) {
      console.error('Failed to load active promotions via /active:', err)
    }
    try {
      const res = await api.get('/api/v1/promotions', { params: { page: 0, size: 100 } })
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

export const unwrapList = (payload) => {
  const data = payload?.result ?? payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.result)) return data.result
  return []
}

/**
 * Unwrap an ApiResponse-wrapped object payload.
 * Handles shapes: { result: {...} }, { data: {...} }, or a raw object.
 */
export const unwrapObject = (payload) => {
  if (payload == null || typeof payload !== 'object') return {}
  if (payload.result && typeof payload.result === 'object') return payload.result
  if (payload.data && typeof payload.data === 'object') return payload.data
  return payload
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
  COUPON: 'COUPON',
  CAMPAIGN: 'CAMPAIGN',
  POINTS: 'POINTS',
}

export const REDEMPTION_TYPES = {
  MONEY_FIXED: 'MONEY_FIXED',
  MONEY_PERCENT: 'MONEY_PERCENT',
  PRODUCT: 'PRODUCT',
  COMBO: 'COMBO',
}

export const REDEMPTION_TYPE_LABELS = {
  MONEY_FIXED: 'Giảm tiền mặt',
  MONEY_PERCENT: 'Giảm %',
  PRODUCT: 'Đổi sản phẩm',
  COMBO: 'Đổi combo',
}

export const PROMOTION_TYPE_LABELS = {
  COUPON: 'Voucher (nhập mã)',
  CAMPAIGN: 'Tự động áp dụng (Campaign)',
  POINTS: 'Đổi điểm lấy voucher',
}

export const DISCOUNT_TYPES = {
  PERCENT: 'PERCENT',
  FIXED_AMOUNT: 'FIXED_AMOUNT',
}

export const DISCOUNT_TYPE_LABELS = {
  PERCENT: 'Giảm theo %',
  FIXED_AMOUNT: 'Giảm tiền mặt (VNĐ)',
}

/** Backend PromotionStatus enum: ACTIVE / EXPIRED / DISABLED / UPCOMING (derived) */
export const PROMOTION_STATUS = {
  ACTIVE: 'ACTIVE',
  UPCOMING: 'UPCOMING',
  EXPIRED: 'EXPIRED',
  DISABLED: 'DISABLED',
}

export const PROMOTION_STATUS_LABELS = {
  ACTIVE: 'Đang hoạt động',
  UPCOMING: 'Sắp diễn ra',
  EXPIRED: 'Đã hết hạn',
  DISABLED: 'Đã bị vô hiệu hóa',
}

export const PROMOTION_STATUS_COLORS = {
  ACTIVE: 'bg-emerald-500 text-white border-emerald-300 shadow-sm shadow-emerald-500/30',
  UPCOMING: 'bg-yellow-500 text-white border-yellow-300 shadow-sm shadow-yellow-500/30',
  EXPIRED: 'bg-red-500 text-white border-red-300 shadow-sm shadow-red-500/30',
  DISABLED: 'bg-amber-500 text-white border-amber-300 shadow-sm shadow-amber-500/30',
}

/**
 * Helper: Tính trạng thái hiệu lực từ data (nếu backend chưa trả về field status)
 */
export function computePromotionStatus(promo) {
  // DISABLED / EXPIRED từ backend luôn ưu tiên
  if (promo?.status === PROMOTION_STATUS.DISABLED) return PROMOTION_STATUS.DISABLED
  if (promo?.status === PROMOTION_STATUS.EXPIRED) return PROMOTION_STATUS.EXPIRED

  const now = new Date()
  const start = promo?.startTime ? new Date(promo.startTime) : null
  const end = promo?.endTime ? new Date(promo.endTime) : null

  // UPCOMING: chưa tới startTime
  if (start && now < start) return PROMOTION_STATUS.UPCOMING

  // EXPIRED: đã qua endTime
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

/**
 * Helper: Tính số ngày còn lại cho đến khi bắt đầu (countdown tới startTime)
 * Trả về:
 *   - null nếu không có startTime
 *   - 0 nếu đã qua startTime (now >= startTime)
 *   - số ngày > 0 nếu chưa tới
 */
export function getDaysUntilStart(startTime) {
  if (!startTime) return null
  const start = new Date(startTime)
  const now = new Date()
  const diffMs = start - now
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
