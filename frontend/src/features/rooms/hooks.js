// path: src/features/rooms/hooks.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getRoomsAPI,
  getRoomAPI,
  createRoomAPI,
  updateRoomAPI,
  deleteRoomAPI,
  applyRoomAPI,
} from './api'

const ROOMS_QUERY_KEY = ['rooms']

export const useRooms = (params) => {
  return useQuery({
    queryKey: [...ROOMS_QUERY_KEY, params],
    queryFn: () => getRoomsAPI(params),
  })
}

export const useRoom = (id, enabled = true) => {
  return useQuery({
    queryKey: [...ROOMS_QUERY_KEY, id],
    queryFn: () => getRoomAPI(id),
    enabled,
  })
}

export const useCreateRoom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createRoomAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY })
    },
  })
}

export const useUpdateRoom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updateRoomAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY })
    },
  })
}

export const useDeleteRoom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteRoomAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY })
    },
  })
}

export const useApplyRoom = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: applyRoomAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_QUERY_KEY })
    },
  })
}
