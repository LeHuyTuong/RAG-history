import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { RichTextEditor, EntityRelationInput, FormHeader, TagInput } from '../../../components/admin';
import apiClient, { mockClient, extractErrorMessage } from '../../../services/apiClient';
import { API_ENDPOINTS } from '../../../services/api';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    time: '',
    sub: '',
    description: '',
    dynasty: [],
    status: 'Bản nháp',
    relatedLocations: [],
    relatedCharacters: []
  });

  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          let foundEvent = null;

          if (!isNaN(Number(id))) {
            try {
              const response = await apiClient.get(`${API_ENDPOINTS.ADMIN_EVENTS}/${id}`);
              const data = response.data?.data || response.data;
              if (data) {
                foundEvent = data;
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
            setFormData(prev => ({
              ...prev,
              name: foundEvent.name || foundEvent.title || '',
              slug: foundEvent.slug || generateSlug(foundEvent.name || foundEvent.title || ''),
              time: foundEvent.startYear !== undefined && foundEvent.startYear !== null ? `${foundEvent.startYear} - ${foundEvent.endYear || ''}` : (foundEvent.time || foundEvent.startDate || foundEvent.date || ''),
              sub: foundEvent.sub || foundEvent.shortDesc || (foundEvent.description ? foundEvent.description.replace(/<[^>]*>/g, '') : ''),
              description: foundEvent.description || foundEvent.content || '',
              dynasty: foundEvent.period ? [foundEvent.period.name] : (foundEvent.dynasties ? foundEvent.dynasties : (foundEvent.dynasty ? (Array.isArray(foundEvent.dynasty) ? foundEvent.dynasty : [foundEvent.dynasty]) : [])),
              status: (foundEvent.status === 'published' || !foundEvent.status || foundEvent.status === 'PUBLISHED') ? 'Công khai' : 'Bản nháp',
              content: foundEvent.description || foundEvent.content || '',
              relatedLocations: foundEvent.locationRelations ? foundEvent.locationRelations.map(l => l.name) : (foundEvent.relatedLocations || foundEvent.relatedLocation || []),
              relatedCharacters: foundEvent.relatedCharacters || foundEvent.relatedCharacter || []
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
        const [locRes, charRes, metaRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.ADMIN_LOCATIONS, { params: { size: 500 } }),
          apiClient.get(API_ENDPOINTS.ADMIN_CHARACTERS, { params: { size: 500 } }),
          apiClient.get(API_ENDPOINTS.ADMIN_PERIODS, { params: { size: 500 } })
        ]);

        const locData = locRes.data?.data?.result || locRes.data?.data?.content || [];
        setAvailableLocations(locData.map(l => ({
          id: l.id,
          name: l.name,
          type: l.locationType || 'UNKNOWN',
          coords: `${l.latitude || 0}, ${l.longitude || 0}`,
          description: l.description || '',
          status: 'PUBLISHED'
        })));

        const charData = charRes.data?.data?.result || charRes.data?.data?.content || [];
        setAvailableCharacters(charData.map(c => ({
          ...c,
          title: c.alias || '',
          years: `${c.birthDate ? new Date(c.birthDate).getFullYear() : '?'} - ${c.deathDate ? new Date(c.deathDate).getFullYear() : '?'}`,
          dynasty: c.dynasty || 'Chưa rõ',
          status: c.status || 'published'
        })));

        const periodsList = metaRes.data?.data?.result || metaRes.data?.data || [];
        setPeriods(periodsList);
        setAvailablePeriods(periodsList.map(p => p.name));
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu liên kết từ backend, dùng mock làm dự phòng:', error);
        try {
          const [locRes, charRes, metaRes] = await Promise.all([
            mockClient.get('/api/admin_locations.json').then(r => r.data),
            mockClient.get('/api/admin_characters.json').then(r => r.data),
            mockClient.get('/api/admin_metadata.json').then(r => r.data)
          ]);
          setAvailableLocations(locRes.locations || []);
          setAvailableCharacters(charRes.characters || []);
          setAvailablePeriods(metaRes.periods?.map(p => p.name) || []);
          setPeriods(metaRes.periods || []);
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
    setFormData(prev => ({ ...prev, dynasty: [...new Set([...(prev.dynasty || []), tag])] }));
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

    try {
      let startYear = null;
      let endYear = null;
      if (formData.time) {
        const parts = formData.time.split('-');
        if (parts[0]) startYear = parseInt(parts[0].trim()) || null;
        if (parts[1]) endYear = parseInt(parts[1].trim()) || null;
      }

      let selectedPeriodId = null;
      if (formData.dynasty && formData.dynasty.length > 0) {
        const selectedPeriodName = formData.dynasty[0];
        const matchedPeriod = periods.find(p => p.name === selectedPeriodName);
        if (matchedPeriod) {
          selectedPeriodId = matchedPeriod.id;
        }
      }
      if (!selectedPeriodId) {
        selectedPeriodId = originalData.period?.id || null;
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

      const payload = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        periodId: selectedPeriodId,
        startYear: startYear,
        endYear: endYear,
        startDate: null,
        endDate: null,
        certaintyLevel: 'CERTAIN',
        locationRelations: locationRelations
      };

      let savedEventId = Number(id);
      if (isEdit && !isNaN(Number(id))) {
        await apiClient.put(`${API_ENDPOINTS.ADMIN_EVENTS}/${id}`, payload);
      } else {
        const res = await apiClient.post(API_ENDPOINTS.ADMIN_EVENTS, payload);
        const newEvent = res.data?.data || res.data;
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
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Thời gian diễn ra</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <input
                        type="text"
                        value={formData.time}
                        onChange={e => setFormData(prev => ({ ...prev, time: e.target.value }))}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                        placeholder="VD: Năm 1010, Thế kỷ 15..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Phụ đề (Mô tả ngắn gọn)</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <input
                        type="text"
                        value={formData.sub}
                        onChange={e => setFormData(prev => ({ ...prev, sub: e.target.value }))}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                        placeholder="VD: Chiếu dời đô của Lý Công Uẩn..."
                      />
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
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-1 rounded-3xl shadow-xl sticky top-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
              <div className="bg-surface/95 backdrop-blur-xl p-6 rounded-[22px] h-full border border-white/10 flex flex-col space-y-6 relative">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Cấu hình Sự kiện
                </h4>

                {/* Publishing Info */}
                <div className="space-y-4 relative z-10">
                  <p className="font-body text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">publish</span> Xuất bản
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</label>
                      <div className="relative">
                        <select
                          value={formData.status}
                          onChange={e => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-sm font-bold text-on-surface outline-none cursor-pointer hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                        >
                          <option>Bản nháp</option>
                          <option>Công khai</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                      </div>
                    </div>
                  </div>
                </div>

                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10 mt-6">
                  <span className="material-symbols-outlined text-[16px]">hub</span>
                  Liên kết Thông tin
                </h4>

                <EntityRelationInput
                  type="location"
                  label="Địa danh liên quan"
                  icon="location_on"
                  entities={formData.relatedLocations}
                  availableEntities={availableLocations}
                  onAdd={addLocation}
                  onRemove={removeLocation}
                />

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

                <TagInput
                  tags={formData.dynasty}
                  availableTags={availablePeriods.length > 0 ? availablePeriods : ['Nhà Lý', 'Nhà Trần', 'Nhà Lê', 'Nhà Nguyễn', 'Bắc Thuộc']}
                  onAddTag={handleAddDynasty}
                  onRemoveTag={handleRemoveDynasty}
                  label="Triều đại"
                />

              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
};

export default EventForm;