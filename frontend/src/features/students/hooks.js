// path: src/features/students/hooks.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getStudentsAPI,
  getStudentAPI,
  createStudentAPI,
  updateStudentAPI,
  deleteStudentAPI,
} from './api'

const STUDENTS_QUERY_KEY = ['students']

export const useStudents = (params) => {
  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, params],
    queryFn: () => getStudentsAPI(params),
  })
}

export const useStudent = (id, enabled = true) => {
  return useQuery({
    queryKey: [...STUDENTS_QUERY_KEY, id],
    queryFn: () => getStudentAPI(id),
    enabled,
  })
}

export const useCreateStudent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createStudentAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY })
    },
  })
}

export const useUpdateStudent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updateStudentAPI(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY })
    },
  })
}

export const useDeleteStudent = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteStudentAPI,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STUDENTS_QUERY_KEY })
    },
  })
}
