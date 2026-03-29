// path: src/features/allocations/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

export const getAllocationsAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.ALLOCATIONS.LIST, { params })
  return data
}

export const getAllocationAPI = async (id) => {
  const { data } = await axios.get(API_ENDPOINTS.ALLOCATIONS.DETAIL(id))
  return data
}

export const createAllocationAPI = async (allocation) => {
  const { data } = await axios.post(API_ENDPOINTS.ALLOCATIONS.CREATE, allocation)
  return data
}

export const updateAllocationAPI = async (id, allocation) => {
  const { data } = await axios.put(API_ENDPOINTS.ALLOCATIONS.UPDATE(id), allocation)
  return data
}

export const deleteAllocationAPI = async (id) => {
  await axios.delete(API_ENDPOINTS.ALLOCATIONS.DELETE(id))
}

export const getAllocationSummaryAPI = async () => {
  const { data } = await axios.get(API_ENDPOINTS.ALLOCATIONS.SUMMARY)
  return data
}
