import React, { useState } from 'react';

const AiManagement = () => {
  const [isSyncing, setIsSyncing] = useState(false);

  const stats = [
    { label: 'Vector Nodes', value: '142,840', icon: 'memory', color: 'text-primary' },
    { label: 'Tài liệu đã học', value: '856', icon: 'auto_stories', color: 'text-accent' },
    { label: 'Độ chính xác RAG', value: '94%', icon: 'verified', color: 'text-green-600' },
  ];

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => setIsSyncing(false), 3000);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500 font-body">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-outline-variant/30 pb-8 gap-4">
        <div>
          <h2 className="font-headline text-4xl text-primary font-bold tracking-tight">Quản trị Trí tuệ Nhân tạo</h2>
          <p className="text-on-surface-variant text-sm mt-2 italic">Cấu hình mô hình RAG (Retrieval-Augmented Generation) và nạp tri thức sử liệu.</p>
        </div>
        <button 
          onClick={handleSync}
          disabled={isSyncing}
          className={`bg-primary text-white px-8 py-3 rounded-lg font-headline font-bold uppercase text-xs tracking-widest shadow-xl transition-all flex items-center gap-2 ${isSyncing ? 'opacity-50' : 'hover:brightness-110'}`}
        >
          <span className={`material-symbols-outlined text-sm ${isSyncing ? 'animate-spin' : ''}`}>
            {isSyncing ? 'sync' : 'neurology'}
          </span> 
          {isSyncing ? 'ĐANG TỐI ƯU VECTOR...' : 'TÁI CẤU TRÚC NÃO BỘ'}
        </button>
      </div>

      {/* Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white border border-outline-variant p-6 rounded-xl shadow-sm flex items-center justify-between">
            <div>
              <p className="font-body text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">{s.label}</p>
              <h3 className={`font-headline text-3xl font-bold mt-1 ${s.color}`}>{s.value}</h3>
            </div>
            <span className="material-symbols-outlined text-4xl opacity-10">{s.icon}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Cấu hình Model */}
        <section className="col-span-12 lg:col-span-7 bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-outline-variant bg-surface-low/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">settings_input_component</span>
            <h3 className="font-headline text-xl text-primary font-bold">Tham số Mô hình</h3>
          </div>
          <div className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-body text-[10px] font-bold uppercase opacity-60">LLM Engine</label>
                <select className="w-full bg-surface-low border border-outline-variant p-3 rounded font-body text-sm outline-none focus:border-primary">
                  <option>GPT-4o (Historical Optimized)</option>
                  <option>Claude 3.5 Sonnet</option>
                  <option>Local Llama 3 (Private)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-body text-[10px] font-bold uppercase opacity-60">Temperature (Độ sáng tạo)</label>
                <input type="range" className="w-full accent-primary" />
              </div>
            </div>

            <div className="p-4 bg-[#fcf9ee] border-l-4 border-primary italic text-sm text-on-surface-variant leading-relaxed">
              "Lưu ý: Giảm độ sáng tạo (Temperature) xuống mức thấp giúp AI tránh hiện tượng 'ảo giác' và bám sát vào các bộ chính sử như Đại Việt Sử Ký Toàn Thư."
            </div>

            <div className="space-y-4">
              <label className="font-body text-[10px] font-bold uppercase opacity-60 block">System Prompt (Chỉ thị cốt lõi)</label>
              <textarea 
                rows="5" 
                className="w-full bg-surface-low border border-outline-variant p-4 rounded font-body text-sm italic"
                defaultValue={"Bạn là một Sử Quan đại thần triều đình, có nhiệm vụ giải đáp sử liệu dựa trên các văn bản được cung cấp. Hãy sử dụng ngôn ngữ trang trọng, chuẩn xác và luôn trích dẫn nguồn từ các bộ quốc sử."}
              />
            </div>
          </div>
        </section>

        {/* Nạp dữ liệu Vector */}
        <section className="col-span-12 lg:col-span-5 space-y-6">
          <div className="bg-primary text-white p-8 rounded-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 dong-son-pattern opacity-10 group-hover:scale-110 transition-transform duration-[20s]"></div>
            <h3 className="font-headline text-2xl font-bold italic mb-6 relative z-10">Nạp Tri thức Mới</h3>
            <div className="border-2 border-dashed border-white/30 rounded-lg p-10 flex flex-col items-center justify-center relative z-10 hover:bg-white/5 transition-all cursor-pointer">
              <span className="material-symbols-outlined text-5xl mb-4">cloud_upload</span>
              <p className="font-body text-[10px] font-bold uppercase tracking-widest text-center">Kéo thả PDF sử liệu hoặc văn bản cổ</p>
              <p className="text-[9px] opacity-60 mt-2 uppercase">Hỗ trợ tự động OCR chữ Hán - Nôm</p>
            </div>
          </div>

          <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-sm">
            <h4 className="font-body text-[10px] font-bold uppercase text-primary border-b border-outline-variant pb-2 mb-4 tracking-widest">Lịch sử nạp liệu</h4>
            <div className="space-y-4">
              {[
                { name: 'Kỷ_Nhà_Trần_Full.pdf', date: '2 giờ trước', status: 'Done' },
                { name: 'Văn_bia_Quốc_Tử_Giám.json', date: 'Hôm qua', status: 'Done' },
              ].map((file, i) => (
                <div key={i} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant text-sm">description</span>
                    <div className="text-[11px]">
                      <p className="font-bold text-on-surface group-hover:text-primary transition-colors">{file.name}</p>
                      <p className="opacity-50 font-body text-[9px] uppercase">{file.date}</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-green-600 text-sm">check_circle</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AiManagement;