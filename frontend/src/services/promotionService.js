import api from './api'

/**
 * Promotion Service
 *
 * Lưu ý: Backend hiện tại chỉ hỗ trợ 5 endpoint cơ bản.
 * Các endpoint mở rộng (validate/apply/active/available/stats/toggle)
 * sẽ được bổ sung ở backend sau. UI frontend được thiết kế để
 *  hoạt động được với cả 2 trường hợp — sẵn sàng mở rộng mà không phải sửa lại.
 */
export const promotionService = {
  getAll: (params) => api.get('/api/v1/promotions', { params }),
  getById: (id) => api.get(`/api/v1/promotions/${id}`),
  create: (data) => api.post('/api/v1/admin/promotions', data),
  update: (id, data) => api.put(`/api/v1/admin/promotions/${id}`, data),
  delete: (id) => api.delete(`/api/v1/admin/promotions/${id}`),
}

/**
 * Các hằng số dùng chung cho UI — không phụ thuộc backend
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

export const PROMOTION_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  EXPIRED: 'EXPIRED',
}

export const PROMOTION_STATUS_LABELS = {
  DRAFT: 'Bản nháp',
  ACTIVE: 'Đang chạy',
  PAUSED: 'Tạm dừng',
  EXPIRED: 'Hết hạn',
}

export const PROMOTION_STATUS_COLORS = {
  DRAFT: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  ACTIVE: 'bg-green-500/20 text-green-300 border-green-500/30',
  PAUSED: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  EXPIRED: 'bg-red-500/20 text-red-300 border-red-500/30',
}

/**
 * Helper: Tính trạng thái hiệu lực từ data (nếu backend chưa trả về field status)
 */
export function computePromotionStatus(promo) {
  if (promo?.status) return promo.status
  const now = new Date()
  const start = promo?.startTime ? new Date(promo.startTime) : null
  const end = promo?.endTime ? new Date(promo.endTime) : null
  if (end && end < now) return PROMOTION_STATUS.EXPIRED
  if (start && start > now) return PROMOTION_STATUS.DRAFT
  if (promo?.usageLimit != null && (promo?.usedCount ?? 0) >= promo.usageLimit) {
    return PROMOTION_STATUS.EXPIRED
  }
  return PROMOTION_STATUS.ACTIVE
}

/**
 * Helper: Format hiển thị giá trị giảm giá
 */
export function formatDiscountValue(promo) {
  if (promo?.discountValue == null) return ''
  if (promo?.discountType === DISCOUNT_TYPES.PERCENT) {
    return `${promo.discountValue}%`
  }
  if (promo?.discountType === DISCOUNT_TYPES.FIXED_AMOUNT) {
    return new Intl.NumberFormat('vi-VN').format(promo.discountValue) + 'đ'
  }
  return String(promo.discountValue)
}

/**
 * Helper: Tính % giảm cho hiển thị nhanh
 */
export function getQuickDiscountText(promo) {
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
