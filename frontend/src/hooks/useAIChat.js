import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { extractSourcesFromCitations, transformCitationsToSources } from '../utils/aiSourceUtils';
import { ragService, settingsService } from '../services';

export const useAIChat = (initialMessages = []) => {
  const [messages, setMessages] = useState(
    initialMessages.map((msg, index) => ({
      id: msg.id || `init-${index}`,
      role: msg.role,
      content: msg.content || msg.text || '',
      text: msg.content || msg.text || '',
      sources: msg.sources || [],
      suggestions: msg.suggestions || [],
      createdAt: msg.createdAt || new Date(),
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [streamingMsgId, setStreamingMsgId] = useState(null);
  const [tokensPerSecond, setTokensPerSecond] = useState(0);
  const [aiModel, setAiModel] = useState(null);

  const stopStreamRef = useRef(null);
  const tokenCountRef = useRef(0);
  const streamStartRef = useRef(null);
  const tpsIntervalRef = useRef(null);

  useEffect(() => {
    const loadAiModel = () => {
      settingsService.getByKey('rag.llm_model')
        .then(setting => setAiModel(setting?.value || null))
        .catch(() => setAiModel(null));
    };

    loadAiModel();
    window.addEventListener('history-rag-settings-updated', loadAiModel);

    return () => {
      window.removeEventListener('history-rag-settings-updated', loadAiModel);
    };
  }, []);

  const sendMessage = useCallback((question, options = {}) => {
    if (!question.trim() || loading) return;

    if (stopStreamRef.current) {
      stopStreamRef.current();
      stopStreamRef.current = null;
    }

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      text: question,
      sources: [],
      suggestions: [],
      createdAt: new Date(),
    };

    const aiMsgId = `ai-${Date.now()}`;
    const aiPlaceholder = {
      id: aiMsgId,
      role: 'ai',
      content: '',
      text: '',
      thinking: '',
      sources: [],
      suggestions: [],
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, aiPlaceholder]);
    setLoading(true);
    setError(null);
    setStreamingMsgId(aiMsgId);
    setTokensPerSecond(0);
    tokenCountRef.current = 0;
    streamStartRef.current = Date.now();

    // Cập nhật token/s mỗi 300ms
    tpsIntervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - streamStartRef.current) / 1000;
      if (elapsed > 0) {
        setTokensPerSecond(Math.round(tokenCountRef.current / elapsed));
      }
    }, 300);

    const updateAiMsg = (updater) =>
      setMessages((prev) =>
        prev.map((m) => (m.id === aiMsgId ? { ...m, ...updater(m) } : m))
      );

    const stopStream = () => {
      clearInterval(tpsIntervalRef.current);
      setStreamingMsgId(null);
    };

    stopStreamRef.current = ragService.chatStream(
      {
        question,
        topK: options.topK || 5,
        useGraph: options.useGraph || false,
        sourceIds: options.sourceIds || [],
        tagIds: options.tagIds || [],
        temperature: options.temperature || 0.2,
        model: options.model || aiModel || undefined,
      },
      {
        onThinking: (text) =>
          updateAiMsg((m) => ({ thinking: (m.thinking || '') + text })),

        onToken: (text) => {
          tokenCountRef.current += text.length;
          updateAiMsg((m) => ({ content: m.content + text, text: m.text + text }));
        },

        onCitations: (citations) =>
          updateAiMsg(() => ({
            sources: transformCitationsToSources(citations),
            fullSources: extractSourcesFromCitations(citations),
          })),

        onSuggestions: (suggestions) =>
          updateAiMsg(() => ({ suggestions })),

        onDone: () => {
          stopStream();
          setLoading(false);
          stopStreamRef.current = null;
        },

        onError: (err) => {
          stopStream();
          setError(err.message || 'Lỗi kết nối. Vui lòng thử lại.');
          setLoading(false);
          stopStreamRef.current = null;
          setMessages((prev) => {
            const ai = prev.find((m) => m.id === aiMsgId);
            return ai?.content ? prev : prev.filter((m) => m.id !== aiMsgId);
          });
        },
      }
    );
  }, [aiModel, loading]);

  const clearMessages = useCallback(() => {
    if (stopStreamRef.current) {
      stopStreamRef.current();
      stopStreamRef.current = null;
    }
    clearInterval(tpsIntervalRef.current);
    setMessages([]);
    setError(null);
    setLoading(false);
    setStreamingMsgId(null);
    setTokensPerSecond(0);
  }, []);

  const allSources = useMemo(
    () => messages.flatMap((m) => m.fullSources || m.sources || []),
    [messages]
  );

  return {
    messages,
    loading,
    error,
    streamingMsgId,
    tokensPerSecond,
    sendMessage,
    clearMessages,
    allSources,
  };
};

export default useAIChat;
