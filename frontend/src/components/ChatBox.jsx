import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const ChatBox = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      text: "Xin chào! Tôi là Trợ lý AI Sử Việt. Bạn muốn tìm hiểu về triều đại hay sự kiện lịch sử nào?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newUserMsg = { id: Date.now(), role: "user", text: inputValue };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: "Cảm ơn bạn đã đặt câu hỏi. Hiện tại tôi đang trong quá trình học hỏi thêm dữ liệu lịch sử. Chức năng tra cứu tự động sẽ sớm được hoàn thiện!",
        },
      ]);
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          style={{ bottom: "100px", right: "24px", width: "380px", height: "600px", backgroundColor: "#fbf6e8" }}
          className="fixed rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden border border-[#d99b4a]/60 z-[100]"
        >
          {/* Header */}
          <div 
            style={{ background: "linear-gradient(to right, #5a0c0a, #7a1210)" }}
            className="text-[#ffe7b0] px-5 py-4 flex justify-between items-center relative shrink-0 shadow-md z-20"
          >
            <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(to right, transparent, rgba(217,155,74,0.8), transparent)" }}></div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center border border-[#d99b4a]/40 shadow-inner" style={{ backgroundColor: "rgba(251,246,232,0.1)" }}>
                <span className="material-symbols-outlined text-[22px] text-[#f7d78a]">smart_toy</span>
              </div>
              <div>
                <h3 className="font-headline font-bold uppercase tracking-[0.1em] text-[15px] text-[#f7d78a] leading-none drop-shadow-sm">Trợ lý Sử Việt</h3>
                <span className="text-[10px] font-body flex items-center gap-1.5 mt-1.5 text-[#ffe7b0]/80 tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_5px_#4ade80]"></span>
                  Trực tuyến
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-[#ffe7b0]/80 hover:text-white hover:rotate-90 transition-all focus:outline-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col space-y-5 relative scroll-smooth custom-scrollbar z-10">
            <div className="grain-overlay pointer-events-none absolute inset-0 opacity-[0.04]" />
            
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative z-10 flex ${msg.role === "user" ? "justify-end" : "justify-start"} items-end gap-2.5`}
              >
                {msg.role === "ai" && (
                  <div 
                    style={{ background: "linear-gradient(to bottom, #7a1210, #5a0c0a)" }}
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white shadow-md mb-1 border border-[#d99b4a]/30"
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#f7d78a]">auto_awesome</span>
                  </div>
                )}
                <div
                  style={
                    msg.role === "user" 
                      ? { maxWidth: "80%", background: "linear-gradient(to bottom right, #7a1210, #6b0f0d)" }
                      : { maxWidth: "80%", backgroundColor: "#ffffff" }
                  }
                  className={`relative p-3.5 px-4 rounded-[20px] text-[13.5px] font-body leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "text-[#ffe7b0] rounded-br-sm border border-[#8b1512]/50"
                      : "border border-[#d9c7a7]/60 text-[#2b1a16] rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative z-10 flex justify-start items-end gap-2.5"
              >
                <div 
                  style={{ background: "linear-gradient(to bottom, #7a1210, #5a0c0a)" }}
                  className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white shadow-md mb-1 border border-[#d99b4a]/30"
                >
                  <span className="material-symbols-outlined text-[15px] text-[#f7d78a]">auto_awesome</span>
                </div>
                <div className="bg-white border border-[#d9c7a7]/60 p-3 rounded-[20px] rounded-bl-sm shadow-sm flex items-center gap-1.5 h-[42px] px-4">
                  <span className="w-1.5 h-1.5 bg-[#d99b4a] rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-[#d99b4a] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                  <span className="w-1.5 h-1.5 bg-[#d99b4a] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Input Area */}
          <div style={{ backgroundColor: "rgba(255,255,255,0.95)" }} className="p-4 border-t border-[#d9c7a7]/80 relative z-20 shrink-0">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi về lịch sử..."
                style={{ backgroundColor: "#fcf9ee", paddingRight: "48px", paddingLeft: "20px" }}
                className="flex-1 text-[#2b1a16] text-[13.5px] rounded-full py-3.5 border border-[#d9c7a7]/60 focus:outline-none focus:border-[#d99b4a] focus:ring-2 focus:ring-[#d99b4a]/30 transition-all font-body placeholder:text-[#2b1a16]/40 shadow-inner w-full"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                style={{
                  ...(inputValue.trim() ? { background: "linear-gradient(to right, #7a1210, #5a0c0a)" } : { backgroundColor: "#ccc" }),
                  position: "absolute",
                  right: "6px",
                  top: "50%",
                  transform: "translateY(-50%)"
                }}
                className="text-[#ffe7b0] rounded-full w-9 h-9 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all focus:outline-none border border-[#d99b4a]/30"
              >
                <span className="material-symbols-outlined text-[18px] ml-0.5">send</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatBox;
