import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { RichTextEditor, FormHeader, VietnamMap, EntityRelationInput } from '../../../components/admin';
import { locationService, eventService, extractErrorMessage } from '../../../services';

const LocationForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', slug: '', locationType: 'Cố đô/Thành quách', latitude: '', longitude: '', description: '', status: 'draft',
    relatedEvents: []
  });
  const [originalData, setOriginalData] = useState({
    originalEvents: []
  });
  const [availableEvents, setAvailableEvents] = useState([]);

  useEffect(() => {
    const loadAllData = async () => {
      try {
        let eventsList = [];
        try {
          eventsList = await eventService.listAll({ size: 500 });
        } catch (err) {
          console.error('Lỗi khi tải danh sách sự kiện:', err);
          try {
            const response = await fetch('/api/admin_events.json');
            if (response.ok) {
              const data = await response.json();
              eventsList = data.events || [];
            }
          } catch (mockErr) {
            console.error('Lỗi khi tải danh sách sự kiện từ mock:', mockErr);
          }
        }

        const mappedEvents = eventsList.map(e => ({
          id: e.id,
          name: e.name || e.title,
          locationRelations: e.locationRelations || []
        }));
        setAvailableEvents(mappedEvents);

        if (isEdit) {
          let foundLocation = null;

          if (!isNaN(Number(id))) {
            try {
              foundLocation = await locationService.getById(Number(id));
            } catch (err) {
              console.error('Lỗi khi tải địa danh từ backend:', err);
            }
          }

          if (!foundLocation) {
            const response = await fetch('/api/admin_locations.json');
            if (response.ok) {
              const data = await response.json();
              foundLocation = data.locations?.find(l => String(l.id) === String(id));
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

            setForm({
              name: foundLocation.name || '',
              slug: foundLocation.slug || generateSlug(foundLocation.name || ''),
              locationType: foundLocation.type || foundLocation.locationType || 'Cố đô/Thành quách',
              latitude: initialLat,
              longitude: initialLng,
              description: foundLocation.description || foundLocation.shortDesc || '',
              status: (foundLocation.status === 'published' || !foundLocation.status || foundLocation.status === 'Công khai') ? 'published' : 'draft',
              relatedEvents: matchedEvents
            });

            setOriginalData({
              ...foundLocation,
              originalEvents: matchedEvents
            });
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu địa danh:', error);
      }
    };
    loadAllData();
  }, [id, isEdit]);

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
          relationType: r.relationType || 'HAPPENED_AT'
        }));
      }

      if (isAdd) {
        const exists = updatedRelations.some(r => Number(r.locationId) === Number(locationId));
        if (!exists) {
          updatedRelations.push({
            locationId: Number(locationId),
            relationType: 'HAPPENED_AT'
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
        name: form.name,
        slug: form.slug,
        locationType: backendType,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        description: form.description
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
      }

      navigate('/admin/locations');
    } catch (error) {
      console.error('Lỗi khi lưu địa danh:', error);
      const errMsg = extractErrorMessage(error, 'Có lỗi xảy ra khi lưu địa danh!');
      alert(errMsg);
    }
  };

  return (
    <div className="flex-grow bg-surface min-h-screen animate-in fade-in duration-500 pb-20">
      <main className="p-8 max-w-6xl mx-auto space-y-8 font-body">

        <FormHeader
          title={isEdit ? 'Chỉnh sửa Địa danh' : 'Thêm Địa danh Mới'}
          subtitle="Quản lý thông tin địa danh, di tích và vị trí lịch sử trong hệ thống Sử Việt."
          icon="my_location"
          isEdit={isEdit}
          onCancel={() => navigate('/admin/locations')}
          onSave={handleSave}
        />

        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* SECTION 1: IDENTITY & COORDS */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-8 relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute -top-12 -right-12 opacity-[0.02] text-primary pointer-events-none">
                <span className="material-symbols-outlined text-[200px]">map</span>
              </div>

              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-primary text-[18px]">share_location</span>
                Danh tính & Tọa độ
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Tên địa danh lịch sử *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => {
                      const newName = e.target.value;
                      setForm({ ...form, name: newName, slug: generateSlug(newName) });
                    }}
                    className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 placeholder:font-light"
                    placeholder="Ví dụ: Hoàng Thành Thăng Long..."
                  />
                </div>

                <div className="flex items-center gap-3 bg-surface-low/30 border border-outline-variant/40 rounded-xl p-3 text-on-surface-variant font-body text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-primary/60">link</span>
                  <span className="opacity-60 lowercase tracking-normal italic">suviet.vn/dia-danh/</span>
                  <input
                    type="text"
                    value={form.slug}
                    readOnly
                    className="flex-1 bg-transparent border-none outline-none font-bold text-indigo-700 placeholder:text-outline-variant/40"
                    placeholder="hoang-thanh-thang-long"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-outline-variant/30">
                  <div className="space-y-2">
                    <label className="block font-body text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Loại hình</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <select
                        value={form.locationType}
                        onChange={e => setForm({ ...form, locationType: e.target.value })}
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
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <input
                        type="number"
                        value={form.latitude}
                        onChange={e => setForm({ ...form, latitude: e.target.value })}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold"
                        placeholder="21.03"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-body text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">Kinh độ (Long)</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <input
                        type="number"
                        value={form.longitude}
                        onChange={e => setForm({ ...form, longitude: e.target.value })}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold"
                        placeholder="105.83"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </section>

            {/* SECTION 2: DESCRIPTION */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-6 transition-all hover:shadow-md">
              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">history_edu</span>
                Diễn giải Lịch sử & Bối cảnh
              </h3>

              <div className="space-y-2">
                <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest opacity-0 h-0 overflow-hidden">Trình soạn thảo</label>
                <div className="rounded-2xl overflow-hidden border border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-surface-low/30">
                  <RichTextEditor
                    value={form.description}
                    onChange={(description) => setForm({ ...form, description })}
                    placeholder="Viết mô tả chi tiết về các sự kiện lịch sử đã diễn ra tại địa danh này..."
                    className="min-h-[300px]"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: PREVIEW & MAP */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-1 rounded-3xl shadow-xl sticky top-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
              <div className="bg-surface/95 backdrop-blur-xl p-6 rounded-[22px] text-center h-full border border-white/10 flex flex-col space-y-6">

                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Cấu hình Địa danh
                </h4>

                {/* Publishing Info */}
                <div className="space-y-4 relative z-10 text-left">
                  <p className="font-body text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">publish</span> Xuất bản
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</label>
                      <div className="relative">
                        <select
                          value={form.status}
                          onChange={e => setForm({ ...form, status: e.target.value })}
                          className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-sm font-bold text-on-surface outline-none cursor-pointer hover:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                        >
                          <option value="draft">Bản nháp</option>
                          <option value="published">Công khai</option>
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

                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10 mt-6">
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  Bản xem trước Vị trí
                </h4>

                {/* DYNAMIC CONTENT */}
                <div className="flex flex-col items-center relative flex-1 mb-6">
                  <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10"></div>

                  <div className="px-4 py-1.5 text-white text-[10px] font-bold rounded-full mb-3 uppercase tracking-widest shadow-sm ring-2 ring-white/50 bg-gradient-to-r from-primary to-indigo-600">
                    {form.locationType || 'Loại hình'}
                  </div>

                  <h4 className="font-headline text-3xl font-bold bg-gradient-to-r from-gray-900 to-primary bg-clip-text text-transparent transition-all duration-300 mb-2">
                    {form.name || 'Tên Địa danh'}
                  </h4>

                  <p className="font-body text-xs text-on-surface-variant italic leading-relaxed px-4 opacity-80 font-bold">
                    {form.latitude && form.longitude ? `${form.latitude}, ${form.longitude}` : 'Chưa nhập tọa độ'}
                  </p>
                </div>

                {/* MINI MAP */}
                <div className="aspect-[4/3] rounded-2xl bg-surface-low border-2 border-dashed border-outline-variant/60 overflow-hidden relative cursor-pointer group hover:border-primary/50 transition-all">
                  <VietnamMap
                    lat={form.latitude}
                    lng={form.longitude}
                    className="w-full h-full opacity-70 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700"
                  />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary group-hover:-translate-y-6 transition-transform duration-500 drop-shadow-md opacity-0">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <p className="text-white text-[10px] font-bold uppercase tracking-widest text-center">Bấm để định vị trên bản đồ</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-surface-low/50 rounded-xl border border-dashed border-outline-variant/60 text-[11px] text-on-surface-variant leading-relaxed font-body italic">
                  Tọa độ này sẽ được sử dụng để ghim địa danh lên bản đồ lịch sử tương tác 3D.
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