// path: src/features/settings/hooks.js
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfileAPI, changePasswordAPI } from './api'

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateProfileAPI,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['auth'] })
    },
  })
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: changePasswordAPI,
  })
}
