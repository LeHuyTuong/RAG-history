import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { RichTextEditor, FormHeader, TagInput, EntityRelationInput } from '../../../components/admin';
import { apiClient, uploadFile, extractErrorMessage, API_ENDPOINTS, eventService, personService, locationService, periodService } from '../../../services';
import toast from 'react-hot-toast';

const RecordForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  const [form, setForm] = useState({
    title: '', slug: '', author: '', publicationYear: '', sourceType: 'Chính sử (Quốc sử)', content: '',
    status: 'published', tags: [], relatedLocations: [], relatedCharacters: [], relatedEvents: []
  });
  const [originalData, setOriginalData] = useState({});
  const [filePath, setFilePath] = useState(null);
  const [errors, setErrors] = useState({});

  const [availableEvents, setAvailableEvents] = useState([]);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [availablePeriods, setAvailablePeriods] = useState([]);

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

          if (record) {
            setOriginalData(record);

            let typeLabel = 'Chính sử (Quốc sử)';
            if (record.sourceType === 'BOOK') typeLabel = 'Chính sử (Quốc sử)';
            else if (record.sourceType === 'ARTICLE') typeLabel = 'Dã sử';
            else if (record.sourceType === 'MANUAL') typeLabel = 'Thần tích';
            else if (record.sourceType) typeLabel = record.sourceType;
            else if (record.metadata) {
              const metaVal = record.metadata?.find(m => m.label === 'Loại hình')?.value;
              if (metaVal) typeLabel = metaVal;
            }

            const cached = localStorage.getItem(`local_record_relations_${id}`);
            let cachedTags = [];
            let cachedLocs = [];
            let cachedChars = [];
            let cachedEvents = [];
            if (cached) {
              const parsed = JSON.parse(cached);
              cachedTags = parsed.tags || [];
              cachedLocs = parsed.relatedLocations || [];
              cachedChars = parsed.relatedCharacters || [];
              cachedEvents = parsed.relatedEvents || [];
            }

            setForm(prev => ({
              ...prev,
              title: record.title || record.name || '',
              slug: record.slug || generateSlug(record.title || record.name || ''),
              author: record.author || '',
              publicationYear: record.publicationYear || record.stats?.find(s => s.label === 'Năm ra đời')?.value || '',
              sourceType: typeLabel,
              content: record.content || record.translations?.[0]?.content?.map(c => c.text).join('<br/><br/>') || '',
              status: (record.status === 'published' || !record.status || record.status === 'PUBLISHED') ? 'published' : 'draft',
              tags: cachedTags.length > 0 ? cachedTags : (record.tags || []),
              relatedLocations: cachedLocs.length > 0 ? cachedLocs : (record.relatedLocations || []),
              relatedCharacters: cachedChars.length > 0 ? cachedChars : (record.relatedCharacters || []),
              relatedEvents: cachedEvents.length > 0 ? cachedEvents : (record.relatedEvents || [])
            }));
          }
        } catch (error) {
          console.error('Lỗi tải dữ liệu sử liệu:', error);
        }
      };
      fetchData();
    }

    const fetchDependencies = async () => {
      try {
        const [events, chars, locs, periods] = await Promise.all([
          eventService.listAll().catch(() => []),
          personService.listAll().catch(() => []),
          locationService.listAll().catch(() => []),
          periodService.listAll().catch(() => [])
        ]);
        setAvailableEvents(events.map(e => ({ id: e.id, name: e.name, status: 'PUBLISHED' })));
        setAvailableCharacters(chars.map(c => ({ id: c.id, name: c.name, status: 'PUBLISHED' })));
        setAvailableLocations(locs.map(l => ({ id: l.id, name: l.name, status: 'PUBLISHED' })));
        setAvailablePeriods(periods.filter(p => p.status === 'PUBLISHED' || !p.status).map(p => p.name));
      } catch (error) {
        console.error('Lỗi tải dữ liệu liên kết cho sử liệu:', error);
      }
    };
    fetchDependencies();
  }, [id, isEdit]);

  const handleSave = async () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = 'Vui lòng nhập tiêu đề bản thảo.';
    if (!form.slug.trim()) {
      newErrors.slug = 'Vui lòng nhập đường dẫn (slug).';
    } else if (!/^[a-z0-9-]+$/.test(form.slug)) {
      newErrors.slug = 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.';
    }

    if (form.publicationYear) {
      const pYear = parseInt(form.publicationYear, 10);
      if (isNaN(pYear) || pYear <= 0) {
        newErrors.publicationYear = 'Năm xuất bản phải lớn hơn 0.';
      }
    }

    if (!filePath && !isEdit && !originalData?.filePath) {
      newErrors.filePath = 'Vui lòng đính kèm tệp sử liệu.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Vui lòng kiểm tra lại thông tin nhập bị lỗi.');
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      let backendType = 'BOOK';
      if (form.sourceType === 'Dã sử') backendType = 'ARTICLE';
      else if (form.sourceType === 'Thần tích') backendType = 'MANUAL';

      let finalFilePath = filePath ? (typeof filePath === 'string' ? filePath : filePath.name) : null;
      if (filePath instanceof File) {
        try {
          const uploadedUrl = await uploadFile(filePath);
          finalFilePath = uploadedUrl;
        } catch (uploadError) {
          console.error('Lỗi upload file:', uploadError);
          toast.error('Lỗi khi tải lên file sử liệu. Đang lưu với tên gốc.');
        }
      }

      const payload = {
        title: form.title,
        sourceType: backendType,
        sourceUrl: null,
        filePath: finalFilePath,
        content: form.content,
        author: form.author || null,
        publicationYear: form.publicationYear ? parseInt(form.publicationYear) : null,
        reliabilityLevel: 'HIGH'
      };

      let savedRecordId = Number(id);
      if (isEdit && !isNaN(Number(id))) {
        await sourceService.update(Number(id), payload);
      } else {
        const newRecord = await sourceService.create(payload);
        if (newRecord && newRecord.id) {
          savedRecordId = Number(newRecord.id);
        }
      }

      // Cache custom local relations
      const localKey = `local_record_relations_${isEdit ? id : savedRecordId}`;
      localStorage.setItem(localKey, JSON.stringify({
        tags: form.tags,
        relatedLocations: form.relatedLocations,
        relatedCharacters: form.relatedCharacters,
        relatedEvents: form.relatedEvents
      }));

      navigate('/admin/records');
    } catch (error) {
      console.error('Lỗi khi lưu sử liệu:', error);
      const errMsg = extractErrorMessage(error, 'Có lỗi xảy ra khi lưu sử liệu!');
      toast.error(errMsg);
    }
  };

  return (
    <div className="flex-grow bg-surface min-h-screen font-body">
      <main className="p-8 max-w-7xl mx-auto space-y-8">

        <FormHeader loading={loading}
          title={isEdit ? 'Chỉnh sửa Sử liệu' : 'Thêm Sử liệu Mới'}
          subtitle="Quản lý kho sử liệu, văn bản cổ, chính sử và tài liệu nghiên cứu lịch sử."
          icon="menu_book"
          isEdit={isEdit}
          onCancel={() => navigate('/admin/records')}
          onSave={handleSave}
          status={form.status}
          contentType="record"
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
                    if (errors.title) setErrors(prev => ({ ...prev, title: null, slug: null }));
                  }}
                  className={`w-full bg-transparent border-b py-2 font-headline text-2xl text-on-surface outline-none transition-all ${errors.title ? 'border-red-500 focus:border-red-600' : 'border-outline-variant focus:border-primary'}`}
                  placeholder="Ví dụ: Đại Việt Sử Ký Toàn Thư..."
                />
                {errors.title && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {errors.title}</p>}
              </div>
              <div className="space-y-1 mb-4 mt-2">
                <div className={`flex items-center gap-2 text-on-surface-variant font-body text-[11px] bg-surface-low/30 border rounded-xl p-3 ${errors.slug ? 'border-red-500' : 'border-outline-variant/40'}`}>
                  <span className="material-symbols-outlined text-[16px] text-primary/60">link</span>
                  <span className="opacity-50 lowercase tracking-normal italic">suviet.vn/su-lieu/</span>
                  <input
                    type="text" value={form.slug} readOnly
                    className={`flex-1 bg-transparent border-none outline-none font-bold cursor-not-allowed opacity-70 ${errors.slug ? 'text-red-500' : 'text-on-surface-variant'}`}
                  />
                </div>
                {errors.slug && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {errors.slug}</p>}
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-1">
                  <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Tác giả / Chủ biên</label>
                  <input type="text" value={form.author} onChange={e => { setForm(prev => ({ ...prev, author: e.target.value })); if(errors.author) setErrors(prev => ({ ...prev, author: null })); }} className={`w-full bg-transparent border-b py-2 outline-none ${errors.author ? 'border-red-500 focus:border-red-600' : 'border-outline-variant focus:border-primary'}`} placeholder="Vd: Ngô Sĩ Liên" />
                  {errors.author && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {errors.author}</p>}
                </div>
                <div className="space-y-1">
                  <label className="font-body text-[10px] font-bold uppercase text-on-surface-variant">Năm xuất bản/khởi soạn</label>
                  <input type="text" inputMode="numeric" pattern="[0-9]*" value={form.publicationYear} onChange={e => { setForm(prev => ({ ...prev, publicationYear: e.target.value.replace(/\D/g, '') })); if(errors.publicationYear) setErrors(prev => ({ ...prev, publicationYear: null })); }} className={`w-full bg-transparent border-b py-2 outline-none ${errors.publicationYear ? 'border-red-500 focus:border-red-600' : 'border-outline-variant focus:border-primary'}`} placeholder="Vd: 1479" />
                  {errors.publicationYear && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {errors.publicationYear}</p>}
                </div>

              </div>
            </section>

            {/* TRÌNH SOẠN THẢO VĂN BẢN (QUILL) */}
            <section className="bg-white border border-outline-variant shadow-sm rounded-3xl overflow-hidden">
              <RichTextEditor
                value={form.content}
                onChange={(content) => setForm(prev => ({ ...prev, content }))}
                placeholder="Nhập nội dung sử liệu hoặc bản dịch tại đây..."
                className="min-h-[500px]"
              />
            </section>
          </div>

          {/* CỘT PHẢI: ASSETS */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-6 border border-outline-variant shadow-sm rounded-3xl sticky top-8 flex flex-col space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6b0f0d]/10 rounded-full blur-3xl pointer-events-none"></div>

              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                CẤU HÌNH SỬ LIỆU
              </h4>

              {/* 1. TRẠNG THÁI XUẤT BẢN */}
              <div className="space-y-4 relative z-10 text-left">
                <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest flex items-center gap-2 border-b border-outline-variant/30 pb-1">
                  <span className="material-symbols-outlined text-[14px]">publish</span> TRẠNG THÁI XUẤT BẢN
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</label>
                    <div className="relative">
                      <select
                        value={form.status}
                        onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-sm font-bold text-on-surface outline-none cursor-pointer hover:border-[#6b0f0d] focus:border-[#6b0f0d] focus:ring-2 focus:ring-[#6b0f0d]/20 transition-all appearance-none"
                      >
                        <option value="draft">Bản nháp</option>
                        <option value="published">Công khai</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Loại hình sử liệu</label>
                    <div className="relative">
                      <select
                        value={form.sourceType}
                        onChange={e => setForm(prev => ({ ...prev, sourceType: e.target.value }))}
                        className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-sm font-bold text-on-surface outline-none cursor-pointer hover:border-[#6b0f0d] focus:border-[#6b0f0d] focus:ring-2 focus:ring-[#6b0f0d]/20 transition-all appearance-none"
                      >
                        <option>Chính sử (Quốc sử)</option>
                        <option>Dã sử</option>
                        <option>Thần tích</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. TỆP ĐÍNH KÈM */}
              <div className="space-y-3 text-left">
                <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest flex items-center gap-2 border-b border-outline-variant/30 pb-1">
                  <span className="material-symbols-outlined text-[14px]">upload_file</span> TỆP ĐÍNH KÈM (PDF/DOCX)
                </p>
                <label className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-surface-low/50 transition-all group text-center ${errors.filePath ? 'border-red-500 bg-red-50/50' : 'border-outline-variant/60 bg-surface-low/20'}`}>
                  <span className={`material-symbols-outlined text-4xl mb-2 group-hover:scale-110 transition-transform ${errors.filePath ? 'text-red-500' : 'text-[#6b0f0d]'}`}>description</span>
                  <p className={`font-headline text-xs font-bold ${errors.filePath ? 'text-red-500' : 'text-[#6b0f0d]'}`}>Tải lên sử liệu</p>
                  <p className="text-[9px] text-on-surface-variant mt-1">Hỗ trợ PDF, DOC, DOCX</p>
                  <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { setFilePath(e.target.files[0]); if(errors.filePath) setErrors(prev => ({ ...prev, filePath: null })); }} />
                </label>
                {errors.filePath && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {errors.filePath}</p>}
                {filePath && (
                  <div className="mt-2 p-2 bg-[#6b0f0d]/5 border border-[#6b0f0d]/20 rounded-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#6b0f0d] text-sm">description</span>
                    <span className="text-xs font-bold truncate flex-1 text-on-surface">{filePath.name}</span>
                  </div>
                )}
              </div>

              {/* 3. LIÊN KẾT THÔNG TIN */}
              <div className="space-y-4 pt-2 border-t border-outline-variant/60 text-left">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10 w-full">
                  <span className="material-symbols-outlined text-[16px]">link</span> LIÊN KẾT THÔNG TIN
                </h4>

                {/* TRIỂU ĐẠI */}
                <div className="pt-2">
                  <TagInput
                    tags={form.tags}
                    availableTags={availablePeriods}
                    onAddTag={(tag) => setForm(prev => ({ ...prev, tags: [...new Set([...(prev.tags || []), tag])] }))}
                    onRemoveTag={(tag) => setForm(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }))}
                  />
                </div>

                {/* DI TÍCH LIÊN QUAN */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="location"
                    label="Di tích liên quan"
                    icon="location_on"
                    entities={form.relatedLocations || []}
                    availableEntities={availableLocations}
                    onAdd={(val) => setForm(prev => ({ ...prev, relatedLocations: [...new Set([...(prev.relatedLocations || []), val])] }))}
                    onRemove={(val) => setForm(prev => ({ ...prev, relatedLocations: (prev.relatedLocations || []).filter(l => l !== val) }))}
                  />
                </div>

                {/* NHÂN VẬT LIÊN QUAN */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="character"
                    label="Nhân vật liên quan"
                    icon="person"
                    itemIcon="person"
                    entities={form.relatedCharacters || []}
                    availableEntities={availableCharacters}
                    onAdd={(val) => setForm(prev => ({ ...prev, relatedCharacters: [...new Set([...(prev.relatedCharacters || []), val])] }))}
                    onRemove={(val) => setForm(prev => ({ ...prev, relatedCharacters: (prev.relatedCharacters || []).filter(c => c !== val) }))}
                  />
                </div>

                {/* SỰ KIỆN LỊCH SỬ */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="event"
                    label="Sự kiện liên quan"
                    icon="event"
                    itemIcon="event"
                    entities={form.relatedEvents || []}
                    availableEntities={availableEvents}
                    onAdd={(val) => setForm(prev => ({ ...prev, relatedEvents: [...new Set([...(prev.relatedEvents || []), val])] }))}
                    onRemove={(val) => setForm(prev => ({ ...prev, relatedEvents: (prev.relatedEvents || []).filter(e => e !== val) }))}
                  />
                </div>

              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default RecordForm;
