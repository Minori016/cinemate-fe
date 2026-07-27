import api from './api'

/** Khớp với item_type trong DB (food / drink / combo) */
export const CONCESSION_ITEM_TYPES = {
  popcorn: 'Bắp rang',
  food: 'Đồ ăn khác',
  drink: 'Đồ uống',
  combo: 'Combo bắp nước',
}

export const ITEM_TYPE_EMOJIS = {
  popcorn: '🍿',
  food: '🌭',
  drink: '🥤',
  combo: '🎒',
}

export const PRODUCT_SIZES = [
  { key: 'STANDARD', label: 'Tiêu chuẩn', name: 'Tiêu chuẩn', desc: 'Khẩu phần / dung tích tiêu chuẩn' },
  { key: 'L', label: 'Lớn', name: 'Lớn', desc: 'Khẩu phần / dung tích lớn' },
  { key: 'XL', label: 'Siêu lớn', name: 'Siêu lớn', desc: 'Khẩu phần / dung tích siêu lớn' },
]

export const SIZE_DISPLAY = {
  STANDARD: { label: 'Tiêu chuẩn', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
  L: { label: 'Lớn', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
  XL: { label: 'Siêu lớn', bg: 'bg-rose-100 text-rose-800 border-rose-300' },
}

/** Default flavor & beverage options for customizable items inside combos */
export const DEFAULT_COMBO_OPTIONS = {
  popcornFlavors: [
    { id: 'sweet', label: 'Vị Ngọt (Truyền Thống)', extraFee: 0 },
    { id: 'cheese', label: 'Vị Phô Mai (+10.000đ)', extraFee: 10000 },
    { id: 'caramel', label: 'Vị Caramel (+10.000đ)', extraFee: 10000 },
    { id: 'salty', label: 'Vị Mặn / Bơ', extraFee: 0 },
  ],
  drinkTypes: [
    { id: 'coca', label: 'Coca-Cola (Ly lớn)', extraFee: 0 },
    { id: 'sprite', label: 'Sprite (Ly lớn)', extraFee: 0 },
    { id: 'fanta', label: 'Fanta Cam (Ly lớn)', extraFee: 0 },
    { id: 'water', label: 'Nước Suối Dasani', extraFee: 0 },
  ],
}

/** Fallback khi API lỗi / rỗng (dev UI) */
export const FALLBACK_COMBOS = [
  {
    id: 'c1010101-1010-1010-1010-101010101010',
    name: 'Combo Solo',
    desc: '1 Bắp lớn 60oz + 1 Nước ngọt 22oz',
    price: 75000,
    img: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=600',
    category: 'combo',
    itemType: 'combo',
    subItems: [
      { id: 'popcorn_1', name: 'Bắp Rang Lớn 60oz', type: 'popcorn', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.popcornFlavors, defaultFlavor: 'sweet', defaultSize: 'L' },
      { id: 'drink_1', name: 'Nước Ngọt 22oz', type: 'drink', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.drinkTypes, defaultFlavor: 'coca', defaultSize: 'L' }
    ]
  },
  {
    id: 'c2020202-2020-2020-2020-202020202020',
    name: 'Combo Couple',
    desc: '1 Bắp lớn 60oz + 2 Nước ngọt 22oz tùy chọn',
    price: 125000,
    img: 'https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=600',
    category: 'combo',
    itemType: 'combo',
    subItems: [
      { id: 'popcorn_1', name: 'Bắp Rang Lớn 60oz', type: 'popcorn', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.popcornFlavors, defaultFlavor: 'sweet', defaultSize: 'L' },
      { id: 'drink_1', name: 'Nước Ngọt Thứ 1 (22oz)', type: 'drink', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.drinkTypes, defaultFlavor: 'coca', defaultSize: 'L' },
      { id: 'drink_2', name: 'Nước Ngọt Thứ 2 (22oz)', type: 'drink', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.drinkTypes, defaultFlavor: 'sprite', defaultSize: 'L' }
    ]
  },
  {
    id: 'c3030303-3030-3030-3030-303030303030',
    name: 'Combo Party VIP',
    desc: '2 Bắp lớn 60oz + 3 Nước ngọt 22oz + 1 Snack',
    price: 210000,
    img: 'https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?q=80&w=600',
    category: 'combo',
    itemType: 'combo',
    subItems: [
      { id: 'popcorn_1', name: 'Bắp Rang Lớn Thứ 1', type: 'popcorn', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.popcornFlavors, defaultFlavor: 'caramel', defaultSize: 'L' },
      { id: 'popcorn_2', name: 'Bắp Rang Lớn Thứ 2', type: 'popcorn', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.popcornFlavors, defaultFlavor: 'cheese', defaultSize: 'L' },
      { id: 'drink_1', name: 'Nước Ngọt Thứ 1', type: 'drink', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.drinkTypes, defaultFlavor: 'coca', defaultSize: 'L' },
      { id: 'drink_2', name: 'Nước Ngọt Thứ 2', type: 'drink', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.drinkTypes, defaultFlavor: 'sprite', defaultSize: 'L' },
      { id: 'drink_3', name: 'Nước Ngọt Thứ 3', type: 'drink', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.drinkTypes, defaultFlavor: 'fanta', defaultSize: 'L' }
    ]
  },
]

/**
 * Extract base name by stripping trailing size tags in parentheses e.g. "Bắp Rang Bơ (Tiêu chuẩn)" -> "Bắp Rang Bơ"
 */
export const extractBaseName = (rawName = '') => {
  if (!rawName) return ''
  return String(rawName).replace(/\s*\([^)]*\)\s*$/g, '').trim() || String(rawName).trim()
}

/**
 * Group raw concession items by base product name so multi-size items occupy only 1 card/row.
 */
export const groupConcessionsByBaseName = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) return []

  const groupMap = new Map()

  items.forEach((item) => {
    if (!item) return
    const rawName = (item.name || '').trim()
    let type = String(item.itemType || item.category || 'food').toLowerCase()
    if (type === 'beverage') type = 'drink'

    const itemId = item.id || item.uuid || item.productUuid || item.comboUuid

    // Auto infer popcorn if type is food but name contains Bắp / Popcorn
    if (type === 'food' && (rawName.toLowerCase().includes('bắp') || rawName.toLowerCase().includes('popcorn'))) {
      type = 'popcorn'
    }

    // For combo items, do not merge; attach default subItems if missing
    if (type === 'combo') {
      const comboKey = `combo_${itemId}`
      groupMap.set(comboKey, {
        ...item,
        id: itemId,
        uuid: itemId,
        isGrouped: true,
        sizes: [],
        subItems: item.subItems || [
          { id: 'popcorn_1', name: 'Bắp Rang Lớn', type: 'popcorn', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.popcornFlavors, defaultFlavor: 'sweet', defaultSize: 'L' },
          { id: 'drink_1', name: 'Nước Ngọt tùy chọn', type: 'drink', sizes: ['L'], flavors: DEFAULT_COMBO_OPTIONS.drinkTypes, defaultFlavor: 'coca', defaultSize: 'L' }
        ]
      })
      return
    }

    // Extract base name by stripping trailing size tags in parentheses
    const baseName = extractBaseName(rawName)
    let rawSize = (item.size || 'STANDARD').toUpperCase()
    // Map legacy sizes S -> STANDARD, M -> L
    let sizeKey = rawSize
    if (rawSize === 'S') sizeKey = 'STANDARD'
    if (rawSize === 'M') sizeKey = 'L'

    const groupKey = `${type}_${baseName.toLowerCase()}`

    const sizeLabelMap = {
      STANDARD: 'Tiêu chuẩn',
      L: 'Lớn',
      XL: 'Siêu lớn'
    }

    const currentLabel = sizeLabelMap[sizeKey] || (sizeKey === 'STANDARD' ? 'Tiêu chuẩn' : `Size ${sizeKey}`)

    const itemDescription = item.description || item.desc || ''

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, {
        id: itemId,
        uuid: itemId,
        baseName: baseName,
        name: baseName,
        desc: itemDescription,
        description: itemDescription,
        category: type,
        itemType: type,
        img: item.imageUrl || item.img || ITEM_TYPE_EMOJIS[type] || '🍿',
        imageUrl: item.imageUrl || item.img || '',
        isActive: item.isActive !== false,
        sizes: [
          {
            key: sizeKey,
            label: currentLabel,
            price: Number(item.price) || 0,
            variantId: itemId,
            rawItem: item
          }
        ],
        selectedSize: sizeKey,
        price: Number(item.price) || 0,
        isGrouped: true
      })
    } else {
      const existingGroup = groupMap.get(groupKey)
      if (!existingGroup.desc && itemDescription) {
        existingGroup.desc = itemDescription
        existingGroup.description = itemDescription
      }
      // Append size option if not already present
      if (!existingGroup.sizes.some(s => s.key === sizeKey)) {
        existingGroup.sizes.push({
          key: sizeKey,
          label: currentLabel,
          price: Number(item.price) || 0,
          variantId: itemId,
          rawItem: item
        })
        // Sort sizes: STANDARD -> L -> XL
        const sizeOrder = { STANDARD: 1, S: 1, M: 2, L: 2, XL: 3 }
        existingGroup.sizes.sort((a, b) => (sizeOrder[a.key] || 9) - (sizeOrder[b.key] || 9))
      }
    }
  })

  return Array.from(groupMap.values())
}

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
  const resolvedType = type === 'beverage' ? 'drink' : type
  const emoji = ITEM_TYPE_EMOJIS[resolvedType] || '🍿'
  const imageUrl = item.imageUrl || item.img || ''
  const hasHttpImg = typeof imageUrl === 'string' && (
    imageUrl.startsWith('http') || imageUrl.startsWith('/') || imageUrl.startsWith('data:')
  )

  const itemId = item.id || item.uuid || item.productUuid || item.comboUuid

  return {
    id: itemId,
    uuid: itemId,
    name: item.name || 'Bắp nước',
    desc: item.description || item.desc || CONCESSION_ITEM_TYPES[resolvedType] || '',
    price: Number(item.price) || 0,
    img: hasHttpImg ? imageUrl : (imageUrl || emoji),
    category: resolvedType,
    itemType: resolvedType,
    size: item.size || null,
    isActive: item.isActive !== false,
  }
}

export const concessionService = {
  getAll: (params) => {
    if (params && Object.keys(params).length > 0) {
      return api.get('/api/v1/concessions', { params: { size: 1000, ...params } })
    }
    return api.get('/api/v1/concessions/all')
  },
  getById: (id) => api.get(`/api/v1/concessions/${id}`),
  create: (data) => api.post('/api/v1/admin/concessions', data),
  update: (id, data) => api.put(`/api/v1/admin/concessions/${id}`, data),
  delete: (id) => api.delete(`/api/v1/admin/concessions/${id}`),
  toggleActive: (id) => api.patch(`/api/v1/admin/concessions/${id}/toggle`),
  getActive: () => api.get('/api/v1/concessions/active'),

  /**
   * Lấy danh sách thành phần món lẻ trong 1 combo
   */
  getComboItems: (comboId) => api.get(`/api/v1/admin/combos/${comboId}/items`),

  /**
   * Cập nhật danh sách thành phần món lẻ trong 1 combo
   */
  updateComboItems: (comboId, items) => api.post(`/api/v1/admin/combos/${comboId}/items`, items),

  /**
   * Tạo nhiều sản phẩm theo các bậc size khác nhau (nếu tạo hàng loạt)
   * @param {Array<Object>} itemsList Danh sách payload cần tạo
   */
  createMultiSize: async (itemsList) => {
    const results = []
    for (const itemData of itemsList) {
      const res = await api.post('/api/v1/admin/concessions', itemData)
      results.push(res)
    }
    return results
  },

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
