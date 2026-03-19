// path: src/features/students/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

export const getStudentsAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.STUDENTS.LIST, { params })
  return data.data
}

export const getStudentAPI = async (id) => {
  const { data } = await axios.get(API_ENDPOINTS.STUDENTS.DETAIL(id))
  return data.data
}

export const createStudentAPI = async (student) => {
  const { data } = await axios.post(API_ENDPOINTS.STUDENTS.CREATE, student)
  return data.data
}

export const updateStudentAPI = async (id, student) => {
  const { data } = await axios.put(API_ENDPOINTS.STUDENTS.UPDATE(id), student)
  return data.data
}

export const deleteStudentAPI = async (id) => {
  await axios.delete(API_ENDPOINTS.STUDENTS.DELETE(id))
}
