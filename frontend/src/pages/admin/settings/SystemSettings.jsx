import React, { useState } from 'react';

// --- COMPONENT CON 1: THẺ THỐNG KÊ (STAT BOX) ---
const StatCard = ({ label, value, icon }) => (
  <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-sm flex items-center justify-between hover:-translate-y-1 transition-all">
    <div>
      <p className="font-body text-[9px] uppercase font-bold text-on-surface-variant tracking-widest">{label}</p>
      <h3 className="font-headline text-3xl font-bold text-primary leading-tight mt-1">{value}</h3>
    </div>
    <span className="material-symbols-outlined text-primary opacity-10 text-4xl">{icon}</span>
  </div>
);

// --- COMPONENT CON 2: MODAL THÊM THAM SỐ ---
const AddParamModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
       <div className="bg-primary-container p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10"><span className="material-symbols-outlined text-8xl">auto_stories</span></div>
          <h3 className="font-headline text-2xl font-bold italic relative z-10">Khởi tạo tham số mới</h3>
       </div>
       <div className="p-8 space-y-6 font-body">
          <div className="space-y-2">
            <label className="font-body text-[10px] font-bold uppercase opacity-60 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">key</span> Khóa tham số (Key)
            </label>
            <input type="text" className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary outline-none py-2 text-sm" placeholder="Vd: rag_max_results" />
          </div>
          <div className="space-y-2">
            <label className="font-body text-[10px] font-bold uppercase opacity-60 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">edit_note</span> Giá trị (Value)
            </label>
            <input type="text" className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary outline-none py-2 text-sm" placeholder="Nhập giá trị..." />
          </div>
          <div className="space-y-2">
            <label className="font-body text-[10px] font-bold uppercase opacity-60 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">description</span> Mô tả ghi chú
            </label>
            <textarea rows="3" className="w-full bg-surface-low border border-outline-variant rounded p-3 text-xs outline-none focus:ring-1 focus:ring-primary/30" placeholder="Giải thích ý nghĩa tham số..." />
          </div>
          <div className="flex gap-4 pt-4 font-body text-[11px] font-bold">
            <button onClick={onClose} className="flex-1 py-3 border border-outline rounded-lg hover:bg-surface-low uppercase tracking-widest transition-all">Hủy bỏ</button>
            <button onClick={() => {alert('Đã lưu!'); onClose()}} className="flex-1 py-3 bg-primary text-white rounded-lg shadow-md hover:bg-primary-container uppercase tracking-widest transition-all">Lưu tham số</button>
          </div>
       </div>
    </div>
  </div>
);

// --- COMPONENT CHÍNH ---
const SystemSettings = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Dữ liệu mẫu
  const parameters = [
    { key: 'site_name', value: 'Sử Việt', desc: 'Tên hiển thị chính của hệ thống' },
    { key: 'rag_threshold', value: '0.75', desc: 'Ngưỡng tương đồng vector cho AI' },
    { key: 'max_upload_size', value: '50MB', desc: 'Giới hạn dung lượng tài liệu số' },
    { key: 'embedding_model', value: 'text-embedding-3-small', desc: 'Mô hình ngôn ngữ tạo vector' },
  ];

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      {/* 1. TOP BAR */}


      <main className="p-8 max-w-[1200px] mx-auto w-full space-y-10 font-body">
        {/* 2. HEADER */}
        <div className="border-l-4 border-primary pl-6">
          <h2 className="font-headline text-3xl text-primary font-bold italic tracking-tight">Cài đặt Hệ thống</h2>
          <p className="text-on-surface-variant text-sm mt-1 max-w-2xl">Quản lý tham số vận hành lõi. Đảm bảo tính nhất quán của cơ sở dữ liệu và hiệu năng tìm kiếm sử liệu.</p>
        </div>

        {/* 3. STATS BENTO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Danh mục chính" value="18" icon="category" />
          <StatCard label="Thẻ hệ thống" value="1,482" icon="sell" />
          <StatCard label="Thời kỳ lịch sử" value="12" icon="timeline" />
        </div>

        {/* 4. PARAMETERS TABLE */}
        <section className="bg-white border border-outline-variant rounded-xl shadow-sm overflow-hidden relative group">
          <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-variant/10">
            <h3 className="font-headline text-xl text-primary font-bold italic">Bảng tham số</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="text-primary font-body text-[10px] font-bold uppercase tracking-widest border-b border-primary/20 hover:border-primary transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">add</span> Thêm tham số
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-body">
              <thead className="bg-surface-low font-body text-[10px] uppercase text-on-surface-variant border-b border-outline-variant">
                <tr>
                  <th className="p-4 w-1/4">Tham số (Key)</th>
                  <th className="p-4 w-1/4">Giá trị (Value)</th>
                  <th className="p-4">Mô tả</th>
                  <th className="p-4 text-right">#</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-sm">
                {parameters.map((p) => (
                  <tr key={p.key} className="hover:bg-surface-variant/10 transition-colors group">
                    <td className="p-4 font-bold text-primary font-body text-xs">{p.key}</td>
                    <td className="p-4 font-medium text-on-surface">{p.value}</td>
                    <td className="p-4 text-on-surface-variant italic text-[11px] leading-relaxed">{p.desc}</td>
                    <td className="p-4 text-right">
                      <button className="p-1 hover:text-primary text-on-surface-variant transition-all">
  <span className="material-symbols-outlined text-sm">edit</span>
</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* --- MODAL SYSTEM --- */}
      {isModalOpen && <AddParamModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default SystemSettings;