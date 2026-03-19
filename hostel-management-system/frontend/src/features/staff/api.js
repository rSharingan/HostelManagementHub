// path: src/features/staff/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

export const getStaffAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.STAFF.LIST, { params })
  return data.data
}

export const getStaffMemberAPI = async (id) => {
  const { data } = await axios.get(API_ENDPOINTS.STAFF.DETAIL(id))
  return data.data
}

export const createStaffAPI = async (staff) => {
  const { data } = await axios.post(API_ENDPOINTS.STAFF.CREATE, staff)
  return data.data
}

export const updateStaffAPI = async (id, staff) => {
  const { data } = await axios.put(API_ENDPOINTS.STAFF.UPDATE(id), staff)
  return data.data
}

export const deleteStaffAPI = async (id) => {
  await axios.delete(API_ENDPOINTS.STAFF.DELETE(id))
}
