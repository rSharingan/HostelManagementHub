// path: src/features/settings/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

export const updateProfileAPI = async (data) => {
  const response = await axios.put('/me', data)
  return response.data
}

export const changePasswordAPI = async (data) => {
  const response = await axios.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, data)
  return response.data
}
