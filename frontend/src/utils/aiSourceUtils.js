import { API_ENDPOINTS } from '../services/api';

const MAX_LINKS = 20;
const URL_REGEX = /^https?:\/\/.+/i;

export const validateUrl = (url) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return URL_REGEX.test(parsed.href);
  } catch {
    return false;
  }
};

export const extractSourcesFromCitations = (citations) => {
  const sources = [];

  for (const cit of citations) {
    if (cit.sourceUrl && validateUrl(cit.sourceUrl)) {
      sources.push({
        title: cit.title || `${cit.sourceType || 'Nguồn'} #${cit.sourceId || ''}`,
        url: cit.sourceUrl,
        sourceType: cit.sourceType,
        sourceId: cit.sourceId,
      });
    }
    if (cit.url && validateUrl(cit.url)) {
      sources.push({
        title: cit.title || `${cit.sourceType || 'Nguồn'} #${cit.sourceId || ''}`,
        url: cit.url,
        sourceType: cit.sourceType,
        sourceId: cit.sourceId,
      });
    }
    if (cit.slug && !cit.slug.startsWith('/')) {
      const fullUrl = `https://${cit.slug}`;
      if (validateUrl(fullUrl)) {
        sources.push({
          title: cit.title || `${cit.sourceType || 'Nguồn'} #${cit.sourceId || ''}`,
          url: fullUrl,
          sourceType: cit.sourceType,
          sourceId: cit.sourceId,
        });
      }
    }
  }

  const uniqueSources = Array.from(
    new Map(sources.map(s => [s.url, s])).values()
  );

  return uniqueSources.slice(0, MAX_LINKS);
};

export const callRagChatApi = async (question, options = {}) => {
  const response = await fetch(API_ENDPOINTS.RAG_CHAT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      question,
      topK: options.topK || 5,
      useGraph: options.useGraph || false,
      sourceIds: options.sourceIds || [],
      tagIds: options.tagIds || [],
      temperature: options.temperature || 0.2,
    }),
  });

  if (!response.ok) {
    throw new Error(`Server returned status ${response.status}`);
  }

  return response.json();
};

export const transformCitationsToSources = (citations) => {
  return (citations || []).map((cit) => {
    let url = undefined;
    let detail = `Nguồn: ${cit.sourceType || 'Khác'}`;

    if (cit.sourceType === 'DOCUMENT') {
      detail = `Trang ${cit.pageNumber || 'N/A'}`;
    } else if (cit.slug) {
      detail = `Xem bài viết: ${cit.slug}`;
      url = `/articles/${cit.slug}`;
    } else if (cit.sourceUrl) {
      detail = `Xem nguồn trực tuyến`;
      url = cit.sourceUrl;
    } else if (cit.url) {
      detail = `Xem nguồn trực tuyến`;
      url = cit.url;
    }

    return {
      title: cit.title || `${cit.sourceType} #${cit.sourceId || ''}`,
      detail,
      url,
    };
  });
};