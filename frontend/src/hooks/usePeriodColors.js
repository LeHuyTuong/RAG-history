import { useState, useEffect } from 'react';

import { metadataService, ENDPOINTS } from '../services';
import mockClient from '../services/http/mockClient';

export const usePeriodColors = () => {
  const [periodColors, setPeriodColors] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchColors = async () => {
      try {
        let palette;
        try {
          const { periodColors: colors } = await metadataService.fetchColors();
          palette = colors;
        } catch (e) {
          const res = await mockClient.get(ENDPOINTS.MOCK.PERIOD_COLORS);
          palette = res.data;
        }
        if (!cancelled) setPeriodColors(palette);
      } catch (error) {
        console.error('Error fetching period colors:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchColors();
    return () => {
      cancelled = true;
    };
  }, []);

  const getPeriodStyle = (period) => {
    if (!period || !periodColors) {
      return 'bg-surface-low text-on-surface-variant border-outline-variant';
    }
    const lowerPeriod = period.toLowerCase();

    for (const key in periodColors) {
      if (key !== 'default' && lowerPeriod.includes(key)) {
        return periodColors[key];
      }
    }
    return periodColors.default || 'bg-indigo-50 text-indigo-700 border-indigo-200';
  };

  return { periodColors, getPeriodStyle, loading };
};