import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const HubEntityForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="flex-grow bg-surface min-h-screen font-body pb-20">
      <header className="h-16 sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-outline-variant px-8 flex justify-between items-center">
        <div className="flex items-center gap-2 font-body text-[10px] uppercase text-on-surface-variant">
          <span>Mạng lưới tri thức</span> <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary font-bold">Chỉnh sửa thực thể</span>
        </div>
        <div className="flex gap-3 font-body text-[10px] font-bold">
           <button onClick={() => navigate('/admin/hub')} className="px-5 py-2 border border-primary text-primary hover:bg-primary/5 transition-all">HỦY BỎ</button>
           <button className="px-6 py-2 bg-primary text-white shadow-lg flex items-center gap-2 transition-all">
             <span className="material-symbols-outlined text-sm">save</span> LƯU THAY ĐỔI
           </button>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto space-y-10">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: THÔNG TIN CHÍNH */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
             <section className="bg-white p-8 border border-outline-variant shadow-sm space-y-6">
                <h3 className="font-headline text-xl text-primary font-bold italic border-b border-outline-variant pb-3 mb-6">Thông tin chính</h3>
                <div className="grid grid-cols-2 gap-6">
                   <div className="col-span-2 md:col-span-1 space-y-1">
                      <label className="font-body text-[10px] font-bold uppercase opacity-60">Tên thực thể</label>
                      <input type="text" className="w-full bg-transparent border-b-2 border-outline-variant focus:border-primary py-2 font-headline text-2xl text-primary outline-none" defaultValue="Lê Thánh Tông" />
                   </div>
                   <div className="col-span-2 md:col-span-1 space-y-1">
                      <label className="font-body text-[10px] font-bold uppercase opacity-60">Loại thực thể</label>
                      <select className="w-full bg-transparent border-b-2 border-outline-variant py-2 outline-none">
                         <option>Nhân vật</option><option>Sự kiện</option><option>Địa danh</option>
                      </select>
                   </div>
                   <div className="col-span-2 space-y-1">
                      <label className="font-body text-[10px] font-bold uppercase opacity-60">Tóm lược (Summary)</label>
                      <textarea rows="3" className="w-full bg-surface-low border border-outline-variant p-4 rounded text-sm italic italic leading-relaxed" defaultValue="Vị hoàng đế thứ tư của nhà Hậu Lê, người đưa Đại Việt đạt đến đỉnh cao phát triển..." />
                   </div>
                </div>
             </section>

             <section className="bg-white p-8 border border-outline-variant shadow-sm space-y-6">
                <h3 className="font-headline text-xl text-primary font-bold italic border-b border-outline-variant pb-3 mb-6 flex items-center justify-between">
                   <span>Sử liệu trích dẫn</span>
                   <button className="font-body text-[10px] font-bold text-accent">+ THÊM NGUỒN</button>
                </h3>
                <div className="space-y-3">
                   {['Đại Việt Sử Ký Toàn Thư', 'Khâm Định Việt Sử Thông Giám'].map(src => (
                     <div key={src} className="p-4 bg-surface-low border-l-4 border-primary flex justify-between items-center group">
                        <span className="font-bold italic text-sm text-primary">{src}</span>
                        <button className="material-symbols-outlined text-sm text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">delete</button>
                     </div>
                   ))}
                </div>
             </section>
          </div>

          {/* CỘT PHẢI: LIÊN KẾT */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
             <div className="bg-white p-6 border border-outline-variant shadow-sm space-y-6">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-primary border-b pb-2">Liên kết thực thể</h4>
                <div className="space-y-3">
                   {['Cải cách Hồng Đức', 'Thăng Long', 'Tao đàn Nhị thập bát tú'].map(item => (
                     <div key={item} className="flex items-center gap-3 p-3 bg-surface-low rounded-lg border border-transparent hover:border-primary transition-all cursor-pointer group">
                        <span className="material-symbols-outlined text-sm text-primary">link</span>
                        <span className="text-xs font-bold flex-1">{item}</span>
                        <button className="material-symbols-outlined text-xs text-red-600 opacity-0 group-hover:opacity-100">remove_circle</button>
                     </div>
                   ))}
                </div>
                <button className="w-full py-2 border-2 border-dashed border-outline-variant text-on-surface-variant font-bold text-[10px] uppercase rounded hover:border-primary hover:text-primary transition-all">
                   + Thiết lập liên kết mới
                </button>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HubEntityForm;