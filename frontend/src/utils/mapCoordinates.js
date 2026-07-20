export const getXPercent = (lng) => {
  if (lng === undefined || lng === null) return 50;
  return Math.max(0, Math.min(100, 45.45 + (parseFloat(lng) - 105.3) * 6.14));
};

export const getYPercent = (lat) => {
  if (lat === undefined || lat === null) return 50;
  return Math.max(0, Math.min(100, 0.27 + (23.39 - parseFloat(lat)) * 6.394));
};
