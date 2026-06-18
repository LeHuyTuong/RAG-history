import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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

  // States for adding a new link
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkRelation, setNewLinkRelation] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [charsRes, evtsRes, locsRes] = await Promise.all([
          fetch('/api/admin_characters.json').then(r => r.json()),
          fetch('/api/admin_events.json').then(r => r.json()),
          fetch('/api/admin_locations.json').then(r => r.json())
        ]);

        const deletedIds = new Set(JSON.parse(localStorage.getItem('admin_deleted_ids') || '[]'));

        // Merging logic
        let baseChars = charsRes.characters || [];
        const localNewChars = JSON.parse(localStorage.getItem('admin_new_characters') || '[]');
        let mergedChars = [...baseChars];
        localNewChars.forEach(localChar => {
          const idx = mergedChars.findIndex(c => String(c.id) === String(localChar.id));
          if (idx >= 0) mergedChars[idx] = localChar;
          else mergedChars.push(localChar);
        });
        mergedChars = mergedChars.filter(c => !deletedIds.has(String(c.id)));

        let baseEvents = evtsRes.events || [];
        const localNewEvents = JSON.parse(localStorage.getItem('admin_new_events') || '[]');
        let mergedEvents = [...baseEvents];
        localNewEvents.forEach(localEvent => {
          const idx = mergedEvents.findIndex(e => String(e.id) === String(localEvent.id));
          if (idx >= 0) mergedEvents[idx] = localEvent;
          else mergedEvents.push(localEvent);
        });
        mergedEvents = mergedEvents.filter(e => !deletedIds.has(String(e.id)));

        let baseLocations = locsRes.locations || [];
        const localNewLocations = JSON.parse(localStorage.getItem('admin_new_locations') || '[]');
        let mergedLocations = [...baseLocations];
        localNewLocations.forEach(localLoc => {
          const idx = mergedLocations.findIndex(l => String(l.id) === String(localLoc.id));
          if (idx >= 0) mergedLocations[idx] = localLoc;
          else mergedLocations.push(localLoc);
        });
        mergedLocations = mergedLocations.filter(l => !deletedIds.has(String(l.id)));

        setAllCharacters(mergedChars);
        setAllEvents(mergedEvents);
        setAllLocations(mergedLocations);

        // Find the target entity
        let target = mergedChars.find(c => String(c.id) === String(id));
        let type = 'character';
        let tLabel = 'Nhân vật';
        
        if (!target) {
          target = mergedEvents.find(e => String(e.id) === String(id));
          type = 'event';
          tLabel = 'Sự kiện';
        }
        if (!target) {
          target = mergedLocations.find(l => String(l.id) === String(id));
          type = 'location';
          tLabel = 'Địa danh';
        }

        if (target) {
          setEntity(target);
          setEntityType(type);
          setTypeLabel(tLabel);
          setName(target.name || '');
          setDesc(target.biography || target.description || target.shortDesc || '');

          // Resolve relations
          const ownRelations = [];
          if (target.relatedCharacters) {
            target.relatedCharacters.forEach(rcName => {
              const found = mergedChars.find(c => c.name.toLowerCase() === rcName.toLowerCase());
              ownRelations.push({
                id: found ? found.id : 'temp_char_' + rcName,
                name: rcName,
                type: 'Nhân vật',
                group: 'character',
                relation: 'Liên kết'
              });
            });
          }
          if (target.relatedLocations) {
            target.relatedLocations.forEach(rlName => {
              const found = mergedLocations.find(l => l.name.toLowerCase() === rlName.toLowerCase());
              ownRelations.push({
                id: found ? found.id : 'temp_loc_' + rlName,
                name: rlName,
                type: 'Địa danh',
                group: 'location',
                relation: 'Địa danh liên quan'
              });
            });
          }

          const localCustomRelations = JSON.parse(localStorage.getItem('admin_custom_relations') || '[]');
          const customRelations = [];
          localCustomRelations.forEach(rel => {
            if (String(rel.sourceId) === String(id)) {
              customRelations.push({
                id: rel.id,
                targetId: rel.targetId,
                name: rel.targetName,
                relation: rel.relation,
                isCustom: true
              });
            } else if (String(rel.targetId) === String(id)) {
              customRelations.push({
                id: rel.id,
                targetId: rel.sourceId,
                name: rel.sourceName,
                relation: rel.relation,
                isCustom: true
              });
            }
          });

          const resolved = [];
          const hasName = (n) => resolved.some(r => r.name.toLowerCase() === n.toLowerCase());

          customRelations.forEach(cr => {
            let tType = 'Nhân vật';
            let tGroup = 'character';
            let foundNode = mergedChars.find(c => String(c.id) === String(cr.targetId));
            if (!foundNode) {
              foundNode = mergedEvents.find(e => String(e.id) === String(cr.targetId));
              tType = 'Sự kiện';
              tGroup = 'event';
            }
            if (!foundNode) {
              foundNode = mergedLocations.find(l => String(l.id) === String(cr.targetId));
              tType = 'Địa danh';
              tGroup = 'location';
            }

            resolved.push({
              id: cr.id,
              targetId: cr.targetId,
              name: cr.name,
              type: tType,
              group: tGroup,
              relation: cr.relation,
              isCustom: true
            });
          });

          ownRelations.forEach(or => {
            if (!hasName(or.name)) {
              resolved.push({
                id: 'auto_' + or.id,
                targetId: or.id,
                name: or.name,
                type: or.type,
                group: or.group,
                relation: or.relation,
                isCustom: false
              });
            }
          });

          setRelatedEntities(resolved);
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

  const handleSave = () => {
    if (!name.trim()) {
      alert("Tên thực thể không được để trống.");
      return;
    }

    // Save custom relationships in localStorage
    const localCustomRelations = JSON.parse(localStorage.getItem('admin_custom_relations') || '[]');
    let updatedCustom = localCustomRelations.filter(rel => 
      String(rel.sourceId) !== String(id) && String(rel.targetId) !== String(id)
    );

    relatedEntities.forEach(re => {
      if (re.isCustom) {
        updatedCustom.push({
          id: String(re.id).startsWith('rel_temp_') ? 'rel_' + Date.now() + Math.random().toString(36).substring(2, 5) : re.id,
          sourceId: id,
          sourceName: name,
          targetId: re.targetId,
          targetName: re.name,
          relation: re.relation
        });
      }
    });
    localStorage.setItem('admin_custom_relations', JSON.stringify(updatedCustom));

    // Save entity details back
    if (entityType === 'character') {
      const localNewChars = JSON.parse(localStorage.getItem('admin_new_characters') || '[]');
      const existingIndex = localNewChars.findIndex(c => String(c.id) === String(id));
      const updatedCharObj = {
        ...entity,
        name: name,
        biography: desc,
        content: desc,
        relatedCharacters: relatedEntities.filter(re => re.group === 'character').map(re => re.name),
        relatedLocations: relatedEntities.filter(re => re.group === 'location').map(re => re.name)
      };
      if (existingIndex >= 0) {
        localNewChars[existingIndex] = updatedCharObj;
      } else {
        localNewChars.push(updatedCharObj);
      }
      localStorage.setItem('admin_new_characters', JSON.stringify(localNewChars));
    } else if (entityType === 'event') {
      const localNewEvents = JSON.parse(localStorage.getItem('admin_new_events') || '[]');
      const existingIndex = localNewEvents.findIndex(e => String(e.id) === String(id));
      const updatedEventObj = {
        ...entity,
        name: name,
        title: name,
        description: desc,
        content: desc,
        relatedCharacters: relatedEntities.filter(re => re.group === 'character').map(re => re.name),
        relatedLocations: relatedEntities.filter(re => re.group === 'location').map(re => re.name)
      };
      if (existingIndex >= 0) {
        localNewEvents[existingIndex] = updatedEventObj;
      } else {
        localNewEvents.push(updatedEventObj);
      }
      localStorage.setItem('admin_new_events', JSON.stringify(localNewEvents));
    } else if (entityType === 'location') {
      const localNewLocations = JSON.parse(localStorage.getItem('admin_new_locations') || '[]');
      const existingIndex = localNewLocations.findIndex(l => String(l.id) === String(id));
      const updatedLocationObj = {
        ...entity,
        name: name,
        description: desc,
        shortDesc: desc
      };
      if (existingIndex >= 0) {
        localNewLocations[existingIndex] = updatedLocationObj;
      } else {
        localNewLocations.push(updatedLocationObj);
      }
      localStorage.setItem('admin_new_locations', JSON.stringify(localNewLocations));
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
                          <p className="text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">{item.relation || 'Liên kết'}</p>
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