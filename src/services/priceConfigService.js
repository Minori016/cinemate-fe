import api from './api'

export const priceConfigService = {
  getAll: async () => {
    const res = await api.get('/api/v1/admin/price-config')
    return res.data?.result || res.data
  },

  updatePrice: async (format, basePrice) => {
    const res = await api.put(`/api/v1/admin/price-config/${format}`, null, {
      params: { basePrice }
    })
    return res.data?.result || res.data
  }
}
