import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CharacterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', title: '', role: 'Danh tướng', birth: '', death: '', dynasty: 'Nhà Trần', bio: '',
  image: null,
  imagePreview: null
  });

  useEffect(() => {
    if (isEdit) {
      // Giả lập load dữ liệu cũ
      setForm({
        name: 'Trần Hưng Đạo',
        title: 'Hưng Đạo Đại Vương',
        role: 'Danh tướng',
        birth: '1228',
        death: '1300',
        dynasty: 'Nhà Trần',
        bio: 'Trần Quốc Tuấn là một nhà chính trị, quân sự lỗi lạc, người chỉ huy quân đội Đại Việt đánh bại quân Nguyên Mông...',
        image: null,
imagePreview:
  'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Tran_Hung_Dao.jpg/800px-Tran_Hung_Dao.jpg'
      });
    }
  }, [id, isEdit]);
const handleImageChange = (e) => {
  const file = e.target.files[0];

  if (file) {
    setForm({
      ...form,
      image: file,
      imagePreview: URL.createObjectURL(file)
    });
  }
};
  return (
    <div className="flex-grow bg-surface min-h-screen">

      <main className="p-8 max-w-7xl mx-auto space-y-8 font-body">
<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-outline-variant/30 pb-6">
  <div>
    <h2 className="font-headline text-3xl text-primary font-bold tracking-tight">
      Hồ sơ Nhân vật Lịch sử
    </h2>

    <p className="text-on-surface-variant text-sm italic mt-1">
      Kiến tạo bản ghi điện tử cho nhân vật trong hệ thống Sử Việt.
    </p>
  </div>

  <div className="flex gap-3 font-body text-[10px] font-bold tracking-widest">
    <button
      onClick={() => navigate('/admin/characters')}
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
          {/* CỘT TRÁI: FORM CHÍNH */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            
            {/* Thông tin cơ bản */}
            <section className="bg-surface-low p-8 border border-outline-variant shadow-sm space-y-6">
              <div className="flex items-center gap-2 text-primary border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined">person_edit</span>
                <h3 className="font-headline text-xl font-bold italic">Thông tin căn bản</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
                  <label className="font-body text-[10px] font-bold text-on-surface-variant uppercase">Tên nhân vật *</label>
                  <input type="text" value={form.name} className="bg-transparent border-b-2 border-outline-variant focus:border-primary py-2 outline-none font-headline text-lg" placeholder="Vd: Trần Hưng Đạo" />
                </div>
                <div className="col-span-2 md:col-span-1 flex flex-col gap-1">
                  <label className="font-body text-[10px] font-bold text-on-surface-variant uppercase">Biệt hiệu / Tên tự</label>
                  <input type="text" value={form.title} className="bg-transparent border-b-2 border-outline-variant focus:border-primary py-2 outline-none font-body text-base" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-body text-[10px] font-bold text-on-surface-variant uppercase">Vai trò chính</label>
                  <select className="bg-transparent border-b-2 border-outline-variant py-2 outline-none cursor-pointer">
                    <option>Danh tướng</option>
                    <option>Quân chủ</option>
                    <option>Văn thần</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="font-body text-[10px] font-bold text-on-surface-variant uppercase">Năm sinh</label>
                     <input type="text" value={form.birth} className="w-full bg-transparent border-b-2 border-outline-variant focus:border-primary py-2 outline-none font-body text-xs" />
                   </div>
                   <div>
                     <label className="font-body text-[10px] font-bold text-on-surface-variant uppercase">Năm mất</label>
                     <input type="text" value={form.death} className="w-full bg-transparent border-b-2 border-outline-variant focus:border-primary py-2 outline-none font-body text-xs" />
                   </div>
                </div>
              </div>
            </section>

            {/* Tiểu sử */}
            <section className="bg-white p-8 border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-primary border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined">description</span>
                <h3 className="font-headline text-xl font-bold italic">Tiểu sử tóm lược</h3>
              </div>
              <textarea 
                rows="6" value={form.bio}
                className="w-full bg-surface-low/30 border border-outline-variant p-4 font-body text-base leading-relaxed outline-none focus:ring-1 focus:ring-primary/20 rounded"
                placeholder="Nhập tóm tắt cuộc đời và sự nghiệp..."
              />
            </section>

            {/* Gia phả */}
            <section className="bg-surface-low p-8 border border-outline-variant shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-primary border-b border-outline-variant/30 pb-3">
                <span className="material-symbols-outlined">family_history</span>
                <h3 className="font-headline text-xl font-bold italic">Gia phả & Quan hệ</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                 {['Cha/Mẹ', 'Anh/Chị/Em', 'Con cái'].map(label => (
                   <div key={label} className="p-4 border border-outline-variant bg-white flex flex-col items-center gap-2 group cursor-pointer hover:border-primary transition-all">
                      <span className="font-body text-[9px] uppercase font-bold opacity-60">{label}</span>
                      <span className="material-symbols-outlined text-outline-variant group-hover:text-primary">add_circle</span>
                   </div>
                 ))}
              </div>
            </section>
          </div>

          {/* CỘT PHẢI: WIDGETS */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
             {/* Ảnh đại diện */}
             {/* ẢNH ĐẠI DIỆN */}
<div className="bg-white p-6 border border-outline-variant shadow-sm space-y-4">
  <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-primary border-b border-outline-variant pb-2">
    Ảnh chân dung / Tượng
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
    className="
      relative
      aspect-[3/4]
      bg-surface-low
      border-2
      border-dashed
      border-outline-variant
      flex
      flex-col
      items-center
      justify-center
      text-on-surface-variant
      hover:text-primary
      hover:border-primary
      cursor-pointer
      transition-all
      group
      overflow-hidden
    "
  >
    {form.imagePreview ? (
      <>
        <img
          src={form.imagePreview}
          alt="Character Preview"
          className="w-full h-full object-cover"
        />

        <div
          className="
            absolute inset-0
            bg-black/40
            opacity-0
            group-hover:opacity-100
            transition-opacity
            flex
            items-center
            justify-center
            gap-3
          "
        >
          <span className="text-white text-[10px] font-bold uppercase tracking-widest">
            Thay đổi ảnh
          </span>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();

              setForm({
                ...form,
                image: null,
                imagePreview: null
              });

              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
            className="
              p-2
              bg-red-600
              text-white
              rounded-full
              hover:scale-110
              transition-transform
            "
          >
            <span className="material-symbols-outlined text-sm">
              delete
            </span>
          </button>
        </div>
      </>
    ) : (
      <>
        <span className="material-symbols-outlined text-5xl mb-2 group-hover:scale-110 transition-transform">
          add_photo_alternate
        </span>

        <p className="text-[10px] font-bold uppercase text-center px-6">
          Tải lên chân dung mô phỏng
        </p>
      </>
    )}
  </div>
</div>

             {/* Phân loại */}
             <div className="bg-white border border-outline-variant p-6 shadow-sm space-y-4">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-primary border-b border-outline-variant pb-2">Triều đại & Thời kỳ</h4>
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold opacity-60">Triều đại chủ chốt</label>
                      <select className="w-full bg-surface-low border border-outline-variant p-2 text-sm outline-none">
                        <option>Nhà Trần</option>
                        <option>Nhà Lý</option>
                        <option>Nhà Lê</option>
                      </select>
                   </div>
                </div>
             </div>

             {/* Tác phẩm */}
             <div className="bg-primary/90 text-white p-6 shadow-xl space-y-4">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-2 italic">Tác phẩm & Thành tựu</h4>
                <div className="space-y-2 text-xs">
                   <p className="border-l border-white/40 pl-3 italic opacity-80">"Hịch Tướng Sĩ"</p>
                   <p className="border-l border-white/40 pl-3 italic opacity-80">"Binh Thư Yếu Lược"</p>
                   <button className="text-[10px] font-bold underline mt-2">+ Thêm thành tựu</button>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CharacterForm;