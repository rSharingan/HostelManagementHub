// path: src/features/roomRequests/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

export const getRoomRequestsAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.ROOM_REQUESTS.LIST, { params })
  return data
}

export const createRoomRequestAPI = async (payload) => {
  const { data } = await axios.post(API_ENDPOINTS.ROOM_REQUESTS.CREATE, payload)
  return data
}

export const approveRoomRequestAPI = async (id) => {
  const { data } = await axios.put(API_ENDPOINTS.ROOM_REQUESTS.APPROVE(id))
  return data
}