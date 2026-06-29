import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { RichTextEditor, EntityRelationInput, FormHeader, TagInput } from '../../../components/admin';
import {
  apiClient,
  mockClient,
  extractErrorMessage,
  locationService,
  personService,
  periodService,
  eventService,
  postService,
  sourceService,
  API_ENDPOINTS
} from '../../../services';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    startYear: '',
    startYearEra: 'SCN',
    endYear: '',
    endYearEra: 'SCN',
    description: '',
    dynasty: [],
    status: 'Bản nháp',
    relatedLocations: [],
    relatedCharacters: [],
    relatedArticles: [],
    sources: []
  });

  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [availableArticles, setAvailableArticles] = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          let foundEvent = null;

          if (!isNaN(Number(id))) {
            try {
              foundEvent = await eventService.getById(Number(id));
              if (foundEvent) {
                try {
                  const partRes = await apiClient.get('/api/v1/admin/participations', {
                    params: { eventId: id, size: 500 }
                  });
                  const partData = partRes.data?.data?.result || partRes.data?.data || [];
                  foundEvent.relatedCharacters = partData.map(p => p.person?.name).filter(Boolean);
                  foundEvent.originalParticipations = partData;
                } catch (partErr) {
                  console.error('Lỗi khi tải danh sách tham gia từ backend:', partErr);
                }
              }
            } catch (err) {
              console.error('Lỗi khi tải sự kiện từ backend:', err);
            }
          }

          // Removed localStorage fallback check

          if (!foundEvent) {
            const response = await mockClient.get('/api/admin_events.json');
            foundEvent = response.data.events?.find(e => String(e.id) === String(id) || String(e.id).endsWith('-' + id));
          }

          if (foundEvent) {
            setOriginalData(foundEvent);
            const extractYearAndEra = (dateStr, fallbackYear) => {
              if (!dateStr) {
                if (fallbackYear !== undefined && fallbackYear !== null && fallbackYear !== '') {
                  const val = Math.abs(parseInt(fallbackYear));
                  const era = parseInt(fallbackYear) < 0 ? 'TCN' : 'SCN';
                  return { val, era };
                }
                return { val: '', era: 'SCN' };
              }
              const isNegative = dateStr.startsWith('-');
              const cleanStr = isNegative ? dateStr.substring(1) : dateStr;
              const parts = cleanStr.split('-');
              if (parts[0]) {
                const y = parseInt(parts[0]);
                if (!isNaN(y)) {
                  return { val: y, era: isNegative ? 'TCN' : 'SCN' };
                }
              }
              return { val: '', era: 'SCN' };
            };
            const sYearObj = extractYearAndEra(foundEvent.startDate, foundEvent.startYear);
            const eYearObj = extractYearAndEra(foundEvent.endDate, foundEvent.endYear);

            const cached = localStorage.getItem(`local_event_relations_${id}`);
            let cachedArticles = [];
            let cachedSources = [];
            if (cached) {
              const parsed = JSON.parse(cached);
              cachedArticles = parsed.relatedArticles || [];
              cachedSources = parsed.sources || [];
            }

            setFormData(prev => ({
              ...prev,
              name: foundEvent.name || foundEvent.title || '',
              slug: foundEvent.slug || generateSlug(foundEvent.name || foundEvent.title || ''),
              startYear: sYearObj.val,
              startYearEra: sYearObj.era,
              endYear: eYearObj.val,
              endYearEra: eYearObj.era,
              description: foundEvent.description || foundEvent.content || '',
              dynasty: foundEvent.period ? [foundEvent.period.name] : (foundEvent.dynasties ? foundEvent.dynasties : (foundEvent.dynasty ? (Array.isArray(foundEvent.dynasty) ? foundEvent.dynasty : [foundEvent.dynasty]) : [])),
              status: (foundEvent.status === 'published' || !foundEvent.status || foundEvent.status === 'PUBLISHED') ? 'Công khai' : 'Bản nháp',
              content: foundEvent.description || foundEvent.content || '',
              relatedLocations: foundEvent.locationRelations ? foundEvent.locationRelations.map(l => l.name) : (foundEvent.relatedLocations || foundEvent.relatedLocation || []),
              relatedCharacters: foundEvent.relatedCharacters || foundEvent.relatedCharacter || [],
              relatedArticles: cachedArticles.length > 0 ? cachedArticles : (foundEvent.relatedArticles || []),
              sources: cachedSources.length > 0 ? cachedSources : (foundEvent.sources || [])
            }));
          }
        } catch (error) {
          console.error('Lỗi tải dữ liệu sự kiện:', error);
        }
      };
      fetchData();
    }

    const fetchAvailableData = async () => {
      try {
        const [locData, charData, periodsList, artData, srcData] = await Promise.all([
          locationService.listAll({ size: 500 }),
          personService.listAll({ size: 500 }),
          periodService.listAll({ size: 500 }),
          postService.listAll().catch(() => []),
          sourceService.listAll().catch(() => [])
        ]);

        setAvailableLocations(locData.map(l => ({
          id: l.id,
          name: l.name,
          type: l.locationType || 'UNKNOWN',
          coords: `${l.latitude || 0}, ${l.longitude || 0}`,
          description: l.description || '',
          status: 'PUBLISHED'
        })));

        setAvailableCharacters(charData.map(c => ({
          ...c,
          title: c.alias || '',
          years: `${c.birthDate ? new Date(c.birthDate).getFullYear() : '?'} - ${c.deathDate ? new Date(c.deathDate).getFullYear() : '?'}`,
          dynasty: c.dynasty || 'Chưa rõ',
          status: c.status || 'published'
        })));

        setAvailableArticles(artData.map(a => ({
          id: a.id,
          name: a.title,
          status: 'PUBLISHED'
        })));

        setAvailableSources(srcData.map(s => ({
          id: s.id,
          name: s.title || s.name,
          status: 'PUBLISHED'
        })));

        setPeriods(periodsList);
        setAvailablePeriods(periodsList.map(p => p.name));
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu liên kết từ backend, dùng mock làm dự phòng:', error);
        try {
          const [locRes, charRes, periodsRes] = await Promise.all([
            mockClient.get('/api/admin_locations.json').then(r => r.data),
            mockClient.get('/api/admin_characters.json').then(r => r.data),
            mockClient.get('/api/user_periods.json').then(r => r.data)
          ]);
          setAvailableLocations(locRes.locations || []);
          setAvailableCharacters(charRes.characters || []);
          const mockPeriodsList = (periodsRes || []).map(p => ({
            ...p,
            id: p.id || p.period_id
          }));
          setAvailablePeriods(mockPeriodsList.map(p => p.name) || []);
          setPeriods(mockPeriodsList || []);
        } catch (e) {
          console.error('Lỗi khi tải dữ liệu mock làm dự phòng:', e);
        }
      }
    };
    fetchAvailableData();
  }, [id, isEdit]);

  const removeLocation = (locToRemove) => {
    setFormData(prev => ({
      ...prev,
      relatedLocations: prev.relatedLocations.filter(l => l !== locToRemove)
    }));
  };

  const addLocation = (loc) => {
    setFormData(prev => ({
      ...prev,
      relatedLocations: [...new Set([...(prev.relatedLocations || []), loc])]
    }));
  };

  const removeCharacter = (charToRemove) => {
    setFormData(prev => ({
      ...prev,
      relatedCharacters: prev.relatedCharacters.filter(c => c !== charToRemove)
    }));
  };

  const addCharacter = (char) => {
    setFormData(prev => ({
      ...prev,
      relatedCharacters: [...new Set([...(prev.relatedCharacters || []), char])]
    }));
  };

  const handleAddDynasty = (tag) => {
    setFormData(prev => ({ ...prev, dynasty: [tag] }));
  };

  const handleRemoveDynasty = (tag) => {
    setFormData(prev => ({ ...prev, dynasty: prev.dynasty.filter(t => t !== tag) }));
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên sự kiện.');
      return;
    }

    if (formData.startYear !== '' && formData.startYear !== null && formData.startYear !== undefined) {
      const sYear = parseInt(formData.startYear, 10);
      if (isNaN(sYear) || sYear < 0) {
        alert('Năm bắt đầu phải là số nguyên dương lớn hơn hoặc bằng 0.');
        return;
      }
    }
    if (formData.endYear !== '' && formData.endYear !== null && formData.endYear !== undefined) {
      const eYear = parseInt(formData.endYear, 10);
      if (isNaN(eYear) || eYear < 0) {
        alert('Năm kết thúc phải là số nguyên dương lớn hơn hoặc bằng 0.');
        return;
      }
    }

    if (formData.startYear !== '' && formData.startYear !== null && formData.startYear !== undefined &&
      formData.endYear !== '' && formData.endYear !== null && formData.endYear !== undefined) {
      const sYear = parseInt(formData.startYear, 10);
      const eYear = parseInt(formData.endYear, 10);
      const startVal = formData.startYearEra === 'TCN' ? -sYear : sYear;
      const endVal = formData.endYearEra === 'TCN' ? -eYear : eYear;
      if (startVal > endVal) {
        alert('Lỗi hợp lệ: Năm bắt đầu không thể diễn ra sau năm kết thúc.');
        return;
      }
    }

    try {
      let startYear = formData.startYear !== '' ? parseInt(formData.startYear) : null;
      if (startYear !== null && formData.startYearEra === 'TCN') {
        startYear = -startYear;
      }
      let endYear = formData.endYear !== '' ? parseInt(formData.endYear) : null;
      if (endYear !== null && formData.endYearEra === 'TCN') {
        endYear = -endYear;
      }

      let selectedPeriodId = null;
      if (formData.dynasty && formData.dynasty.length > 0) {
        const selectedPeriodName = formData.dynasty[0];
        const matchedPeriod = periods.find(p => p.name === selectedPeriodName);
        if (matchedPeriod) {
          selectedPeriodId = matchedPeriod.id;
        }
      }

      const locationRelations = (formData.relatedLocations || [])
        .map(locName => {
          const match = availableLocations.find(l => l.name === locName);
          if (match) return { locationId: match.id, relationType: 'HAPPENED_AT' };
          const originalMatch = originalData.locationRelations?.find(l => l.name === locName);
          if (originalMatch) return { locationId: originalMatch.locationId || originalMatch.id, relationType: originalMatch.relationType || 'HAPPENED_AT' };
          return null;
        })
        .filter(rel => rel !== null);

      let startDate = null;
      let endDate = null;
      if (formData.startYear !== '' && formData.startYear !== null) {
        const sYear = parseInt(formData.startYear);
        if (!isNaN(sYear) && sYear >= 0) {
          const sign = formData.startYearEra === 'TCN' ? '-' : '';
          startDate = `${sign}${String(sYear).padStart(4, '0')}-01-01`;
        }
      }
      if (formData.endYear !== '' && formData.endYear !== null) {
        const eYear = parseInt(formData.endYear);
        if (!isNaN(eYear) && eYear >= 0) {
          const sign = formData.endYearEra === 'TCN' ? '-' : '';
          endDate = `${sign}${String(eYear).padStart(4, '0')}-01-01`;
        }
      }

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        periodId: selectedPeriodId,
        startYear: startYear,
        endYear: endYear,
        startDate: startDate,
        endDate: endDate,
        certaintyLevel: 'CERTAIN',
        locationRelations: locationRelations
      };

      let savedEventId = Number(id);
      if (isEdit && !isNaN(Number(id))) {
        await eventService.update(Number(id), payload);
      } else {
        const newEvent = await eventService.create(payload);
        if (newEvent && newEvent.id) {
          savedEventId = Number(newEvent.id);
        }
      }

      if (!isNaN(savedEventId)) {
        try {
          const originalParts = originalData.originalParticipations || [];
          const selectedNames = formData.relatedCharacters || [];

          const toDelete = originalParts.filter(p => !selectedNames.includes(p.person?.name));

          const currentNames = originalParts.map(p => p.person?.name);
          const toAdd = selectedNames.filter(name => !currentNames.includes(name));

          for (const p of toDelete) {
            await apiClient.delete(`/api/v1/admin/participations/${p.id}`);
          }

          for (const name of toAdd) {
            const charMatch = availableCharacters.find(c => c.name === name);
            if (charMatch) {
              await apiClient.post('/api/v1/admin/participations', {
                eventId: savedEventId,
                personId: Number(charMatch.id),
                role: 'KEY_FIGURE'
              });
            }
          }
        } catch (syncErr) {
          console.error('Lỗi khi đồng bộ danh sách tham gia:', syncErr);
        }

        // Cache custom local relations
        const localKey = `local_event_relations_${isEdit ? id : savedEventId}`;
        localStorage.setItem(localKey, JSON.stringify({
          relatedArticles: formData.relatedArticles,
          sources: formData.sources
        }));
      }

      navigate('/admin/events');
    } catch (error) {
      console.error('Lỗi khi lưu sự kiện vào backend:', error);
      const errMsg = extractErrorMessage(error, 'Có lỗi xảy ra khi lưu sự kiện!');
      alert(errMsg);
    }
  };

  return (
    <div className="flex-grow bg-surface min-h-screen animate-in fade-in duration-500 pb-20">
      <main className="p-8 max-w-7xl mx-auto space-y-8 font-body">

        <FormHeader
          title={isEdit ? 'Chỉnh sửa Sự kiện' : 'Thêm Sự kiện Mới'}
          subtitle="Cập nhật chi tiết diễn biến, kết quả và ý nghĩa của sự kiện lịch sử."
          icon="event_note"
          isEdit={isEdit}
          onCancel={() => navigate('/admin/events')}
          onSave={handleSave}
        />

        <div className="grid grid-cols-12 gap-8 items-start">

          {/* CỘT TRÁI: FORM CHÍNH */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* SECTION 1: IDENTITY */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-8 relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute -top-12 -right-12 opacity-[0.02] text-primary pointer-events-none">
                <span className="material-symbols-outlined text-[200px]">event</span>
              </div>

              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-primary text-[18px]">event_note</span>
                Thông tin Sự kiện
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Tên sự kiện lịch sử *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => {
                      const newName = e.target.value;
                      setFormData(prev => ({ ...prev, name: newName, slug: generateSlug(newName) }));
                    }}
                    className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 placeholder:font-light"
                    placeholder="Ví dụ: Định đô Thăng Long..."
                  />
                </div>

                <div className="flex items-center gap-3 bg-surface-low/30 border border-outline-variant/40 rounded-xl p-3 text-on-surface-variant font-body text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-primary/60">link</span>
                  <span className="opacity-60 lowercase tracking-normal italic">suviet.vn/su-kien/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    readOnly
                    className="flex-1 bg-transparent border-none outline-none font-bold text-indigo-700 placeholder:text-outline-variant/40"
                    placeholder="dinh-do-thang-long"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-outline-variant/30">
                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Năm bắt đầu</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12 flex items-center">
                      <input
                        type="number"
                        value={formData.startYear}
                        onChange={e => setFormData(prev => ({ ...prev, startYear: e.target.value }))}
                        className="flex-grow h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                        placeholder="VD: 1010"
                      />
                      <select
                        value={formData.startYearEra}
                        onChange={e => setFormData(prev => ({ ...prev, startYearEra: e.target.value }))}
                        className="bg-transparent border-0 border-l border-outline-variant/40 px-2 h-full text-xs font-bold text-primary outline-none cursor-pointer"
                      >
                        <option value="SCN">SCN</option>
                        <option value="TCN">TCN</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Năm kết thúc</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12 flex items-center">
                      <input
                        type="number"
                        value={formData.endYear}
                        onChange={e => setFormData(prev => ({ ...prev, endYear: e.target.value }))}
                        className="flex-grow h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                        placeholder="VD: 1025"
                      />
                      <select
                        value={formData.endYearEra}
                        onChange={e => setFormData(prev => ({ ...prev, endYearEra: e.target.value }))}
                        className="bg-transparent border-0 border-l border-outline-variant/40 px-2 h-full text-xs font-bold text-primary outline-none cursor-pointer"
                      >
                        <option value="SCN">SCN</option>
                        <option value="TCN">TCN</option>
                      </select>
                    </div>
                  </div>
                </div>



              </div>
            </section>

            {/* SECTION 2: BIOGRAPHY */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-6 transition-all hover:shadow-md">
              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">history_edu</span>
                Diễn biến chi tiết
              </h3>

              <div className="space-y-2">
                <div className="rounded-2xl overflow-hidden border border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-surface-low/30">
                  <RichTextEditor
                    value={formData.description}
                    onChange={(description) => setFormData(prev => ({ ...prev, description }))}
                    placeholder="Bắt đầu ghi chép sử liệu chi tiết tại đây..."
                    className="min-h-[500px]"
                  />
                </div>
              </div>
            </section>

          </div>

          {/* CỘT PHẢI: LIÊN KẾT */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-6 border border-outline-variant shadow-sm rounded-3xl sticky top-8 flex flex-col space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6b0f0d]/10 rounded-full blur-3xl pointer-events-none"></div>

              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                CẤU HÌNH SỰ KIỆN
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
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-sm font-bold text-on-surface outline-none cursor-pointer hover:border-[#6b0f0d] focus:border-[#6b0f0d] focus:ring-2 focus:ring-[#6b0f0d]/20 transition-all appearance-none"
                      >
                        <option>Bản nháp</option>
                        <option>Công khai</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. ẢNH BÌA/ẢNH ĐẠI DIỆN / BẢN XEM TRƯỚC (Hidden for Events as there is no thumbnail support) */}

              {/* 3. LIÊN KẾT THÔNG TIN */}
              <div className="space-y-4 pt-2 border-t border-outline-variant/60">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10 w-full">
                  <span className="material-symbols-outlined text-[16px]">link</span> LIÊN KẾT THÔNG TIN
                </h4>

                {/* TRIỂU ĐẠI */}
                <div className="pt-2">
                  <TagInput
                    tags={formData.dynasty}
                    availableTags={availablePeriods.length > 0 ? availablePeriods : ['Nhà Lý', 'Nhà Trần', 'Nhà Lê', 'Nhà Nguyễn', 'Bắc Thuộc']}
                    onAddTag={handleAddDynasty}
                    onRemoveTag={handleRemoveDynasty}
                  />
                </div>

                {/* ĐỊA DANH LIÊN QUAN */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="location"
                    label="Địa danh liên quan"
                    icon="location_on"
                    entities={formData.relatedLocations}
                    availableEntities={availableLocations}
                    onAdd={addLocation}
                    onRemove={removeLocation}
                  />
                </div>

                {/* BÀI VIẾT LIÊN QUAN */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="article"
                    label="Bài viết liên quan"
                    icon="article"
                    itemIcon="article"
                    entities={formData.relatedArticles || []}
                    availableEntities={availableArticles}
                    onAdd={(val) => setFormData(prev => ({ ...prev, relatedArticles: [...new Set([...(prev.relatedArticles || []), val])] }))}
                    onRemove={(val) => setFormData(prev => ({ ...prev, relatedArticles: (prev.relatedArticles || []).filter(a => a !== val) }))}
                  />
                </div>

                {/* NHÂN VẬT THEN CHỐT / NHÂN VẬT KHÁC */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="character"
                    label="Nhân vật then chốt"
                    icon="groups"
                    itemIcon="person"
                    entities={formData.relatedCharacters}
                    availableEntities={availableCharacters}
                    onAdd={addCharacter}
                    onRemove={removeCharacter}
                  />
                </div>

                {/* NGUỒN THAM KHẢO */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="source"
                    label="Nguồn tham khảo"
                    icon="menu_book"
                    itemIcon="menu_book"
                    entities={formData.sources || []}
                    availableEntities={availableSources}
                    onAdd={(val) => setFormData(prev => ({ ...prev, sources: [...new Set([...(prev.sources || []), val])] }))}
                    onRemove={(val) => setFormData(prev => ({ ...prev, sources: (prev.sources || []).filter(s => s !== val) }))}
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

export default EventForm;