// src/features/reports/hook.js
import { useQuery } from '@tanstack/react-query';
import { fetchOccupancyReport } from './api';

export const useOccupancyReport = () => {
  return useQuery(['occupancyReport'], fetchOccupancyReport, {
    staleTime: 5 * 60 * 1000, // cache 5 mins
    retry: 1,
  });
};