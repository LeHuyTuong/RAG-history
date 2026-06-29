import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { RichTextEditor, TagInput, EntityRelationInput, FormHeader } from '../../../components/admin';
import { mockClient, apiClient, extractErrorMessage, API_ENDPOINTS, postService, sourceService } from '../../../services';
import CharacterFamilyTree, { HISTORICAL_MOCK_RELATIONS, normalizeKey } from '../../../components/character/CharacterFamilyTree';

const CharacterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    id: null,
    name: '', title: '', slug: '', birthYear: '', birthYearEra: 'SCN', deathYear: '', deathYearEra: 'SCN', biography: '', tags: [],
    relatedLocations: [], relatedCharacters: [], avatar: '', status: 'draft',
    parents: [], siblings: [], family: [],
    relatedEvents: [], relatedArticles: [], sources: []
  });

  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [availableEvents, setAvailableEvents] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableArticles, setAvailableArticles] = useState([]);
  const [availableSources, setAvailableSources] = useState([]);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [locRes, charRes, metaRes, eventRes, artRes, srcRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.ADMIN_LOCATIONS, { params: { size: 500 } }).catch(() => null),
          apiClient.get(API_ENDPOINTS.ADMIN_CHARACTERS, { params: { size: 500 } }).catch(() => null),
          apiClient.get(API_ENDPOINTS.ADMIN_PERIODS, { params: { size: 500 } }).catch(() => null),
          apiClient.get(API_ENDPOINTS.ADMIN_EVENTS, { params: { size: 500 } }).catch(() => null),
          postService.listAll().catch(() => []),
          sourceService.listAll().catch(() => [])
        ]);

        const artList = artRes || [];
        setAvailableArticles(artList.map(a => ({
          id: a.id,
          name: a.title,
          status: 'PUBLISHED'
        })));

        const srcList = srcRes || [];
        setAvailableSources(srcList.map(s => ({
          id: s.id,
          name: s.title || s.name,
          status: 'PUBLISHED'
        })));

        const locData = locRes?.data?.data?.result || locRes?.data?.data?.content || [];
        setAvailableLocations(locData.map(l => ({
          id: l.id,
          name: l.name,
          type: l.locationType || 'UNKNOWN',
          coords: `${l.latitude || 0}, ${l.longitude || 0}`,
          description: l.description || '',
          status: 'PUBLISHED'
        })));

        const charData = charRes?.data?.data?.result || charRes?.data?.data?.content || [];
        setAvailableCharacters(charData.map(c => ({
          ...c,
          title: c.alias || '',
          years: `${c.birthDate ? new Date(c.birthDate).getFullYear() : '?'} - ${c.deathDate ? new Date(c.deathDate).getFullYear() : '?'}`,
          dynasty: c.dynasty || 'Chưa rõ',
          status: c.status || 'published'
        })));

        const periodsList = metaRes?.data?.data?.result || metaRes?.data?.data || [];
        const periodsNames = periodsList.map(p => p.name);
        setAvailableTags(periodsNames);

        const eventData = eventRes?.data?.data?.result || eventRes?.data?.data?.content || [];
        const mappedEvents = eventData.map(e => ({
          id: e.id,
          name: e.name || e.title,
          period: e.period,
          status: 'PUBLISHED'
        }));
        setAvailableEvents(mappedEvents);

        // Load character details if in edit mode
        if (isEdit) {
          let foundChar = null;
          let mockChar = null;

          try {
            const mockRes = await mockClient.get('/api/admin_characters.json');
            mockChar = mockRes.data.characters?.find(c => String(c.id) === String(id) || c.slug === id);
          } catch (err) {
            console.error('Lỗi khi tải nhân vật mock:', err);
          }

          if (!isNaN(Number(id))) {
            try {
              const response = await apiClient.get(`${API_ENDPOINTS.ADMIN_CHARACTERS}/${id}`);
              const data = response.data?.data || response.data;
              if (data) {
                foundChar = {
                  ...mockChar,
                  ...data
                };
                try {
                  const partRes = await apiClient.get('/api/v1/admin/participations', {
                    params: { personId: id, size: 500 }
                  });
                  const partData = partRes.data?.data?.result || partRes.data?.data || [];
                  foundChar.relatedEvents = partData.map(p => p.event?.name).filter(Boolean);
                  foundChar.originalParticipations = partData;
                } catch (partErr) {
                  console.error('Lỗi khi tải danh sách tham gia của nhân vật:', partErr);
                }
              }
            } catch (err) {
              console.error('Lỗi khi tải nhân vật từ API:', err);
            }
          }

          if (!foundChar) {
            foundChar = mockChar;
          }

          if (foundChar) {
            setOriginalData(foundChar);
            const extractYearAndEra = (dateStr) => {
              if (!dateStr) return { val: '', era: 'SCN' };
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
            const birthYearObj = extractYearAndEra(foundChar.birthDate);
            const deathYearObj = extractYearAndEra(foundChar.deathDate);

            // Compute dynasties from mock data + participations
            const dyns = new Set();
            if (foundChar.dynasties) {
              foundChar.dynasties.forEach(d => dyns.add(d));
            } else if (foundChar.dynasty) {
              dyns.add(foundChar.dynasty);
            }
            if (foundChar.originalParticipations) {
              foundChar.originalParticipations.forEach(p => {
                const eventMatch = mappedEvents.find(e => e.id === p.event?.id);
                if (eventMatch && eventMatch.period?.name) {
                  dyns.add(eventMatch.period.name);
                }
              });
            }
            const computedDynasties = Array.from(dyns);

            const cached = localStorage.getItem(`local_char_relations_${id}`);
            let cachedArticles = [];
            let cachedSources = [];
            if (cached) {
              const parsed = JSON.parse(cached);
              cachedArticles = parsed.relatedArticles || [];
              cachedSources = parsed.sources || [];
            }

            const mockKey = foundChar.slug || generateSlug(foundChar.name || '');
            const mockMatch = HISTORICAL_MOCK_RELATIONS[mockKey] || HISTORICAL_MOCK_RELATIONS[normalizeKey(foundChar.name)] || {};

            setForm(prev => ({
              ...prev,
              id: foundChar.id || null,
              name: foundChar.name || '',
              slug: foundChar.slug || generateSlug(foundChar.name || ''),
              realName: foundChar.realName || '',
              title: foundChar.title || foundChar.role || '',
              birthYear: birthYearObj.val,
              birthYearEra: birthYearObj.era,
              deathYear: deathYearObj.val,
              deathYearEra: deathYearObj.era,
              dynasty: computedDynasties.length > 0 ? computedDynasties[0] : 'Khác',
              avatar: foundChar.avatar || null,
              biography: foundChar.biography || foundChar.content || '',
              tags: computedDynasties,
              status: (foundChar.status === 'published' || !foundChar.status || foundChar.status === 'Công khai') ? 'published' : 'draft',
              relatedLocations: foundChar.relatedLocations || foundChar.relatedLocation || [],
              relatedCharacters: foundChar.relatedCharacters || foundChar.relatedCharacter || [],
              parents: (foundChar.parents && foundChar.parents.length > 0) ? foundChar.parents : (foundChar.parent && foundChar.parent.length > 0) ? foundChar.parent : mockMatch.parents || [],
              siblings: (foundChar.siblings && foundChar.siblings.length > 0) ? foundChar.siblings : mockMatch.siblings || [],
              family: (foundChar.family && foundChar.family.length > 0) ? foundChar.family : mockMatch.family || [],
              relatedEvents: foundChar.relatedEvents || [],
              relatedArticles: cachedArticles.length > 0 ? cachedArticles : (foundChar.relatedArticles || []),
              sources: cachedSources.length > 0 ? cachedSources : (foundChar.sources || [])
            }));
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải toàn bộ dữ liệu:', error);
      }
    };
    loadAllData();
  }, [id, isEdit]);

  const removeLocation = (locToRemove) => {
    setForm(prev => ({
      ...prev,
      relatedLocations: prev.relatedLocations.filter(l => l !== locToRemove)
    }));
  };

  const addLocation = (loc) => {
    setForm(prev => ({
      ...prev,
      relatedLocations: [...new Set([...(prev.relatedLocations || []), loc])]
    }));
  };

  const removeCharacter = (charToRemove) => {
    setForm(prev => ({
      ...prev,
      relatedCharacters: prev.relatedCharacters.filter(c => c !== charToRemove)
    }));
  };

  const addCharacter = (char) => {
    setForm(prev => ({
      ...prev,
      relatedCharacters: [...new Set([...(prev.relatedCharacters || []), char])]
    }));
  };

  const removeTag = (tagToRemove) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleAddTag = (tagName) => {
    setForm(prev => ({ ...prev, tags: [...new Set([...(prev.tags || []), tagName])] }));
  };

  const handleSave = async () => {
    // Validation
    if (!form.name || !form.slug) {
      alert('Vui lòng điền các trường bắt buộc (*)');
      return;
    }

    if (form.birthYear !== '' && form.birthYear !== null && form.birthYear !== undefined) {
      const bYear = parseInt(form.birthYear, 10);
      if (isNaN(bYear) || bYear < 0) {
        alert('Năm sinh phải là số nguyên dương lớn hơn hoặc bằng 0.');
        return;
      }
    }
    if (form.deathYear !== '' && form.deathYear !== null && form.deathYear !== undefined) {
      const dYear = parseInt(form.deathYear, 10);
      if (isNaN(dYear) || dYear < 0) {
        alert('Năm mất phải là số nguyên dương lớn hơn hoặc bằng 0.');
        return;
      }
    }

    if (form.birthYear !== '' && form.birthYear !== null && form.birthYear !== undefined &&
      form.deathYear !== '' && form.deathYear !== null && form.deathYear !== undefined) {
      const bYear = parseInt(form.birthYear, 10);
      const dYear = parseInt(form.deathYear, 10);
      const birthVal = form.birthYearEra === 'TCN' ? -bYear : bYear;
      const deathVal = form.deathYearEra === 'TCN' ? -dYear : dYear;
      if (birthVal > deathVal) {
        alert('Lỗi hợp lệ: Năm sinh không thể diễn ra sau năm mất.');
        return;
      }
    }

    try {

      let birthDate = null;
      let deathDate = null;
      if (form.birthYear !== '' && form.birthYear !== null) {
        const bYear = parseInt(form.birthYear);
        if (!isNaN(bYear) && bYear >= 0) {
          const sign = form.birthYearEra === 'TCN' ? '-' : '';
          birthDate = `${sign}${String(bYear).padStart(4, '0')}-01-01`;
        }
      }
      if (form.deathYear !== '' && form.deathYear !== null) {
        const dYear = parseInt(form.deathYear);
        if (!isNaN(dYear) && dYear >= 0) {
          const sign = form.deathYearEra === 'TCN' ? '-' : '';
          deathDate = `${sign}${String(dYear).padStart(4, '0')}-01-01`;
        }
      }

      const payload = {
        name: form.name,
        slug: form.slug,
        alias: form.title || '',
        biography: form.biography || '',
        birthDate: birthDate,
        deathDate: deathDate
      };

      let savedPersonId = Number(id);
      if (isEdit && !isNaN(Number(id))) {
        await apiClient.put(`${API_ENDPOINTS.ADMIN_CHARACTERS}/${id}`, payload);
      } else {
        const res = await apiClient.post(API_ENDPOINTS.ADMIN_CHARACTERS, payload);
        const newPerson = res.data?.data || res.data;
        if (newPerson && newPerson.id) {
          savedPersonId = Number(newPerson.id);
        }
      }

      if (!isNaN(savedPersonId)) {
        try {
          const originalParts = originalData.originalParticipations || [];
          const selectedNames = form.relatedEvents || [];

          const toDelete = originalParts.filter(p => !selectedNames.includes(p.event?.name));

          const currentNames = originalParts.map(p => p.event?.name);
          const toAdd = selectedNames.filter(name => !currentNames.includes(name));

          for (const p of toDelete) {
            await apiClient.delete(`/api/v1/admin/participations/${p.id}`);
          }

          for (const name of toAdd) {
            const eventMatch = availableEvents.find(e => e.name === name);
            if (eventMatch) {
              await apiClient.post('/api/v1/admin/participations', {
                eventId: Number(eventMatch.id),
                personId: savedPersonId,
                role: 'KEY_FIGURE'
              });
            }
          }
        } catch (syncErr) {
          console.error('Lỗi khi đồng bộ danh sách tham gia của nhân vật:', syncErr);
        }

        const localKey = `local_char_relations_${isEdit ? id : savedPersonId}`;
        localStorage.setItem(localKey, JSON.stringify({
          relatedArticles: form.relatedArticles,
          sources: form.sources
        }));
      }

      navigate('/admin/characters');
    } catch (error) {
      console.error('Lỗi khi lưu nhân vật:', error);
      const errMsg = extractErrorMessage(error, 'Có lỗi xảy ra khi lưu nhân vật. Vui lòng thử lại.');
      alert(errMsg);
    }
  };

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

  return (
    <div className="flex-grow bg-surface min-h-screen animate-in fade-in duration-500 pb-20">
      <main className="p-8 max-w-7xl mx-auto space-y-8 font-body">

        <FormHeader
          title={isEdit ? 'Chỉnh sửa Hồ sơ' : 'Hồ sơ Nhân vật Lịch sử'}
          subtitle="Kiến tạo bản ghi điện tử cho nhân vật trong hệ thống Sử Việt."
          icon="person_check"
          isEdit={isEdit}
          onCancel={() => navigate('/admin/characters')}
          onSave={handleSave}
        />

        <div className="grid grid-cols-12 gap-8 items-start">

          {/* CỘT TRÁI: FORM CHÍNH */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* SECTION 1: IDENTITY */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-8 relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute -top-12 -right-12 opacity-[0.02] text-primary pointer-events-none">
                <span className="material-symbols-outlined text-[200px]">account_box</span>
              </div>

              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                Thông tin Căn bản
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Tên nhân vật *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => {
                      const newName = e.target.value;
                      setForm(prev => ({ ...prev, name: newName, slug: generateSlug(newName) }));
                    }}
                    className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 placeholder:font-light"
                    placeholder="Ví dụ: Trần Hưng Đạo..."
                  />
                </div>

                <div className="flex items-center gap-3 bg-surface-low/30 border border-outline-variant/40 rounded-xl p-3 text-on-surface-variant font-body text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-primary/60">link</span>
                  <span className="opacity-60 lowercase tracking-normal italic">suviet.vn/nhan-vat/</span>
                  <input
                    type="text"
                    value={form.slug}
                    readOnly
                    className="flex-1 bg-transparent border-none outline-none font-bold text-indigo-700 placeholder:text-outline-variant/40"
                    placeholder="tran-hung-dao"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-outline-variant/30">
                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Biệt hiệu / Tôn hiệu</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-[13px] outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                        placeholder="Vd: Hưng Đạo Đại Vương"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Năm sinh</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12 flex items-center">
                      <input
                        type="number"
                        value={form.birthYear}
                        onChange={e => setForm(prev => ({ ...prev, birthYear: e.target.value }))}
                        className="flex-grow h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                        placeholder="Vd: 1228"
                      />
                      <select
                        value={form.birthYearEra}
                        onChange={e => setForm(prev => ({ ...prev, birthYearEra: e.target.value }))}
                        className="bg-transparent border-0 border-l border-outline-variant/40 px-2 h-full text-xs font-bold text-primary outline-none cursor-pointer"
                      >
                        <option value="SCN">SCN</option>
                        <option value="TCN">TCN</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Năm mất</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12 flex items-center">
                      <input
                        type="number"
                        value={form.deathYear}
                        onChange={e => setForm(prev => ({ ...prev, deathYear: e.target.value }))}
                        className="flex-grow h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                        placeholder="Vd: 1300"
                      />
                      <select
                        value={form.deathYearEra}
                        onChange={e => setForm(prev => ({ ...prev, deathYearEra: e.target.value }))}
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
                Tiểu sử & Sự nghiệp
              </h3>

              <div className="space-y-2">
                <div className="rounded-2xl overflow-hidden border border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-surface-low/30">
                  <RichTextEditor
                    value={form.biography}
                    onChange={(biography) => setForm(prev => ({ ...prev, biography }))}
                    placeholder="Viết tóm tắt về cuộc đời và sự nghiệp của nhân vật..."
                    className="min-h-[300px]"
                  />
                </div>
              </div>
            </section>

            {/* SECTION 3: INTERACTIVE FAMILY TREE EDITOR */}
            <section className="bg-white p-8 rounded-3xl border border-[#d99b4a]/25 shadow-sm space-y-6 transition-all hover:shadow-md">
              <CharacterFamilyTree
                character={form}
                relations={{ parents: form.parents || [], siblings: form.siblings || [], family: form.family || [] }}
                isAdminEditMode={true}
                onAddRelation={(category, name, relation) => setForm(prev => {
                  let mappedCategory = category;
                  if (category === 'spouse' || category === 'children') {
                    mappedCategory = 'family';
                  }
                  return {
                    ...prev,
                    [mappedCategory]: [...(prev[mappedCategory] || []), { name, relation }]
                  };
                })}
                onRemoveRelation={(category, name) => setForm(prev => {
                  let mappedCategory = category;
                  if (category === 'spouse' || category === 'children') {
                    mappedCategory = 'family';
                  }
                  return {
                    ...prev,
                    [mappedCategory]: (prev[mappedCategory] || []).filter(item => item.name !== name)
                  };
                })}
              />
            </section>
          </div>

          {/* CỘT PHẢI: LIÊN KẾT & TAGS */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-6 border border-outline-variant shadow-sm rounded-3xl sticky top-8 flex flex-col space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6b0f0d]/10 rounded-full blur-3xl pointer-events-none"></div>

              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                CẤU HÌNH NHÂN VẬT
              </h4>

              {/* 1. XUẤT BẢN / TRẠNG THÁI */}
              <div className="space-y-4 relative z-10 text-left">
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
                </div>
              </div>

              {/* 2. ẢNH ĐẠI DIỆN */}
              <div className="space-y-3">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10 w-full">
                  <span className="material-symbols-outlined text-[16px]">image</span> ẢNH ĐẠI DIỆN
                </h4>
                <div
                  className="aspect-square w-48 mx-auto rounded-[2rem] bg-surface-low border-4 border-white shadow-lg flex flex-col items-center justify-center text-on-surface-variant hover:text-[#6b0f0d] hover:border-[#6b0f0d]/50 transition-all group overflow-hidden relative cursor-pointer mb-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img
                    src={form.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                    alt="Character Avatar"
                  />
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-2xl mb-1 text-[#6b0f0d]">cloud_upload</span>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-[#6b0f0d]">Đổi ảnh</p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
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
                    availableTags={availableTags}
                    onAddTag={handleAddTag}
                    onRemoveTag={removeTag}
                  />
                </div>

                {/* ĐỊA DANH LIÊN QUAN */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="location"
                    label="Địa danh"
                    icon="location_on"
                    entities={form.relatedLocations}
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
                    entities={form.relatedArticles || []}
                    availableEntities={availableArticles}
                    onAdd={(artVal) => setForm(prev => ({ ...prev, relatedArticles: [...new Set([...(prev.relatedArticles || []), artVal])] }))}
                    onRemove={(artToRemove) => setForm(prev => ({ ...prev, relatedArticles: (prev.relatedArticles || []).filter(a => a !== artToRemove) }))}
                  />
                </div>

                {/* NHÂN VẬT KHÁC */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="character"
                    label="Nhân vật khác"
                    icon="groups"
                    itemIcon="person"
                    entities={form.relatedCharacters}
                    availableEntities={availableCharacters}
                    onAdd={addCharacter}
                    onRemove={removeCharacter}
                  />
                </div>

                {/* SỰ KIỆN LỊCH SỬ */}
                <div className="pt-2">
                  <EntityRelationInput
                    type="event"
                    label="Sự kiện tham gia"
                    icon="event"
                    itemIcon="event"
                    entities={form.relatedEvents}
                    availableEntities={availableEvents}
                    onAdd={(eventVal) => {
                      const eventMatch = availableEvents.find(e => e.name === eventVal);
                      const periodName = eventMatch?.period?.name;
                      setForm(prev => {
                        const newTags = (periodName && !prev.tags.includes(periodName))
                          ? [...prev.tags, periodName]
                          : prev.tags;
                        return {
                          ...prev,
                          relatedEvents: [...new Set([...(prev.relatedEvents || []), eventVal])],
                          tags: newTags
                        };
                      });
                    }}
                    onRemove={(eventToRemove) => setForm(prev => ({
                      ...prev,
                      relatedEvents: prev.relatedEvents.filter(e => e !== eventToRemove)
                    }))}
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

export default CharacterForm;