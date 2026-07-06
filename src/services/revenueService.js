import api from './api'

const BASE_URL = '/api/v1/manager/revenue'

export const revenueService = {
  // Get revenue by branch with filters
  getByBranch: (params) => api.get(BASE_URL + '/branches', { params }),

  // Get revenue summary for all branches
  getSummary: (params) => api.get(BASE_URL + '/summary', { params }),

  // Get branch comparison data
  getComparison: (params) => api.get(BASE_URL + '/comparison', { params }),

  // Export revenue report by branch
  export: (data) => api.post(BASE_URL + '/export', data),
}
