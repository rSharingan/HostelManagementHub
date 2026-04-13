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

export const initiatePaymentAPI = async (paymentData) => {
  try {
    console.log('🔵 [API] Initiating payment request with data:', paymentData)
    
    if (!paymentData.invoiceId || !paymentData.studentId || !paymentData.amount) {
      throw new Error('Missing required fields: invoiceId, studentId, or amount')
    }

    const { data } = await axios.post('/payments/initiate', paymentData)
    console.log('✅ [API] Payment initiation successful. Transaction ID:', data.transactionId)
    return data
  } catch (error) {
    console.error('❌ [API] Payment initiation failed:', error)
    throw error
  }
}

export const getRentStatusAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.FEES.RENT_STATUS, { params })
  return data
}

export const payRentAPI = async (payload) => {
  const { data } = await axios.post(API_ENDPOINTS.FEES.RENT_PAY, payload)
  return data
}

export const getStaffPaymentsAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.FEES.STAFF_PAYMENTS_LIST, { params })
  return data
}

export const getMyStaffPaymentsAPI = async (email) => {
  const { data } = await axios.get(API_ENDPOINTS.FEES.STAFF_PAYMENTS_ME, {
    params: { email },
  })
  return data
}

export const initiateStaffPaymentAPI = async (payload) => {
  const { data } = await axios.post(API_ENDPOINTS.FEES.STAFF_PAYMENTS_INITIATE, payload)
  return data
}

export const getStaffPaymentStatusAPI = async (transactionId) => {
  const { data } = await axios.get(API_ENDPOINTS.FEES.STAFF_PAYMENTS_STATUS(transactionId))
  return data
}

export const getStaffSalaryPromptsAPI = async (params = {}) => {
  const { data } = await axios.get(API_ENDPOINTS.FEES.STAFF_SALARY_PROMPTS_LIST, { params })
  return data
}

export const createStaffSalaryPromptAPI = async (payload) => {
  const { data } = await axios.post(API_ENDPOINTS.FEES.STAFF_SALARY_PROMPTS_CREATE, payload)
  return data
}

export const resolveStaffSalaryPromptAPI = async ({ id, resolvedByEmail }) => {
  const { data } = await axios.post(API_ENDPOINTS.FEES.STAFF_SALARY_PROMPTS_RESOLVE(id), { resolvedByEmail })
  return data
}

export const getUserBalanceAPI = async (email) => {
  const { data } = await axios.get(API_ENDPOINTS.USERS.BALANCE, {
    params: { email },
  })
  return data
}
