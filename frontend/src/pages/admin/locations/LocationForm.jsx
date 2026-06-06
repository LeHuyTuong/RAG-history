import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const LocationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', type: 'Cố đô/Thành quách', lat: '', long: '', dynasties: ['Lý', 'Trần', 'Lê'], description: '',
  coverImage: null,
  imagePreview: null
  });

  useEffect(() => {
    if (isEdit) {
setForm({
  name: 'Hoàng thành Thăng Long',
  type: 'Cố đô/Thành quách',
  lat: '21.03',
  long: '105.83',
  dynasties: ['Lý', 'Trần', 'Lê', 'Nguyễn'],
  description: 'Khu Trung tâm Hoàng thành Thăng Long...',
  coverImage: null,
  imagePreview:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Imperial_Citadel_of_Thang_Long.jpg/1200px-Imperial_Citadel_of_Thang_Long.jpg'
});
    }
  }, [id, isEdit]);
const handleImageChange = (e) => {
  const file = e.target.files[0];

  if (file) {
    setForm({
      ...form,
      coverImage: file,
      imagePreview: URL.createObjectURL(file)
    });
  }
};

const removeImage = (e) => {
  e.stopPropagation();

  setForm({
    ...form,
    coverImage: null,
    imagePreview: null
  });

  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};

  return (
    <div className="flex-grow bg-surface min-h-screen">

      <main className="p-8 max-w-6xl mx-auto space-y-8 font-body">
<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-outline-variant/30 pb-6">
  <div>
    <h2 className="font-headline text-3xl text-primary font-bold tracking-tight">
      {isEdit ? 'Chỉnh sửa Địa danh' : 'Thêm Địa danh Mới'}
    </h2>

    <p className="text-on-surface-variant text-sm italic mt-1">
      Quản lý thông tin địa danh, di tích và vị trí lịch sử trong hệ thống Sử Việt.
    </p>
  </div>

  <div className="flex gap-3 font-body text-[10px] font-bold tracking-widest">
    <button
      onClick={() => navigate('/admin/locations')}
      className="px-5 py-2 border border-primary text-primary hover:bg-primary/5 transition-all"
    >
      HỦY BỎ
    </button>

    <button className="px-6 py-2 bg-primary text-white shadow-lg hover:bg-primary-container flex items-center gap-2 transition-all">
      <span className="material-symbols-outlined text-sm">save</span>
      {isEdit ? 'CẬP NHẬT' : 'XUẤT BẢN'}
    </button>
  </div>
</div>
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-8">
            {/* Thông tin tọa độ */}
            <section className="bg-surface-low border border-outline-variant p-8 shadow-sm space-y-6">
              <div className="col-span-2">
                <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Tên địa danh lịch sử *</label>
                <input type="text" value={form.name} className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 font-headline text-2xl text-primary outline-none transition-all" placeholder="Ví dụ: Hoàng Thành Thăng Long..." />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div>
                  <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Loại hình</label>
                  <select className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 outline-none cursor-pointer">
                    <option>Cố đô / Thành quách</option>
                    <option>Ải / Chiến trường</option>
                    <option>Di tích tôn giáo</option>
                  </select>
                </div>
                <div className="flex gap-4">
                   <div className="flex-1">
                     <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Vĩ độ (Lat)</label>
                     <input type="text" value={form.lat} className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 outline-none font-body text-xs" placeholder="21.03" />
                   </div>
                   <div className="flex-1">
                     <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Kinh độ (Long)</label>
                     <input type="text" value={form.long} className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 outline-none font-body text-xs" placeholder="105.83" />
                   </div>
                </div>
              </div>
            </section>

            {/* Triều đại & Mô tả */}
            <section className="bg-white border border-outline-variant p-8 shadow-sm space-y-6">
               <div className="space-y-4">
                  <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Triều đại liên quan</label>
                  <div className="flex flex-wrap gap-2">
                    {form.dynasties.map(d => (
                      <span key={d} className="px-3 py-1 bg-primary text-white rounded-full text-[10px] font-bold uppercase flex items-center gap-2">
                        {d} <span className="material-symbols-outlined text-xs cursor-pointer">close</span>
                      </span>
                    ))}
                    <button className="px-3 py-1 border border-dashed border-primary text-primary rounded-full text-[10px] font-bold uppercase hover:bg-primary/5">+ Thêm</button>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Diễn giải lịch sử</label>
                  <textarea rows="6" value={form.description} className="w-full bg-surface-low border-none p-4 rounded-lg outline-none focus:ring-1 focus:ring-primary/30 font-body text-sm leading-relaxed" />
               </div>
            </section>
          </div>

          {/* CỘT PHẢI: MEDIA & MAP */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
<div className="bg-white p-6 border border-outline-variant shadow-sm space-y-4">
  <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-primary border-b border-outline-variant pb-2">
    Ảnh đại diện địa danh
  </h4>

  <input
    type="file"
    accept="image/*"
    className="hidden"
    ref={fileInputRef}
    onChange={handleImageChange}
  />

  <div
    onClick={() => fileInputRef.current?.click()}
    className="relative aspect-video bg-surface-low border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary cursor-pointer transition-all group overflow-hidden"
  >
    {form.imagePreview ? (
      <>
        <img
          src={form.imagePreview}
          alt="Preview"
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
          <span className="text-white font-body text-[10px] font-bold uppercase tracking-widest">
            Thay đổi ảnh
          </span>

          <button
            onClick={removeImage}
            className="p-2 bg-red-600 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
          >
            <span className="material-symbols-outlined text-sm">
              delete
            </span>
          </button>
        </div>
      </>
    ) : (
      <>
        <span className="material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform">
          add_photo_alternate
        </span>

        <span className="font-body text-[9px] font-bold uppercase tracking-wider">
          Tải lên ảnh địa danh
        </span>
      </>
    )}
  </div>
</div>

             <div className="bg-white border border-outline-variant p-6 shadow-sm">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant pb-2 mb-4">Vị trí địa lý</h4>
                <div className="aspect-square bg-slate-200 rounded-lg overflow-hidden relative">
                   <img className="w-full h-full object-cover grayscale opacity-60" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBksZeeHANbqwkd4mlRNQsgMsvIun-ZG4WR3HQ56nHZ1DfXs4D_WHm4h1l27eyL2hHqBBZg2rA_fS2kRulKk6mSdQsvLQTl3KWfPQON_aNliOmvX8fUDq6AZxzRnmN7VlsOQuAl5shgcT1mHYNvD_xis6AtEbw-f8ZTFRhyNjXzY0uB57J5R2V4VUY5SLcS21uKHXyT-RZgy5j1ixaIScRSg7Vp2TzLxipto_UuuLAkdLdqVP7b94T-QP7rJVxRDQ7c7MwCQv-FW1Y" alt="mini-map" />
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary">
                      <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                   </div>
                </div>
                <div className="mt-3 flex justify-between items-center text-[10px] font-bold font-body">
                   <span>Ba Đình, Hà Nội</span>
                   <button className="text-primary underline">Mở bản đồ lớn</button>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LocationForm;