// path: src/features/maintenance/hooks.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getMaintenanceAPI,
  getMaintenanceDetailAPI,
  createMaintenanceAPI,
  updateMaintenanceAPI,
  deleteMaintenanceAPI,
} from './api'

const MAINTENANCE_QUERY_KEY = ['maintenance']

export const useMaintenance = (params) => {
  return useQuery({
    queryKey: [...MAINTENANCE_QUERY_KEY, params],
    queryFn: () => getMaintenanceAPI(params),
  })
}

export const useMaintenanceDetail = (id, enabled = true) => {
  return useQuery({
    queryKey: [...MAINTENANCE_QUERY_KEY, id],
    queryFn: () => getMaintenanceDetailAPI(id),
    enabled,
  })
}

export const useCreateMaintenance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createMaintenanceAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
    },
  })
}

export const useUpdateMaintenance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => updateMaintenanceAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
    },
  })
}

export const useDeleteMaintenance = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteMaintenanceAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MAINTENANCE_QUERY_KEY })
    },
  })
}
