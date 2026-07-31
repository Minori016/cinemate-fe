import api from './api'

export const contactService = {
  submitContact: async (data) => {
    const response = await api.post('/api/v1/contacts', data)
    return response.data
  },
  
  // Admin methods
  getAllContacts: async (page = 1, size = 10) => {
    const response = await api.get('/api/v1/admin/contacts', { params: { page, size } })
    return response.data
  },
  
  getContactById: async (id) => {
    const response = await api.get(`/api/v1/admin/contacts/${id}`)
    return response.data
  },
  
  replyToContact: async (id, responseMessage) => {
    const response = await api.post(`/api/v1/admin/contacts/${id}/reply`, { responseMessage })
    return response.data
  }
}
