import { useState, useCallback, useMemo } from 'react';
import { callRagChatApi, extractSourcesFromCitations, transformCitationsToSources } from '../utils/aiSourceUtils';

const MOCK_ANSWERS = [
  {
    answer: "Lý Thường Kiệt (1019–1105) là vị đại tướng quân tài ba, người đã chủ động thực hiện chiến lược 'Tiên phát chế nhân' chống quân Tống xâm lược. Đặc biệt, tại phòng tuyến sông Như Nguyệt, ông đã đọc bài thơ 'Nam quốc sơn hà' để khích lệ tinh thần quân sĩ.",
    citations: [
      { sourceType: "ARTICLE", sourceId: 1, title: "Đại Việt Sử Ký Toàn Thư", slug: "dai-viet-su-ky" },
      { sourceType: "ARTICLE", sourceId: 2, title: "Lịch sử chống ngoại xâm", slug: "lich-su-chong-ngoai-xam" }
    ]
  },
  {
    answer: "Chiếu dời đô (Thiên đô chiếu) được vua Lý Thái Tổ ban hành vào năm Canh Tuất 1010 để chuyển kinh đô từ Hoa Lư (Ninh Bình) về Đại La (Hà Nội ngày nay), mở ra thời kỳ hưng thịnh mới cho đất nước.",
    citations: [
      { sourceType: "DOCUMENT", sourceId: 3, title: "Chiếu Dời Đô tuyển tập", pageNumber: 5 }
    ]
  },
  {
    answer: "Trận Bạch Đằng năm 938 là một trong những trận chiến oai hùng nhất lịch sử nước nhà, do Ngô Quyền lãnh đạo đánh tan quân Nam Hán bằng chiến thuật đóng cọc gỗ đầu bịt sắt dưới lòng sông.",
    citations: [
      { sourceType: "ARTICLE", sourceId: 4, title: "Bản kỷ Ngô Quyền", slug: "ngo-quyen-bach-dang" }
    ]
  }
];

const findMockAnswer = (question) => {
  const q = question.toLowerCase();
  if (q.includes("tống") || q.includes("lý thường kiệt") || q.includes("nam quốc")) {
    return MOCK_ANSWERS[0];
  }
  if (q.includes("dời đô") || q.includes("lý thái tổ")) {
    return MOCK_ANSWERS[1];
  }
  if (q.includes("bạch đằng") || q.includes("ngô quyền")) {
    return MOCK_ANSWERS[2];
  }
  return MOCK_ANSWERS[Math.floor(Math.random() * MOCK_ANSWERS.length)];
};

export const useAIChat = (initialMessages = []) => {
  const [messages, setMessages] = useState(
    initialMessages.map((msg, index) => ({
      id: msg.id || `init-${index}`,
      role: msg.role,
      content: msg.content || msg.text || '',
      text: msg.content || msg.text || '',
      sources: msg.sources || [],
      quote: msg.quote || null,
      createdAt: msg.createdAt || new Date(),
    }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (question, options = {}) => {
    if (!question.trim()) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage = {
      id: userMsgId,
      role: 'user',
      content: question,
      text: question,
      sources: [],
      quote: null,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    setError(null);

    try {
      const data = await callRagChatApi(question, options);
      
      const aiMsgId = `ai-${Date.now()}`;
      const sources = transformCitationsToSources(data.citations || []);
      const fullSources = extractSourcesFromCitations(data.citations || []);

      const aiMessage = {
        id: aiMsgId,
        role: 'ai',
        content: data.answer,
        text: data.answer,
        sources,
        fullSources,
        quote: null,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      return { answer: data.answer, sources: fullSources };
    } catch (err) {
      console.warn("Direct RAG chat failed. Falling back to mock responses...", err);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const matchedMock = findMockAnswer(question);

      const aiMsgId = `ai-mock-${Date.now()}`;
      const sources = transformCitationsToSources(matchedMock.citations);
      const fullSources = extractSourcesFromCitations(matchedMock.citations);

      const aiMessage = {
        id: aiMsgId,
        role: 'ai',
        content: matchedMock.answer,
        text: matchedMock.answer,
        sources,
        fullSources,
        quote: question.toLowerCase().includes("lý thường kiệt") ? "Nam quốc sơn hà Nam đế cư / Tiệt nhiên định phận tại thiên thư..." : null,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
      return { answer: matchedMock.answer, sources: fullSources };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const allSources = useMemo(() => 
    messages.flatMap(m => m.fullSources || m.sources || []),
    [messages]
  );

  const validatedLinks = useMemo(() => 
    allSources.filter(s => s.url && extractSourcesFromCitations([{url: s.url}]).length > 0).slice(0, 20),
    [allSources]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearMessages,
    sources: validatedLinks,
    allSources,
    sourcesCount: validatedLinks.length,
  };
};

export default useAIChat;