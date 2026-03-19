// path: src/features/student-portal/hooks.js
import { useQuery } from '@tanstack/react-query'
import { getStudentDashboardAPI, getStudentProfileAPI, getStudentFeesAPI, getStudentRoomAPI, getAvailableRoomsAPI } from './api'

export const useStudentDashboard = () => {
  return useQuery({
    queryKey: ['student-dashboard'],
    queryFn: getStudentDashboardAPI,
  })
}

export const useStudentProfile = () => {
  return useQuery({
    queryKey: ['student-profile'],
    queryFn: getStudentProfileAPI,
  })
}

export const useStudentFees = () => {
  return useQuery({
    queryKey: ['student-fees'],
    queryFn: getStudentFeesAPI,
  })
}

export const useStudentRoom = () => {
  return useQuery({
    queryKey: ['student-room'],
    queryFn: getStudentRoomAPI,
  })
}

export const useAvailableRooms = () => {
  return useQuery({
    queryKey: ['available-rooms'],
    queryFn: getAvailableRoomsAPI,
  })
}