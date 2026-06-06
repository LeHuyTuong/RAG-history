import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // Refs cho Editor
  const editorRef = useRef(null);
  const editorImageInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    time: '',
    dynasty: '',
    summary: '',
    content: ''
  });

  // Load dữ liệu cũ
  useEffect(() => {
    if (isEdit) {
      const mockContent = 'Sau thất bại ở Tây Kết, quân Nguyên của Toa Đô rút về đóng ở bến Hàm Tử...';
      setFormData({
        name: 'Trận Hàm Tử (1285)',
        time: 'Tháng 5 năm 1285',
        dynasty: 'Nhà Trần',
        summary: 'Trận đánh then chốt do Trần Quang Khải chỉ huy tiêu diệt quân Nguyên...',
        content: mockContent
      });
      // Đổ nội dung vào editor khi ở chế độ edit
      if (editorRef.current) editorRef.current.innerHTML = mockContent;
    }
  }, [id, isEdit]);

  // --- LOGIC EDITOR ĐỒNG BỘ ---
  const runCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    updateContent();
  };

  const updateContent = () => {
    if (editorRef.current) {
      setFormData(prev => ({ ...prev, content: editorRef.current.innerHTML }));
    }
  };

  const handleEditorImageInsert = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imgHtml = `<img src="${event.target.result}" class="max-w-full h-auto my-6 rounded-xl shadow-lg border border-outline-variant/30" alt="event-img" />`;
        editorRef.current.focus();
        document.execCommand('insertHTML', false, imgHtml + "<p><br></p>");
        updateContent();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-body">
      
      {/* 1. HEADER ACTIONS (Giống bài viết) */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-outline-variant/30 pb-6 mb-10 gap-4">
        <div>
           <h2 className="font-headline text-4xl text-primary font-bold italic tracking-tight">
             {isEdit ? 'Hiệu đính Sự kiện' : 'Thêm Sự kiện Lịch sử Mới'}
           </h2>
           <p className="font-body text-sm text-on-surface-variant italic mt-2">"Ghi chép những cột mốc vàng son của dân tộc"</p>
        </div>
        <div className="flex gap-3 font-body text-[10px] font-bold tracking-widest">
          <button onClick={() => navigate('/admin/events')} className="px-6 py-2.5 border border-primary text-primary hover:bg-primary/5 transition-all uppercase">HỦY BỎ</button>
          <button className="px-8 py-2.5 bg-primary text-white shadow-lg hover:bg-primary-container transition-all active:scale-95 uppercase">
            <span className="material-symbols-outlined text-sm">save</span> LƯU SỰ KIỆN
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* Thông tin cơ bản */}
          <section className="bg-white p-8 border border-outline-variant shadow-sm space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5"><span className="material-symbols-outlined text-[80px]">shield</span></div>
            <div className="space-y-1">
              <label className="font-body text-[10px] uppercase font-bold text-on-surface-variant tracking-widest opacity-60 block">Tên sự kiện lịch sử *</label>
              <input 
                type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary py-2 font-headline text-2xl text-primary font-bold outline-none transition-all"
                placeholder="Ví dụ: Định đô Thăng Long..."
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="font-body text-[10px] uppercase font-bold text-on-surface-variant tracking-widest opacity-60 block">Thời gian xảy ra</label>
                <input type="text" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary py-2 outline-none font-medium" placeholder="Ví dụ: Năm 1010" />
              </div>
              <div className="space-y-1">
                <label className="font-body text-[10px] uppercase font-bold text-on-surface-variant tracking-widest opacity-60 block">Triều đại</label>
                <select value={formData.dynasty} onChange={e => setFormData({...formData, dynasty: e.target.value})} className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary py-2 outline-none cursor-pointer">
                  <option>Nhà Lý</option><option>Nhà Trần</option><option>Nhà Lê Sơ</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-body text-[10px] uppercase font-bold text-on-surface-variant tracking-widest opacity-60 block">Tóm lược (Summary)</label>
              <textarea rows="3" value={formData.summary} onChange={e => setFormData({...formData, summary: e.target.value})} className="w-full bg-transparent border-none focus:ring-0 font-body text-sm italic leading-relaxed resize-none outline-none" placeholder="Mô tả tóm tắt diễn biến..." />
            </div>
          </section>

          {/* TRÌNH SOẠN THẢO VĂN BẢN ĐỒNG BỘ */}
          <section className="bg-white border border-outline-variant shadow-sm min-h-[600px] flex flex-col rounded-sm">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-outline-variant bg-surface-low/30 sticky top-0 z-10">
              <EditorBtn onClick={() => runCommand('bold')} label="B" />
              <EditorBtn onClick={() => runCommand('italic')} label="I" />
              <EditorBtn onClick={() => runCommand('underline')} label="U" />
              <div className="w-px h-6 bg-outline-variant mx-2"></div>
              <button onClick={() => runCommand('formatBlock', 'H1')} className="px-2 font-bold text-xs hover:text-primary transition-all font-body">H1</button>
              <button onClick={() => runCommand('formatBlock', 'H2')} className="px-2 font-bold text-xs hover:text-primary transition-all font-body">H2</button>
              <div className="w-px h-6 bg-outline-variant mx-2"></div>
              <EditorBtn onClick={() => runCommand('insertUnorderedList')} icon="format_list_bulleted" />
              <EditorBtn onClick={() => runCommand('formatBlock', 'blockquote')} icon="format_quote" />
              <EditorBtn onClick={() => {
                const url = prompt("Nhập liên kết:");
                if(url) runCommand('createLink', url);
              }} icon="link" />
              
              {/* Chèn ảnh vào nội dung */}
              <input type="file" ref={editorImageInputRef} className="hidden" accept="image/*" onChange={handleEditorImageInsert} />
              <EditorBtn onClick={() => editorImageInputRef.current.click()} icon="image" />
              
              <div className="w-px h-6 bg-outline-variant mx-2"></div>
              <EditorBtn icon="history_edu" />
            </div>

            {/* Editable Area */}
            <div
              ref={editorRef}
              contentEditable
              onInput={updateContent}
              className="flex-1 p-10 font-body text-lg leading-loose outline-none min-h-[450px] bg-[#fcf9ee]/10 prose max-w-none focus:bg-white transition-all"
              placeholder="Bắt đầu ghi chép sử liệu chi tiết tại đây..."
            ></div>
          </section>
        </div>

        {/* CỘT PHẢI: LIÊN KẾT */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-6 border border-outline-variant shadow-sm space-y-4">
            <h4 className="font-body text-[10px] font-bold text-primary uppercase border-b pb-2 tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">location_on</span> Địa danh liên quan
            </h4>
            <div className="flex flex-wrap gap-2">
              {['Bến Hàm Tử', 'Chương Dương'].map(loc => (
                   <span key={loc} className="inline-flex items-center gap-1 bg-surface-low text-on-surface px-2 py-1 rounded text-[10px] font-bold border border-outline-variant mr-2 italic">#{loc}</span>
                 ))}
                 <button className="w-full mt-2 py-2 border border-dashed border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary/5 transition-all">+ Gắn địa danh</button>
            </div>
          </div>

          <div className="bg-white p-6 border border-outline-variant shadow-sm space-y-4">
            <h4 className="font-body text-[10px] font-bold text-primary uppercase border-b pb-2 tracking-widest">Nhân vật then chốt</h4>
            <div className="space-y-3">
              {['Trần Quang Khải', 'Trần Nhật Duật'].map(name => (
                <div key={name} className="flex items-center gap-3 p-2 bg-surface-low border border-outline-variant/30 hover:bg-white transition-all cursor-pointer group">
                  <div className="w-8 h-8 bg-primary/10 flex items-center justify-center rounded text-primary"><span className="material-symbols-outlined text-sm">person</span></div>
                  <span className="text-xs font-bold flex-1">{name}</span>
                  <span className="material-symbols-outlined text-xs opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component con cho nút Toolbar
const EditorBtn = ({ onClick, icon, label }) => (
  <button 
    type="button" onClick={onClick} 
    className="w-9 h-9 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-on-surface-variant hover:text-primary transition-all"
  >
    {label ? <span className="font-bold text-sm">{label}</span> : <span className="material-symbols-outlined text-lg">{icon}</span>}
  </button>
);

export default EventForm;