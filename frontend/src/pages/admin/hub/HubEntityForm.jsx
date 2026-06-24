import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient, { mockClient } from '../../../services/apiClient';
import { API_ENDPOINTS } from '../../../services/api';
import { generateSlug } from '../../../utils/stringUtils';
import { getRelationLabel } from '../../../utils/relationUtils';

const HubEntityForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [entity, setEntity] = useState(null);
  const [entityType, setEntityType] = useState(''); // 'character', 'event', 'location'
  const [typeLabel, setTypeLabel] = useState(''); // 'Nhân vật', 'Sự kiện', 'Địa danh'
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  // Lists of all available entities for linking
  const [allCharacters, setAllCharacters] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [allLocations, setAllLocations] = useState([]);

  // Current entity's connections
  const [relatedEntities, setRelatedEntities] = useState([]); // Array of { id, targetId, name, type, group, relation, isCustom }
  const [originalRelations, setOriginalRelations] = useState([]);

  // States for adding a new link
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkRelation, setNewLinkRelation] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        let baseChars = [];
        let baseEvents = [];
        let baseLocations = [];

        // Fetch characters
        try {
          const charRes = await apiClient.get(API_ENDPOINTS.ADMIN_CHARACTERS, { params: { page: 0, size: 500 } });
          const charData = charRes.data?.data?.result || charRes.data?.data?.content || [];
          baseChars = charData.map(c => ({
            ...c,
            title: c.alias || '',
            years: `${c.birthDate ? new Date(c.birthDate).getFullYear() : '?'} - ${c.deathDate ? new Date(c.deathDate).getFullYear() : '?'}`,
            dynasty: c.dynasty || 'Chưa rõ',
            status: c.status || 'published'
          }));
        } catch (e) {
          console.error("Lỗi khi tải nhân vật từ API:", e);
          try {
            const res = await mockClient.get('/api/admin_characters.json');
            baseChars = res.data.characters || [];
          } catch (e2) {
            console.error("Lỗi khi tải nhân vật từ mock JSON:", e2);
          }
        }

        // Fetch events
        try {
          const eventRes = await apiClient.get(API_ENDPOINTS.ADMIN_EVENTS, { params: { page: 0, size: 500 } });
          const eventData = eventRes.data?.data?.result || eventRes.data?.data?.content || [];
          baseEvents = eventData.map(e => ({
            ...e,
            time: `${e.startYear || '?'} - ${e.endYear || '?'}`,
            dynasty: e.period?.name || 'Chưa rõ',
            status: e.status || 'published',
            sub: e.description || ''
          }));
        } catch (e) {
          console.error("Lỗi khi tải sự kiện từ API:", e);
          try {
            const res = await mockClient.get('/api/admin_events.json');
            baseEvents = res.data.events || [];
          } catch (e2) {
            console.error("Lỗi khi tải sự kiện từ mock JSON:", e2);
          }
        }

        // Fetch locations
        try {
          const locRes = await apiClient.get(API_ENDPOINTS.ADMIN_LOCATIONS, { params: { page: 0, size: 500 } });
          const locData = locRes.data?.data?.result || locRes.data?.data?.content || [];
          baseLocations = locData.map(l => ({
            id: l.id,
            name: l.name,
            type: l.locationType || 'UNKNOWN',
            coords: `${l.latitude || 0}, ${l.longitude || 0}`,
            description: l.description || '',
            status: 'PUBLISHED'
          }));
        } catch (e) {
          console.error("Lỗi khi tải địa danh từ API:", e);
          try {
            const res = await mockClient.get('/api/admin_locations.json');
            baseLocations = res.data.locations || [];
          } catch (e2) {
            console.error("Lỗi khi tải địa danh từ mock JSON:", e2);
          }
        }

        const mergedChars = baseChars;
        const mergedEvents = baseEvents;
        const mergedLocations = baseLocations;

        setAllCharacters(mergedChars);
        setAllEvents(mergedEvents);
        setAllLocations(mergedLocations);

        // Find the target entity
        let target = mergedChars.find(c => String(c.id) === String(id) || String(c.id).endsWith('-' + id));
        let type = 'character';
        let tLabel = 'Nhân vật';

        if (!target) {
          target = mergedEvents.find(e => String(e.id) === String(id) || String(e.id).endsWith('-' + id));
          type = 'event';
          tLabel = 'Sự kiện';
        }
        if (!target) {
          target = mergedLocations.find(l => String(l.id || l.location_id) === String(id) || String(l.id || l.location_id).endsWith('-' + id));
          type = 'location';
          tLabel = 'Địa danh';
        }

        // If numeric ID and target found, let's fetch detail by ID for full info
        if (target && !isNaN(Number(id))) {
          try {
            if (type === 'character') {
              const response = await apiClient.get(`${API_ENDPOINTS.ADMIN_CHARACTERS}/${id}`);
              const data = response.data?.data || response.data;
              if (data) {
                target = {
                  ...target,
                  ...data,
                  biography: data.biography || data.content || '',
                  relatedCharacters: data.relatedCharacters || [],
                  relatedLocations: data.relatedLocations || []
                };
              }
            } else if (type === 'event') {
              const response = await apiClient.get(`${API_ENDPOINTS.ADMIN_EVENTS}/${id}`);
              const data = response.data?.data || response.data;
              if (data) {
                target = {
                  ...target,
                  ...data,
                  description: data.description || data.content || '',
                  relatedCharacters: data.relatedCharacters || [],
                  relatedLocations: data.locationRelations ? data.locationRelations.map(l => l.name) : (data.relatedLocations || [])
                };
              }
            } else if (type === 'location') {
              const response = await apiClient.get(`${API_ENDPOINTS.ADMIN_LOCATIONS}/${id}`);
              const data = response.data?.data || response.data;
              if (data) {
                target = {
                  ...target,
                  ...data,
                  description: data.description || ''
                };
              }
            }
          } catch (err) {
            console.error(`Lỗi khi tải chi tiết ${type} từ backend:`, err);
          }
        }

        if (target) {
          setEntity(target);
          setEntityType(type);
          setTypeLabel(tLabel);
          setName(target.name || '');
          setDesc(target.biography || target.description || target.shortDesc || '');

          // Resolve relations
          const ownRelations = [];
          const dbRelationsList = [];

          if (!isNaN(Number(id))) {
            if (type === 'character') {
              try {
                const partRes = await apiClient.get('/api/v1/admin/participations', {
                  params: { personId: id, size: 500 }
                });
                const partData = partRes.data?.data?.result || partRes.data?.data || [];
                partData.forEach(p => {
                  if (p.event) {
                    const relItem = {
                      id: `part_${p.id}`,
                      targetId: p.event.id,
                      name: p.event.name,
                      type: 'Sự kiện',
                      group: 'event',
                      relation: p.note || p.role || 'Tham gia',
                      isCustom: true,
                      isBackend: true,
                      backendType: 'participation',
                      backendId: p.id
                    };
                    ownRelations.push(relItem);
                    dbRelationsList.push(relItem);
                  }
                });
              } catch (err) {
                console.error('Lỗi khi tải participations cho nhân vật:', err);
              }
            } else if (type === 'event') {
              try {
                const partRes = await apiClient.get('/api/v1/admin/participations', {
                  params: { eventId: id, size: 500 }
                });
                const partData = partRes.data?.data?.result || partRes.data?.data || [];
                partData.forEach(p => {
                  if (p.person) {
                    const relItem = {
                      id: `part_${p.id}`,
                      targetId: p.person.id,
                      name: p.person.name,
                      type: 'Nhân vật',
                      group: 'character',
                      relation: p.note || p.role || 'Tham gia',
                      isCustom: true,
                      isBackend: true,
                      backendType: 'participation',
                      backendId: p.id
                    };
                    ownRelations.push(relItem);
                    dbRelationsList.push(relItem);
                  }
                });
              } catch (err) {
                console.error('Lỗi khi tải participations cho sự kiện:', err);
              }

              // Load event_location relations
              if (target && target.locationRelations) {
                target.locationRelations.forEach(lr => {
                  const relItem = {
                    id: `el_${id}_${lr.locationId}`,
                    targetId: lr.locationId,
                    name: lr.name,
                    type: 'Địa danh',
                    group: 'location',
                    relation: lr.relationType || 'Địa danh liên quan',
                    isCustom: true,
                    isBackend: true,
                    backendType: 'event_location',
                    eventId: id,
                    locationId: lr.locationId
                  };
                  ownRelations.push(relItem);
                  dbRelationsList.push(relItem);
                });
              }
            } else if (type === 'location') {
              try {
                const eventRes = await apiClient.get(API_ENDPOINTS.ADMIN_EVENTS, { params: { size: 500 } });
                const eventData = eventRes.data?.data?.result || eventRes.data?.data?.content || [];
                eventData.forEach(event => {
                  if (event.locationRelations) {
                    const locRel = event.locationRelations.find(lr => String(lr.locationId) === String(id));
                    if (locRel) {
                      const relItem = {
                        id: `el_${event.id}_${id}`,
                        targetId: event.id,
                        name: event.name,
                        type: 'Sự kiện',
                        group: 'event',
                        relation: locRel.relationType || 'Địa danh liên quan',
                        isCustom: true,
                        isBackend: true,
                        backendType: 'event_location',
                        eventId: event.id,
                        locationId: id
                      };
                      ownRelations.push(relItem);
                      dbRelationsList.push(relItem);
                    }
                  }
                });
              } catch (err) {
                console.error('Lỗi khi tải danh sách sự kiện cho địa danh:', err);
              }
            }
          }

          setRelatedEntities(ownRelations);
          setOriginalRelations(dbRelationsList);
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      }
    };
    fetchData();
  }, [id]);

  const handleAddLink = () => {
    if (!newLinkName.trim() || !newLinkRelation.trim()) {
      alert("Vui lòng điền đầy đủ tên thực thể và mối quan hệ.");
      return;
    }

    let targetNode = allCharacters.find(c => c.name.toLowerCase() === newLinkName.trim().toLowerCase());
    let tType = 'Nhân vật';
    let tGroup = 'character';

    if (!targetNode) {
      targetNode = allEvents.find(e => e.name.toLowerCase() === newLinkName.trim().toLowerCase());
      tType = 'Sự kiện';
      tGroup = 'event';
    }
    if (!targetNode) {
      targetNode = allLocations.find(l => l.name.toLowerCase() === newLinkName.trim().toLowerCase());
      tType = 'Địa danh';
      tGroup = 'location';
    }

    if (!targetNode) {
      alert(`Không tìm thấy thực thể nào có tên "${newLinkName}"`);
      return;
    }

    if (String(targetNode.id) === String(id)) {
      alert("Không thể tạo liên kết tới chính nó.");
      return;
    }

    const duplicate = relatedEntities.some(re => String(re.targetId) === String(targetNode.id));
    if (duplicate) {
      alert("Mối liên kết với thực thể này đã tồn tại.");
      return;
    }

    const newLink = {
      id: 'rel_temp_' + Date.now(),
      targetId: targetNode.id,
      name: targetNode.name,
      type: tType,
      group: tGroup,
      relation: newLinkRelation.trim(),
      isCustom: true
    };

    setRelatedEntities([...relatedEntities, newLink]);
    setNewLinkName('');
    setNewLinkRelation('');
  };

  const handleRemoveLink = (targetIdToRemove) => {
    setRelatedEntities(relatedEntities.filter(re => String(re.targetId) !== String(targetIdToRemove)));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Tên thực thể không được để trống.");
      return;
    }

    try {
      // 1. Save base entity information
      if (!isNaN(Number(id))) {
        if (entityType === 'character') {
          const payload = {
            name: name,
            slug: entity.slug || generateSlug(name),
            alias: entity.title || entity.alias || '',
            biography: desc
          };
          await apiClient.put(`${API_ENDPOINTS.ADMIN_CHARACTERS}/${id}`, payload);
        } else if (entityType === 'event') {
          // Event locations are updated as part of payload locationRelations
          const locationRelations = relatedEntities
            .filter(re => re.group === 'location')
            .map(re => ({
              locationId: Number(re.targetId),
              relationType: re.relation
            }));

          const payload = {
            name: name,
            slug: entity.slug || generateSlug(name),
            description: desc,
            startYear: entity.startYear !== undefined ? entity.startYear : null,
            endYear: entity.endYear !== undefined ? entity.endYear : null,
            startDate: entity.startDate || null,
            endDate: entity.endDate || null,
            certaintyLevel: entity.certaintyLevel || 'CERTAIN',
            periodId: entity.periodId || (entity.period ? entity.period.id : null),
            locationRelations: locationRelations
          };
          await apiClient.put(`${API_ENDPOINTS.ADMIN_EVENTS}/${id}`, payload);
        } else if (entityType === 'location') {
          const payload = {
            name: name,
            slug: entity.slug || generateSlug(name),
            locationType: entity.locationType || 'CITY',
            latitude: entity.latitude !== undefined ? entity.latitude : null,
            longitude: entity.longitude !== undefined ? entity.longitude : null,
            description: desc
          };
          await apiClient.put(`${API_ENDPOINTS.ADMIN_LOCATIONS}/${id}`, payload);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu thông tin thực thể vào backend:', error);
      alert('Có lỗi xảy ra khi lưu vào database. Vui lòng kiểm tra lại.');
      return;
    }

    // 2. Synchronize DB relationships
    if (!isNaN(Number(id))) {
      try {
        if (entityType === 'character') {
          const currentEventIds = relatedEntities.filter(re => re.group === 'event').map(re => Number(re.targetId));
          const originalEventIds = originalRelations.filter(or => or.group === 'event').map(or => Number(or.targetId));

          const toDelete = originalRelations.filter(or => or.group === 'event' && !currentEventIds.includes(Number(or.targetId)));
          const toAdd = relatedEntities.filter(re => re.group === 'event' && !originalEventIds.includes(Number(re.targetId)));

          for (const p of toDelete) {
            await apiClient.delete(`/api/v1/admin/participations/${p.backendId}`);
          }

          for (const re of toAdd) {
            let matchedRole = null;
            const upperRel = (re.relation || '').trim().toUpperCase();
            const roleEnums = [
              'KING', 'QUEEN', 'PRINCE', 'PRINCESS', 'COMMANDER', 'GENERAL', 'STRATEGIST',
              'OFFICIAL', 'DIPLOMAT', 'SOLDIER', 'REBEL_LEADER', 'ALLY', 'OPPONENT', 'WITNESS', 'HISTORIAN'
            ];
            if (roleEnums.includes(upperRel)) {
              matchedRole = upperRel;
            }
            await apiClient.post('/api/v1/admin/participations', {
              eventId: Number(re.targetId),
              personId: Number(id),
              role: matchedRole,
              note: re.relation
            });
          }
        } else if (entityType === 'event') {
          const currentCharacterIds = relatedEntities.filter(re => re.group === 'character').map(re => Number(re.targetId));
          const originalCharacterIds = originalRelations.filter(or => or.group === 'character').map(or => Number(or.targetId));

          const toDelete = originalRelations.filter(or => or.group === 'character' && !currentCharacterIds.includes(Number(or.targetId)));
          const toAdd = relatedEntities.filter(re => re.group === 'character' && !originalCharacterIds.includes(Number(re.targetId)));

          for (const p of toDelete) {
            await apiClient.delete(`/api/v1/admin/participations/${p.backendId}`);
          }

          for (const re of toAdd) {
            let matchedRole = null;
            const upperRel = (re.relation || '').trim().toUpperCase();
            const roleEnums = [
              'KING', 'QUEEN', 'PRINCE', 'PRINCESS', 'COMMANDER', 'GENERAL', 'STRATEGIST',
              'OFFICIAL', 'DIPLOMAT', 'SOLDIER', 'REBEL_LEADER', 'ALLY', 'OPPONENT', 'WITNESS', 'HISTORIAN'
            ];
            if (roleEnums.includes(upperRel)) {
              matchedRole = upperRel;
            }
            await apiClient.post('/api/v1/admin/participations', {
              eventId: Number(id),
              personId: Number(re.targetId),
              role: matchedRole,
              note: re.relation
            });
          }
        } else if (entityType === 'location') {
          const currentEventIds = relatedEntities.filter(re => re.group === 'event').map(re => Number(re.targetId));
          const originalEventIds = originalRelations.filter(or => or.group === 'event').map(or => Number(or.targetId));

          const toDelete = originalRelations.filter(or => or.group === 'event' && !currentEventIds.includes(Number(or.targetId)));
          const toAdd = relatedEntities.filter(re => re.group === 'event' && !originalEventIds.includes(Number(re.targetId)));

          // Delete relations from events
          for (const or of toDelete) {
            const eventRes = await apiClient.get(`${API_ENDPOINTS.ADMIN_EVENTS}/${or.targetId}`);
            const eventData = eventRes.data?.data || eventRes.data;
            if (eventData) {
              const updatedLocationRelations = (eventData.locationRelations || [])
                .filter(lr => String(lr.locationId) !== String(id))
                .map(lr => ({
                  locationId: lr.locationId,
                  relationType: lr.relationType
                }));
              const payload = {
                name: eventData.name,
                slug: eventData.slug,
                description: eventData.description,
                startYear: eventData.startYear,
                endYear: eventData.endYear,
                startDate: eventData.startDate,
                endDate: eventData.endDate,
                certaintyLevel: eventData.certaintyLevel || 'CERTAIN',
                periodId: eventData.period?.id || null,
                locationRelations: updatedLocationRelations
              };
              await apiClient.put(`${API_ENDPOINTS.ADMIN_EVENTS}/${or.targetId}`, payload);
            }
          }

          // Add relations to events
          for (const re of toAdd) {
            const eventRes = await apiClient.get(`${API_ENDPOINTS.ADMIN_EVENTS}/${re.targetId}`);
            const eventData = eventRes.data?.data || eventRes.data;
            if (eventData) {
              const updatedLocationRelations = (eventData.locationRelations || []).map(lr => ({
                locationId: lr.locationId,
                relationType: lr.relationType
              }));
              updatedLocationRelations.push({
                locationId: Number(id),
                relationType: re.relation
              });
              const payload = {
                name: eventData.name,
                slug: eventData.slug,
                description: eventData.description,
                startYear: eventData.startYear,
                endYear: eventData.endYear,
                startDate: eventData.startDate,
                endDate: eventData.endDate,
                certaintyLevel: eventData.certaintyLevel || 'CERTAIN',
                periodId: eventData.period?.id || null,
                locationRelations: updatedLocationRelations
              };
              await apiClient.put(`${API_ENDPOINTS.ADMIN_EVENTS}/${re.targetId}`, payload);
            }
          }
        }
      } catch (err) {
        console.error('Lỗi khi đồng bộ các mối quan hệ:', err);
        alert('Có lỗi xảy ra khi cập nhật các liên kết dữ liệu.');
      }
    }

    navigate('/admin/hub');
  };

  const getCombinedNodes = () => {
    return [...allCharacters, ...allEvents, ...allLocations].filter(n => String(n.id) !== String(id));
  };

  if (!entity) {
    return (
      <div className="flex items-center justify-center min-h-screen font-body text-primary bg-[#FDFBF0]">
        Đang tải thông tin thực thể liên quan...
      </div>
    );
  }

  return (
    <div className="flex-grow bg-surface min-h-screen font-body pb-20">
      <header className="h-16 sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-outline-variant px-8 flex justify-between items-center">
        <div className="flex items-center gap-2 font-body text-[10px] uppercase text-on-surface-variant tracking-wider">
          <span>Mạng lưới tri thức</span> <span className="material-symbols-outlined text-[10px] opacity-50">chevron_right</span>
          <span className="text-primary font-bold">Thiết lập liên kết thực thể</span>
        </div>
        <div className="flex gap-3 font-body text-[10px] font-bold tracking-widest">
          <button onClick={() => navigate('/admin/hub')} className="px-5 py-2.5 border border-primary/30 text-primary hover:bg-primary/5 rounded-xl transition-all cursor-pointer">HỦY BỎ</button>
          <button onClick={handleSave} className="px-6 py-2.5 bg-primary hover:bg-primary-container text-white shadow-lg flex items-center gap-2 transition-all rounded-xl cursor-pointer">
            <span className="material-symbols-outlined text-sm">save</span> LƯU THAY ĐỔI
          </button>
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto space-y-10">
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: THÔNG TIN CHÍNH */}
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <section className="bg-white p-8 rounded-[2rem] border border-outline-variant/60 shadow-sm space-y-6">
              <h3 className="font-headline text-2xl text-primary font-bold border-b border-outline-variant/40 pb-3 mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">badge</span>
                Thông tin Thực thể
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="font-body text-[10px] font-bold uppercase tracking-widest opacity-60">Tên thực thể</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary py-2.5 font-headline text-2xl font-bold text-primary outline-none transition-colors"
                  />
                </div>
                <div className="col-span-2 md:col-span-1 space-y-2">
                  <label className="font-body text-[10px] font-bold uppercase tracking-widest opacity-60">Loại thực thể</label>
                  <div className="py-2.5 font-body font-bold text-sm text-on-surface-variant flex items-center gap-2">
                    <span className={`material-symbols-outlined text-sm ${entityType === 'character' ? 'text-primary' : entityType === 'location' ? 'text-accent' : 'text-secondary'}`}>
                      {entityType === 'character' ? 'person' : entityType === 'location' ? 'location_on' : 'event'}
                    </span>
                    {typeLabel}
                  </div>
                </div>
                <div className="col-span-2 space-y-2 pt-4">
                  <label className="font-body text-[10px] font-bold uppercase tracking-widest opacity-60">Tóm lược tiểu sử / Bối cảnh</label>
                  <textarea
                    rows="5"
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    className="w-full bg-surface-low/50 border border-outline-variant/60 p-4 rounded-xl text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-body text-on-surface"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* CỘT PHẢI: THIẾT LẬP LIÊN KẾT */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-[2rem] border border-outline-variant/60 shadow-sm space-y-6">
              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-primary border-b border-outline-variant/40 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">hub</span>
                Liên kết Thực thể
              </h4>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {relatedEntities.map(item => (
                  <div key={item.targetId} className="flex items-center gap-3 p-3 bg-surface-low/50 rounded-xl border border-outline-variant/30 hover:border-primary/50 transition-all group">
                    <span className={`material-symbols-outlined text-sm ${item.group === 'character' ? 'text-primary' : item.group === 'location' ? 'text-accent' : 'text-secondary'}`}>
                      {item.group === 'character' ? 'person' : item.group === 'location' ? 'location_on' : 'event'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-on-surface truncate">{item.name}</p>
                      <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">{getRelationLabel(item.relation) || 'Liên kết'}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveLink(item.targetId)}
                      className="material-symbols-outlined text-sm text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-50 rounded cursor-pointer"
                    >
                      remove_circle
                    </button>
                  </div>
                ))}
                {relatedEntities.length === 0 && (
                  <p className="text-[10px] text-on-surface-variant italic py-2">Chưa thiết lập mối liên kết nào.</p>
                )}
              </div>

              <div className="border-t border-outline-variant/30 pt-4 space-y-4">
                <p className="font-body text-[10px] font-bold uppercase tracking-widest opacity-60">Thêm liên kết mới</p>

                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      list="avail-nodes"
                      value={newLinkName}
                      onChange={e => setNewLinkName(e.target.value)}
                      placeholder="Chọn thực thể kết nối..."
                      className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-xs font-bold text-on-surface outline-none focus:border-primary"
                    />
                    <datalist id="avail-nodes">
                      {getCombinedNodes().map(n => (
                        <option key={n.id} value={n.name}>
                          {(n.type || (n.years ? 'Nhân vật' : 'Sự kiện'))}
                        </option>
                      ))}
                    </datalist>
                  </div>

                  <input
                    type="text"
                    value={newLinkRelation}
                    onChange={e => setNewLinkRelation(e.target.value)}
                    placeholder="Mối quan hệ (Vd: Học trò, Tướng lĩnh...)"
                    className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-xs font-bold text-on-surface outline-none focus:border-primary"
                  />

                  <button
                    onClick={handleAddLink}
                    className="w-full py-2 bg-primary hover:bg-primary-container text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Thiết lập liên kết
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HubEntityForm;