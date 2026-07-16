import { API_ENDPOINTS, apiClient, extractErrorMessage } from '../../../services';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import EntityRelationInput from '../../../components/admin/EntityRelationInput';
import toast from 'react-hot-toast';
import { FormHeader } from '../../../components/admin';
import { validateYearRange } from '../../../utils/validation';


const PeriodForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    version: 0,
    name: '',
    startYear: '',
    endYear: '',
    eraTypeStart: 'SCN',
    eraTypeEnd: 'SCN',
    philosophy: '',
    description: '',
    avatar: '',
    emperors: [],
    relatedLocations: [],
    relatedEvents: [],
    relatedArticles: [],
    status: 'published'
  });
  const [originalData, setOriginalData] = useState({});
  const [errors, setErrors] = useState({});

  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [availableArticles, setAvailableArticles] = useState([]);




  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          if (!isNaN(Number(id))) {
            try {
              const response = await apiClient.get(`${API_ENDPOINTS.ADMIN_PERIODS}/${id}`);
              const data = response.data?.data || response.data;
              if (data) {
                setOriginalData(data);
                const years = data.range?.match(/\d+/g) || [];
                const timeParts = (data.range || '').split('-');

                const sYear = data.startYear !== undefined && data.startYear !== null ? Math.abs(data.startYear) : (years[0] || '');
                const eYear = data.endYear !== undefined && data.endYear !== null ? Math.abs(data.endYear) : (years[1] || '');
                const eraStart = data.startYear !== undefined && data.startYear !== null ? (data.startYear < 0 ? 'TCN' : 'SCN') : (timeParts[0]?.includes('TCN') ? 'TCN' : 'SCN');
                const eraEnd = data.endYear !== undefined && data.endYear !== null ? (data.endYear < 0 ? 'TCN' : 'SCN') : (timeParts[1]?.includes('TCN') ? 'TCN' : 'SCN');

                setForm(prev => ({
                  ...prev,
                  name: data.name || '',
                  startYear: sYear,
                  endYear: eYear,
                  eraTypeStart: eraStart,
                  eraTypeEnd: eraEnd,
                  philosophy: data.philosophy || '',
                  description: data.description || data.desc || '',
                  avatar: data.imageUrl || data.avatar || '',
                  emperors: typeof data.emperors === 'string' ? data.emperors.split(',').filter(Boolean) : (data.emperors || []),
                  relatedLocations: typeof data.relatedLocations === 'string' ? data.relatedLocations.split(',').filter(Boolean) : (data.relatedLocations || []),
                  relatedEvents: typeof data.relatedEvents === 'string' ? data.relatedEvents.split(',').filter(Boolean) : (data.relatedEvents || []),
                  relatedArticles: typeof data.relatedArticles === 'string' ? data.relatedArticles.split(',').filter(Boolean) : (data.relatedArticles || []),
                  status: (data.status === 'PUBLISHED' || data.status === 'published' || !data.status) ? 'published' : 'draft'
                }));
                return;
              }
            } catch (err) {
              console.error('Lỗi khi tải thời kỳ từ backend:', err);
            }
          }
        } catch (error) {
          console.error('Error fetching period:', error);
        }
      };
      fetchData();
    }

    // Luôn fetch danh sách nhân vật và các thực thể khác để gợi ý
    const fetchAvailableData = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.ADMIN_CHARACTERS, { params: { size: 500 } });
        const charData = response.data?.data?.result || response.data?.data?.content || [];
        setAvailableCharacters(charData.map(c => ({
          id: c.id,
          name: c.name,
          title: c.alias || '',
          years: `${c.birthDate ? new Date(c.birthDate).getFullYear() : '?'} - ${c.deathDate ? new Date(c.deathDate).getFullYear() : '?'}`,
          dynasty: c.dynasty || 'Chưa rõ'
        })));
      } catch (error) {
        console.error('Error fetching characters from backend:', error);
      }

      // Fetch Locations
      try {
        const locRes = await apiClient.get(API_ENDPOINTS.ADMIN_LOCATIONS, { params: { size: 500 } });
        const locData = locRes.data?.data?.result || locRes.data?.data?.content || locRes.data || [];
        setAvailableLocations(locData);
      } catch (e) {
        console.error('Error fetching locations:', e);
      }

      // Fetch Events
      try {
        const evtRes = await apiClient.get(API_ENDPOINTS.ADMIN_EVENTS, { params: { size: 500 } });
        const evtData = evtRes.data?.data?.result || evtRes.data?.data?.content || evtRes.data || [];
        setAvailableEvents(evtData);
      } catch (e) {
        console.error('Error fetching events:', e);
      }

      // Fetch Articles
      try {
        const artRes = await apiClient.get(API_ENDPOINTS.ADMIN_ARTICLES, { params: { size: 500 } });
        const artData = artRes.data?.data?.result || artRes.data?.data?.content || artRes.data || [];
        setAvailableArticles(artData);
      } catch (e) {
        console.error('Error fetching articles:', e);
      }
    };
    fetchAvailableData();
  }, [id, isEdit]);

  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeEmperor = (empId) => {
    setForm(prev => ({ ...prev, emperors: prev.emperors.filter(e => e.id !== empId) }));
  };

  const handleSave = async () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên thời kỳ.';
    }

    const hasStart = form.startYear !== '' && form.startYear !== null && form.startYear !== undefined;
    const hasEnd = form.endYear !== '' && form.endYear !== null && form.endYear !== undefined;

    if (hasStart) {
      const sY = parseInt(form.startYear, 10);
      if (isNaN(sY) || sY <= 0) {
        newErrors.startYear = 'Năm bắt đầu phải lớn hơn 0 (Lịch sử không có năm 0).';
      }
    }
    if (hasEnd) {
      const eY = parseInt(form.endYear, 10);
      if (isNaN(eY) || eY <= 0) {
        newErrors.endYear = 'Năm kết thúc phải lớn hơn 0 (Lịch sử không có năm 0).';
      }
    }

    if (hasStart && hasEnd && !validateYearRange(form.startYear, form.eraTypeStart, form.endYear, form.eraTypeEnd)) {
      newErrors.yearRange = 'Năm bắt đầu không thể diễn ra sau năm kết thúc.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Vui lòng kiểm tra lại thông tin nhập bị lỗi.');
      return;
    }
    setErrors({});

    let startVal = null;
    let endVal = null;

    if (hasStart) {
      const sY = parseInt(form.startYear, 10);
      startVal = form.eraTypeStart === 'TCN' ? -sY : sY;
    }
    if (hasEnd) {
      const eY = parseInt(form.endYear, 10);
      endVal = form.eraTypeEnd === 'TCN' ? -eY : eY;
    }

    if (hasStart && hasEnd) {
      if (startVal > endVal) {
        toast.error('Lỗi hợp lệ: Năm bắt đầu không thể diễn ra sau năm kết thúc.');
        return;
      }
    }

    try {
      const { apiClient, API_ENDPOINTS } = await import('../../../services');
      const { generateSlug } = await import('../../../utils/stringUtils');

      const payload = {
        name: form.name,
        slug: generateSlug(form.name),
        startYear: startVal,
        endYear: endVal,
        philosophy: form.philosophy || '',
        description: form.description,
        imageUrl: form.avatar || null,
        emperors: Array.isArray(form.emperors) ? form.emperors.join(',') : form.emperors || '',
        relatedLocations: Array.isArray(form.relatedLocations) ? form.relatedLocations.join(',') : form.relatedLocations || '',
        relatedEvents: Array.isArray(form.relatedEvents) ? form.relatedEvents.join(',') : form.relatedEvents || '',
        relatedArticles: Array.isArray(form.relatedArticles) ? form.relatedArticles.join(',') : form.relatedArticles || '',
        status: (form.status === 'published' || form.status === 'Công khai' || form.status === 'PUBLISHED') ? 'PUBLISHED' : 'DRAFT'
      };

      if (isEdit && !isNaN(Number(id))) {
        await apiClient.put(`${API_ENDPOINTS.ADMIN_PERIODS}/${id}`, payload);
      } else {
        await apiClient.post(API_ENDPOINTS.ADMIN_PERIODS, payload);
      }

      navigate('/admin/periods');
    } catch (error) {
      console.error('Lỗi lưu kỷ nguyên:', error);
      const errMsg = extractErrorMessage(error, 'Có lỗi xảy ra khi lưu Kỷ nguyên!');
      toast.error(errMsg);
    }
  };

  return (
    <div className="flex-grow bg-surface min-h-screen font-body pb-20 animate-in fade-in duration-500">
      <main className="p-8 max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <FormHeader
          loading={loading}
          title={isEdit ? 'Hiệu đính Kỷ nguyên' : 'Ghi chép Kỷ nguyên mới'}
          subtitle="Đảm bảo tính chính xác về thời gian và ngôn ngữ để lưu trữ vĩnh viễn."
          icon="history_edu"
          isEdit={isEdit}
          onCancel={() => navigate('/admin/periods')}
          onSave={handleSave}
          status={form.status}
          contentType="metadata"
        />

        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* SECTION 1: IDENTITY */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-8 relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute -top-12 -right-12 opacity-[0.03] text-primary pointer-events-none">
                <span className="material-symbols-outlined text-[200px]">account_balance</span>
              </div>



              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-primary text-[18px]">stars</span>
                Danh tính & Niên đại
              </h3>

              <div className="grid grid-cols-2 gap-8 relative z-10">

                <div className="col-span-2 space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Tên Thời kỳ / Triều đại *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => {
                      setForm(prev => ({ ...prev, name: e.target.value }));
                      if (errors.name) setErrors(prev => ({ ...prev, name: null }));
                    }}
                    className={`w-full bg-transparent border-0 border-b py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:font-light ${errors.name ? 'border-red-500 focus:border-red-600 placeholder:text-red-400' : 'border-outline-variant/60 focus:border-primary placeholder:text-outline-variant/60'
                      }`}
                    placeholder="Ví dụ: Nhà Lý (Hậu Lý)..."
                  />
                  {errors.name && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Khởi điểm (Năm bắt đầu)
                  </label>
                  <div className={`bg-surface-low/50 border rounded-xl overflow-hidden transition-all p-1 h-12 flex items-center ${errors.startYear || errors.yearRange ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/20' : 'border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
                    }`}>
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*"
                      value={form.startYear}
                      onChange={e => {
                        const rawVal = e.target.value.replace(/\D/g, '');
                        setForm(prev => ({ ...prev, startYear: rawVal ? Math.abs(parseInt(rawVal)) : '' }));
                        if (errors.startYear || errors.yearRange) setErrors(prev => ({ ...prev, startYear: null, yearRange: null }));
                      }}
                      className="flex-grow h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                      placeholder="VD: 1009"
                    />
                    <select
                      value={form.eraTypeStart}
                      onChange={e => {
                        setForm(prev => ({ ...prev, eraTypeStart: e.target.value }));
                        if (errors.yearRange) setErrors(prev => ({ ...prev, yearRange: null }));
                      }}
                      className="bg-transparent border-0 border-l border-outline-variant/40 px-2 h-full text-xs font-bold text-primary outline-none cursor-pointer"
                    >
                      <option value="SCN">SCN</option>
                      <option value="TCN">TCN</option>
                    </select>
                  </div>
                  {errors.startYear && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {errors.startYear}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Kết thúc (Năm kết thúc)
                  </label>
                  <div className={`bg-surface-low/50 border rounded-xl overflow-hidden transition-all p-1 h-12 flex items-center ${errors.endYear || errors.yearRange ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/20' : 'border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
                    }`}>
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*"
                      value={form.endYear}
                      onChange={e => {
                        const rawVal = e.target.value.replace(/\D/g, '');
                        setForm(prev => ({ ...prev, endYear: rawVal ? Math.abs(parseInt(rawVal)) : '' }));
                        if (errors.endYear || errors.yearRange) setErrors(prev => ({ ...prev, endYear: null, yearRange: null }));
                      }}
                      className="flex-grow h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                      placeholder="VD: 1225"
                    />
                    <select
                      value={form.eraTypeEnd}
                      onChange={e => {
                        setForm(prev => ({ ...prev, eraTypeEnd: e.target.value }));
                        if (errors.yearRange) setErrors(prev => ({ ...prev, yearRange: null }));
                      }}
                      className="bg-transparent border-0 border-l border-outline-variant/40 px-2 h-full text-xs font-bold text-primary outline-none cursor-pointer"
                    >
                      <option value="SCN">SCN</option>
                      <option value="TCN">TCN</option>
                    </select>
                  </div>
                  {errors.endYear && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {errors.endYear}</p>}
                </div>

                {errors.yearRange && (
                  <div className="col-span-2 text-red-500 text-[12px] font-bold flex items-center gap-2 bg-red-50 p-3 rounded-lg border border-red-200">
                    <span className="material-symbols-outlined text-[16px]">error</span>
                    {errors.yearRange}
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 2: CONTEXT */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-6 transition-all hover:shadow-md">
              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">auto_stories</span>
                Bối cảnh & Ý nghĩa
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Triết lý / Khẩu hiệu
                  </label>
                  <input
                    type="text"
                    value={form.philosophy}
                    onChange={e => setForm(prev => ({ ...prev, philosophy: e.target.value }))}
                    className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-2 font-body text-base italic text-on-surface outline-none transition-all placeholder:text-outline-variant/60"
                    placeholder="Ví dụ: Nam Quốc Sơn Hà Nam Đế Cư..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Mô tả chi tiết sử liệu
                  </label>
                  <textarea
                    rows="6"
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-4 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none font-body"
                    placeholder="Viết về các thay đổi chính trị - xã hội trong thời kỳ này..."
                  />
                </div>
              </div>
            </section>

          </div>

          {/* CỘT PHẢI: CẤU HÌNH & MEDIA */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-6 border border-outline-variant shadow-sm rounded-3xl sticky top-8 flex flex-col space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6b0f0d]/10 rounded-full blur-3xl pointer-events-none"></div>

              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                CẤU HÌNH KỶ NGUYÊN
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
                </div>
              </div>

              {/* 2. ẢNH ĐẠI DIỆN */}
              <div className="pt-2 relative z-10 text-left border-t border-outline-variant/60 mt-4">
                <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest flex items-center gap-2 border-b border-outline-variant/30 pb-1 mb-3">
                  <span className="material-symbols-outlined text-[14px]">image</span> ẢNH ĐẠI DIỆN THỜI KỲ
                </p>
                <div
                  className="aspect-video w-full mx-auto rounded-2xl bg-surface-low border-4 border-white shadow-lg flex flex-col items-center justify-center text-on-surface-variant hover:text-[#6b0f0d] hover:border-[#6b0f0d]/50 transition-all group overflow-hidden relative cursor-pointer mb-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img
                    src={form.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                    alt="Period Avatar"
                  />
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-2xl mb-1 text-[#6b0f0d]">cloud_upload</span>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#6b0f0d]">Đổi ảnh bìa</p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                />
              </div>

              {/* 3. LIÊN KẾT THÔNG TIN */}
              <div className="space-y-4 pt-2 border-t border-outline-variant/60 text-left">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10 w-full">
                  <span className="material-symbols-outlined text-[16px]">link</span> LIÊN KẾT THÔNG TIN
                </h4>

                {/* DI TÍCH LIÊN QUAN */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="location"
                    label="Di tích liên quan"
                    icon="location_on"
                    itemIcon="location_on"
                    entities={form.relatedLocations}
                    availableEntities={availableLocations}
                    onAdd={(val) => setForm(prev => ({ ...prev, relatedLocations: [...new Set([...(prev.relatedLocations || []), val])] }))}
                    onRemove={(val) => setForm(prev => ({ ...prev, relatedLocations: (prev.relatedLocations || []).filter(c => (typeof c === 'object' ? c.name : c) !== val) }))}
                  />
                </div>

                {/* SỰ KIỆN LỊCH SỬ */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="event"
                    label="Sự kiện lịch sử"
                    icon="event"
                    itemIcon="event"
                    entities={form.relatedEvents}
                    availableEntities={availableEvents}
                    onAdd={(val) => setForm(prev => ({ ...prev, relatedEvents: [...new Set([...(prev.relatedEvents || []), val])] }))}
                    onRemove={(val) => setForm(prev => ({ ...prev, relatedEvents: (prev.relatedEvents || []).filter(c => (typeof c === 'object' ? c.name : c) !== val) }))}
                  />
                </div>

                {/* BÀI VIẾT LIÊN QUAN */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="article"
                    label="Bài viết liên quan"
                    icon="article"
                    itemIcon="article"
                    entities={form.relatedArticles}
                    availableEntities={availableArticles}
                    onAdd={(val) => setForm(prev => ({ ...prev, relatedArticles: [...new Set([...(prev.relatedArticles || []), val])] }))}
                    onRemove={(val) => setForm(prev => ({ ...prev, relatedArticles: (prev.relatedArticles || []).filter(c => (typeof c === 'object' ? c.name : c) !== val) }))}
                  />
                </div>

                {/* NHÂN VẬT THEN CHỐT */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="character"
                    label="Nhân vật then chốt"
                    icon="groups"
                    itemIcon="person"
                    entities={form.emperors}
                    availableEntities={availableCharacters}
                    onAdd={(val) => setForm(prev => ({ ...prev, emperors: [...new Set([...(prev.emperors || []), val])] }))}
                    onRemove={(val) => setForm(prev => ({ ...prev, emperors: (prev.emperors || []).filter(c => (typeof c === 'object' ? c.name : c) !== val) }))}
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

export default PeriodForm;
