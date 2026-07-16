import { API_ENDPOINTS, apiClient, hubService } from '../../../services';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';


import { generateSlug, stripHtml } from '../../../utils/stringUtils';
import { getRelationLabel, PARTICIPATION_ROLE_LABELS, EVENT_LOCATION_RELATION_LABELS } from '../../../utils/relationUtils';
import { FormHeader } from '../../../components/admin';
import toast from 'react-hot-toast';

const HubEntityForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { id } = useParams();

  // Clean prefix if present (e.g. "character_12" -> "12")
  let cleanId = id;
  let forcedType = null;
  if (id && typeof id === 'string') {
    if (id.startsWith('character_')) {
      cleanId = id.replace('character_', '');
      forcedType = 'character';
    } else if (id.startsWith('event_')) {
      cleanId = id.replace('event_', '');
      forcedType = 'event';
    } else if (id.startsWith('location_')) {
      cleanId = id.replace('location_', '');
      forcedType = 'location';
    }
  }

  const [entity, setEntity] = useState(null);
  const [entityType, setEntityType] = useState(''); // 'character', 'event', 'location'
  const [typeLabel, setTypeLabel] = useState(''); // 'Nhân vật', 'Sự kiện', 'Di tích'
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [formErrors, setFormErrors] = useState({});

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
          console.error("Lỗi khi tải di tích từ API:", e);
        }

        const mergedChars = baseChars;
        const mergedEvents = baseEvents;
        const mergedLocations = baseLocations;

        setAllCharacters(mergedChars);
        setAllEvents(mergedEvents);
        setAllLocations(mergedLocations);

        // Find the target entity
        let target = null;
        let type = forcedType || 'character';
        let tLabel = type === 'character' ? 'Nhân vật' : type === 'event' ? 'Sự kiện' : 'Di tích';

        if (type === 'character') {
          target = mergedChars.find(c => String(c.id) === String(cleanId) || String(c.id) === String(id));
        } else if (type === 'event') {
          target = mergedEvents.find(e => String(e.id) === String(cleanId) || String(e.id) === String(id));
        } else if (type === 'location') {
          target = mergedLocations.find(l => String(l.id || l.location_id) === String(cleanId) || String(l.id || l.location_id) === String(id));
        }

        if (!target) {
          target = mergedChars.find(c => String(c.id) === String(cleanId) || String(c.id) === String(id));
          if (target) {
            type = 'character';
            tLabel = 'Nhân vật';
          }
        }
        if (!target) {
          target = mergedEvents.find(e => String(e.id) === String(cleanId) || String(e.id) === String(id));
          if (target) {
            type = 'event';
            tLabel = 'Sự kiện';
          }
        }
        if (!target) {
          target = mergedLocations.find(l => String(l.id || l.location_id) === String(cleanId) || String(l.id || l.location_id) === String(id));
          if (target) {
            type = 'location';
            tLabel = 'Di tích';
          }
        }

        // If numeric ID and target found, let's fetch detail by ID for full info
        if (target && !isNaN(Number(cleanId))) {
          try {
            if (type === 'character') {
              const response = await apiClient.get(`${API_ENDPOINTS.ADMIN_CHARACTERS}/${cleanId}`);
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
              const response = await apiClient.get(`${API_ENDPOINTS.ADMIN_EVENTS}/${cleanId}`);
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
              const response = await apiClient.get(`${API_ENDPOINTS.ADMIN_LOCATIONS}/${cleanId}`);
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
          setDesc(stripHtml(target.biography || target.description || target.shortDesc || ''));

          let ownRelations = [];
          if (!isNaN(Number(cleanId))) {
            ownRelations = await hubService.fetchEntityFullRelations(type, cleanId, target);
          }

          // MERGE LOCAL STORAGE RELATIONS
          const findTargetNode = (rawName) => {
            if (!rawName) return null;
            const lower = rawName.toString().toLowerCase().trim();
            let match = mergedChars.find(c => c.name.toLowerCase() === lower);
            if (match) return { id: match.id, name: match.name, type: 'Nhân vật', group: 'character' };
            match = mergedEvents.find(e => e.name.toLowerCase() === lower);
            if (match) return { id: match.id, name: match.name, type: 'Sự kiện', group: 'event' };
            match = mergedLocations.find(l => l.name.toLowerCase() === lower);
            if (match) return { id: match.id || match.location_id, name: match.name, type: 'Di tích', group: 'location' };
            return null;
          };

          const pushLocalRelation = (list, defaultRole) => {
            if (Array.isArray(list)) {
              list.forEach(rel => {
                const rawName = typeof rel === 'string' ? rel : (rel?.name || '');
                const targetNode = findTargetNode(rawName);
                if (targetNode && String(targetNode.id) !== String(cleanId)) {
                  if (!ownRelations.some(r => String(r.targetId) === String(targetNode.id))) {
                    ownRelations.push({
                      id: `local_${targetNode.id}_${Date.now()}_${Math.random()}`,
                      targetId: targetNode.id,
                      name: targetNode.name,
                      type: targetNode.type,
                      group: targetNode.group,
                      relation: rel?.relation || defaultRole,
                      isCustom: true,
                      isBackend: false
                    });
                  }
                }
              });
            }
          };

          if (type === 'character') {
            if (target.parents) pushLocalRelation(target.parents, 'Cha/Mẹ');
            if (target.siblings) pushLocalRelation(target.siblings, 'Anh/Chị/Em');
            if (target.family) pushLocalRelation(target.family, 'Gia đình');
            if (target.relatedCharacters) pushLocalRelation(target.relatedCharacters, 'Liên quan');
            const localDataStr = localStorage.getItem(`local_char_relations_${cleanId}`) || (target.slug ? localStorage.getItem(`local_char_relations_${target.slug}`) : null);
            if (localDataStr) {
              try {
                const data = JSON.parse(localDataStr);
                pushLocalRelation(data.parents, 'Cha/Mẹ');
                pushLocalRelation(data.siblings, 'Anh/Chị/Em');
                pushLocalRelation(data.family, 'Gia đình');
                pushLocalRelation(data.relatedCharacters, 'Liên quan');
              } catch (e) { }
            }
          } else if (type === 'event') {
            if (target.relatedCharacters) pushLocalRelation(target.relatedCharacters, 'Nhân vật liên quan');
            const localDataStr = localStorage.getItem(`local_event_relations_${cleanId}`);
            if (localDataStr) {
              try {
                const data = JSON.parse(localDataStr);
                pushLocalRelation(data.relatedCharacters, 'Nhân vật liên quan');
              } catch (e) { }
            }
          } else if (type === 'location') {
            if (target.relatedCharacters) pushLocalRelation(target.relatedCharacters, 'Nhân vật liên quan');
            if (target.relatedEvents) pushLocalRelation(target.relatedEvents, 'Sự kiện liên quan');
            const localDataStr = localStorage.getItem(`local_location_relations_${cleanId}`);
            if (localDataStr) {
              try {
                const data = JSON.parse(localDataStr);
                pushLocalRelation(data.relatedCharacters, 'Nhân vật liên quan');
                pushLocalRelation(data.relatedEvents, 'Sự kiện liên quan');
              } catch (e) { }
            }
          }

          setRelatedEntities(ownRelations);
          setOriginalRelations(ownRelations.map(x => ({ ...x })));
        }
      } catch (error) {
        console.error('Error fetching details:', error);
      }
    };
    fetchData();
  }, [id]);

  const handleAddLink = () => {
    if (!newLinkName.trim() || !newLinkRelation.trim()) {
      toast.error("Vui lòng điền đầy đủ tên thực thể và mối quan hệ.");
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
      tType = 'Di tích';
      tGroup = 'location';
    }

    if (!targetNode) {
      toast.error(`Không tìm thấy thực thể nào có tên "${newLinkName}"`);
      return;
    }

    if (String(targetNode.id) === String(id)) {
      toast.error("Không thể tạo liên kết tới chính nó.");
      return;
    }

    const duplicate = relatedEntities.some(re => String(re.targetId) === String(targetNode.id));
    if (duplicate) {
      toast.error("Mối liên kết với thực thể này đã tồn tại.");
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
      setFormErrors({ name: 'Vui lòng nhập tên thực thể.' });
      toast.error("Vui lòng kiểm tra lại thông tin nhập bị lỗi.");
      return;
    }
    setFormErrors({});

    try {
      // 1. Save base entity information
      if (!isNaN(Number(cleanId))) {
        if (entityType === 'character') {
          const payload = {
            name: name,
            slug: entity.slug || generateSlug(name),
            alias: entity.alias !== undefined ? entity.alias : (entity.title !== undefined ? entity.title : ''),
            biography: desc,
            birthDate: entity.birthDate || null,
            deathDate: entity.deathDate || null
          };
          await apiClient.put(`${API_ENDPOINTS.ADMIN_CHARACTERS}/${cleanId}`, payload);
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
          await apiClient.put(`${API_ENDPOINTS.ADMIN_EVENTS}/${cleanId}`, payload);
        } else if (entityType === 'location') {
          const payload = {
            name: name,
            slug: entity.slug || generateSlug(name),
            locationType: entity.locationType || 'CITY',
            latitude: entity.latitude !== undefined ? entity.latitude : null,
            longitude: entity.longitude !== undefined ? entity.longitude : null,
            description: desc
          };
          await apiClient.put(`${API_ENDPOINTS.ADMIN_LOCATIONS}/${cleanId}`, payload);
        }
      }
    } catch (error) {
      console.error('Lỗi khi lưu thông tin thực thể vào backend:', error);
      toast.error('Có lỗi xảy ra khi lưu vào database. Vui lòng kiểm tra lại.');
      return;
    }

    // 2. Synchronize DB relationships
    if (!isNaN(Number(cleanId))) {
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
              personId: Number(cleanId),
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
              eventId: Number(cleanId),
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
                .filter(lr => String(lr.locationId) !== String(cleanId))
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
                locationId: Number(cleanId),
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
        toast.error('Có lỗi xảy ra khi cập nhật các liên kết dữ liệu.');
      }
    }

    navigate('/admin/hub');
  };

  const getCombinedNodes = () => {
    return [...allCharacters, ...allEvents, ...allLocations].filter(n => String(n.id) !== String(cleanId) && String(n.id) !== String(id));
  };

  if (!id) {
    return (
      <div className="flex-grow bg-surface min-h-screen font-body pb-20 animate-in fade-in duration-500">
        <main className="p-8 max-w-7xl mx-auto space-y-8">
          <FormHeader loading={loading}
            title="Thêm Mối Quan Hệ"
            subtitle="Chọn một thực thể làm gốc để bắt đầu thêm các liên kết."
            icon="hub"
            isEdit={false}
            onCancel={() => navigate('/admin/hub')}
            hideSave={true}
          />
          <div className="bg-white p-8 rounded-[2rem] border border-outline-variant/60 shadow-sm space-y-6 max-w-2xl mx-auto mt-12">
            <h3 className="font-headline text-2xl text-primary font-bold border-b border-outline-variant/40 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[24px]">search</span>
              Chọn Thực Thể Nguồn
            </h3>
            <p className="text-sm text-on-surface-variant italic">Tìm kiếm và chọn một nhân vật, sự kiện hoặc di tích để bắt đầu tạo mối quan hệ.</p>
            <div className="space-y-3 pt-4">
              <label className="font-body text-[11px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 opacity-80">
                Tên thực thể
              </label>
              <input
                type="text"
                list="all-nodes"
                onChange={(e) => {
                  const val = e.target.value;
                  const foundChar = allCharacters.find(c => c.name === val);
                  if (foundChar) return navigate(`/admin/hub/edit/character_${foundChar.id}`);
                  const foundEvent = allEvents.find(ev => ev.name === val);
                  if (foundEvent) return navigate(`/admin/hub/edit/event_${foundEvent.id}`);
                  const foundLoc = allLocations.find(l => l.name === val);
                  if (foundLoc) return navigate(`/admin/hub/edit/location_${foundLoc.id || foundLoc.location_id}`);
                }}
                placeholder="Nhập tên nhân vật, sự kiện hoặc di tích..."
                className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-4 text-base font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
              />
              <datalist id="all-nodes">
                {allCharacters.map(c => <option key={`c-${c.id}`} value={c.name}>Nhân vật</option>)}
                {allEvents.map(e => <option key={`e-${e.id}`} value={e.name}>Sự kiện</option>)}
                {allLocations.map(l => <option key={`l-${l.id || l.location_id}`} value={l.name}>Di tích</option>)}
              </datalist>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!entity) {
    return (
      <div className="flex items-center justify-center min-h-screen font-body text-primary bg-[#FDFBF0]">
        Đang tải thông tin thực thể liên quan...
      </div>
    );
  }

  return (
    <div className="flex-grow bg-surface min-h-screen font-body pb-20 animate-in fade-in duration-500">
      <main className="p-8 max-w-7xl mx-auto space-y-8">
        <FormHeader loading={loading}
          title="Thiết lập liên kết thực thể"
          subtitle="Quản lý và điều chỉnh các mối quan hệ của thực thể trên Mạng lưới tri thức."
          icon="hub"
          isEdit={true}
          onCancel={() => navigate('/admin/hub')}
          onSave={handleSave}
          status="published"
          contentType="relation"
        />
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
                    onChange={e => { setName(e.target.value); if(formErrors.name) setFormErrors({}); }}
                    className={`w-full bg-transparent border-0 border-b-2 py-2.5 font-headline text-2xl font-bold outline-none transition-colors ${formErrors.name ? 'border-red-500 focus:border-red-600 text-red-500' : 'border-outline-variant focus:border-primary text-primary'}`}
                  />
                  {formErrors.name && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {formErrors.name}</p>}
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
                    <select
                      value={newLinkName}
                      onChange={e => setNewLinkName(e.target.value)}
                      className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-xs font-bold text-on-surface outline-none focus:border-primary appearance-none pr-8 cursor-pointer"
                    >
                      <option value="" disabled>-- Chọn thực thể kết nối --</option>
                      {getCombinedNodes().map(n => (
                        <option key={n.id} value={n.name}>
                          {n.name} - {(n.type || (n.years ? 'Nhân vật' : 'Sự kiện'))}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">expand_more</span>
                  </div>

                  <div className="relative">
                    <select
                      value={newLinkRelation}
                      onChange={e => setNewLinkRelation(e.target.value)}
                      className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-xs font-bold text-on-surface outline-none focus:border-primary appearance-none pr-8 cursor-pointer"
                    >
                      <option value="" disabled>-- Chọn loại mối quan hệ --</option>
                      <optgroup label="Nhân vật - Sự kiện">
                        {Object.entries(PARTICIPATION_ROLE_LABELS).map(([key, label]) => (
                          <option key={`p-${key}`} value={key}>{label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Sự kiện - Di tích">
                        {Object.entries(EVENT_LOCATION_RELATION_LABELS).map(([key, label]) => (
                          <option key={`l-${key}`} value={key}>{label}</option>
                        ))}
                      </optgroup>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-sm">expand_more</span>
                  </div>

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
