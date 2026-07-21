import api from './api'

/** Khớp với item_type trong DB (food / drink / combo) */
export const CONCESSION_ITEM_TYPES = {
  food: 'Đồ ăn',
  drink: 'Đồ uống',
  combo: 'Combo bắp nước',
}

export const ITEM_TYPE_EMOJIS = {
  food: '🍿',
  drink: '🥤',
  combo: '🎒',
}

/** Fallback khi API lỗi / rỗng (dev UI) */
export const FALLBACK_COMBOS = [
  {
    id: 'fallback-solo',
    name: 'Combo Solo',
    desc: '1 bắp ngọt 60oz + 1 nước ngọt 22oz',
    price: 75000,
    img: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=600',
    category: 'combo',
  },
  {
    id: 'fallback-couple',
    name: 'Combo Couple',
    desc: '1 bắp ngọt 60oz + 2 nước ngọt 22oz',
    price: 95000,
    img: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=600',
    category: 'combo',
  },
  {
    id: 'fallback-party',
    name: 'Combo Party',
    desc: '2 bắp ngọt 60oz + 4 nước ngọt 22oz',
    price: 165000,
    img: 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=600',
    category: 'combo',
  },
]

const unwrapList = (payload) => {
  const data = payload?.result ?? payload?.data ?? payload
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  if (Array.isArray(data?.result)) return data.result
  return []
}

/** Map BE ConcessionResponse → shape UI booking/user */
export const mapConcessionForUi = (item = {}) => {
  const type = String(item.itemType || item.category || 'combo').toLowerCase()
  const emoji = ITEM_TYPE_EMOJIS[type] || '🍿'
  const imageUrl = item.imageUrl || item.img || ''
  const hasHttpImg = typeof imageUrl === 'string' && (
    imageUrl.startsWith('http') || imageUrl.startsWith('/') || imageUrl.startsWith('data:')
  )

  return {
    id: item.id,
    name: item.name || 'Bắp nước',
    desc: item.description || item.desc || CONCESSION_ITEM_TYPES[type] || '',
    price: Number(item.price) || 0,
    img: hasHttpImg ? imageUrl : (imageUrl || emoji),
    category: type,
    itemType: type,
    isActive: item.isActive !== false,
  }
}

export const concessionService = {
  getAll: (params) => api.get('/api/v1/concessions', { params }),
  getById: (id) => api.get(`/api/v1/concessions/${id}`),
  create: (data) => api.post('/api/v1/admin/concessions', data),
  update: (id, data) => api.put(`/api/v1/admin/concessions/${id}`, data),
  delete: (id) => api.delete(`/api/v1/admin/concessions/${id}`),
  toggleActive: (id) => api.patch(`/api/v1/admin/concessions/${id}/toggle`),
  getActive: () => api.get('/api/v1/concessions/active'),

  /**
   * Upload một file ảnh lên Cloudinary (qua BE) và trả về URL.
   * Endpoint: POST /api/v1/admin/concessions/upload  (multipart, field "file")
   */
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/v1/admin/concessions/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * User booking: load active concessions, mapped for UI.
   * @param {{ fallback?: boolean, onlyCombo?: boolean }} opts
   */
  getActiveForUi: async (opts = {}) => {
    const { onlyCombo = false } = opts
    try {
      let list = unwrapList((await api.get('/api/v1/concessions/active')).data)
        .map(mapConcessionForUi)
        .filter(concession => concession.id && concession.name)
      if (onlyCombo) {
        list = list.filter(concession => !concession.category || concession.category === 'combo')
      }
      return list
    } catch (err) {
      if (import.meta.env.DEV) console.error('Failed to load concessions:', err)
      return []
    }
  },
}
