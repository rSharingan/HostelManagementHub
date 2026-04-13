// path: src/features/fees/hooks.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getInvoicesAPI,
  getInvoiceAPI,
  createInvoiceAPI,
  updateInvoiceAPI,
  getPaymentsAPI,
  getPaymentAPI,
  createPaymentAPI,
  updatePaymentAPI,
  initiatePaymentAPI,
  getRentStatusAPI,
  payRentAPI,
  getStaffPaymentsAPI,
  getMyStaffPaymentsAPI,
  initiateStaffPaymentAPI,
  getStaffSalaryPromptsAPI,
  createStaffSalaryPromptAPI,
  resolveStaffSalaryPromptAPI,
  getUserBalanceAPI,
} from './api'

const INVOICES_QUERY_KEY = ['invoices']
const PAYMENTS_QUERY_KEY = ['payments']
const RENT_QUERY_KEY = ['rent-status']
const STAFF_PAYMENTS_QUERY_KEY = ['staff-payments']
const STAFF_PROMPTS_QUERY_KEY = ['staff-salary-prompts']
const USER_BALANCE_QUERY_KEY = ['user-balance']

// Invoices
export const useInvoices = (params) => {
  return useQuery({
    queryKey: [...INVOICES_QUERY_KEY, params],
    queryFn: () => getInvoicesAPI(params),
  })
}

export const useInvoice = (id, enabled = true) => {
  return useQuery({
    queryKey: [...INVOICES_QUERY_KEY, id],
    queryFn: () => getInvoiceAPI(id),
    enabled,
  })
}

export const useCreateInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createInvoiceAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
    },
  })
}

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateInvoiceAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
    },
  })
}

// Payments
export const usePayments = (params) => {
  return useQuery({
    queryKey: [...PAYMENTS_QUERY_KEY, params],
    queryFn: () => getPaymentsAPI(params),
  })
}

export const usePayment = (id, enabled = true) => {
  return useQuery({
    queryKey: [...PAYMENTS_QUERY_KEY, id],
    queryFn: () => getPaymentAPI(id),
    enabled,
  })
}

export const useCreatePayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createPaymentAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY })
    },
  })
}

export const useUpdatePayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updatePaymentAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY })
    },
  })
}

export const useInitiatePayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: initiatePaymentAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY })
    },
  })
}

export const useRentStatus = (params, enabled = true) => {
  return useQuery({
    queryKey: [...RENT_QUERY_KEY, params],
    queryFn: () => getRentStatusAPI(params),
    enabled,
  })
}

export const usePayRent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: payRentAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: RENT_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: INVOICES_QUERY_KEY })
    },
  })
}

export const useStaffPayments = (params, enabled = true) => {
  return useQuery({
    queryKey: [...STAFF_PAYMENTS_QUERY_KEY, params],
    queryFn: () => getStaffPaymentsAPI(params),
    enabled,
  })
}

export const useMyStaffPayments = (email, enabled = true) => {
  return useQuery({
    queryKey: [...STAFF_PAYMENTS_QUERY_KEY, 'me', email],
    queryFn: () => getMyStaffPaymentsAPI(email),
    enabled,
  })
}

export const useInitiateStaffPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: initiateStaffPaymentAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_PAYMENTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: PAYMENTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['staff'] })
      queryClient.invalidateQueries({ queryKey: STAFF_PROMPTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: USER_BALANCE_QUERY_KEY })
    },
  })
}

export const useStaffSalaryPrompts = (params, enabled = true) => {
  return useQuery({
    queryKey: [...STAFF_PROMPTS_QUERY_KEY, params],
    queryFn: () => getStaffSalaryPromptsAPI(params),
    enabled,
  })
}

export const useCreateStaffSalaryPrompt = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createStaffSalaryPromptAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_PROMPTS_QUERY_KEY })
    },
  })
}

export const useResolveStaffSalaryPrompt = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: resolveStaffSalaryPromptAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_PROMPTS_QUERY_KEY })
    },
  })
}

export const useUserBalance = (email, enabled = true) => {
  return useQuery({
    queryKey: [...USER_BALANCE_QUERY_KEY, email],
    queryFn: () => getUserBalanceAPI(email),
    enabled: enabled && Boolean(email),
  })
}
