import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { validateSlug } from '../../../utils/validation';
import { RichTextEditor, FormHeader, EntityRelationInput, TagInput } from '../../../components/admin';
import UserVietnamMap from '../../../components/VietnamMap';
import { getXPercent, getYPercent } from '../../../utils/mapCoordinates';
import { locationService, eventService, extractErrorMessage, personService, postService, sourceService, periodService, apiClient } from '../../../services';
import toast from 'react-hot-toast';

const LocationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', slug: '', locationType: 'Cố đô/Thành quách', latitude: '', longitude: '', description: '', status: 'draft',
    dynasty: [], tags: [], relatedEvents: [], relatedCharacters: [], relatedArticles: [], sources: [],
    imageUrl: ''
  });
  const [originalData, setOriginalData] = useState({
    originalEvents: []
  });
  const [availableEvents, setAvailableEvents] = useState([]);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [availableArticles, setAvailableArticles] = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        let eventsList = [];
        try {
          eventsList = await eventService.listAll({ size: 500 });
        } catch (err) {
          console.error('Lỗi khi tải danh sách sự kiện:', err);
        }

        const mappedEvents = eventsList.map(e => ({
          id: e.id,
          name: e.name || e.title,
          locationRelations: e.locationRelations || []
        }));
        setAvailableEvents(mappedEvents);

        const [chars, arts, srcs, periodsList] = await Promise.all([
          personService.listAll().catch(() => []),
          postService.listAll().catch(() => []),
          sourceService.listAll().catch(() => []),
          periodService.listAll().catch(() => [])
        ]);
        setAvailableCharacters(chars.map(c => ({ id: c.id, name: c.name, status: 'PUBLISHED' })));
        setAvailableArticles(arts.map(a => ({ id: a.id, name: a.title, status: 'PUBLISHED' })));
        setAvailableSources(srcs.map(s => ({ id: s.id, name: s.title || s.name, status: 'PUBLISHED' })));
        setAvailablePeriods(periodsList.filter(p => p.status === 'PUBLISHED' || !p.status).map(p => p.name));

        try {
          const tagRes = await apiClient.get('/api/v1/admin/tags', { params: { size: 500 } }).catch(() => null);
          const tagList = tagRes?.data?.data?.result || tagRes?.data?.data?.content || tagRes?.data || [];
          setAvailableTags(tagList.map(t => ({
            id: t.id,
            label: t.name,
            category: t.type || 'Khác'
          })));
        } catch (e) {
          console.error('Lỗi tải tags:', e);
        }

        if (isEdit) {
          let foundLocation = null;

          if (!isNaN(Number(id))) {
            try {
              foundLocation = await locationService.getById(Number(id));
            } catch (err) {
              console.error('Lỗi khi tải di tích từ backend:', err);
            }
          }

          if (foundLocation) {
            let initialLat = foundLocation.lat || foundLocation.latitude || '';
            let initialLng = foundLocation.lng || foundLocation.longitude || '';
            if (foundLocation.coords && typeof foundLocation.coords === 'string') {
              const [latStr, lngStr] = foundLocation.coords.split(',');
              if (latStr && lngStr) {
                initialLat = latStr.trim();
                initialLng = lngStr.trim();
              }
            }

            const matchedEvents = mappedEvents
              .filter(e => e.locationRelations.some(rel => Number(rel.locationId) === Number(foundLocation.id)))
              .map(e => e.name);

            const cached = localStorage.getItem(`local_location_relations_${id}`);
            let cachedDynasty = [];
            let cachedCharacters = [];
            let cachedArticles = [];
            let cachedSources = [];
            let cachedTags = [];
            if (cached) {
              const parsed = JSON.parse(cached);
              cachedDynasty = parsed.dynasty || [];
              cachedCharacters = parsed.relatedCharacters || [];
              cachedArticles = parsed.relatedArticles || [];
              cachedSources = parsed.sources || [];
              cachedTags = parsed.tags || [];
            }

            setForm({
              name: foundLocation.name || '',
              slug: foundLocation.slug || generateSlug(foundLocation.name || ''),
              locationType: foundLocation.type || foundLocation.locationType || 'Cố đô/Thành quách',
              latitude: initialLat,
              longitude: initialLng,
              description: foundLocation.description || foundLocation.shortDesc || '',
              status: (foundLocation.status === 'published' || !foundLocation.status || foundLocation.status === 'Công khai' || foundLocation.status === 'PUBLISHED') ? 'published' : 'draft',
              dynasty: [...new Set([...cachedDynasty, ...(foundLocation.dynasty ? (Array.isArray(foundLocation.dynasty) ? foundLocation.dynasty : [foundLocation.dynasty]) : [])])],
              tags: cachedTags,
              relatedEvents: matchedEvents,
              relatedCharacters: [...new Set([...cachedCharacters, ...(foundLocation.relatedCharacters || [])])],
              relatedArticles: [...new Set([...cachedArticles, ...(foundLocation.relatedArticles || [])])],
              sources: [...new Set([...cachedSources, ...(foundLocation.sources || [])])],
              imageUrl: foundLocation.imageUrl || foundLocation.image || '',
              version: foundLocation?.version || 0
            });

            setOriginalData({
              ...foundLocation,
              originalEvents: matchedEvents
            });
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu di tích:', error);
      }
    };
    loadAllData();
  }, [id, isEdit]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addEvent = (eventVal) => {
    setForm(prev => ({
      ...prev,
      relatedEvents: [...new Set([...(prev.relatedEvents || []), eventVal])]
    }));
  };

  const removeEvent = (eventToRemove) => {
    setForm(prev => ({
      ...prev,
      relatedEvents: (prev.relatedEvents || []).filter(e => e !== eventToRemove)
    }));
  };

  const updateEventLocationRelations = async (eventMatch, locationId, isAdd) => {
    try {
      const fullEvent = await eventService.getById(eventMatch.id);
      if (!fullEvent) return;

      let updatedRelations = [];
      if (fullEvent.locationRelations) {
        updatedRelations = fullEvent.locationRelations.map(r => ({
          locationId: Number(r.locationId),
          relationType: r.relationType || 'LOCATED'
        }));
      }

      if (isAdd) {
        const exists = updatedRelations.some(r => Number(r.locationId) === Number(locationId));
        if (!exists) {
          updatedRelations.push({
            locationId: Number(locationId),
            relationType: 'LOCATED'
          });
        }
      } else {
        updatedRelations = updatedRelations.filter(r => Number(r.locationId) !== Number(locationId));
      }

      const eventPayload = {
        name: fullEvent.name,
        slug: fullEvent.slug,
        description: fullEvent.description,
        periodId: fullEvent.period ? fullEvent.period.id : null,
        startYear: fullEvent.startYear,
        endYear: fullEvent.endYear,
        startDate: fullEvent.startDate,
        endDate: fullEvent.endDate,
        certaintyLevel: fullEvent.certaintyLevel || 'CERTAIN',
        locationRelations: updatedRelations
      };

      await eventService.update(fullEvent.id, eventPayload);
    } catch (err) {
      console.error(`Lỗi khi cập nhật quan hệ sự kiện ${eventMatch.name}:`, err);
    }
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.name?.trim()) newErrors.name = 'Vui lòng nhập tên di tích.';
    if (!form.slug?.trim()) {
      newErrors.slug = 'Vui lòng nhập đường dẫn (slug).';
    } else if (!validateSlug(form.slug)) {
      newErrors.slug = 'Slug chỉ gồm chữ thường, số và dấu gạch ngang.';
    }
    if (form.status === 'published' && (!form.description || !form.description.trim())) {
      newErrors.description = 'Không thể xuất bản: Thiếu tóm tắt.';
    }

    let parsedLat = null;
    let parsedLng = null;

    if (form.latitude) {
      parsedLat = parseFloat(form.latitude);
      if (isNaN(parsedLat)) newErrors.latitude = 'Vĩ độ phải là một số.';
      else if (parsedLat < 8 || parsedLat > 24) newErrors.latitude = 'Vĩ độ phải nằm trong khoảng [8, 24].';
    }

    if (form.longitude) {
      parsedLng = parseFloat(form.longitude);
      if (isNaN(parsedLng)) newErrors.longitude = 'Kinh độ phải là một số.';
      else if (parsedLng < 102 || parsedLng > 110) newErrors.longitude = 'Kinh độ phải nằm trong khoảng [102, 110].';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error('Vui lòng kiểm tra lại các trường bị lỗi.');
      return;
    }
    setFormErrors({});

    setLoading(true);
    try {
      // Map frontend location type to backend enum
      let backendType = 'CITY';
      const typeMap = {
        'Cố đô / Thành quách': 'CAPITAL',
        'Cố đô/Thành quách': 'CAPITAL',
        'Ải / Chiến trường': 'BATTLEFIELD',
        'Di tích tôn giáo': 'TEMPLE',
        'Làng nghề truyền thống': 'PROVINCE'
      };
      if (typeMap[form.locationType]) {
        backendType = typeMap[form.locationType];
      }

      const payload = {
        name: form.name.trim(),
        slug: form.slug,
        locationType: backendType,
        latitude: parsedLat,
        longitude: parsedLng,
        description: form.description,
        status: (form.status === 'published' || form.status === 'Công khai' || form.status === 'PUBLISHED') ? 'PUBLISHED' : 'DRAFT',
        dynasty: form.dynasty || [],
        imageUrl: form.imageUrl || null
      };

      let savedLocationId = Number(id);
      if (isEdit && !isNaN(Number(id))) {
        await locationService.update(Number(id), payload);
      } else {
        const newLocation = await locationService.create(payload);
        if (newLocation && newLocation.id) {
          savedLocationId = Number(newLocation.id);
        }
      }

      // Sync relationships
      if (!isNaN(savedLocationId)) {
        try {
          const originalEvents = originalData.originalEvents || [];
          const selectedEvents = form.relatedEvents || [];

          const toDelete = originalEvents.filter(name => !selectedEvents.includes(name));
          const toAdd = selectedEvents.filter(name => !originalEvents.includes(name));

          // Run sync for deletions
          for (const name of toDelete) {
            const eventMatch = availableEvents.find(e => e.name === name);
            if (eventMatch) {
              await updateEventLocationRelations(eventMatch, savedLocationId, false);
            }
          }

          // Run sync for additions
          for (const name of toAdd) {
            const eventMatch = availableEvents.find(e => e.name === name);
            if (eventMatch) {
              await updateEventLocationRelations(eventMatch, savedLocationId, true);
            }
          }
        } catch (syncErr) {
          console.error('Lỗi khi đồng bộ sự kiện liên quan:', syncErr);
        }

        // Cache custom local relations
        const localKey = `local_location_relations_${isEdit ? id : savedLocationId}`;
        localStorage.setItem(`local_location_relations_${savedLocationId}`, JSON.stringify({
          dynasty: form.dynasty,
          tags: form.tags,
          relatedCharacters: form.relatedCharacters,
          relatedArticles: form.relatedArticles,
          sources: form.sources
        }));
      }

      navigate('/admin/locations');
    } catch (error) {
      console.error('Lỗi khi lưu di tích:', error);
      if (error?.response?.data && typeof error.response.data === 'object' && error.response.data.errors) {
        const backendErrors = {};
        Object.keys(error.response.data.errors).forEach(key => {
          backendErrors[key] = error.response.data.errors[key];
        });
        setFormErrors(backendErrors);
        toast.error('Dữ liệu không hợp lệ, vui lòng kiểm tra lại!');
      } else {
        const errMsg = extractErrorMessage(error, 'Có lỗi xảy ra khi lưu di tích!');
        toast.error(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow bg-surface min-h-screen animate-in fade-in duration-500 pb-20">
      <main className="p-8 max-w-6xl mx-auto space-y-8 font-body">

        <FormHeader loading={loading}
          title={isEdit ? 'Chỉnh sửa Di tích' : 'Thêm Di tích Mới'}
          subtitle="Quản lý thông tin di tích, di tích và vị trí lịch sử trong hệ thống Sử Việt."
          icon="my_location"
          isEdit={isEdit}
          onCancel={() => navigate('/admin/locations')}
          onSave={handleSave}
          status={form.status}
          contentType="location"
        />

        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* SECTION 1: IDENTITY & COORDS */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-8 relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute -top-12 -right-12 opacity-[0.02] text-primary pointer-events-none">
                <span className="material-symbols-outlined text-[200px]">map</span>
              </div>

              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest pb-3 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-primary text-[18px]">share_location</span>
                Danh tính & Tọa độ
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Tên di tích lịch sử *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => {
                      const newName = e.target.value;
                      setForm(prev => ({ ...prev, name: newName, slug: generateSlug(newName) }));
                      if (formErrors.name) setFormErrors(prev => ({ ...prev, name: null, slug: null }));
                    }}
                    className={`w-full bg-transparent border-0 border-b py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:font-light ${formErrors.name ? 'border-red-500 focus:border-red-600 placeholder:text-red-400' : 'border-outline-variant/60 focus:border-primary placeholder:text-outline-variant/60'
                      }`}
                    placeholder="Ví dụ: Hoàng Thành Thăng Long..."
                  />
                  {formErrors.name && (
                    <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">error</span> {formErrors.name}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-surface-low/30 border border-outline-variant/40 rounded-xl p-3 text-on-surface-variant font-body text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-primary/60">link</span>
                  <span className="opacity-60 lowercase tracking-normal italic">suviet.vn/dia-danh/</span>
                  <input
                    type="text"
                    value={form.slug}
                    readOnly
                    className={`flex-1 bg-transparent border-none outline-none font-bold placeholder:text-outline-variant/40 ${formErrors.slug ? 'text-red-500' : 'text-indigo-700'
                      }`}
                    placeholder="hoang-thanh-thang-long"
                  />
                </div>
                {formErrors.slug && (
                  <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span> {formErrors.slug}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-outline-variant/30">
                  <div className="space-y-2">
                    <label className="block font-body text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Loại hình</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <select
                        value={form.locationType}
                        onChange={e => setForm(prev => ({ ...prev, locationType: e.target.value }))}
                        className="w-full h-full bg-transparent border-none px-2 text-[11px] font-bold text-on-surface outline-none cursor-pointer"
                      >
                        <option>Cố đô / Thành quách</option>
                        <option>Ải / Chiến trường</option>
                        <option>Di tích tôn giáo</option>
                        <option>Làng nghề truyền thống</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-body text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Vĩ độ (Lat)</label>
                    <div className={`bg-surface-low/50 border rounded-xl overflow-hidden transition-all p-1 h-12 ${formErrors.latitude ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/20' : 'border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
                      }`}>
                      <input
                        type="number"
                        min="8" max="24"
                        value={form.latitude}
                        onChange={e => {
                          setForm(prev => ({ ...prev, latitude: e.target.value }));
                          if (formErrors.latitude) setFormErrors(prev => ({ ...prev, latitude: null }));
                        }}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold"
                        placeholder="21.03"
                      />
                    </div>
                    {formErrors.latitude && (
                      <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">error</span> {formErrors.latitude}
                      </p>
                    )}
                    {!formErrors.latitude && form.latitude && (isNaN(parseFloat(form.latitude)) || parseFloat(form.latitude) < 8.1 || parseFloat(form.latitude) > 23.4) && (
                      <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">error</span> Vĩ độ phải nằm trong khoảng [8.1, 23.4] (Việt Nam)
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block font-body text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Kinh độ (Long)</label>
                    <div className={`bg-surface-low/50 border rounded-xl overflow-hidden transition-all p-1 h-12 ${formErrors.longitude ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-500/20' : 'border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
                      }`}>
                      <input
                        type="number"
                        min="102" max="110"
                        value={form.longitude}
                        onChange={e => {
                          setForm(prev => ({ ...prev, longitude: e.target.value }));
                          if (formErrors.longitude) setFormErrors(prev => ({ ...prev, longitude: null }));
                        }}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold"
                        placeholder="105.83"
                      />
                    </div>
                    {formErrors.longitude && (
                      <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">error</span> {formErrors.longitude}
                      </p>
                    )}
                    {!formErrors.longitude && form.longitude && (isNaN(parseFloat(form.longitude)) || parseFloat(form.longitude) < 102.1 || parseFloat(form.longitude) > 109.5) && (
                      <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">error</span> Kinh độ phải nằm trong khoảng [102.1, 109.5] (Việt Nam)
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </section>

            {/* SECTION 2: DESCRIPTION */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-6 transition-all hover:shadow-md">
              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">history_edu</span>
                Diễn giải Lịch sử & Bối cảnh
              </h3>

              <div className="space-y-2">
                <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest opacity-0 h-0 overflow-hidden">Trình soạn thảo</label>
                <div className={`rounded-2xl overflow-hidden border transition-all bg-surface-low/30 ${formErrors.description ? 'border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20' : 'border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20'
                  }`}>
                  <RichTextEditor
                    value={form.description}
                    onChange={(description) => {
                      setForm(prev => ({ ...prev, description }));
                      if (formErrors.description) setFormErrors(prev => ({ ...prev, description: null }));
                    }}
                    placeholder="Viết mô tả chi tiết về các sự kiện lịch sử đã diễn ra tại di tích này..."
                    className="min-h-[300px]"
                  />
                </div>
                {formErrors.description && (
                  <p className="text-[10px] text-rose-600 font-bold mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">error</span> {formErrors.description}
                  </p>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: PREVIEW & MAP */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-6 border border-outline-variant shadow-sm rounded-3xl sticky top-8 flex flex-col space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6b0f0d]/10 rounded-full blur-3xl pointer-events-none"></div>

              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] pb-3 flex items-center justify-center gap-2 text-center relative z-10">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                CẤU HÌNH DI TÍCH
              </h4>

              {/* 1. TRẠNG THÁI XUẤT BẢN */}
              <div className="space-y-4 relative z-10 text-left">
                <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest flex items-center gap-2 pb-1">
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

              {/* 1.5. ẢNH ĐẠI DIỆN */}
              <div className="pt-2 relative z-10 text-left border-t border-outline-variant/60 mt-4">
                <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest flex items-center gap-2 pb-1 mb-3">
                  <span className="material-symbols-outlined text-[14px]">image</span> ẢNH ĐẠI DIỆN
                </p>
                <div
                  className="aspect-video w-full mx-auto rounded-2xl bg-surface-low border-4 border-white shadow-lg flex flex-col items-center justify-center text-on-surface-variant hover:text-[#6b0f0d] hover:border-[#6b0f0d]/50 transition-all group overflow-hidden relative cursor-pointer mb-2"
                  onClick={() => document.getElementById('image-upload').click()}
                >
                  {form.imageUrl ? (
                    <>
                      <img
                        src={form.imageUrl}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        alt="Preview"
                      />
                      <div className="absolute inset-0 bg-surface/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-2xl mb-1 text-rose-600">delete</span>
                        <p
                          onClick={(e) => {
                            e.stopPropagation();
                            setForm(prev => ({ ...prev, imageUrl: '' }));
                          }}
                          className="text-[9px] font-bold uppercase tracking-widest text-rose-600 hover:underline"
                        >
                          Xóa ảnh
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-transparent opacity-70 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-2xl mb-1 text-[#6b0f0d]">add_photo_alternate</span>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-[#6b0f0d]">Tải lên ảnh bìa</p>
                    </div>
                  )}
                </div>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  onChange={handleImageUpload}
                  accept=".jpg,.jpeg,.png,.webp"
                />
              </div>

              {/* 2. BẢN XEM TRƯỚC VỊ TRÍ */}
              <div className="pt-2 relative z-10 text-left border-t border-outline-variant/60 mt-4">
                <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest flex items-center gap-2 pb-1 mb-3">
                  <span className="material-symbols-outlined text-[14px]">visibility</span> BẢN XEM TRƯỚC VỊ TRÍ
                </p>

                {/* DYNAMIC CONTENT */}
                <div className="flex flex-col items-center relative text-center">
                  <div className="absolute inset-0 bg-[#6b0f0d]/5 rounded-full blur-3xl -z-10"></div>

                  <div className="px-4 py-1.5 text-white text-[10px] font-bold rounded-full mb-3 uppercase tracking-widest shadow-sm ring-2 ring-white/50 bg-gradient-to-r from-[#6b0f0d] to-amber-700">
                    {form.locationType || 'Loại hình'}
                  </div>

                  <h4 className="font-headline text-2xl font-bold bg-gradient-to-r from-gray-900 to-[#6b0f0d] bg-clip-text text-transparent transition-all duration-300 mb-2">
                    {form.name || 'Tên Di tích'}
                  </h4>

                  <p className="font-body text-xs text-on-surface-variant italic leading-relaxed px-4 opacity-80 font-bold mb-3">
                    {form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : 'Chưa nhập tọa độ'}
                  </p>
                </div>

                {/* MINI MAP */}
                <div className="aspect-[4/3] rounded-2xl bg-[#fffdf8] border-2 border-dashed border-outline-variant/60 overflow-hidden relative cursor-pointer group hover:border-[#6b0f0d]/50 transition-all flex items-center justify-center">
                  <div className="relative h-full aspect-square">
                    <UserVietnamMap className="absolute inset-0 w-full h-full opacity-90 group-hover:scale-105 transition-transform duration-[5s] drop-shadow-[0_10px_20px_rgba(158,27,27,0.15)]" />

                    {form.latitude && form.longitude && (
                      <div
                        className="absolute w-3 h-3 rounded-full bg-[#9e1b1b] shadow-sm z-10 border border-white group-hover:scale-105 transition-transform duration-[5s]"
                        style={{
                          left: `${getXPercent(form.longitude)}%`,
                          top: `${getYPercent(form.latitude)}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    )}
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur p-2 rounded text-[9px] font-bold border border-outline-variant uppercase shadow-sm z-20 text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Bản đồ Di tích Tổng hợp</div>
                </div>

                <div className="p-4 bg-surface-low/50 rounded-xl border border-dashed border-outline-variant/60 text-[11px] text-on-surface-variant leading-relaxed font-body italic text-center">
                  Tọa độ này sẽ được sử dụng để ghim di tích lên bản đồ lịch sử tương tác 3D.
                </div>
              </div>

              {/* 3. LIÊN KẾT THÔNG TIN */}
              <div className="space-y-4 pt-2 relative z-10 text-left border-t border-outline-variant/60 mt-4">
                <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest flex items-center gap-2 pb-1 mb-3">
                  <span className="material-symbols-outlined text-[14px]">link</span> LIÊN KẾT THÔNG TIN
                </p>

                {/* TRIỀU ĐẠI / THỜI KỲ */}
                <div className="pt-2">
                  <TagInput
                    label="Triều đại / Thời kỳ"
                    tags={form.dynasty}
                    availableTags={availablePeriods}
                    onAddTag={(tag) => setForm(prev => ({ ...prev, dynasty: [...new Set([...(prev.dynasty || []), tag])] }))}
                    onRemoveTag={(tag) => setForm(prev => ({ ...prev, dynasty: prev.dynasty.filter(t => t !== tag) }))}
                  />
                </div>

                {/* THẺ TỪ KHÓA (TAGS) */}
                <div className="pt-2">
                  <TagInput
                    label="Thẻ (Tags)"
                    tags={form.tags}
                    availableTags={availableTags}
                    onAddTag={(tag) => setForm(prev => ({ ...prev, tags: [...new Set([...(prev.tags || []), tag])] }))}
                    onRemoveTag={(tag) => setForm(prev => ({ ...prev, tags: (prev.tags || []).filter(t => t !== tag) }))}
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
                    label="Sự kiện diễn ra tại đây"
                    icon="event"
                    itemIcon="event"
                    entities={form.relatedEvents}
                    availableEntities={availableEvents}
                    onAdd={addEvent}
                    onRemove={removeEvent}
                    placeholder="Gõ & Enter để thêm sự kiện..."
                  />
                </div>

                {/* BÀI VIẾT LIÊN QUAN */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="article"
                    label="Bài viết liên quan"
                    icon="article"
                    itemIcon="article"
                    entities={form.relatedArticles || []}
                    availableEntities={availableArticles}
                    onAdd={(val) => setForm(prev => ({ ...prev, relatedArticles: [...new Set([...(prev.relatedArticles || []), val])] }))}
                    onRemove={(val) => setForm(prev => ({ ...prev, relatedArticles: (prev.relatedArticles || []).filter(a => a !== val) }))}
                  />
                </div>

                {/* NGUỒN THAM KHẢO */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="source"
                    label="Nguồn tham khảo"
                    icon="menu_book"
                    itemIcon="menu_book"
                    entities={form.sources || []}
                    availableEntities={availableSources}
                    onAdd={(val) => setForm(prev => ({ ...prev, sources: [...new Set([...(prev.sources || []), val])] }))}
                    onRemove={(val) => setForm(prev => ({ ...prev, sources: (prev.sources || []).filter(s => s !== val) }))}
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

export default LocationForm;
