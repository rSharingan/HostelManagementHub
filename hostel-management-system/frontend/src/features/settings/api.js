// path: src/features/settings/api.js
import axios from '../../lib/api/axios'

export const updateProfileAPI = async (data) => {
  const response = await axios.put('/me', data)
  return response.data.data
}

export const changePasswordAPI = async (data) => {
  const response = await axios.post('/change-password', data)
  return response.data.data
}
