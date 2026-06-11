import {  useState, useEffect  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { RichTextEditor, FormHeader } from '../../../components/admin';

const RecordForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '', slug: '', author: '', publicationYear: '', sourceType: 'Bộ chính sử', content: '', reliabilityScore: ''
  });
  const [filePath, setFilePath] = useState(null);

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const response = await fetch('/api/user_record_detail.json');
          if (response.ok) {
            const data = await response.json();
            setForm(prev => ({
              ...prev,
              title: data.title || '',
              slug: generateSlug(data.title || ''),
              author: data.author || '',
              publicationYear: data.stats?.find(s => s.label === 'Năm ra đời')?.value || '',
              sourceType: data.metadata?.find(m => m.label === 'Loại hình')?.value || 'Bộ chính sử',
              reliabilityScore: '9',
              content: data.translations?.[0]?.content?.map(c => c.text).join('<br/><br/>') || ''
            }));
          }
        } catch (error) {
          console.error('Lỗi tải dữ liệu sử liệu:', error);
        }
      };
      fetchData();
    }
  }, [id, isEdit]);

  return (
    <div className="flex-grow bg-surface min-h-screen font-body">
      <main className="p-8 max-w-7xl mx-auto space-y-8">
        
        <FormHeader 
          title={isEdit ? 'Chỉnh sửa Sử liệu' : 'Thêm Sử liệu Mới'}
          subtitle="Quản lý kho sử liệu, văn bản cổ, chính sử và tài liệu nghiên cứu lịch sử."
          icon="menu_book"
          isEdit={isEdit}
          onCancel={() => navigate('/admin/records')}
          onSave={() => {}}
        />

        <div className="grid grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: FORM CHÍNH */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <section className="bg-white p-8 border border-outline-variant shadow-sm space-y-6 relative overflow-hidden">
              <h3 className="font-headline text-xl text-primary font-bold border-l-4 border-primary pl-4 mb-8">Thông tin Chính văn</h3>
              <div className="space-y-1">
                <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Tiêu đề bản thảo *</label>
                <input 
                  type="text" value={form.title} 
                  onChange={e => {
                    const newTitle = e.target.value;
                    setForm({...form, title: newTitle, slug: generateSlug(newTitle)});
                  }}
                  className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 font-headline text-2xl text-on-surface outline-none transition-all" 
                  placeholder="Ví dụ: Đại Việt Sử Ký Toàn Thư..." 
                />
              </div>
              <div className="flex items-center gap-2 text-on-surface-variant font-body text-[11px] mb-4">
                <span className="opacity-50 lowercase tracking-normal italic">suviet.vn/su-lieu/</span>
                <input 
                  type="text" value={form.slug} readOnly
                  className="flex-1 bg-surface-low px-2 py-1 rounded outline-none text-on-surface-variant font-bold cursor-not-allowed opacity-70" 
                />
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Tác giả / Chủ biên</label>
                  <input type="text" value={form.author} onChange={e => setForm({...form, author: e.target.value})} className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 outline-none" placeholder="Vd: Ngô Sĩ Liên" />
                </div>
                <div className="space-y-1">
                  <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Năm xuất bản/khởi soạn</label>
                  <input type="number" value={form.publicationYear} onChange={e => setForm({...form, publicationYear: e.target.value})} className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 outline-none" placeholder="Vd: 1479" />
                </div>
                <div className="space-y-1">
                  <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Độ tin cậy (1-10)</label>
                  <input type="number" min="1" max="10" value={form.reliabilityScore} onChange={e => setForm({...form, reliabilityScore: e.target.value})} className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 outline-none" placeholder="Vd: 9" />
                </div>
              </div>
            </section>

            {/* TRÌNH SOẠN THẢO VĂN BẢN (QUILL) */}
            <section className="bg-white border border-outline-variant shadow-sm rounded-sm">
              <RichTextEditor
                value={form.content}
                onChange={(content) => setForm({...form, content})}
                placeholder="Nhập nội dung sử liệu hoặc bản dịch tại đây..."
                className="min-h-[500px]"
              />
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
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setFilePath(e.target.files[0])} />
              </label>
              {filePath && (
                <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-sm">description</span>
                  <span className="text-xs font-medium truncate flex-1">{filePath.name}</span>
                </div>
              )}
            </div>

            <div className="bg-primary/90 text-white p-6 rounded shadow-xl">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest border-b border-white/20 pb-2 mb-4 italic">Loại hình lưu trữ</h4>
                <select value={form.sourceType} onChange={e => setForm({...form, sourceType: e.target.value})} className="w-full bg-white/10 border border-white/20 rounded p-2 text-sm outline-none">
                  <option className="text-black">Chính sử (Quốc sử)</option>
                  <option className="text-black">Dã sử</option>
                  <option className="text-black">Thần tích</option>
                </select>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RecordForm;