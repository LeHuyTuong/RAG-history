import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { RichTextEditor, FormHeader } from '../../../components/admin';
import apiClient, { mockClient, extractErrorMessage } from '../../../services/apiClient';
import { API_ENDPOINTS } from '../../../services/api';

const RecordForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '', slug: '', author: '', publicationYear: '', sourceType: 'Bộ chính sử', content: ''
  });
  const [originalData, setOriginalData] = useState({});
  const [filePath, setFilePath] = useState(null);

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          let record = null;

          if (!isNaN(Number(id))) {
            try {
              const response = await apiClient.get(`${API_ENDPOINTS.ADMIN_SOURCES}/${id}`);
              const data = response.data?.data || response.data;
              if (data) {
                record = data;
              }
            } catch (err) {
              console.error('Lỗi khi tải sử liệu từ backend:', err);
            }
          }

          if (!record) {
            const response = await mockClient.get('/api/admin_records.json');
            const data = response.data;
            record = data.records?.find(r => String(r.id) === String(id) || String(r.id).endsWith('-' + id));
          }

          if (!record) {
            const response = await mockClient.get('/api/user_record_detail.json');
            const data = response.data;
            record = (String(data.id) === String(id) || String(data.id).endsWith('-' + id)) ? data : null;
          }

          if (record) {
            setOriginalData(record);

            let typeLabel = 'Bộ chính sử';
            if (record.sourceType === 'BOOK') typeLabel = 'Chính sử (Quốc sử)';
            else if (record.sourceType === 'ARTICLE') typeLabel = 'Dã sử';
            else if (record.sourceType === 'MANUAL') typeLabel = 'Thần tích';
            else if (record.sourceType) typeLabel = record.sourceType;
            else if (record.metadata) {
              const metaVal = record.metadata?.find(m => m.label === 'Loại hình')?.value;
              if (metaVal) typeLabel = metaVal;
            }

            setForm(prev => ({
              ...prev,
              title: record.title || record.name || '',
              slug: record.slug || generateSlug(record.title || record.name || ''),
              author: record.author || '',
              publicationYear: record.publicationYear || record.stats?.find(s => s.label === 'Năm ra đời')?.value || '',
              sourceType: typeLabel,
              content: record.content || record.translations?.[0]?.content?.map(c => c.text).join('<br/><br/>') || ''
            }));
          }
        } catch (error) {
          console.error('Lỗi tải dữ liệu sử liệu:', error);
        }
      };
      fetchData();
    }
  }, [id, isEdit]);

  const handleSave = async () => {
    try {
      let backendType = 'BOOK';
      if (form.sourceType === 'Dã sử') backendType = 'ARTICLE';
      else if (form.sourceType === 'Thần tích') backendType = 'MANUAL';

      const payload = {
        title: form.title,
        sourceType: backendType,
        sourceUrl: null,
        filePath: filePath ? filePath.name : null,
        content: form.content,
        author: form.author || null,
        publicationYear: form.publicationYear ? parseInt(form.publicationYear) : null,
        reliabilityLevel: 'HIGH'
      };

      if (isEdit && !isNaN(Number(id))) {
        await apiClient.put(`${API_ENDPOINTS.ADMIN_SOURCES}/${id}`, payload);
      } else {
        await apiClient.post(API_ENDPOINTS.ADMIN_SOURCES, payload);
      }

      navigate('/admin/records');
    } catch (error) {
      console.error('Lỗi khi lưu sử liệu:', error);
      const errMsg = extractErrorMessage(error, 'Có lỗi xảy ra khi lưu sử liệu!');
      alert(errMsg);
    }
  };

  return (
    <div className="flex-grow bg-surface min-h-screen font-body">
      <main className="p-8 max-w-7xl mx-auto space-y-8">

        <FormHeader
          title={isEdit ? 'Chỉnh sửa Sử liệu' : 'Thêm Sử liệu Mới'}
          subtitle="Quản lý kho sử liệu, văn bản cổ, chính sử và tài liệu nghiên cứu lịch sử."
          icon="menu_book"
          isEdit={isEdit}
          onCancel={() => navigate('/admin/records')}
          onSave={handleSave}
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
                    setForm(prev => ({ ...prev, title: newTitle, slug: generateSlug(newTitle) }));
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
                  <input type="text" value={form.author} onChange={e => setForm(prev => ({ ...prev, author: e.target.value }))} className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 outline-none" placeholder="Vd: Ngô Sĩ Liên" />
                </div>
                <div className="space-y-1">
                  <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Năm xuất bản/khởi soạn</label>
                  <input type="number" value={form.publicationYear} onChange={e => setForm(prev => ({ ...prev, publicationYear: e.target.value }))} className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 outline-none" placeholder="Vd: 1479" />
                </div>

              </div>
            </section>

            {/* TRÌNH SOẠN THẢO VĂN BẢN (QUILL) */}
            <section className="bg-white border border-outline-variant shadow-sm rounded-sm">
              <RichTextEditor
                value={form.content}
                onChange={(content) => setForm(prev => ({ ...prev, content }))}
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
              <select value={form.sourceType} onChange={e => setForm(prev => ({ ...prev, sourceType: e.target.value }))} className="w-full bg-white/10 border border-white/20 rounded p-2 text-sm outline-none">
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