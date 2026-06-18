import { useState, useEffect } from 'react';

import { API_ENDPOINTS } from '../services/api';
export const usePeriodColors = () => {
  const [periodColors, setPeriodColors] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchColors = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.PERIOD_COLORS);
        if (response.ok) {
          const data = await response.json();
          setPeriodColors(data);
        }
      } catch (error) {
        console.error('Error fetching period colors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchColors();
  }, []);

  const getPeriodStyle = (period) => {
    if (!period || !periodColors) return 'bg-surface-low text-on-surface-variant border-outline-variant';
    const lowerPeriod = period.toLowerCase();
    
    for (const key in periodColors) {
      if (key !== 'default' && lowerPeriod.includes(key)) {
        return periodColors[key];
      }
    }
    return periodColors['default'] || 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return { periodColors, getPeriodStyle, loading };
};
