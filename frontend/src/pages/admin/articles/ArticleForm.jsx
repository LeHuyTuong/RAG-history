import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug, stripHtml } from '../../../utils/stringUtils';
import { validateSlug, validateYearRange, validatePublishDate } from '../../../utils/validation';
import { RichTextEditor, ImageUpload, TagInput, FormHeader, EntityRelationInput } from '../../../components/admin';
import { extractErrorMessage, uploadFile, postService, tagService, eventService, sourceService, personService, locationService, API_ENDPOINTS } from '../../../services';
import toast from 'react-hot-toast';

const formatDateForInput = (dateStr) => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch (e) {
    return '';
  }
};

const cleanArrayData = (data) => {
  if (!data) return [];
  let arr = Array.isArray(data) ? data : [data];
  let res = [];
  arr.forEach(item => {
    if (typeof item === 'string') {
      let trimmed = item.trim();
      if (trimmed === '[]') return;
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            res.push(...parsed);
            return;
          }
        } catch (e) {
          let cleaned = trimmed.replace(/^\["?|"?\]$/g, '').replace(/"?,"?/g, ', ');
          if (cleaned) res.push(cleaned);
          return;
        }
      }
    }
    if (item && item !== '[]') {
      res.push(item);
    }
  });
  return res.filter(Boolean);
};

const ArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  const [predefinedTags, setPredefinedTags] = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);

  const [form, setForm] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
    publishedAt: new Date().toISOString().split('T')[0],
    tags: [],
    author: 'Admin',
    thumbnailUrl: null,
    thumbnailPreview: null,
    sources: [],
    eventIds: [],
    startYear: '',
    startYearEra: 'SCN',
    endYear: '',
    endYearEra: 'SCN',
    summary: '',
    relatedLocations: [],
    relatedCharacters: []
  });
  const [originalData, setOriginalData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          let foundArticle = null;

          if (!isNaN(Number(id))) {
            try {
              const article = await postService.getById(id);
              if (article) {
                foundArticle = article;
              }
            } catch (err) {
              console.error('Lỗi khi tải bài viết từ backend:', err);
            }
          }

          if (foundArticle) {
            setOriginalData(foundArticle);

            const cached = localStorage.getItem(`local_post_relations_${id}`) || localStorage.getItem(`local_post_relations_${foundArticle.slug}`);
            let cachedLocs = [];
            let cachedChars = [];
            let cachedSources = [];
            let cachedTags = null;
            if (cached) {
              const parsed = JSON.parse(cached);
              cachedLocs = parsed.relatedLocations || [];
              cachedChars = parsed.relatedCharacters || [];
              cachedSources = parsed.sources || [];
              cachedTags = parsed.tags || null;
            }

            const extractYearAndEra = (yearVal) => {
              if (yearVal === null || yearVal === undefined || yearVal === '') return { val: '', era: 'SCN' };
              const isNegative = Number(yearVal) < 0;
              const cleanStr = Math.abs(Number(yearVal));
              return { val: cleanStr, era: isNegative ? 'TCN' : 'SCN' };
            };
            const startYearObj = extractYearAndEra(foundArticle.startYear);
            const endYearObj = extractYearAndEra(foundArticle.endYear);

            let periodTags = [];
            if (foundArticle.period) {
              if (typeof foundArticle.period === 'string' && foundArticle.period.startsWith('[') && foundArticle.period.endsWith(']')) {
                try {
                  periodTags = JSON.parse(foundArticle.period);
                } catch(e) {
                  periodTags = [foundArticle.period.replace(/^\["?|"?\]$/g, '').replace(/"/g, '')];
                }
              } else {
                periodTags = [foundArticle.period];
              }
            }

            const backendTags = foundArticle.tags ? (Array.isArray(foundArticle.tags) ? foundArticle.tags.map(t => typeof t === 'object' ? (t.name || t.label || '') : t) : [foundArticle.tags]) : periodTags;
            setForm({
              title: foundArticle.title || '',
              slug: foundArticle.slug || generateSlug(foundArticle.title || ''),
              summary: foundArticle.summary || '',
              content: foundArticle.content || '',
              status: (foundArticle.status === 'published' || !foundArticle?.status || foundArticle.status === 'Công khai' || foundArticle.status === 'PUBLISHED') ? 'published' : 'draft',
              publishedAt: formatDateForInput(foundArticle.publishedAt || foundArticle.published_at),
              tags: cleanArrayData(cachedTags ? [...new Set([...cachedTags, ...backendTags])] : backendTags),
              author: foundArticle.author || 'Admin',
              thumbnailUrl: null,
              thumbnailPreview: foundArticle.image || foundArticle.thumbnailUrl || foundArticle.thumbnail_url || null,
              sources: cleanArrayData([...new Set([...cachedSources, ...(foundArticle.sources || [])])]),
              eventIds: cleanArrayData(foundArticle.events?.map(e => e.id) || (foundArticle.event ? [foundArticle.event.id] : [])),
              startYear: startYearObj.val,
              startYearEra: startYearObj.era,
              endYear: endYearObj.val,
              endYearEra: endYearObj.era,
              relatedLocations: cleanArrayData([...new Set([...cachedLocs, ...(foundArticle.relatedLocations || [])])]),
              relatedCharacters: cleanArrayData([...new Set([...cachedChars, ...(foundArticle.relatedCharacters || [])])])
            });
          } else {
            console.error('Không tìm thấy bài viết với ID:', id);
          }
        } catch (error) {
          console.error('Lỗi tải dữ liệu bài viết:', error);
        }
      };
      fetchData();
    }

    const fetchSources = async () => {
      try {
        const list = await sourceService.listAll();
        setAvailableSources(list);
      } catch (error) {
        console.error('Lỗi tải danh sách nguồn tư liệu:', error);
      }
    };
    fetchSources();

    const fetchTags = async () => {
      try {
        const list = await tagService.listAll();
        setPredefinedTags(list.map(t => ({
          id: t.id,
          label: t.name,
          category: t.type || 'Triều đại'
        })));
      } catch (error) {
        console.error('Lỗi tải danh sách thẻ từ backend:', error);
      }
    };
    fetchTags();

    const fetchEvents = async () => {
      try {
        const list = await eventService.listAll();
        setAvailableEvents(list.map(e => ({
          id: e.id,
          name: e.name || e.title,
          status: 'PUBLISHED'
        })));
      } catch (error) {
        console.error('Lỗi tải danh sách sự kiện:', error);
      }
    };
    fetchEvents();

    const fetchCharacters = async () => {
      try {
        const list = await personService.listAll();
        setAvailableCharacters(list.map(p => ({
          id: p.id,
          name: p.name,
          status: 'PUBLISHED'
        })));
      } catch (error) {
        console.error('Lỗi tải danh sách nhân vật:', error);
      }
    };
    fetchCharacters();

    const fetchLocations = async () => {
      try {
        const list = await locationService.listAll();
        setAvailableLocations(list.map(l => ({
          id: l.id,
          name: l.name,
          status: 'PUBLISHED'
        })));
      } catch (error) {
        console.error('Lỗi tải danh sách di tích:', error);
      }
    };
    fetchLocations();
  }, [id, isEdit]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file định dạng hình ảnh hợp lệ (JPG, PNG, WEBP,...)');
      return;
    }
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({
          ...prev,
          thumbnailUrl: file,
          thumbnailPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddTag = (tagName) => {
    setForm(prev => ({ ...prev, tags: [...new Set([...(prev.tags || []), tagName])] }));
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const validate = () => {
    const newErrors = {};
    const title = (form.title || '').trim();
    if (!title) {
      newErrors.title = 'Vui lòng nhập tiêu đề bài viết';
    } else if (title.length > 100) {
      newErrors.title = 'Tiêu đề không được vượt quá 100 ký tự';
    }

    const slug = (form.slug || generateSlug(title)).trim();
    if (!slug) {
      newErrors.slug = 'Vui lòng nhập đường dẫn (slug)';
    } else if (!validateSlug(slug)) {
      newErrors.slug = 'Slug chỉ gồm chữ thường, số và dấu gạch ngang';
    } else if (slug.length > 200) {
      newErrors.slug = 'Slug không được vượt quá 200 ký tự';
    }

    if (form.startYear !== '' && form.endYear !== '' && !validateYearRange(form.startYear, form.startYearEra, form.endYear, form.endYearEra)) {
      newErrors.yearRange = 'Năm bắt đầu phải nhỏ hơn hoặc bằng năm kết thúc';
    }

    if (!validatePublishDate(form.status, form.publishedAt)) {
      newErrors.publishedAt = 'Ngày xuất bản không hợp lệ';
    }

    setFormErrors(newErrors);
    return { ok: Object.keys(newErrors).length === 0, slug };
  };

  const handleSave = async () => {
    const check = validate();
    if (!check.ok) {
      toast.error('Vui lòng kiểm tra lại các thông tin bị lỗi.');
      return;
    }

    try {
      // Prepare payload to match backend CreatePostRequest/UpdatePostRequest
      const publishedInstant = form.publishedAt
        ? new Date(form.publishedAt).toISOString()
        : new Date().toISOString();

      const tagIds = form.tags
        .map(tagName => {
          const match = predefinedTags.find(pt => pt.label === tagName);
          if (match) return match.id;
          const originalMatch = originalData.tags?.find(t => (t.name || t.label || t) === tagName);
          if (originalMatch) return originalMatch.id;
          return null;
        })
        .filter(id => id !== null)
        .map(Number);

      let finalThumbnailUrl = form.thumbnailPreview;
      if (form.thumbnailUrl instanceof File) {
        try {
          const uploadRes = await uploadFile(form.thumbnailUrl);
          finalThumbnailUrl = typeof uploadRes === 'string' ? uploadRes : (uploadRes?.data?.data?.url || uploadRes?.data?.url || finalThumbnailUrl);
        } catch (uploadErr) {
          console.error('Lỗi khi tải ảnh:', uploadErr);
          toast.error('Không thể tải ảnh lên máy chủ. Vui lòng thử lại.');
          return;
        }
      }

      const payload = {
        title: form.title.trim(),
        slug: check.slug,
        summary: form.summary ? form.summary.trim() : (form.content ? stripHtml(form.content).substring(0, 150) + '...' : ''),
        content: form.content,
        status: form.status === 'published' || form.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        publishedAt: publishedInstant,
        thumbnailUrl: finalThumbnailUrl,
        eventIds: form.eventIds,
        startYear: form.startYear !== '' ? (form.startYearEra === 'TCN' ? -Number(form.startYear) : Number(form.startYear)) : null,
        endYear: form.endYear !== '' ? (form.endYearEra === 'TCN' ? -Number(form.endYear) : Number(form.endYear)) : null,
        tagIds: tagIds,
        relatedLocations: form.relatedLocations,
        relatedCharacters: form.relatedCharacters
      };

      // Cache custom local relations
      const localKey = `local_post_relations_${isEdit ? id : check.slug}`;
      localStorage.setItem(localKey, JSON.stringify({
        relatedLocations: form.relatedLocations,
        relatedCharacters: form.relatedCharacters,
        sources: form.sources,
        tags: form.tags
      }));

      // Go through postService so the service layer owns the HTTP call.
      // Backend PostController.update reads `id` from the request body.
      if (isEdit && !isNaN(Number(id))) {
        await postService.update({ ...payload, id: Number(id) });
      } else {
        await postService.create(payload);
      }

      navigate('/admin/articles');
    } catch (error) {
      console.error('Lỗi khi lưu bài viết:', error);
      const errMsg = extractErrorMessage(error, 'Có lỗi xảy ra khi lưu bài viết!');
      toast.error(errMsg);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-body">
      <FormHeader loading={loading}
        title={isEdit ? 'Hiệu đính Sử liệu' : 'Soạn thảo Bài viết Mới'}
        subtitle='"Ghi chép ngàn năm, lưu truyền vạn thế"'
        icon="history_edu"
        isEdit={isEdit}
        onCancel={() => navigate('/admin/articles')}
        onSave={handleSave}
        status={form.status}
        contentType="article"
      />

      <div className="grid grid-cols-12 gap-8">
        {/* Main Editor Section */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Title Area */}
          <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-6 transition-all hover:shadow-md relative overflow-hidden">
            <div className="absolute -top-12 -right-12 opacity-[0.02] text-primary pointer-events-none">
              <span className="material-symbols-outlined text-[200px]">article</span>
            </div>

            <div className="space-y-2 relative z-10">
              <label className="font-body text-[11px] uppercase font-bold text-on-surface-variant tracking-widest block flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">title</span>
                Tiêu đề sử liệu <span className="text-rose-500">*</span>
              </label>
              <input
                type="text" value={form.title}
                onChange={e => {
                  const newTitle = e.target.value;
                  setForm(prev => ({ ...prev, title: newTitle, slug: generateSlug(newTitle) }));
                  if (formErrors.title) setFormErrors(prev => ({ ...prev, title: null, slug: null }));
                }}
                className={`w-full bg-transparent border-0 border-b py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:font-light ${formErrors.title ? 'border-red-500 focus:border-red-600 placeholder:text-red-400' : 'border-outline-variant/60 focus:border-primary placeholder:text-outline-variant/60'}`}
                placeholder="Nhập tiêu đề trang trọng..."
              />
              {formErrors.title && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {formErrors.title}</p>}
            </div>
            <div className={`flex items-center gap-2 text-on-surface-variant font-body text-[12px] bg-surface-low/50 p-3 rounded-xl border ${formErrors.slug ? 'border-red-500' : 'border-outline-variant/40'}`}>
              <span className="material-symbols-outlined text-[16px] text-primary">link</span>
              <span className="opacity-70 tracking-normal">suviet.vn/bai-viet/</span>
              <input
                type="text" value={form.slug} readOnly
                className="flex-1 bg-transparent outline-none text-primary font-bold cursor-not-allowed opacity-90"
              />
            </div>
            {formErrors.slug && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {formErrors.slug}</p>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-outline-variant/30 mt-4">
              <div className="space-y-2">
                <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Năm bắt đầu</label>
                <div className={`bg-surface-low/50 border rounded-xl overflow-hidden transition-all p-1 h-12 flex items-center ${formErrors.yearRange ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/20' : 'border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'}`}>
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    value={form.startYear}
                    onChange={e => {
                      const rawVal = e.target.value.replace(/\D/g, '');
                      setForm(prev => ({ ...prev, startYear: rawVal ? Math.abs(parseInt(rawVal)) : '' }));
                      if (formErrors.yearRange) setFormErrors(prev => ({ ...prev, yearRange: null }));
                    }}
                    className="flex-grow h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                    placeholder="VD: 938"
                  />
                  <select
                    value={form.startYearEra}
                    onChange={e => {
                        setForm(prev => ({ ...prev, startYearEra: e.target.value }));
                        if (formErrors.yearRange) setFormErrors(prev => ({ ...prev, yearRange: null }));
                    }}
                    className="bg-transparent border-0 border-l border-outline-variant/40 px-2 h-full text-xs font-bold text-primary outline-none cursor-pointer"
                  >
                    <option value="SCN">SCN</option>
                    <option value="TCN">TCN</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Năm kết thúc</label>
                <div className={`bg-surface-low/50 border rounded-xl overflow-hidden transition-all p-1 h-12 flex items-center ${formErrors.yearRange ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/20' : 'border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'}`}>
                  <input
                    type="text" inputMode="numeric" pattern="[0-9]*"
                    value={form.endYear}
                    onChange={e => {
                      const rawVal = e.target.value.replace(/\D/g, '');
                      setForm(prev => ({ ...prev, endYear: rawVal ? Math.abs(parseInt(rawVal)) : '' }));
                      if (formErrors.yearRange) setFormErrors(prev => ({ ...prev, yearRange: null }));
                    }}
                    className="flex-grow h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                    placeholder="VD: 944"
                  />
                  <select
                    value={form.endYearEra}
                    onChange={e => {
                        setForm(prev => ({ ...prev, endYearEra: e.target.value }));
                        if (formErrors.yearRange) setFormErrors(prev => ({ ...prev, yearRange: null }));
                    }}
                    className="bg-transparent border-0 border-l border-outline-variant/40 px-2 h-full text-xs font-bold text-primary outline-none cursor-pointer"
                  >
                    <option value="SCN">SCN</option>
                    <option value="TCN">TCN</option>
                  </select>
                </div>
              </div>
              {formErrors.yearRange && (
                <div className="col-span-1 md:col-span-2 text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {formErrors.yearRange}</div>
              )}
            </div>

            {/* Summary Area */}
            <div className="space-y-2 pt-4 border-t border-outline-variant/30 mt-4">
              <label className="font-body text-[11px] uppercase font-bold text-on-surface-variant tracking-widest block flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary">subject</span>
                Tóm tắt nội dung
              </label>
              <textarea
                value={form.summary}
                onChange={e => setForm(prev => ({ ...prev, summary: e.target.value }))}
                className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-4 font-body text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-outline-variant/60"
                placeholder="Nhập đoạn tóm tắt ngắn (hiển thị in nghiêng có viền vàng trên trang người đọc)..."
                rows="3"
              ></textarea>
            </div>
          </section>

          {/* Content Area */}
          <section className="bg-white rounded-3xl border border-outline-variant/60 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
            <div className="p-4 bg-surface-low/30 border-b border-outline-variant/60 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">edit_document</span>
              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest">Nội dung bài viết</h3>
            </div>
            <RichTextEditor
              value={form.content}
              onChange={(content) => setForm(prev => ({ ...prev, content }))}
              placeholder="Bắt đầu soạn thảo dòng lịch sử..."
              className="min-h-[500px]"
            />
          </section>
        </div>

        {/* Sidebar Section */}
        <aside className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white p-6 border border-outline-variant shadow-sm rounded-3xl sticky top-8 flex flex-col space-y-6 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6b0f0d]/10 rounded-full blur-3xl pointer-events-none"></div>

            <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
              <span className="material-symbols-outlined text-[16px]">tune</span>
              CẤU HÌNH BÀI VIẾT
            </h4>

            {/* 1. TRẠNG THÁI XUẤT BẢN */}
            <div className="space-y-4 relative z-10">
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
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ngày xuất bản</label>
                  <input
                    type="date"
                    value={form.publishedAt}
                    onChange={e => {
                        setForm(prev => ({ ...prev, publishedAt: e.target.value }));
                        if (formErrors.publishedAt) setFormErrors(prev => ({ ...prev, publishedAt: null }));
                    }}
                    className={`w-full bg-surface-low/50 border rounded-xl p-2.5 text-sm font-bold text-on-surface outline-none transition-all ${formErrors.publishedAt ? 'border-red-500 focus:border-red-600 focus:ring-red-500/20' : 'border-outline-variant/60 hover:border-[#6b0f0d] focus:border-[#6b0f0d] focus:ring-2 focus:ring-[#6b0f0d]/20'}`}
                  />
                  {formErrors.publishedAt && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {formErrors.publishedAt}</p>}
                </div>
              </div>
            </div>


            {/* 2. ẢNH BÌA */}
            <div className="pt-2 relative z-10 text-left">
              <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest flex items-center gap-2 border-b border-outline-variant/30 pb-1 mb-3">
                <span className="material-symbols-outlined text-[14px]">image</span> ẢNH BÌA
              </p>
              <ImageUpload
                previewUrl={form.thumbnailPreview}
                onImageChange={handleImageChange}
                onRemove={() => setForm(prev => ({ ...prev, thumbnailUrl: null, thumbnailPreview: null }))}
              />
            </div>

            {/* 3. LIÊN KẾT THÔNG TIN */}
            <div className="space-y-4 pt-2 relative z-10 text-left border-t border-outline-variant/60 mt-4">
              <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest flex items-center gap-2 border-b border-outline-variant/30 pb-1 mb-3">
                <span className="material-symbols-outlined text-[14px]">link</span> LIÊN KẾT THÔNG TIN
              </p>

              {/* THẺ TỪ KHÓA (TAGS) */}
              <div className="pt-2">
                <TagInput
                  tags={form.tags}
                  availableTags={predefinedTags}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                />
              </div>

              {/* DI TÍCH LIÊN QUAN */}
              <div className="pt-2">
                <EntityRelationInput
                  entities={form.relatedLocations || []}
                  availableEntities={availableLocations}
                  type="location"
                  label="Di tích liên quan"
                  icon="explore"
                  itemIcon="explore"
                  placeholder="Gõ hoặc chọn di tích..."
                  onAdd={(val) => setForm(prev => ({ ...prev, relatedLocations: [...new Set([...(prev.relatedLocations || []), val])] }))}
                  onRemove={(val) => setForm(prev => ({ ...prev, relatedLocations: (prev.relatedLocations || []).filter(l => l !== val) }))}
                />
              </div>

              {/* NHÂN VẬT THEN CHỐT / NHÂN VẬT KHÁC */}
              <div className="pt-2">
                <EntityRelationInput
                  entities={form.relatedCharacters || []}
                  availableEntities={availableCharacters}
                  type="character"
                  label="Nhân vật then chốt"
                  icon="person"
                  itemIcon="person"
                  placeholder="Gõ hoặc chọn nhân vật..."
                  onAdd={(val) => setForm(prev => ({ ...prev, relatedCharacters: [...new Set([...(prev.relatedCharacters || []), val])] }))}
                  onRemove={(val) => setForm(prev => ({ ...prev, relatedCharacters: (prev.relatedCharacters || []).filter(c => c !== val) }))}
                />
              </div>

              {/* SỰ KIỆN LỊCH SỬ */}
              <div className="pt-2">
                <EntityRelationInput
                  entities={form.eventIds && form.eventIds.length > 0 ? form.eventIds.map(id =>
                    availableEvents.find(e => e.id === id)?.name ||
                    originalData.events?.find(e => e.id === id)?.name
                  ).filter(Boolean) : []}
                  availableEntities={availableEvents}
                  type="event"
                  label="Sự kiện lịch sử"
                  icon="event"
                  itemIcon="event"
                  placeholder="Gõ hoặc chọn sự kiện..."
                  onAdd={(val) => {
                    const match = availableEvents.find(e => (e.name || e.title) === val);
                    if (match) {
                      setForm(prev => ({
                        ...prev,
                        eventIds: [...new Set([...(prev.eventIds || []), match.id])]
                      }));
                    }
                  }}
                  onRemove={(val) => {
                    const match = availableEvents.find(e => (e.name || e.title) === val);
                    if (match) {
                      setForm(prev => ({
                        ...prev,
                        eventIds: (prev.eventIds || []).filter(id => id !== match.id)
                      }));
                    }
                  }}
                />
              </div>

              {/* NGUỒN THAM KHẢO */}
              <div className="pt-2">
                <EntityRelationInput
                  entities={form.sources.map(s => s.title || s.name || s)}
                  availableEntities={availableSources}
                  type="source"
                  label="Nguồn tham khảo"
                  icon="menu_book"
                  itemIcon="menu_book"
                  placeholder="Gõ hoặc chọn nguồn sử liệu..."
                  onAdd={(val) => {
                    const match = availableSources.find(s => (s.title || s.name) === val);
                    if (match) {
                      setForm(prev => ({
                        ...prev,
                        sources: [...(prev.sources || []), match]
                      }));
                    }
                  }}
                  onRemove={(entToRemove) => {
                    setForm(prev => ({
                      ...prev,
                      sources: prev.sources.filter(s => (s.title || s.name || s) !== entToRemove)
                    }));
                  }}
                />
              </div>

            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ArticleForm;
