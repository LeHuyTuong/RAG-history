import React, { useState, useEffect, useRef } from 'react'; // Đã thêm useRef vào đây
import { useParams, useNavigate } from 'react-router-dom';

const RecordForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  // Khai báo các Refs cho Editor
  const editorRef = useRef(null);
  const editorImageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: '', author: '', year: '', type: 'Bộ chính sử', content: '', summary: ''
  });
  const [documentFile, setDocumentFile] = useState(null);

  useEffect(() => {
    if (isEdit) {
      const mockContent = 'Mùa xuân, tháng giêng, ngày mồng một, vua lên ngôi ở điện Kính Thiên...';
      setForm({
        title: 'Đại Việt Sử Ký Toàn Thư',
        author: 'Ngô Sĩ Liên',
        year: 'Hồng Đức (1479)',
        type: 'Bộ chính sử',
        summary: 'Bộ quốc sử chính thức lớn nhất của Việt Nam thời trung đại...',
        content: mockContent
      });
      // Đổ nội dung vào editor khi ở chế độ edit
      if (editorRef.current) editorRef.current.innerHTML = mockContent;
    }
  }, [id, isEdit]);

  // --- HÀM XỬ LÝ EDITOR ---
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
      reader.onload = (event) => runCommand('insertImage', event.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-grow bg-surface min-h-screen font-body">
      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-outline-variant/30 pb-6">
          <div>
            <h2 className="font-headline text-3xl text-primary font-bold italic tracking-tight">
              {isEdit ? 'Chỉnh sửa Sử liệu' : 'Thêm Sử liệu Mới'}
            </h2>
            <p className="text-on-surface-variant text-sm italic mt-1">
              Quản lý kho sử liệu, văn bản cổ, chính sử và tài liệu nghiên cứu lịch sử.
            </p>
          </div>
          <div className="flex gap-3 font-body text-[10px] font-bold tracking-widest">
            <button onClick={() => navigate('/admin/records')} className="px-5 py-2 border border-primary text-primary hover:bg-primary/5 transition-all uppercase">HỦY BỎ</button>
            <button className="px-8 py-2 bg-primary text-white shadow-lg hover:bg-primary-container transition-all active:scale-95 uppercase">
              <span className="material-symbols-outlined text-sm">save</span> {isEdit ? 'CẬP NHẬT' : 'XUẤT BẢN'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: FORM CHÍNH */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <section className="bg-white p-8 border border-outline-variant shadow-sm space-y-6 relative overflow-hidden">
              <h3 className="font-headline text-xl text-primary font-bold border-l-4 border-primary pl-4 mb-8">Thông tin Chính văn</h3>
              <div className="space-y-1">
                <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Tiêu đề bản thảo *</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 font-headline text-2xl text-on-surface outline-none transition-all" placeholder="Ví dụ: Đại Việt Sử Ký Toàn Thư..." />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Tác giả / Chủ biên</label>
                  <input type="text" value={form.author} onChange={e => setForm({...form, author: e.target.value})} className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 outline-none" placeholder="Vd: Ngô Sĩ Liên" />
                </div>
                <div className="space-y-1">
                  <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Niên hiệu / Năm khởi soạn</label>
                  <input type="text" value={form.year} onChange={e => setForm({...form, year: e.target.value})} className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 outline-none" placeholder="Vd: Hồng Đức (1479)" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Tóm lược nội dung</label>
                <textarea rows="4" value={form.summary} onChange={e => setForm({...form, summary: e.target.value})} className="w-full bg-surface-low border border-outline-variant p-4 text-sm leading-relaxed rounded outline-none focus:ring-1 focus:ring-primary" placeholder="Mô tả sơ lược về giá trị của sử liệu..." />
              </div>
            </section>

            {/* TRÌNH SOẠN THẢO VĂN BẢN ĐÃ SỬA LỖI */}
            <section className="bg-white border border-outline-variant shadow-sm min-h-[700px] flex flex-col rounded-sm">
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
                <EditorBtn onClick={() => editorImageInputRef.current.click()} icon="image" />
                <div className="w-px h-6 bg-outline-variant mx-2"></div>
                <EditorBtn icon="history_edu" />
                <input type="file" ref={editorImageInputRef} className="hidden" accept="image/*" onChange={handleEditorImageInsert} />
              </div>
              <div
                ref={editorRef}
                contentEditable
                onInput={updateContent}
                className="flex-1 p-12 font-headline text-xl italic leading-loose outline-none min-h-[500px] bg-[#fcf9ee]/10 prose max-w-none focus:bg-white transition-all"
                placeholder="Nhập nội dung sử liệu hoặc bản dịch tại đây..."
              ></div>
            </section>
          </div>

          {/* CỘT PHẢI: ASSETS */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-6 border border-outline-variant shadow-sm">
              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-primary border-b border-outline-variant pb-2 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">upload_file</span> Tệp sử liệu (PDF/DOCX)
              </h4>
              <label className="border-2 border-dashed border-outline-variant rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-low transition-all group text-center">
                <span className="material-symbols-outlined text-5xl text-primary mb-3 group-hover:scale-110 transition-transform">description</span>
                <p className="font-headline text-sm text-primary font-bold">Tải lên sử liệu</p>
                <p className="text-[11px] text-on-surface-variant mt-1">Hỗ trợ PDF, DOC, DOCX</p>
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setDocumentFile(e.target.files[0])} />
              </label>
              {documentFile && (
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">description</span>
                  <span className="text-xs font-medium truncate flex-1">{documentFile.name}</span>
                </div>
              )}
            </div>

            <div className="bg-white p-6 border border-outline-variant shadow-sm">
              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-primary border-b border-outline-variant pb-2 mb-4">Ảnh minh họa sử liệu</h4>
              <label className="aspect-video bg-surface-low border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:bg-surface-variant/20 transition-all text-on-surface-variant group relative overflow-hidden rounded-lg">
                <img className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUvbL7PMKBU-jrjc5IMD9puyfrlzgXI1Jevn1ALky7TnMS9G5lOfVrUzcaBjl53B1Dr5n_QQo5_FuRVQrLPbzieVk54hqBXQYIKonMnbLVG_VlaXGubp7WyTNU_gv6aOweLHrj1e_rDjFtwb0971sG89Rnk31omiMt7QwCT5Ntnyt8G3INtJlo2zJcpJQ7_HbpaDFzltCKhSOcht8_cY1UmSYRB0ErpY4_pDkYTofLwbNgOljE2uJTnExb0XVTW_W-4uCa9Qx3Low" alt="preview" />
                <span className="material-symbols-outlined text-4xl relative z-10 text-white shadow-sm">add_a_photo</span>
                <input type="file" accept="image/*" className="hidden" />
              </label>
            </div>

            <div className="bg-primary/90 text-white p-6 rounded shadow-xl">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-2 mb-4 italic">Loại hình lưu trữ</h4>
                <select className="w-full bg-white/10 border border-white/20 rounded p-2 text-sm outline-none">
                  <option className="text-black">Chính sử (Quốc sử)</option>
                  <option className="text-black">Dã sử</option>
                  <option className="text-black">Thần tích</option>
                </select>
             </div>
          </div>
        </div> {/* Đã thêm thẻ đóng div còn thiếu ở đây */}
      </main>
    </div>
  );
};

const EditorBtn = ({ onClick, icon, label }) => (
  <button 
    type="button" 
    onClick={onClick} 
    className="w-9 h-9 flex items-center justify-center rounded hover:bg-white hover:shadow-sm text-on-surface-variant hover:text-primary transition-all"
  >
    {label ? <span className="font-bold text-sm">{label}</span> : <span className="material-symbols-outlined text-lg">{icon}</span>}
  </button>
);

export default RecordForm;