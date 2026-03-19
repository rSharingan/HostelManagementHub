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
} from './api'

const INVOICES_QUERY_KEY = ['invoices']
const PAYMENTS_QUERY_KEY = ['payments']

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
