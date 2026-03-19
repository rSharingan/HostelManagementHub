// path: src/features/rooms/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

export const getRoomsAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.ROOMS.LIST, { params })
  return data.data
}

export const getRoomAPI = async (id) => {
  const { data } = await axios.get(API_ENDPOINTS.ROOMS.DETAIL(id))
  return data.data
}

export const createRoomAPI = async (room) => {
  const { data } = await axios.post(API_ENDPOINTS.ROOMS.CREATE, room)
  return data.data
}

export const updateRoomAPI = async (id, room) => {
  const { data } = await axios.put(API_ENDPOINTS.ROOMS.UPDATE(id), room)
  return data.data
}

export const deleteRoomAPI = async (id) => {
  await axios.delete(API_ENDPOINTS.ROOMS.DELETE(id))
}
