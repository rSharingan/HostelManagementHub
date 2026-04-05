// path: src/features/fees/api.js
import axios from '../../lib/api/axios'
import { API_ENDPOINTS } from '../../lib/api/endpoints'

// Invoices
export const getInvoicesAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.FEES.INVOICES_LIST, { params })
  return data
}

export const getInvoiceAPI = async (id) => {
  const { data } = await axios.get(API_ENDPOINTS.FEES.INVOICES_DETAIL(id))
  return data
}

export const createInvoiceAPI = async (invoice) => {
  const { data } = await axios.post(API_ENDPOINTS.FEES.INVOICES_CREATE, invoice)
  return data
}

export const updateInvoiceAPI = async (id, invoice) => {
  const { data } = await axios.put(API_ENDPOINTS.FEES.INVOICES_UPDATE(id), invoice)
  return data
}

// Payments
export const getPaymentsAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.FEES.PAYMENTS_LIST, { params })
  return data
}

export const getPaymentAPI = async (id) => {
  const { data } = await axios.get(API_ENDPOINTS.FEES.PAYMENTS_DETAIL(id))
  return data
}

export const createPaymentAPI = async (payment) => {
  const { data } = await axios.post(API_ENDPOINTS.FEES.PAYMENTS_CREATE, payment)
  return data
}

export const updatePaymentAPI = async (id, payment) => {
  const { data } = await axios.put(API_ENDPOINTS.FEES.PAYMENTS_UPDATE(id), payment)
  return data
}

export const getRentStatusAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.FEES.RENT_STATUS, { params })
  return data
}

export const payRentAPI = async (payload) => {
  const { data } = await axios.post(API_ENDPOINTS.FEES.RENT_PAY, payload)
  return data
}
