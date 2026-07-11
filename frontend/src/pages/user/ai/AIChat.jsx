import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAIChat } from '../../../hooks/useAIChat';
import ragService from '../../../services/common/ragService';
import DongSonDrumIcon from '../../../components/DongSonDrumIcon';

const normalizeMarkdown = (text) => {
  if (!text) return '';
  // Standardize newlines
  let normalized = text.replace(/\r\n/g, '\n');
  
  // Ensure that lists and headers have double newlines before them
  normalized = normalized
    .replace(/([^\n])\n(\s*[-*+•]\s)/g, '$1\n\n$2') // bullets
    .replace(/([^\n])\n(\s*\d+\.\s)/g, '$1\n\n$2')  // numbered lists
    .replace(/([^\n])\n(\s*#+\s)/g, '$1\n\n$2');    // headers

  // Replace any remaining single newlines (that are not double newlines) with double newlines
  // so they don't get collapsed into spaces by ReactMarkdown
  normalized = normalized.replace(/(?<!\n)\n(?!\n)/g, '\n\n');
  
  return normalized;
};

const MD_COMPONENTS = {
  p: ({ children }) => <p className="mb-2.5 last:mb-0 leading-relaxed text-sm">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 mt-1 space-y-1.5 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 mt-1 space-y-1.5 pl-5 list-decimal">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-relaxed list-disc text-on-surface">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
  em: ({ children }) => <em className="italic text-on-surface-variant">{children}</em>,
  h1: ({ children }) => <h1 className="text-base font-headline font-bold text-primary mt-4 mb-2 first:mt-0 border-b border-outline-variant/20 pb-1">{children}</h1>,
  h2: ({ children }) => <h2 className="text-sm font-headline font-bold text-primary mt-3 mb-1.5 first:mt-0">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-bold text-on-surface mt-2 mb-1 first:mt-0">{children}</h3>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary/40 pl-3 py-0.5 my-2.5 bg-primary/5 rounded-r text-sm italic text-on-surface-variant">
      {children}
    </blockquote>
  ),
  code: ({ children }) => <code className="bg-surface-low px-1 py-0.5 rounded text-xs font-mono text-secondary">{children}</code>,
  hr: () => <hr className="my-3 border-outline-variant/20" />,
};

const Cursor = () => (
  <span
    className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
    style={{ animation: 'blink 1s step-end infinite' }}
  />
);

const ThinkingBlock = ({ thinking, isStreaming }) => {
  const [open, setOpen] = useState(false);
  if (!thinking && !isStreaming) return null;
  return (
    <div className="mb-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[10px] font-body font-bold text-on-surface-variant/60 uppercase tracking-widest hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-xs">
          {isStreaming ? 'psychology' : open ? 'expand_less' : 'expand_more'}
        </span>
        {isStreaming ? (
          <span className="flex items-center gap-1">
            Đang suy nghĩ
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-current rounded-full animate-bounce" />
              <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
            </span>
          </span>
        ) : (
          `Quá trình suy luận ${open ? '▲' : '▼'}`
        )}
      </button>
      {open && thinking && (
        <div className="mt-2 p-3 bg-surface-variant/30 rounded-xl border border-outline-variant/20 text-[11px] text-on-surface-variant/70 font-body leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
          {thinking}
        </div>
      )}
    </div>
  );
};

const AIChat = () => {
  const {
    messages, loading, error,
    streamingMsgId, tokensPerSecond,
    sendMessage, clearMessages, sendFeedback,
  } = useAIChat([{
    role: 'ai',
    content: 'Kính chào quý học giả. Tôi là Trợ lý AI được huấn luyện từ kho tàng Đại Việt Sử Ký. Bạn muốn tìm hiểu sâu hơn về triều đại hay sự kiện nào?',
    sources: [],
  }]);

  const [starterQuestions, setStarterQuestions] = useState([]);
  const [input, setFormInput] = useState('');
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    ragService.suggestQuestions({ sourceIds: [], count: 4 })
      .then(setStarterQuestions)
      .catch(() => setStarterQuestions([]));
  }, []);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input);
    setFormInput('');
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="max-w-[1440px] mx-auto px-12 py-8 font-body">

      {/* HEADER */}
      <div className="mb-8 border-b border-outline-variant/30 pb-6">
        <h2 className="font-headline text-4xl text-primary font-bold italic tracking-tight">Trợ lý Học giả AI</h2>
        <p className="text-on-surface-variant text-sm mt-2">Giải mã sử liệu Đại Việt thông qua trí tuệ nhân tạo (RAG Technology).</p>
      </div>

      <div className="grid grid-cols-12 gap-8 h-[70vh]">

        {/* CỘT TRÁI */}
        <aside className="hidden lg:col-span-3 lg:flex flex-col gap-6">
          <div className="p-6 bg-surface-container border border-outline-variant/20 rounded-xl shadow-sm">
            <h3 className="font-headline text-lg text-primary font-bold mb-4 italic">Chủ đề thảo luận</h3>
            <ul className="space-y-2">
              <li className="p-3 bg-primary text-white rounded-lg text-xs font-bold uppercase tracking-widest flex items-center gap-3">
                <span className="material-symbols-outlined text-sm">history_edu</span> Nhà Lý & Kháng chiến
              </li>
              <li className="p-3 hover:bg-white/50 rounded-lg transition-all text-on-surface-variant text-sm flex items-center gap-3 cursor-pointer italic">
                <span className="material-symbols-outlined text-sm">castle</span> Kinh thành Thăng Long
              </li>
            </ul>
          </div>
          <div className="p-6 border border-outline-variant/30 rounded-xl relative overflow-hidden group bg-white/40">
            <div className="absolute inset-0 dong-son-pattern opacity-5" />
            <h4 className="font-body text-[10px] font-bold text-secondary uppercase mb-2 relative z-10">Mẹo nghiên cứu</h4>
            <p className="text-xs text-on-surface-variant italic relative z-10 leading-relaxed">
              "Hãy đặt câu hỏi về các sự kiện cụ thể để AI trích dẫn chính xác các đoạn trong Đại Việt Sử Ký Toàn Thư."
            </p>
          </div>
        </aside>

        {/* CHAT CHÍNH */}
        <section className="col-span-12 lg:col-span-6 flex flex-col bg-white border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden">

          {/* Header */}
          <div className="p-4 bg-surface-low border-b border-outline-variant/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-md p-1.5">
                <DongSonDrumIcon className="w-full h-full text-white" />
              </div>
              <div>
                <p className="font-headline font-bold text-primary italic leading-none">Sử Quan AI</p>
                {loading ? (
                  <span className="text-[10px] font-body text-amber-600 font-bold uppercase flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Đang soạn
                    {tokensPerSecond > 0 && (
                      <span className="ml-1 text-amber-500/80 font-normal normal-case tracking-normal">
                        · {tokensPerSecond} t/s
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-[10px] font-body text-green-600 font-bold uppercase flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Thư viện trực tuyến
                  </span>
                )}
              </div>
            </div>
            {loading && (
              <button
                onClick={clearMessages}
                className="text-[10px] font-body text-on-surface-variant hover:text-primary flex items-center gap-1 px-2 py-1 rounded border border-outline-variant/30 hover:border-primary/40 transition-all"
              >
                <span className="material-symbols-outlined text-xs">stop_circle</span> Dừng
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#FDFBF0]/50">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start gap-4'}`}
              >
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-secondary shrink-0 flex items-center justify-center text-white p-1.5">
                    <DongSonDrumIcon className="w-full h-full text-white" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-3 ${msg.role === 'user' ? 'bg-primary text-white p-4 rounded-2xl rounded-tr-none shadow-md' : ''}`}>

                  {/* Bubble */}
                  <div className={msg.role === 'ai' ? 'bg-white p-6 rounded-2xl rounded-tl-none border border-outline-variant/20 shadow-sm text-on-surface' : 'text-sm'}>
                    {msg.role === 'ai' ? (
                      <>
                        <ThinkingBlock
                          thinking={msg.thinking}
                          isStreaming={streamingMsgId === msg.id && !msg.content}
                        />
                        <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
                          {normalizeMarkdown(msg.content)}
                        </ReactMarkdown>
                        {streamingMsgId === msg.id && <Cursor />}
                      </>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* Web badge + rating */}
                  {msg.usedWeb && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <span className="material-symbols-outlined text-amber-600 text-sm">public</span>
                        <span className="text-[10px] text-amber-800 font-body">
                          Nguồn: Wikipedia tiếng Việt (chưa kiểm chứng nội bộ)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] text-on-surface-variant font-body">
                          Đánh giá:
                        </span>
                        {['GOOD', 'BAD', 'INSUFFICIENT'].map((r) => {
                          const labels = { GOOD: '👍 Đúng', BAD: '👎 Sai', INSUFFICIENT: '⚠️ Chưa đủ' };
                          const colors = {
                            GOOD: 'border-green-300 text-green-700 hover:bg-green-50',
                            BAD: 'border-red-300 text-red-700 hover:bg-red-50',
                            INSUFFICIENT: 'border-gray-300 text-gray-600 hover:bg-gray-50',
                          };
                          const prev = idx > 0 ? messages[idx - 1] : null;
                          const question = prev?.role === 'user' ? prev.content : '';
                          const srcUrl = msg.sources?.[0]?.url || '';
                          return (
                            <button
                              key={r}
                              onClick={() => sendFeedback(question, msg.content, true, srcUrl, r)}
                              className={`text-[10px] font-body px-2 py-1 rounded border ${colors[r]} transition-all`}
                            >
                              {labels[r]}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Rephrase */}
                  {msg.needsRephrase && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-[10px] text-blue-800 font-body">
                        Chưa tìm thấy kết quả phù hợp. Bạn có muốn diễn đạt lại câu hỏi?
                      </p>
                      <button
                        onClick={() => inputRef.current?.focus()}
                        className="mt-2 text-[10px] font-body px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 transition-all"
                      >
                        Gửi lại / Diễn đạt khác
                      </button>
                    </div>
                  )}

                  {/* Gợi ý câu hỏi */}
                  {msg.role === 'ai' && msg.suggestions?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {msg.suggestions.map((s, sIdx) => (
                        <button
                          key={sIdx}
                          onClick={() => sendMessage(s)}
                          className="text-[10px] font-body px-3 py-1 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Citations */}
                  {msg.sources?.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-body text-[9px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">link</span> Trích dẫn nguồn
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.sources.map((src, sIdx) => {
                          const card = (
                            <div className="p-3 bg-surface-low border border-outline-variant/30 rounded-lg flex items-center justify-between hover:border-primary/50 transition-all cursor-pointer group w-full text-left">
                              <div>
                                <p className="text-[11px] font-bold text-primary font-headline italic">{src.title}</p>
                                <p className="text-[9px] text-on-surface-variant font-body">{src.detail}</p>
                              </div>
                              {src.url && <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity text-primary">open_in_new</span>}
                            </div>
                          );
                          if (!src.url) return <div key={sIdx}>{card}</div>;
                          if (src.url.startsWith('http')) return <a key={sIdx} href={src.url} target="_blank" rel="noopener noreferrer" className="block no-underline">{card}</a>;
                          return <Link key={sIdx} to={src.url} className="block no-underline">{card}</Link>;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator — chỉ hiện khi chưa có token nào */}
            {loading && !streamingMsgId && (
              <div className="flex justify-start items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-secondary shrink-0 flex items-center justify-center text-white p-1.5">
                  <DongSonDrumIcon className="w-full h-full text-white" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-outline-variant/20 shadow-sm flex items-center gap-1.5 h-[42px] px-5">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}

            {messages.length === 1 && starterQuestions.length > 0 && (
              <div className="flex flex-wrap gap-2 px-6">
                {starterQuestions.map((q, qi) => (
                  <button
                    key={qi}
                    onClick={() => sendMessage(q)}
                    className="text-[11px] font-body px-3.5 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {error && (
              <div className="mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-body">
                {error}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-6 bg-white border-t border-outline-variant/30">
            <div className="relative bg-surface-low rounded-full flex items-center px-6 py-1 shadow-inner border border-outline-variant/30">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setFormInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-transparent border-none focus:ring-0 text-on-surface flex-1 font-body text-sm italic placeholder:opacity-50 py-3"
                placeholder="Hỏi về nhân vật, sự kiện hoặc điển tích..."
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            <div className="mt-3 flex justify-center gap-6 font-body text-[9px] font-bold text-on-surface-variant opacity-60 uppercase tracking-tighter">
              <span># Nhà Hậu Lê</span>
              <span># Trận Bạch Đằng</span>
              <span># Chiếu Dời Đô</span>
            </div>
          </div>
        </section>

        {/* CỘT PHẢI */}
        <aside className="hidden lg:col-span-3 lg:flex flex-col gap-6">
          <div className="p-6 bg-white border border-outline-variant/20 rounded-xl relative overflow-hidden shadow-sm">
            <h3 className="font-body text-[10px] font-bold text-secondary uppercase tracking-widest mb-6">Thực thể liên quan</h3>
            <div className="space-y-6">
              <EntityItem
                name="Lý Thường Kiệt" type="Nhân vật"
                desc="Thái úy triều Lý, danh tướng lừng lẫy phòng tuyến sông Như Nguyệt."
                img="https://lh3.googleusercontent.com/aida-public/AB6AXuBXLbkFqj-insp0Ywy8bF_fVUuZ67qvyvjRAfWo7w1iKuhghv8n0rYBxfEdRAY4aib4mh7rde3JgELR5JXKp3cGMaRjeCxeUb6g3ojhnFsZ5WnZul23ymRLAXAr4sh3CqkKXZz3SmImreYEbG-r4wAxbSHkx6lO9jqQ9K52SYWCjWO9bmXaal066YFxd0DrXQNWzQ5PZiSvR_uYc2Rms-ZCahCqqVGdjXGVfyVSF6a8qypNfChSdB3nPsN1yPj6fRpIJbohlTl2CPyA"
              />
              <button className="w-full py-2 border-2 border-dashed border-primary/20 text-primary rounded-lg font-body text-[9px] font-bold uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">hub</span> Mở bản đồ tri thức
              </button>
            </div>
          </div>
          <div className="flex-1 p-6 border border-outline-variant/20 rounded-xl bg-surface-variant/10">
            <h4 className="font-body text-[9px] font-bold uppercase text-on-surface-variant mb-4">Lịch sử hội thoại</h4>
            <div className="space-y-4 font-body text-xs italic text-on-surface-variant">
              <p className="hover:text-primary cursor-pointer transition-colors leading-relaxed">"Nguyên nhân vua Lý dời đô..."</p>
              <p className="hover:text-primary cursor-pointer transition-colors leading-relaxed">"Tổ chức quân đội thời Trần..."</p>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
};

const EntityItem = ({ name, type, desc, img }) => (
  <div className="group cursor-pointer space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg overflow-hidden border border-outline-variant group-hover:border-primary transition-all">
        <img src={img} className="w-full h-full object-cover grayscale group-hover:grayscale-0" alt={name} />
      </div>
      <div>
        <h4 className="font-headline font-bold text-on-surface group-hover:text-primary transition-all leading-none">{name}</h4>
        <span className="text-[9px] font-body font-bold text-accent uppercase">{type}</span>
      </div>
    </div>
    <p className="text-[11px] text-on-surface-variant italic leading-relaxed line-clamp-2">{desc}</p>
  </div>
);

export default AIChat;
