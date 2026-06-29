import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug, stripHtml } from '../../../utils/stringUtils';
import { RichTextEditor, ImageUpload, TagInput, FormHeader, EntityRelationInput } from '../../../components/admin';
import { mockClient, extractErrorMessage, postService, tagService, eventService, sourceService, personService, locationService, API_ENDPOINTS } from '../../../services';

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

const ArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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
    eventId: null,
    relatedLocations: [],
    relatedCharacters: []
  });
  const [originalData, setOriginalData] = useState({});

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

            const cached = localStorage.getItem(`local_post_relations_${id}`);
            let cachedLocs = [];
            let cachedChars = [];
            if (cached) {
              const parsed = JSON.parse(cached);
              cachedLocs = parsed.relatedLocations || [];
              cachedChars = parsed.relatedCharacters || [];
            }

            setForm(prev => ({
              ...prev,
              title: foundArticle.title || '',
              slug: foundArticle.slug || generateSlug(foundArticle.title || ''),
              content: foundArticle.content || '',
              status: (foundArticle.status === 'published' || !foundArticle.status || foundArticle.status === 'Công khai' || foundArticle.status === 'PUBLISHED') ? 'published' : 'draft',
              publishedAt: formatDateForInput(foundArticle.publishedAt || foundArticle.published_at),
              tags: foundArticle.tags ? (Array.isArray(foundArticle.tags) ? foundArticle.tags.map(t => typeof t === 'object' ? (t.name || t.label || '') : t) : [foundArticle.tags]) : (foundArticle.period ? [foundArticle.period] : []),
              author: foundArticle.author || 'Admin',
              thumbnailUrl: null,
              thumbnailPreview: foundArticle.image || foundArticle.thumbnailUrl || foundArticle.thumbnail_url || null,
              sources: foundArticle.sources || [],
              eventId: foundArticle.event?.id || foundArticle.eventId || null,
              relatedLocations: cachedLocs.length > 0 ? cachedLocs : (foundArticle.relatedLocations || []),
              relatedCharacters: cachedChars.length > 0 ? cachedChars : (foundArticle.relatedCharacters || [])
            }));
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
        console.error('Lỗi tải danh sách thẻ từ backend, thử dùng mock:', error);
        try {
          const response = await mockClient.get('/api/admin_metadata.json');
          if (response.data?.tags) {
            setPredefinedTags(response.data.tags.map(t => ({
              id: t.id,
              label: t.name,
              category: t.type || 'Triều đại'
            })));
          }
        } catch (e) {
          console.error('Lỗi tải danh sách thẻ:', e);
        }
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
        console.error('Lỗi tải danh sách địa danh:', error);
      }
    };
    fetchLocations();
  }, [id, isEdit]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(prev => ({
        ...prev,
        thumbnailUrl: file,
        thumbnailPreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleAddTag = (tagName) => {
    setForm(prev => ({ ...prev, tags: [...new Set([...(prev.tags || []), tagName])] }));
  };

  const handleRemoveTag = (tagToRemove) => {
    setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const validate = () => {
    const errors = [];
    const title = (form.title || '').trim();
    if (!title) {
      errors.push('Tiêu đề là bắt buộc');
    } else if (title.length > 100) {
      errors.push('Tiêu đề không được vượt quá 100 ký tự');
    }

    const slug = (form.slug || generateSlug(title)).trim();
    if (!slug) {
      errors.push('Slug là bắt buộc');
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      errors.push('Slug chỉ gồm chữ thường, số và dấu gạch ngang');
    } else if (slug.length > 200) {
      errors.push('Slug không được vượt quá 200 ký tự');
    }

    if (form.thumbnailPreview && typeof form.thumbnailPreview === 'string' && form.thumbnailPreview.length > 1000) {
      errors.push('URL ảnh bìa không được vượt quá 1000 ký tự');
    }

    return { ok: errors.length === 0, errors, slug };
  };

  const handleSave = async () => {
    const check = validate();
    if (!check.ok) {
      alert(check.errors.join('\n'));
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

      const payload = {
        title: form.title.trim(),
        slug: check.slug,
        summary: form.content ? stripHtml(form.content).substring(0, 150) + '...' : '',
        content: form.content,
        status: form.status === 'published' || form.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
        publishedAt: publishedInstant,
        thumbnailUrl: typeof form.thumbnailPreview === 'string' && form.thumbnailPreview.startsWith('http') ? form.thumbnailPreview : null,
        eventId: form.eventId,
        tagIds: tagIds,
        relatedLocations: form.relatedLocations,
        relatedCharacters: form.relatedCharacters
      };

      // Cache custom local relations
      const localKey = `local_post_relations_${isEdit ? id : check.slug}`;
      localStorage.setItem(localKey, JSON.stringify({
        relatedLocations: form.relatedLocations,
        relatedCharacters: form.relatedCharacters
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
      alert(errMsg);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 font-body">
      <FormHeader
        title={isEdit ? 'Hiệu đính Sử liệu' : 'Soạn thảo Bài viết Mới'}
        subtitle='"Ghi chép ngàn năm, lưu truyền vạn thế"'
        icon="history_edu"
        isEdit={isEdit}
        onCancel={() => navigate('/admin/articles')}
        onSave={handleSave}
        saveText="Xuất bản"
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
                }}
                className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 placeholder:font-light"
                placeholder="Nhập tiêu đề trang trọng..."
              />
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant font-body text-[12px] bg-surface-low/50 p-3 rounded-xl border border-outline-variant/40">
              <span className="material-symbols-outlined text-[16px] text-primary">link</span>
              <span className="opacity-70 tracking-normal">suviet.vn/bai-viet/</span>
              <input
                type="text" value={form.slug} readOnly
                className="flex-1 bg-transparent outline-none text-primary font-bold cursor-not-allowed opacity-90"
              />
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
              className="h-[600px] flex flex-col custom-quill"
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

            {/* 1. XUẤT BẢN / TRẠNG THÁI */}
            <div className="space-y-4 relative z-10">
              <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest flex items-center gap-2 border-b border-outline-variant/30 pb-1">
                <span className="material-symbols-outlined text-[14px]">publish</span> XUẤT BẢN / TRẠNG THÁI
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
                    onChange={e => setForm(prev => ({ ...prev, publishedAt: e.target.value }))}
                    className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-sm font-bold text-on-surface outline-none hover:border-[#6b0f0d] focus:border-[#6b0f0d] focus:ring-2 focus:ring-[#6b0f0d]/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 2. ẢNH BÌA */}
            <div className="space-y-3">
              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10 w-full">
                <span className="material-symbols-outlined text-[16px]">image</span> ẢNH BÌA
              </h4>
              <ImageUpload
                previewUrl={form.thumbnailPreview}
                onImageChange={handleImageChange}
                onRemove={() => setForm(prev => ({ ...prev, thumbnailUrl: null, thumbnailPreview: null }))}
              />
            </div>

            {/* 3. LIÊN KẾT THÔNG TIN */}
            <div className="space-y-4 pt-2 border-t border-outline-variant/60">
              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10 w-full">
                <span className="material-symbols-outlined text-[16px]">link</span> LIÊN KẾT THÔNG TIN
              </h4>

              {/* TRIỂU ĐẠI */}
              <div className="pt-2">
                <TagInput
                  tags={form.tags}
                  availableTags={predefinedTags}
                  onAddTag={handleAddTag}
                  onRemoveTag={handleRemoveTag}
                />
              </div>

              {/* ĐỊA DANH LIÊN QUAN */}
              <div className="pt-2">
                <EntityRelationInput
                  entities={form.relatedLocations || []}
                  availableEntities={availableLocations}
                  type="location"
                  label="Địa danh liên quan"
                  icon="explore"
                  itemIcon="explore"
                  placeholder="Gõ hoặc chọn địa danh..."
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
                  entities={form.eventId ? [
                    availableEvents.find(e => e.id === form.eventId)?.name ||
                    (originalData.event?.id === form.eventId ? originalData.event?.name : null)
                  ].filter(Boolean) : []}
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
                        eventId: match.id
                      }));
                    }
                  }}
                  onRemove={() => {
                    setForm(prev => ({
                      ...prev,
                      eventId: null
                    }));
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