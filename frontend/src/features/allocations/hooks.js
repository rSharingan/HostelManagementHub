// path: src/features/allocations/hooks.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllocationsAPI,
  getAllocationAPI,
  createAllocationAPI,
  updateAllocationAPI,
  deleteAllocationAPI,
  getAllocationSummaryAPI,
} from './api'

const ALLOCATIONS_QUERY_KEY = ['allocations']

export const useAllocations = (params) => {
  return useQuery({
    queryKey: [...ALLOCATIONS_QUERY_KEY, params],
    queryFn: () => getAllocationsAPI(params),
  })
}

export const useAllocation = (id, enabled = true) => {
  return useQuery({
    queryKey: [...ALLOCATIONS_QUERY_KEY, id],
    queryFn: () => getAllocationAPI(id),
    enabled,
  })
}

export const useCreateAllocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAllocationAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALLOCATIONS_QUERY_KEY })
    },
  })
}

export const useUpdateAllocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateAllocationAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALLOCATIONS_QUERY_KEY })
    },
  })
}

export const useDeleteAllocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAllocationAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALLOCATIONS_QUERY_KEY })
    },
  })
}

export const useAllocationsSummary = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['allocations', 'summary'],
    queryFn: getAllocationSummaryAPI,
  })

  return {
    availableRooms: data?.available || [],
    bookedRooms: data?.booked || [],
    loading: isLoading,
    error,
  }
}
