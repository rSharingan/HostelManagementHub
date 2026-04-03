// src/features/reports/api.js
import axios from 'axios';

export const fetchOccupancyReport = async () => {
  const response = await axios.get('/api/reports/occupancy');
  return response.data;
};