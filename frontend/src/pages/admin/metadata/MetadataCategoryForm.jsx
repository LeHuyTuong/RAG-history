import {  useState, useEffect, useRef  } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MetadataCategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const fileInputRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    parentId: '',
    description: '',
    image: null
  });

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin_metadata.json');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();

    if (isEdit) {
      const fetchCategory = async () => {
        try {
          const response = await fetch('/api/admin_metadata_category_detail.json');
          if (!response.ok) throw new Error('Network error');
          const data = await response.json();
          setForm({
            name: data.name,
            slug: data.slug,
            parentId: data.parentId,
            description: data.description,
            image: data.image
          });
          setImagePreview(data.image);
        } catch (error) {
          console.error('Error fetching category:', error);
        }
      };
      fetchCategory();
    }
  }, [id, isEdit]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    setForm({ ...form, image: file });
  };

  const removeImage = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, image: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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

  const handleSave = () => {
    alert('Đã lưu!');
    navigate('/admin/metadata');
  };

  return (
    <div className="flex-grow bg-surface min-h-screen font-body pb-20 animate-in fade-in duration-500">
      <main className="p-8 max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-outline-variant/40 pb-6 gap-4">
          <div>
            <h2 className="font-headline text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              {isEdit ? 'Hiệu đính Danh mục' : 'Kiến tạo Danh mục mới'}
            </h2>
            <p className="font-body text-sm text-on-surface-variant mt-3 italic flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">account_tree</span>
              Tổ chức kiến thức lịch sử theo hệ thống phân cấp.
            </p>
          </div>
          <div className="flex gap-3 font-body text-xs font-bold tracking-widest">
            <button
              onClick={() => navigate('/admin/metadata')}
              className="px-6 py-2.5 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all uppercase"
            >
              HỦY BỎ
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 flex items-center gap-2 transition-all active:scale-95 uppercase"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {isEdit ? 'CẬP NHẬT' : 'KHỞI TẠO'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-8 relative overflow-hidden transition-all hover:shadow-md">
               {/* Họa tiết hoa sen chìm */}
               <div className="absolute -top-12 -right-12 opacity-[0.03] text-primary pointer-events-none">
                  <span className="material-symbols-outlined text-[200px]">filter_vintage</span>
               </div>

               <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2 relative z-10">
                 <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                 Thông tin Danh mục
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  {/* Tên danh mục */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Tên danh mục *</label>
                    <input 
                      type="text" value={form.name} onChange={handleNameChange}
                      className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 placeholder:font-light"
                      placeholder="Ví dụ: Lịch sử Chính trị..."
                    />
                  </div>

                  {/* Danh mục cha */}
                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Danh mục cha</label>
                    <div className="relative">
                      <select 
                        value={form.parentId} onChange={e => setForm({...form, parentId: e.target.value})}
                        className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 text-sm font-bold text-on-surface outline-none hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Không có (Danh mục gốc)</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
                    </div>
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Đường dẫn (Slug)</label>
                    <div className="flex items-center gap-2 text-on-surface-variant font-body text-[12px] bg-surface-low/50 p-3 rounded-xl border border-outline-variant/40 h-[46px]">
                       <span className="material-symbols-outlined text-[16px] text-primary">link</span>
                       <span className="opacity-70 tracking-normal">/danh-muc/</span>
                       <input 
                         type="text" value={form.slug} readOnly
                         className="flex-1 bg-transparent border-none text-primary font-bold outline-none cursor-not-allowed opacity-90 truncate"
                       />
                       <span className="material-symbols-outlined text-[14px] opacity-40 ml-auto">lock</span>
                    </div>
                  </div>

                  {/* Mô tả */}
                  <div className="col-span-full space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Mô tả chi tiết</label>
                    <textarea 
                      rows="6" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                      className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-4 text-sm leading-relaxed italic font-body outline-none hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      placeholder="Nhập phạm vi và tính chất của danh mục này để hệ thống RAG dễ dàng phân loại tài liệu..."
                    />
                  </div>
               </div>
            </section>
          </div>

          {/* CỘT PHẢI: MEDIA & WIDGETS */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Ảnh đại diện */}
            <div className="bg-white p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-5 transition-all hover:shadow-md">
              <h4 className="font-body text-[11px] font-bold text-on-surface uppercase border-b border-outline-variant/60 pb-3 tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">image</span>
                Ảnh đại diện lưu trữ
              </h4>

              <input
                type="file" accept="image/*" className="hidden"
                ref={fileInputRef} onChange={handleImageChange}
              />
              
              <div 
                onClick={() => fileInputRef.current.click()}
                className="relative aspect-video bg-surface-low/50 border-2 border-dashed border-outline-variant/60 rounded-2xl flex flex-col items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-300 group overflow-hidden"
              >
                {(imagePreview || form.image) ? (
                  <>
                    <img
                      src={imagePreview || form.image}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt="category"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
                      <span className="text-white font-body text-[11px] font-bold uppercase tracking-widest">Thay đổi</span>
                      <button
                        onClick={removeImage}
                        className="p-2.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 hover:scale-110 transition-all shadow-lg"
                        title="Xóa ảnh"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <span className="material-symbols-outlined text-2xl text-primary">add_photo_alternate</span>
                    </div>
                    <span className="font-body text-[10px] font-bold uppercase tracking-wider">Tải lên ảnh bìa</span>
                  </>
                )}
              </div>

              <p className="text-[10px] text-on-surface-variant italic leading-tight text-center px-4">
                Gợi ý: Sử dụng hoa văn cổ, bảo vật quốc gia hoặc phong cảnh di tích.
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default MetadataCategoryForm;