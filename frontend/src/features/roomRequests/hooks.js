// path: src/features/roomRequests/hooks.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRoomRequestsAPI,
  createRoomRequestAPI,
  approveRoomRequestAPI,
} from './api'

const ROOM_REQUESTS_QUERY_KEY = ['roomRequests']

export const useRoomRequests = (params, enabled = true) => {
  return useQuery({
    queryKey: [...ROOM_REQUESTS_QUERY_KEY, params],
    queryFn: () => getRoomRequestsAPI(params),
    enabled,
  })
}

export const useCreateRoomRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRoomRequestAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOM_REQUESTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['rent-status'] })
    },
  })
}

export const useApproveRoomRequest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: approveRoomRequestAPI,
    onSuccess: (data, requestId) => {
      queryClient.setQueriesData({ queryKey: ROOM_REQUESTS_QUERY_KEY }, (oldData) => {
        if (!Array.isArray(oldData)) {
          return oldData
        }

        return oldData.map((request) =>
          String(request.id) === String(requestId)
            ? { ...request, status: data?.status || 'APPROVED' }
            : request,
        )
      })

      queryClient.invalidateQueries({ queryKey: ROOM_REQUESTS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['rooms'] })
      queryClient.invalidateQueries({ queryKey: ['rent-status'] })
    },
  })
}