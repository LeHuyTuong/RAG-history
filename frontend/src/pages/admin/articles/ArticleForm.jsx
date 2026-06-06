import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // Ref để kích hoạt input file ẩn
  const fileInputRef = useRef(null);
const editorRef = useRef(null);
const editorImageInputRef = useRef(null);

  // State quản lý dữ liệu form
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    period: 'Nhà Hậu Lê (1428)',
    tags: ['Nhà Lê', 'Hậu Lê'],
    coverImage: null,
    imagePreview: null
  });

  
  // Giả lập load dữ liệu cũ nếu là chế độ Chỉnh sửa
useEffect(() => {
  if (isEdit) {
    // 1. Khai báo nội dung giả lập (có chứa các thẻ HTML)
    const mockContent = `
      <p>Thay trời hành hóa, Hoàng thượng truyền rằng...</p>
      <p><b>Quân cuồng Minh</b> thừa cơ gây họa, bọn gian tà bán nước cầu vinh.</p>
      <p>Nướng dân đen trên ngọn lửa hung tàn, vùi con đỏ xuống dưới hầm tai vạ.</p>
      <p><i>Quyết tâm đánh đuổi quân xâm lược, giành lại giang sơn...</i></p>
    `;

    // 2. Cập nhật vào State của Form
    setForm({
      title: 'Bình Ngô Đại Cáo - Tuyên ngôn độc lập',
      slug: 'binh-ngo-dai-cao',
      excerpt: '"Bình Ngô đại cáo" là bản tuyên ngôn thứ hai của dân tộc...',
      content: mockContent, // Lưu nội dung vào state
      period: 'Nhà Hậu Lê (1428)',
      tags: ['BìnhNgôĐạiCáo', 'HậuLê', 'NguyễnTrãi'],
      coverImage: null,
      imagePreview: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Binh_Ngo_Dai_Cao.jpg/800px-Binh_Ngo_Dai_Cao.jpg' 
    });

    // 3. Đổ dữ liệu vào trình soạn thảo (Editor)
    if (editorRef.current) {
      editorRef.current.innerHTML = mockContent;
    }
  }
}, [id, isEdit]);

   // Hàm thực hiện lệnh edit (B, I, U, H1, H2...)
  const runCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    updateContent();
  };
    const updateContent = () => {
    if (editorRef.current) {
      setForm(prev => ({ ...prev, content: editorRef.current.innerHTML }));
    }
  };
const handleEditorImageInsert = (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      // Chèn ảnh vào vị trí con trỏ chuột trong Editor
      runCommand('insertImage', event.target.result);
    };
    reader.readAsDataURL(file);
  }
};
  // Xử lý khi chọn ảnh
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

  // Xóa ảnh đã chọn
  const removeImage = (e) => {
    e.stopPropagation(); 
    setForm({ ...form, coverImage: null, imagePreview: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Xóa tag
  const removeTag = (tagToRemove) => {
    setForm({
      ...form,
      tags: form.tags.filter(t => t !== tagToRemove)
    });
  };

  // Danh sách các icon toolbar chia theo nhóm
  const toolbarGroups = [
    ['format_bold', 'format_italic', 'format_underlined', 'format_strikethrough'],
    ['format_h1', 'format_h2', 'format_quote'],
    ['format_list_bulleted', 'format_list_numbered'],
    ['format_align_left', 'format_align_center', 'format_align_right', 'format_align_justify'],
    ['link', 'image', 'video_library', 'history_edu']
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-body">
      
      {/* 1. HEADER: TIÊU ĐỀ VÀ CỤM NÚT ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-outline-variant/30 pb-6 mb-10 gap-4">
        <div>
           <h2 className="font-headline text-4xl text-primary font-bold italic tracking-tight">
             {isEdit ? 'Hiệu đính Sử liệu' : 'Soạn thảo Bài viết Mới'}
           </h2>
           <p className="font-body text-sm text-on-surface-variant italic mt-2">
             "Ghi chép ngàn năm, lưu truyền vạn thế"
           </p>
        </div>
        <div className="flex gap-3 font-body text-[10px] font-bold tracking-widest">
          <button 
            onClick={() => navigate('/admin/articles')} 
            className="px-6 py-2.5 border border-primary text-primary hover:bg-primary/5 transition-all uppercase"
          >
            HỦY BỎ
          </button>
          <button 
            className="px-8 py-2.5 bg-primary text-white shadow-lg hover:bg-primary-container flex items-center gap-2 transition-all active:scale-95 uppercase"
          >
            <span className="material-symbols-outlined text-sm">save</span> 
            {isEdit ? 'CẬP NHẬT' : 'XUẤT BẢN'}
          </button>
        </div>
      </div>

      {/* 2. GRID NỘI DUNG FORM */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* CỘT TRÁI: NỘI DUNG CHÍNH */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Tiêu đề & Slug */}
          <section className="bg-white p-8 border border-outline-variant shadow-sm space-y-6">
            <div className="space-y-1">
              <label className="font-body text-[10px] uppercase font-bold text-on-surface-variant tracking-widest opacity-60 block">
                Tiêu đề sử liệu *
              </label>
              <input 
                type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary py-2 font-headline text-2xl text-primary font-bold outline-none transition-all placeholder:font-light"
                placeholder="Nhập tiêu đề trang trọng..."
              />
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant font-body text-[11px]">
              <span className="opacity-50 lowercase tracking-normal italic">suviet.vn/bai-viet/</span>
              <input 
                type="text" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})}
                className="bg-surface-low px-2 py-1 rounded outline-none focus:text-primary transition-colors font-bold" 
              />
            </div>
          </section>

          {/* Tóm tắt */}
          <section className="bg-white p-6 border border-outline-variant shadow-sm">
            <label className="font-body text-[10px] uppercase font-bold text-on-surface-variant mb-2 block tracking-widest opacity-60">
              Tóm lược
            </label>
            <textarea rows="3" value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})} className="w-full bg-transparent border-none focus:ring-0 font-body text-sm italic leading-relaxed resize-none outline-none" placeholder="Mô tả ngắn gọn nội dung..." />
          </section>

          {/* TRÌNH SOẠN THẢO VĂN BẢN */}
<section className="bg-white border border-outline-variant shadow-sm min-h-[600px] flex flex-col rounded-sm">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-outline-variant bg-surface-low/30 sticky top-0 z-10">
              <EditorBtn onClick={() => runCommand('bold')} label="B" />
              <EditorBtn onClick={() => runCommand('italic')} label="I" />
              <EditorBtn onClick={() => runCommand('underline')} label="U" />
              
              <div className="w-px h-6 bg-outline-variant mx-2"></div>
              
              <button onClick={() => runCommand('formatBlock', 'H1')} className="px-2 font-bold text-xs hover:text-primary transition-all">H1</button>
              <button onClick={() => runCommand('formatBlock', 'H2')} className="px-2 font-bold text-xs hover:text-primary transition-all">H2</button>
              
              <div className="w-px h-6 bg-outline-variant mx-2"></div>
              
              <EditorBtn onClick={() => runCommand('insertUnorderedList')} icon="format_list_bulleted" />
              <EditorBtn onClick={() => runCommand('formatBlock', 'blockquote')} icon="format_quote" />
              <EditorBtn onClick={() => {
                const url = prompt("Nhập liên kết:");
                if(url) runCommand('createLink', url);
              }} icon="add_link" />
              
              {/* Nút chèn ảnh */}
              <EditorBtn onClick={() => editorImageInputRef.current.click()} icon="image" />

              <div className="w-px h-6 bg-outline-variant mx-2"></div>
              
              <EditorBtn icon="history_edu" />
              
              {/* Input file ẩn phục vụ chèn ảnh vào editor */}
              <input 
                type="file" 
                ref={editorImageInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleEditorImageInsert} 
              />
            </div>

            {/* Editable Area */}
            <div
              ref={editorRef}
              contentEditable
              onInput={updateContent}
              className="flex-1 p-10 font-body text-lg leading-loose outline-none min-h-[500px] bg-[#fcf9ee]/10 prose max-w-none focus:bg-white transition-all"
              placeholder="Bắt đầu soạn thảo nội dung..."
            ></div>
          </section>
       
          </div>

        {/* CỘT PHẢI: THÔNG TIN PHỤ */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          
          {/* ẢNH ĐẠI DIỆN (UPLOAD) */}
          <div className="bg-white p-6 border border-outline-variant shadow-sm space-y-4">
            <h3 className="font-body text-[10px] font-bold text-primary uppercase border-b border-outline-variant pb-2 tracking-widest">Ảnh sử liệu</h3>
            
            <input 
              type="file" accept="image/*" className="hidden" 
              ref={fileInputRef} onChange={handleImageChange} 
            />

            <div 
              onClick={() => fileInputRef.current.click()}
              className="relative aspect-video bg-surface-low border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary cursor-pointer transition-all group overflow-hidden"
            >
              {form.imagePreview ? (
                <>
                  <img src={form.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                     <span className="text-white font-body text-[10px] font-bold uppercase tracking-widest">Thay đổi ảnh</span>
                     <button 
                        onClick={removeImage}
                        className="p-2 bg-red-600 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                        title="Xóa ảnh"
                     >
                       <span className="material-symbols-outlined text-sm">delete</span>
                     </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform">add_photo_alternate</span>
                  <span className="font-body text-[9px] font-bold uppercase tracking-wider">Tải lên ảnh bìa</span>
                </>
              )}
            </div>
          </div>

          {/* Thời kỳ */}
          <div className="bg-white p-6 border border-outline-variant shadow-sm space-y-4">
            <h3 className="font-body text-[10px] font-bold text-primary uppercase border-b border-outline-variant pb-2 tracking-widest">Thời kỳ lịch sử</h3>
            <select 
              value={form.period}
              onChange={e => setForm({...form, period: e.target.value})}
              className="w-full bg-surface-low border border-outline-variant rounded p-2 text-sm outline-none font-body cursor-pointer hover:border-primary transition-colors"
            >
              <option>Nhà Hậu Lê (1428)</option>
              <option>Nhà Trần (1225)</option>
              <option>Nhà Lý (1009)</option>
              <option>Nhà Đinh (968)</option>
            </select>
          </div>

          {/* Thẻ Tags */}
          <div className="bg-white p-6 border border-outline-variant shadow-sm space-y-4">
            <h3 className="font-body text-[10px] font-bold text-primary uppercase border-b border-outline-variant pb-2 tracking-widest">Thẻ (Tags)</h3>
            <div className="flex flex-wrap gap-2">
              {form.tags.map(t => (
                <span key={t} className="px-2 py-1 bg-primary/10 text-primary rounded-sm text-[9px] font-bold border border-primary/20 font-body flex items-center gap-1">
                  #{t} 
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeTag(t); }}
                    className="material-symbols-outlined text-[14px] hover:text-red-600 transition-colors"
                  >
                    close
                  </button>
                </span>
              ))}
            </div>
            <input 
              className="w-full bg-transparent border-b border-outline-variant py-2 text-[11px] font-body outline-none focus:border-primary placeholder:italic" 
              placeholder="Gõ để thêm thẻ mới..." 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  setForm({...form, tags: [...new Set([...form.tags, e.target.value])]});
                  e.target.value = '';
                }
              }}
            />
          </div>

        </div>
      </div>
    </div>
  );
};
// Component con cho các nút trên Toolbar
const EditorBtn = ({ onClick, icon, label }) => (
  <button 
    type="button" 
    onClick={onClick} 
    className="w-9 h-9 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-on-surface-variant hover:text-primary transition-all"
  >
    {label ? <span className="font-bold text-sm">{label}</span> : <span className="material-symbols-outlined text-lg">{icon}</span>}
  </button>
);

export default ArticleForm;