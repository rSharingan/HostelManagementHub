// path: src/features/dashboard/hooks.js
import { useQuery } from '@tanstack/react-query'
import { getDashboardStatsAPI } from './api'

const DASHBOARD_QUERY_KEY = ['dashboard']

export const useDashboardStats = () => {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: getDashboardStatsAPI,
  })
}
