import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MetadataCategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
const [imageFile, setImageFile] = useState(null);
const [imagePreview, setImagePreview] = useState(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    parentId: '',
    description: '',
    image: null
  });

  // Giả lập load dữ liệu cũ khi ở chế độ Chỉnh sửa
  useEffect(() => {
    if (isEdit) {
      setForm({
        name: 'Di sản Văn hóa',
        slug: 'di-san-van-hoa',
        parentId: '2',
        description: 'Bao gồm các di sản văn hóa vật thể và phi vật thể mang giá trị lịch sử cao quý...',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC8whZjR9fFlq7Qd9iiM9qz1KQuRlhLugVYn1mv9hci_KAoW-S-DUuOwMjdrPiTdx2x2kDkDQHOQsUJ6OP7SJxk_Y7AROC-7wsQUK7VBaJ7EeB45UeDB-2fM22oqeLOUU97trbZbtmJ83QWcc0xgGuk6czVD0OE22BXXpNd-HlYSyFl0FxwQS00bt_8y59Pyb5YFUnN_epZBHwhYRCpiBI5ESsaCZNCORkxx8m6iJzkZpDUNpJKOefCgSlthlHzLrbJFmW6jDHT_ls'
      });
       setImagePreview('https://lh3.googleusercontent.com/aida-public/AB6AXuC8whZjR9fFlq7Qd9iiM9qz1KQuRlhLugVYn1mv9hci_KAoW-S-DUuOwMjdrPiTdx2x2kDkDQHOQsUJ6OP7SJxk_Y7AROC-7wsQUK7VBaJ7EeB45UeDB-2fM22oqeLOUU97trbZbtmJ83QWcc0xgGuk6czVD0OE22BXXpNd-HlYSyFl0FxwQS00bt_8y59Pyb5YFUnN_epZBHwhYRCpiBI5ESsaCZNCORkxx8m6iJzkZpDUNpJKOefCgSlthlHzLrbJFmW6jDHT_ls');
    }
  }, [id, isEdit]);
const handleImageChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setImageFile(file);
  setImagePreview(URL.createObjectURL(file));

  // nếu muốn lưu vào form luôn
  setForm({ ...form, image: file });
};
  // Hàm chuyển đổi Tiếng Việt có dấu thành Slug không dấu
  const generateSlug = (text) => {
    return text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm({ ...form, name, slug: generateSlug(name) });
  };

  return (
    <div className="flex-grow bg-surface min-h-screen font-body pb-20">
      {/* 1. TOP ACTION BAR */}


      <main className="p-8 max-w-6xl mx-auto space-y-8">
<div className="flex justify-between items-start gap-4">
  
  {/* LEFT: TITLE */}
  <div className="flex flex-col gap-1">
    <h2 className="font-headline text-3xl text-primary font-bold tracking-tight">
      {isEdit ? 'Hiệu đính Phân cấp Danh mục' : 'Kiến tạo Danh mục mới'}
    </h2>
    <p className="text-on-surface-variant text-sm italic">
      "Tổ chức kiến thức lịch sử theo hệ thống phân cấp Imperial."
    </p>
  </div>

  {/* RIGHT: QUICK ACTIONS */}
  <div className="flex gap-3 items-center">
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
      {isEdit ? 'LƯU THAY ĐỔI' : 'TẠO DANH MỤC'}
    </button>
  </div>

</div>
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <section className="bg-white p-8 border border-outline-variant shadow-sm space-y-8 relative overflow-hidden">
               {/* Họa tiết hoa sen chìm */}
               <div className="absolute -top-12 -right-12 opacity-[0.03] text-primary pointer-events-none">
                  <span className="material-symbols-outlined text-[200px]">filter_vintage</span>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  {/* Tên danh mục */}
                  <div className="space-y-1">
                    <label className="block font-body text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Tên danh mục *</label>
                    <input 
                      type="text" value={form.name} onChange={handleNameChange}
                      className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary py-2 font-headline text-2xl text-primary outline-none transition-all"
                      placeholder="Ví dụ: Lịch sử Chính trị..."
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-1">
                    <label className="block font-body text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Đường dẫn (Slug)</label>
                    <div className="flex items-center bg-surface-low px-3 py-2 rounded border border-outline-variant/30 mt-1">
                       <span className="text-[10px] text-on-surface-variant opacity-50 font-body">/danh-muc/</span>
                       <input 
                         type="text" value={form.slug} readOnly
                         className="flex-1 bg-transparent border-none text-xs font-body outline-none text-on-surface-variant italic"
                       />
                       <span className="material-symbols-outlined text-sm opacity-30">lock</span>
                    </div>
                  </div>

                  {/* Danh mục cha */}
                  <div className="col-span-full space-y-1">
                    <label className="block font-body text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Danh mục cha</label>
                    <select 
                      value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})}
                      className="w-full bg-surface-low border border-outline-variant rounded-lg px-4 py-3 text-sm font-body outline-none focus:ring-1 focus:ring-primary/20 appearance-none cursor-pointer"
                    >
                      <option value="">Không có (Danh mục gốc)</option>
                      <option value="1">Lịch sử Chính trị</option>
                      <option value="2">Di sản Văn hóa</option>
                      <option value="3">Địa lý & Cương vực</option>
                    </select>
                  </div>

                  {/* Mô tả */}
                  <div className="col-span-full space-y-1">
                    <label className="block font-body text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Mô tả chi tiết</label>
                    <textarea 
                      rows="6" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                      className="w-full bg-surface-low border border-outline-variant rounded-lg p-4 text-sm leading-relaxed font-body outline-none focus:ring-1 focus:ring-primary/20 resize-none"
                      placeholder="Nhập phạm vi và tính chất của danh mục này..."
                    />
                  </div>
               </div>
            </section>
          </div>

          {/* CỘT PHẢI: MEDIA & WIDGETS */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
             {/* Ảnh đại diện */}
            <div className="bg-white border border-outline-variant p-6 shadow-sm">
  <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-primary border-b border-outline-variant pb-2 mb-4">
    Ảnh đại diện lưu trữ
  </h4>

  <label className="relative group aspect-video bg-surface-low border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:bg-surface-variant/20 transition-all overflow-hidden">

    {/* IMAGE PREVIEW */}
    {(imagePreview || form.image) ? (
      <img
        src={imagePreview || form.image}
        className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform"
        alt="category"
      />
    ) : (
      <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-30">
        image
      </span>
    )}

    {/* ICON OVERLAY */}
    <span className="material-symbols-outlined text-4xl relative z-10 text-white opacity-80">
      add_a_photo
    </span>

    {/* FILE INPUT (GIỐNG RECORD FORM) */}
    <input
      type="file"
      accept="image/*"
      className="hidden"
      onChange={handleImageChange}
    />
  </label>

  <p className="mt-3 text-[10px] text-on-surface-variant italic leading-tight text-center">
    Gợi ý: Sử dụng hoa văn cổ hoặc phong cảnh di tích.
  </p>
</div>

             {/* SEO Widget */}
             <div className="bg-primary/90 text-white p-6 rounded-lg shadow-xl space-y-4">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-2 italic">Tối ưu hóa Tìm kiếm (SEO)</h4>
                <div className="space-y-3">
                   <div className="flex flex-col gap-1">
                      <span className="text-[9px] opacity-60 font-bold uppercase">Từ khóa chính</span>
                      <div className="flex flex-wrap gap-1">
                         {['Văn hóa', 'Lịch sử'].map(t => (
                           <span key={t} className="bg-white/10 px-2 py-0.5 rounded text-[9px] font-body">#{t}</span>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MetadataCategoryForm;