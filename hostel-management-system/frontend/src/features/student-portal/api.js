// path: src/features/student-portal/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

export const getStudentDashboardAPI = async () => {
  const { data } = await axios.get(API_ENDPOINTS.STUDENT.DASHBOARD)
  return data.data
}

export const getStudentProfileAPI = async () => {
  const { data } = await axios.get(API_ENDPOINTS.STUDENT.PROFILE)
  return data.data
}

export const getStudentFeesAPI = async () => {
  const { data } = await axios.get(API_ENDPOINTS.STUDENT.FEES)
  return data.data
}

export const getStudentRoomAPI = async () => {
  const { data } = await axios.get(API_ENDPOINTS.STUDENT.ROOM)
  return data.data
}

export const submitMaintenanceRequestAPI = async (requestData) => {
  const { data } = await axios.post(API_ENDPOINTS.STUDENT.MAINTENANCE, requestData)
  return data.data
}

export const makePaymentAPI = async (paymentData) => {
  const { data } = await axios.post(API_ENDPOINTS.STUDENT.PAYMENT, paymentData)
  return data.data
}

export const getAvailableRoomsAPI = async () => {
  const { data } = await axios.get(API_ENDPOINTS.STUDENT.AVAILABLE_ROOMS)
  return data.data
}