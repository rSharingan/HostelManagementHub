// path: src/features/reports/hooks.js
import { useQuery } from '@tanstack/react-query'
import {
  getOccupancyReportAPI,
  getDuesReportAPI,
  getMaintenanceReportAPI,
} from './api'

const REPORTS_QUERY_KEY = ['reports']

export const useOccupancyReport = (params) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'occupancy', params],
    queryFn: () => getOccupancyReportAPI(params),
  })
}

export const useDuesReport = (params) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'dues', params],
    queryFn: () => getDuesReportAPI(params),
  })
}

export const useMaintenanceReport = (params) => {
  return useQuery({
    queryKey: [...REPORTS_QUERY_KEY, 'maintenance', params],
    queryFn: () => getMaintenanceReportAPI(params),
  })
}
