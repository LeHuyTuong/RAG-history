import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Swords, BookOpen, Compass, Sparkles, Feather, ArrowRight, X } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function HistoricalMap() {
  const [filterType, setFilterType] = useState('all');
  const [selectedSite, setSelectedSite] = useState(mapSites[2]); // Mặc định chọn Bạch Đằng
  const [hoveredSite, setHoveredSite] = useState(null);
  const navigate = useNavigate();

  const filteredSites = mapSites.filter(
    (site) => filterType === 'all' || site.type === filterType
  );

  return (
    <div className="bg-[#fcf9ee] min-h-screen font-body pb-20 relative overflow-hidden">
      {/* Họa tiết Trống Đồng chìm toàn trang */}
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0 opacity-5"></div>
      
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-12 relative z-10">
        
        {/* --- HEADER --- */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Compass className="w-8 h-8 text-primary animate-spin-slow" />
            <span className="font-body text-xs tracking-[0.4em] uppercase font-bold text-primary">Địa Đồ Di Sản</span>
          </div>
          <h2 className="font-headline text-5xl md:text-6xl text-primary font-bold italic tracking-tight mb-8">Cương Vực Quốc Đồ</h2>
          
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-4 font-body text-[10px] font-bold">
            {[
              { id: 'all', label: 'Vạn Lý Sơn Hà', icon: <Compass size={14}/> },
              { id: 'battleground', label: 'Chiến Trường', icon: <Swords size={14}/> },
              { id: 'relic', label: 'Kỳ Tích Di Tích', icon: <BookOpen size={14}/> }
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setFilterType(btn.id)}
                className={`px-6 py-2 border flex items-center gap-2 transition-all duration-300 uppercase tracking-widest rounded-sm ${
                  filterType === btn.id ? 'bg-primary text-white border-primary shadow-xl' : 'bg-white text-on-surface-variant border-outline-variant/60 hover:bg-primary/5'
                }`}
              >
                {btn.icon} {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* --- MAIN LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          
          {/* CỘT TRÁI: BẢN ĐỒ TƯƠNG TÁC (7 COLS) */}
          <div className="lg:col-span-7 relative bg-white border-2 border-primary/20 rounded-sm p-8 shadow-2xl overflow-hidden flex flex-col justify-center min-h-[700px]">
            {/* SVG Bản đồ Việt Nam cách điệu */}
            <div className="relative w-full h-full flex items-center justify-center">
               <svg viewBox="0 0 500 650" className="w-full max-w-[450px] drop-shadow-[0_20px_50px_rgba(107,21,21,0.15)]">
                  {/* Đường S-Curve */}
                  <path
                    d="M 230 40 Q 280 40 310 50 T 310 100 T 260 140 T 320 200 T 380 280 T 340 360 T 325 430 T 250 490 T 200 520 T 170 550 T 220 570 T 200 620"
                    fill="none" stroke="#6B1515" strokeWidth="15" strokeLinecap="round" className="opacity-10"
                  />
                  <path
                    d="M 230 40 Q 280 40 310 50 T 310 100 T 260 140 T 320 200 T 380 280 T 340 360 T 325 430 T 250 490 T 200 520 T 170 550 T 220 570 T 200 620"
                    fill="none" stroke="#6B1515" strokeWidth="2" strokeDasharray="8,8" className="animate-pulse"
                  />
                  <text x="340" y="470" fill="#6B1515" fontSize="10" fontWeight="bold" className="font-body opacity-30 tracking-[0.3em]">BIỂN ĐÔNG VẠN DẶM</text>
                  <text x="50" y="600" fill="#6B1515" fontSize="8" className="font-body opacity-20 italic">Vịnh Thái Lan</text>
               </svg>

               {/* Hiển thị các điểm kỳ tiêu (Markers) */}
               {filteredSites.map((site) => {
                 const isSelected = selectedSite?.id === site.id;
                 return (
                   <div
                     key={site.id}
                     className="absolute cursor-pointer transition-all duration-500"
                     style={{ left: `${(site.x / 500) * 100}%`, top: `${(site.y / 650) * 100}%` }}
                     onClick={() => setSelectedSite(site)}
                     onMouseEnter={() => setHoveredSite(site)}
                     onMouseLeave={() => setHoveredSite(null)}
                   >
                     <div className="relative flex items-center justify-center">
                       {/* Hiệu ứng sóng lan tỏa */}
                       <div className={`absolute rounded-full transition-all duration-1000 ${isSelected ? 'w-12 h-12 bg-primary/20 animate-ping' : 'w-0 h-0'}`} />
                       
                       {/* Icon Marker */}
                       <div className={`relative p-2 rounded-full border-2 transition-all duration-300 ${
                         isSelected 
                          ? 'bg-primary border-accent text-white scale-125 shadow-2xl z-20' 
                          : 'bg-white border-primary/30 text-primary hover:border-primary z-10'
                       }`}>
                          {site.type === 'battleground' ? <Swords size={16} /> : <MapPin size={16} />}
                       </div>

                       {/* Tooltip nhanh khi hover */}
                       <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#1c1c15] text-white text-[10px] font-bold rounded whitespace-nowrap transition-all duration-300 pointer-events-none ${hoveredSite?.id === site.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                          {site.title.toUpperCase()}
                       </div>
                     </div>
                   </div>
                 );
               })}
            </div>

            <div className="mt-8 flex justify-between items-center text-[9px] font-body font-bold text-primary/40 uppercase tracking-widest">
               <span>* Chạm vào điểm mốc để diện kiến sử xanh</span>
               <span>Hằng Đồ Nước Việt</span>
            </div>
          </div>

          {/* CỘT PHẢI: CHI TIẾT (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col">
            <AnimatePresence mode="wait">
              {selectedSite ? (
                <motion.div
                  key={selectedSite.id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="bg-white border-2 border-primary/10 p-10 shadow-2xl rounded-sm flex flex-col h-full"
                >
                  {/* Site Header */}
                  <div className="flex justify-between items-start mb-8 border-b border-primary/10 pb-6">
                    <div className="space-y-1">
                       <div className="flex items-center gap-2 bg-primary/5 w-fit px-2 py-0.5 rounded border border-primary/10">
                          {selectedSite.type === 'battleground' ? <Swords size={12} className="text-primary"/> : <MapPin size={12} className="text-accent"/>}
                          <span className="font-body text-[9px] font-bold text-primary uppercase tracking-widest">
                            {selectedSite.type === 'battleground' ? 'Chiến Trường' : 'Di Tích'}
                          </span>
                       </div>
                       <h3 className="font-headline text-4xl text-primary font-bold italic leading-tight">{selectedSite.title}</h3>
                    </div>
                    <div className="font-body text-[10px] font-bold text-accent italic bg-[#fcf9ee] px-3 py-1 border border-outline-variant shadow-sm">
                       {selectedSite.location}
                    </div>
                  </div>

                  {/* Fact Box */}
                  <div className="bg-[#f7f4e9] p-5 rounded border border-secondary/10 mb-8 italic">
                     <p className="font-headline text-xl text-primary mb-2 opacity-80">"Tóm lược sớ sử"</p>
                     <p className="text-on-surface-variant leading-relaxed">"{selectedSite.summary}"</p>
                  </div>

                  {/* Chi tiết nội dung (Scrollable) */}
                  <div className="font-body text-base leading-[1.8] text-on-surface mb-10 overflow-y-auto max-h-48 pr-4 custom-scrollbar text-justify italic">
                     {selectedSite.historyDetails}
                  </div>

                  {/* Các nhân vật liên quan */}
                  {selectedSite.famousCharacters && (
                    <div className="mb-10">
                       <p className="font-body text-[9px] font-bold text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Feather size={12} /> Anh hùng liên quan
                       </p>
                       <div className="flex flex-wrap gap-2">
                          {selectedSite.famousCharacters.map(char => (
                            <span key={char} className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-sm shadow-md">{char}</span>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* Nút thao tác cuối trang */}
                  <div className="mt-auto space-y-4">
                    <button 
                      onClick={() => navigate(`/locations/${selectedSite.id}`)}
                      className="w-full py-4 bg-[#6B1515] text-white font-headline font-bold text-sm italic tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      XEM TOÀN SỚ SỬ LIỆU <ArrowRight size={18} />
                    </button>
                    
                    <button 
                      onClick={() => navigate('/ai-chat')}
                      className="w-full py-3 border-2 border-primary text-primary font-body text-[10px] font-bold uppercase tracking-widest hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} className="text-accent animate-pulse" /> HỎI SỬ QUAN AI VỀ ĐỊA DANH NÀY
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-30">
                   <Compass size={100} className="animate-spin-slow mb-6 text-primary" />
                   <p className="font-headline text-2xl italic">Chọn một điểm cắm kỳ tiêu trên Quốc Đồ</p>
                </div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}