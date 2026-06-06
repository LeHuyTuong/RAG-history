import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: 'Kính chào quý học giả. Tôi là Trợ lý AI được huấn luyện từ kho tàng Đại Việt Sử Ký. Bạn muốn tìm hiểu sâu hơn về triều đại hay sự kiện nào?',
      sources: []
    },
    {
      role: 'user',
      content: 'Cho tôi biết về vai trò của Lý Thường Kiệt trong kháng chiến chống Tống và bài thơ Nam Quốc Sơn Hà.',
      sources: []
    },
    {
      role: 'ai',
      content: 'Lý Thường Kiệt (1019–1105) là vị đại tướng quân tài ba, người đã chủ động thực hiện chiến lược "Tiên phát chế nhân". Đặc biệt, tại phòng tuyến sông Như Nguyệt, ông đã sử dụng bài thơ "Nam quốc sơn hà" như một vũ khí tâm lý chiến sắc bén...',
      quote: 'Nam quốc sơn hà Nam đế cư / Tiệt nhiên định phận tại thiên thư...',
      sources: [
        { title: 'Đại Việt Sử Ký Toàn Thư', detail: 'Bản kỷ, Quyển III, Kỷ Nhà Lý' },
        { title: 'Việt Sử Lược', detail: 'Quyển II, Giai đoạn Thái Ninh' }
      ]
    }
  ]);
  
  const [input, setFormInput] = useState('');
  const chatEndRef = useRef(null);

  // Tự động cuộn xuống cuối chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="max-w-[1440px] mx-auto px-12 py-8 font-body">
      
      {/* 1. BODY HEADER */}
      <div className="mb-8 border-b border-outline-variant/30 pb-6">
        <h2 className="font-headline text-4xl text-primary font-bold italic tracking-tight">Trợ lý Học giả AI</h2>
        <p className="text-on-surface-variant text-sm mt-2">Giải mã sử liệu Đại Việt thông qua trí tuệ nhân tạo (RAG Technology).</p>
      </div>

      <div className="grid grid-cols-12 gap-8 h-[70vh]">
        
        {/* 2. CỘT TRÁI: CHỦ ĐỀ THẢO LUẬN */}
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
             <div className="absolute inset-0 dong-son-pattern opacity-5"></div>
             <h4 className="font-body text-[10px] font-bold text-secondary uppercase mb-2 relative z-10">Mẹo nghiên cứu</h4>
             <p className="text-xs text-on-surface-variant italic relative z-10 leading-relaxed">
               "Hãy đặt câu hỏi về các sự kiện cụ thể để AI trích dẫn chính xác các đoạn trong Đại Việt Sử Ký Toàn Thư."
             </p>
          </div>
        </aside>

        {/* 3. CỘT GIỮA: GIAO DIỆN CHAT CHÍNH */}
        <section className="col-span-12 lg:col-span-6 flex flex-col bg-white border border-outline-variant/20 rounded-2xl shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-surface-low border-b border-outline-variant/20 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined">auto_awesome</span>
              </div>
              <div>
                <p className="font-headline font-bold text-primary italic leading-none">Sử Quan AI</p>
                <span className="text-[10px] font-body text-green-600 font-bold uppercase flex items-center gap-1 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Thư viện trực tuyến
                </span>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-[#FDFBF0]/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start gap-4'}`}>
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-secondary shrink-0 flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-sm">menu_book</span>
                  </div>
                )}
                <div className={`max-w-[85%] space-y-3 ${msg.role === 'user' ? 'bg-primary text-white p-4 rounded-2xl rounded-tr-none shadow-md' : ''}`}>
                  <div className={`${msg.role === 'ai' ? 'bg-white p-6 rounded-2xl rounded-tl-none border border-outline-variant/20 shadow-sm leading-relaxed text-on-surface' : 'text-sm'}`}>
                    {msg.content}
                    {msg.quote && (
                      <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-surface-low italic font-headline text-lg text-primary/80">
                        {msg.quote}
                      </blockquote>
                    )}
                  </div>
                  
                  {/* Sources display for AI */}
                  {msg.sources.length > 0 && (
                    <div className="space-y-2">
                       <p className="font-body text-[9px] font-bold text-secondary uppercase tracking-widest flex items-center gap-1">
                         <span className="material-symbols-outlined text-xs">link</span> Trích dẫn nguồn
                       </p>
                       <div className="grid grid-cols-1 gap-2">
                         {msg.sources.map((src, sIdx) => (
                           <div key={sIdx} className="p-3 bg-surface-low border border-outline-variant/30 rounded-lg flex items-center justify-between hover:border-primary/50 transition-all cursor-pointer group">
                             <div>
                               <p className="text-[11px] font-bold text-primary font-headline italic">{src.title}</p>
                               <p className="text-[9px] text-on-surface-variant font-body">{src.detail}</p>
                             </div>
                             <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                           </div>
                         ))}
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="p-6 bg-white border-t border-outline-variant/30">
             <div className="relative bg-surface-low rounded-full flex items-center px-6 py-1 shadow-inner border border-outline-variant/30">
                <input 
                  type="text" 
                  className="bg-transparent border-none focus:ring-0 text-on-surface flex-1 font-body text-sm italic placeholder:opacity-50 py-3" 
                  placeholder="Hỏi về nhân vật, sự kiện hoặc điển tích..." 
                />
                <button className="bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
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

        {/* 4. CỘT PHẢI: THỰC THỂ LIÊN QUAN */}
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

// Component con hiển thị thực thể bên phải
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