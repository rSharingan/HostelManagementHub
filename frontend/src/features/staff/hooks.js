// path: src/features/staff/hooks.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStaffAPI,
  getStaffMemberAPI,
  createStaffAPI,
  updateStaffAPI,
  deleteStaffAPI,
} from './api'

const STAFF_QUERY_KEY = ['staff']

export const useStaff = (params) => {
  return useQuery({
    queryKey: [...STAFF_QUERY_KEY, params],
    queryFn: () => getStaffAPI(params),
  })
}

export const useStaffMember = (id, enabled = true) => {
  return useQuery({
    queryKey: [...STAFF_QUERY_KEY, id],
    queryFn: () => getStaffMemberAPI(id),
    enabled,
  })
}

export const useCreateStaff = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createStaffAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY })
    },
  })
}

export const useUpdateStaff = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateStaffAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY })
    },
  })
}

export const useDeleteStaff = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteStaffAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STAFF_QUERY_KEY })
    },
  })
}
