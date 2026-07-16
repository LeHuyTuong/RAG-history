export const resolveImageUrl = (url, fallback = '/images/home.png') => {
  if (!url || typeof url !== 'string' || url === 'null') return fallback;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  if (url.startsWith('/uploads')) {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
    return `${baseUrl}${url}`;
  }
  return url;
};
