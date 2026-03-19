// path: src/features/reports/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

export const getOccupancyReportAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.REPORTS.OCCUPANCY, { params })
  return data.data
}

export const getDuesReportAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.REPORTS.DUES, { params })
  return data.data
}

export const getMaintenanceReportAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.REPORTS.MAINTENANCE, { params })
  return data.data
}
