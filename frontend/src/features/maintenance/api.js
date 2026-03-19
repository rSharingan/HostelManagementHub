// path: src/features/maintenance/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

export const getMaintenanceAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.MAINTENANCE.LIST, { params })
  return data
}

export const getMaintenanceDetailAPI = async (id) => {
  const { data } = await axios.get(API_ENDPOINTS.MAINTENANCE.DETAIL(id))
  return data
}

export const createMaintenanceAPI = async (maintenance) => {
  const { data } = await axios.post(API_ENDPOINTS.MAINTENANCE.CREATE, maintenance)
  return data
}

export const updateMaintenanceAPI = async (id, maintenance) => {
  const { data } = await axios.put(API_ENDPOINTS.MAINTENANCE.UPDATE(id), maintenance)
  return data
}

export const deleteMaintenanceAPI = async (id) => {
  await axios.delete(API_ENDPOINTS.MAINTENANCE.DELETE(id))
}
