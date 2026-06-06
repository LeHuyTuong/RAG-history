import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MetadataTagForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tagName, setTagName] = useState(id ? 'Nhà Trần' : '');
  const [category, setCategory] = useState('dynasty');

  const categories = [
    { id: 'dynasty', label: 'Triều đại', icon: 'castle', color: 'bg-primary' },
    { id: 'topic', label: 'Chủ đề', icon: 'auto_stories', color: 'bg-secondary' },
    { id: 'event', label: 'Sự kiện', icon: 'event_note', color: 'bg-red-600' },
    { id: 'person', label: 'Nhân vật', icon: 'person', color: 'bg-accent' },
  ];

return (
  <div className="flex-grow bg-surface min-h-screen font-body">

    <main className="p-8 max-w-6xl mx-auto grid grid-cols-12 gap-8">

      {/* TITLE + ACTIONS (MỚI) */}
      <div className="col-span-12 flex justify-between items-start border-b border-outline-variant pb-6 mb-6">
        
        <div className="space-y-1">
          <h2 className="font-headline text-3xl text-primary font-bold">
            {id ? 'Chỉnh sửa Thẻ Metadata' : 'Tạo Thẻ'}
          </h2>
          <p className="text-on-surface-variant text-sm italic">
            Quản lý hệ thống tag phân loại dữ liệu lịch sử.
          </p>
        </div>

        {/* ACTION BUTTONS (ĐƯA XUỐNG BODY) */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/admin/metadata')}
            className="px-5 py-2 border border-primary text-primary font-body text-[10px] font-bold hover:bg-primary/5 transition-all uppercase"
          >
            HỦY BỎ
          </button>

          <button
            onClick={() => {
              alert('Đã lưu!');
              navigate('/admin/metadata');
            }}
            className="px-6 py-2 bg-primary text-white font-body text-[10px] font-bold shadow-lg hover:bg-primary-container flex items-center gap-2 transition-all uppercase"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            LƯU THẺ
          </button>
        </div>

      </div>

      {/* LEFT */}
      <div className="col-span-12 lg:col-span-8 space-y-8">

        <section className="bg-white p-8 border border-outline-variant rounded-xl shadow-sm space-y-6">
          <h3 className="font-headline text-xl text-primary font-bold italic border-b border-outline-variant pb-3">
            Định danh Thẻ
          </h3>

          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="font-body text-[10px] font-bold uppercase opacity-60">
                Tên thẻ hệ thống *
              </label>
              <input
                type="text"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                className="w-full bg-transparent border-b-2 border-outline-variant focus:border-primary py-2 font-headline text-2xl text-primary outline-none"
                placeholder="Vd: Lý Thái Tổ..."
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-body text-[10px] font-bold uppercase opacity-60">
                Mô tả ghi chú
              </label>
              <textarea
                rows="4"
                className="w-full bg-surface-low border border-outline-variant p-4 rounded text-sm italic"
                placeholder="Mô tả bối cảnh lịch sử của thẻ này..."
              />
            </div>
          </div>
        </section>

        <section className="bg-white p-8 border border-outline-variant rounded-xl shadow-sm">
          <h3 className="font-body text-[10px] font-bold uppercase opacity-60 mb-6">
            Phân loại loại hình
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map(cat => (
              <label key={cat.id} className="cursor-pointer group">
                <input
                  type="radio"
                  name="cat"
                  className="hidden"
                  checked={category === cat.id}
                  onChange={() => setCategory(cat.id)}
                />

                <div
                  className={`p-4 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                    category === cat.id
                      ? 'bg-primary text-white border-primary shadow-lg scale-105'
                      : 'bg-surface-low border-outline-variant opacity-60'
                  }`}
                >
                  <span className="material-symbols-outlined">
                    {cat.icon}
                  </span>
                  <span className="font-body text-[9px] font-bold uppercase">
                    {cat.label}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </section>

      </div>

      {/* RIGHT PREVIEW */}
      <aside className="col-span-12 lg:col-span-4">
        <div className="bg-white border-2 border-primary/20 p-8 rounded-xl shadow-2xl sticky top-24 text-center space-y-6">

          <p className="font-body text-[10px] font-bold uppercase tracking-widest opacity-40">
            Xem trước thẻ
          </p>

          <div className="flex flex-col items-center py-6">
            <div
              className={`px-4 py-1 text-white text-[10px] font-bold rounded-full mb-3 uppercase ${
                categories.find(c => c.id === category)?.color
              }`}
            >
              {categories.find(c => c.id === category)?.label}
            </div>

            <h4 className="font-headline text-2xl text-on-surface font-bold">
              {tagName || 'Tên Thẻ Mới'}
            </h4>

            <p className="text-xs text-on-surface-variant italic mt-1">
              /tag/{tagName.toLowerCase().replace(/ /g, '-') || 'slug'}
            </p>
          </div>

          <div className="p-4 bg-surface-low rounded border border-dashed border-outline-variant text-[11px] text-on-surface-variant leading-relaxed">
            Đây là cách thẻ xuất hiện trong bộ lọc tìm kiếm và các liên kết bài viết.
          </div>

        </div>
      </aside>

    </main>
  </div>
);
};
export default MetadataTagForm;