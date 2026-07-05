import api from './api'

export const systemConfigService = {
  getAll: () => api.get('/api/v1/admin/system-configs'),
  updateConfigs: (payload) => api.put('/api/v1/admin/system-configs', payload)
}
