import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import PageHeader from '../../../components/admin/PageHeader';

const KnowledgeGraph = () => {
  const navigate = useNavigate();
  const graphRef = useRef();

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  // States for creating a new relationship
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sourceNode, setSourceNode] = useState('');
  const [targetNode, setTargetNode] = useState('');
  const [relationText, setRelationText] = useState('');

  // Manage dimensions for the graph canvas
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [charsRes, evtsRes, locsRes] = await Promise.all([
        fetch('/api/admin_characters.json').then(r => r.json()),
        fetch('/api/admin_events.json').then(r => r.json()),
        fetch('/api/admin_locations.json').then(r => r.json())
      ]);

      const deletedIds = new Set(JSON.parse(localStorage.getItem('admin_deleted_ids') || '[]'));

      // 1. Load and merge characters
      let baseChars = charsRes.characters || [];
      const localNewChars = JSON.parse(localStorage.getItem('admin_new_characters') || '[]');
      let mergedChars = [...baseChars];
      localNewChars.forEach(localChar => {
        const idx = mergedChars.findIndex(c => String(c.id) === String(localChar.id));
        if (idx >= 0) {
          mergedChars[idx] = localChar;
        } else {
          mergedChars.push(localChar);
        }
      });
      mergedChars = mergedChars.filter(c => !deletedIds.has(String(c.id)));

      // 2. Load and merge events
      let baseEvents = evtsRes.events || [];
      const localNewEvents = JSON.parse(localStorage.getItem('admin_new_events') || '[]');
      let mergedEvents = [...baseEvents];
      localNewEvents.forEach(localEvent => {
        const idx = mergedEvents.findIndex(e => String(e.id) === String(localEvent.id));
        if (idx >= 0) {
          mergedEvents[idx] = localEvent;
        } else {
          mergedEvents.push(localEvent);
        }
      });
      mergedEvents = mergedEvents.filter(e => !deletedIds.has(String(e.id)));

      // 3. Load and merge locations
      let baseLocations = locsRes.locations || [];
      const localNewLocations = JSON.parse(localStorage.getItem('admin_new_locations') || '[]');
      let mergedLocations = [...baseLocations];
      localNewLocations.forEach(localLoc => {
        const idx = mergedLocations.findIndex(l => String(l.id) === String(localLoc.id));
        if (idx >= 0) {
          mergedLocations[idx] = localLoc;
        } else {
          mergedLocations.push(localLoc);
        }
      });
      mergedLocations = mergedLocations.filter(l => !deletedIds.has(String(l.id)));

      const newNodes = [];
      const newLinks = [];

      // Process Characters
      mergedChars.forEach(c => {
        newNodes.push({
          id: c.id,
          name: c.name,
          group: 'character',
          type: 'Nhân vật',
          dynasty: c.dynasty,
          desc: (c.title || c.role || '') + ' (' + (c.years || '') + ')'
        });
      });

      // Process Events
      mergedEvents.forEach(e => {
        newNodes.push({
          id: e.id,
          name: e.name,
          group: 'event',
          type: 'Sự kiện',
          dynasty: e.dynasty,
          desc: (e.sub || e.shortDesc || '') + ' (' + (e.time || '') + ')'
        });
      });

      // Process Locations
      mergedLocations.forEach(l => {
        newNodes.push({
          id: l.id,
          name: l.name,
          group: 'location',
          type: 'Địa danh',
          dynasties: l.dynasties || (l.dynasty ? [l.dynasty] : []), // Array
          desc: (l.type || '') + ' (' + (l.coords || '') + ')'
        });
      });

      // Generate Auto Links based on dynasty overlap and hardcoded lore
      const allNodes = newNodes;
      for (let i = 0; i < allNodes.length; i++) {
        for (let j = i + 1; j < allNodes.length; j++) {
          const n1 = allNodes[i];
          const n2 = allNodes[j];

          // Check overlapping dynasty
          let hasOverlap = false;
          const dyn1 = n1.dynasties || [n1.dynasty];
          const dyn2 = n2.dynasties || [n2.dynasty];

          for (let d1 of dyn1) {
            for (let d2 of dyn2) {
              if (d1 === d2 && d1 && d1 !== 'Khác') {
                hasOverlap = true;
                break;
              }
            }
            if (hasOverlap) break;
          }

          const isLoreLink = (n1.name === 'Lê Lợi' && n2.name === 'Khởi nghĩa Lam Sơn') ||
            (n1.name === 'Lê Lợi' && n2.name === 'Ải Chi Lăng') ||
            (n1.name === 'Trần Hưng Đạo' && n2.name === 'Trận Hàm Tử') ||
            (n1.name === 'Trần Hưng Đạo' && n2.name === 'Bạch Đằng Giang');

          if (hasOverlap || isLoreLink) {
            newLinks.push({
              source: n1.id,
              target: n2.id,
              value: isLoreLink ? 3 : 1
            });
          }
        }
      }

      // Generate Custom Links from localCustomRelations
      const localCustomRelations = JSON.parse(localStorage.getItem('admin_custom_relations') || '[]');
      localCustomRelations.forEach(rel => {
        const sourceExists = newNodes.some(n => String(n.id) === String(rel.sourceId));
        const targetExists = newNodes.some(n => String(n.id) === String(rel.targetId));
        if (sourceExists && targetExists) {
          // Check if link already exists, if so enrich it instead of duplicating
          const existingLink = newLinks.find(lk => 
            (String(lk.source) === String(rel.sourceId) && String(lk.target) === String(rel.targetId)) ||
            (String(lk.source) === String(rel.targetId) && String(lk.target) === String(rel.sourceId))
          );
          if (existingLink) {
            existingLink.id = rel.id;
            existingLink.relation = rel.relation;
            existingLink.isCustom = true;
            existingLink.value = 4;
          } else {
            newLinks.push({
              id: rel.id,
              source: rel.sourceId,
              target: rel.targetId,
              value: 4,
              relation: rel.relation,
              isCustom: true
            });
          }
        }
      });

      setGraphData({ nodes: newNodes, links: newLinks });
    } catch (error) {
      console.error('Error fetching graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteRelation = (linkId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa mối quan hệ này không?")) {
      const localCustomRelations = JSON.parse(localStorage.getItem('admin_custom_relations') || '[]');
      const filtered = localCustomRelations.filter(rel => String(rel.id) !== String(linkId));
      localStorage.setItem('admin_custom_relations', JSON.stringify(filtered));
      
      // Reset selected selection to update details
      setSelectedEntity(null);
      
      // Reload graph data
      fetchData();
    }
  };

  const handleSaveRelation = (e) => {
    e.preventDefault();
    if (!sourceNode.trim() || !targetNode.trim() || !relationText.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin.");
      return;
    }

    const sNodeObj = graphData.nodes.find(n => n.name.toLowerCase() === sourceNode.trim().toLowerCase());
    const tNodeObj = graphData.nodes.find(n => n.name.toLowerCase() === targetNode.trim().toLowerCase());

    if (!sNodeObj) {
      alert(`Không tìm thấy thực thể thứ nhất: "${sourceNode}"`);
      return;
    }
    if (!tNodeObj) {
      alert(`Không tìm thấy thực thể thứ hai: "${targetNode}"`);
      return;
    }
    if (sNodeObj.id === tNodeObj.id) {
      alert("Không thể tạo mối quan hệ của một thực thể với chính nó.");
      return;
    }

    const localCustomRelations = JSON.parse(localStorage.getItem('admin_custom_relations') || '[]');
    
    // Check duplication
    const exists = localCustomRelations.some(rel => 
      (String(rel.sourceId) === String(sNodeObj.id) && String(rel.targetId) === String(tNodeObj.id)) ||
      (String(rel.sourceId) === String(tNodeObj.id) && String(rel.targetId) === String(sNodeObj.id))
    );

    if (exists) {
      alert("Mối quan hệ giữa hai thực thể này đã tồn tại.");
      return;
    }

    const newRelation = {
      id: 'rel_' + Date.now(),
      sourceId: sNodeObj.id,
      sourceName: sNodeObj.name,
      targetId: tNodeObj.id,
      targetName: tNodeObj.name,
      relation: relationText.trim()
    };

    localCustomRelations.push(newRelation);
    localStorage.setItem('admin_custom_relations', JSON.stringify(localCustomRelations));

    setSourceNode('');
    setTargetNode('');
    setRelationText('');
    setIsModalOpen(false);
    fetchData();
  };

  const handleZoomIn = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.5, 400);
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom / 1.5, 400);
    }
  }, []);

  const handleFitCenter = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(600, 50);
    }
  }, []);

  // Custom node rendering on canvas
  const drawNode = useCallback((node, ctx, globalScale) => {
    const label = node.name;
    const fontSize = 14 / globalScale;

    // Node styling by group
    const colors = {
      character: '#312b2a', // Primary
      location: '#89716f', // Accent
      event: '#a29583'    // Secondary
    };
    const nodeColor = colors[node.group] || '#999';
    const radius = 6;

    // Draw circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = nodeColor;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw text
    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1c1b1b';

    // Slight offset below the circle
    ctx.fillText(label, node.x, node.y + radius + (8 / globalScale));

    // Hover / selection effect
    if (selectedEntity && selectedEntity.id === node.id) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 4, 0, 2 * Math.PI, false);
      ctx.strokeStyle = '#ff5722';
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    }
  }, [selectedEntity]);

  return (
    <div className="flex flex-col h-screen bg-surface font-body overflow-hidden">
      {/* 1. TOP ACTION BAR - Consistent with other admin pages */}
      <div className="px-8 max-w-[1600px] mx-auto w-full pt-8 pb-4">
        <PageHeader
          title="Mạng lưới Tri thức"
          subtitle="Minh họa các mối quan hệ đa chiều trong sử liệu Việt Nam"
          actionLabel="THÊM QUAN HỆ"
          actionIcon="add_circle"
          onActionClick={() => setIsModalOpen(true)}
        />
      </div>

      <main className="flex-1 flex overflow-hidden relative">
        {/* 2. KHÔNG GIAN SƠ ĐỒ (GRAPH CANVAS) */}
        <section ref={containerRef} className="flex-1 relative bg-surface">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#89716f 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

          {/* Zoom controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-white/90 border border-outline-variant p-1 rounded-lg shadow-lg">
            <button onClick={handleZoomIn} className="p-1.5 hover:bg-primary/10 rounded transition-all" title="Phóng to"><span className="material-symbols-outlined text-sm">zoom_in</span></button>
            <button onClick={handleZoomOut} className="p-1.5 hover:bg-primary/10 rounded transition-all" title="Thu nhỏ"><span className="material-symbols-outlined text-sm">zoom_out</span></button>
            <div className="w-px h-4 bg-outline-variant mx-1"></div>
            <button onClick={handleFitCenter} className="p-1.5 hover:bg-primary/10 rounded transition-all text-[10px] font-bold px-3" title="Tự động căn chỉnh">TỰ ĐỘNG CĂN CHỈNH</button>
          </div>

          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center font-body text-primary z-50 bg-surface/80 backdrop-blur-sm">
              Đang nạp dữ liệu và tính toán lực hấp dẫn...
            </div>
          ) : (
            <ForceGraph2D
              ref={graphRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeLabel={() => ''}
              nodeCanvasObject={drawNode}
              onNodeClick={(node) => setSelectedEntity(node)}
              linkDirectionalParticles={2}
              linkDirectionalParticleSpeed={d => d.value * 0.005}
              linkColor={() => 'rgba(75, 0, 4, 0.15)'}
              linkWidth={d => d.value || 1.5}
              linkLabel={link => {
                const sName = typeof link.source === 'object' ? link.source.name : (graphData.nodes.find(n => n.id === link.source)?.name || link.source);
                const tName = typeof link.target === 'object' ? link.target.name : (graphData.nodes.find(n => n.id === link.target)?.name || link.target);
                const relation = link.relation || 'Liên kết lịch sử';
                return `<div style="background: rgba(30, 41, 59, 0.95); color: #fff; padding: 6px 12px; border-radius: 8px; font-size: 11px; border: 1px solid rgba(255,255,255,0.15); font-family: sans-serif; font-weight: bold; pointer-events: none;">${sName} ➔ ${relation} ➔ ${tName}</div>`;
              }}
              d3VelocityDecay={0.3}
            />
          )}

          {/* Chú giải góc trái */}
          <div className="absolute bottom-6 left-6 bg-surface/90 p-4 rounded-lg border border-outline-variant shadow-xl text-[10px] font-body space-y-2 pointer-events-none">
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary"></span> Nhân vật</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Địa danh</div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-secondary"></span> Sự kiện</div>
          </div>
        </section>

        {/* 3. SIDE PANEL CHI TIẾT (Right Sidebar) */}
        <aside className={`w-[350px] bg-surface border-l border-outline-variant transition-transform duration-500 overflow-y-auto custom-scrollbar absolute right-0 top-0 bottom-0 z-30 ${selectedEntity ? 'translate-x-0' : 'translate-x-full'}`}>
          {selectedEntity && (
            <div className="p-8 space-y-8">
              <div className="flex justify-between items-start">
                <span className="bg-primary/10 text-primary px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest">{selectedEntity.type}</span>
                <button onClick={() => setSelectedEntity(null)} className="material-symbols-outlined text-sm opacity-30 hover:opacity-100 cursor-pointer">close</button>
              </div>
              <div>
                <h3 className="font-headline text-3xl text-primary font-bold leading-tight">{selectedEntity.name}</h3>
                <p className="text-on-surface-variant text-sm italic mt-2">{selectedEntity.desc}</p>
                {selectedEntity.dynasty && (
                  <div className="mt-3 inline-block bg-surface-low border border-outline px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded">
                    {selectedEntity.dynasty}
                  </div>
                )}
                {selectedEntity.dynasties && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {selectedEntity.dynasties.map(d => (
                      <span key={d} className="bg-surface-low border border-outline px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded">{d}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-body text-[10px] font-bold uppercase border-b pb-2">Liên kết đã phân tích</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {graphData.links
                    .filter(l => {
                      const sId = typeof l.source === 'object' ? l.source.id : l.source;
                      const tId = typeof l.target === 'object' ? l.target.id : l.target;
                      return String(sId) === String(selectedEntity.id) || String(tId) === String(selectedEntity.id);
                    })
                    .map((l, idx) => {
                      const sId = typeof l.source === 'object' ? l.source.id : l.source;
                      const otherNode = String(sId) === String(selectedEntity.id) ? l.target : l.source;
                      return (
                        <div key={idx} onClick={() => setSelectedEntity(otherNode)} className="flex items-center justify-between p-2 hover:bg-surface-low rounded transition-all cursor-pointer text-sm border border-transparent hover:border-outline-variant group">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`material-symbols-outlined text-sm shrink-0 ${otherNode.group === 'character' ? 'text-primary' : otherNode.group === 'location' ? 'text-accent' : 'text-secondary'}`}>
                              {otherNode.group === 'character' ? 'person' : otherNode.group === 'location' ? 'location_on' : 'event'}
                            </span>
                            <span className="font-bold truncate">{otherNode.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {l.relation && (
                              <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                                {l.relation}
                              </span>
                            )}
                            {l.isCustom && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRelation(l.id);
                                }}
                                className="material-symbols-outlined text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-50 rounded"
                                title="Xóa mối quan hệ"
                              >
                                delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  }
                  {graphData.links.filter(l => {
                    const sId = typeof l.source === 'object' ? l.source.id : l.source;
                    const tId = typeof l.target === 'object' ? l.target.id : l.target;
                    return String(sId) === String(selectedEntity.id) || String(tId) === String(selectedEntity.id);
                  }).length === 0 && (
                    <p className="text-[10px] text-on-surface-variant italic py-2">Chưa có mối liên kết nào.</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate(`/admin/hub/edit/${selectedEntity.id}`)}
                  className="w-full py-3 bg-primary hover:bg-primary-container text-white font-headline font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all rounded-xl cursor-pointer"
                >
                  Thiết lập mối liên kết
                </button>
                <button
                  onClick={() => navigate(`/admin/${selectedEntity.group}s/edit/${selectedEntity.id}`)}
                  className="w-full py-3 border border-primary/30 text-primary hover:bg-primary/5 font-headline font-bold uppercase text-xs tracking-widest active:scale-95 transition-all rounded-xl cursor-pointer animate-none"
                >
                  Sửa thông tin chi tiết
                </button>
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* 4. MODAL THÊM MỐI QUAN HỆ */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-[2rem] border border-outline-variant shadow-2xl max-w-md w-full p-8 space-y-6 relative animate-in fade-in zoom-in duration-300">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-6 right-6 material-symbols-outlined text-on-surface-variant hover:text-red-500 transition-colors cursor-pointer"
            >
              close
            </button>
            
            <div className="space-y-1">
              <h3 className="font-headline text-2xl text-primary font-bold">Thêm Mối Quan Hệ Mới</h3>
              <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest">Thiết lập mối liên kết giữa các thực thể lịch sử</p>
            </div>

            <form onSubmit={handleSaveRelation} className="space-y-5">
              <div className="space-y-2">
                <label className="block font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Thực thể thứ nhất</label>
                <div className="relative">
                  <input
                    type="text"
                    list="nodes-source"
                    value={sourceNode}
                    onChange={e => setSourceNode(e.target.value)}
                    placeholder="Chọn nhân vật, địa danh, hoặc sự kiện..."
                    className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 text-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <datalist id="nodes-source">
                    {graphData.nodes.map(n => (
                      <option key={n.id} value={n.name}>{n.type} - {n.dynasty || 'Khác'}</option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Thực thể thứ hai</label>
                <div className="relative">
                  <input
                    type="text"
                    list="nodes-target"
                    value={targetNode}
                    onChange={e => setTargetNode(e.target.value)}
                    placeholder="Chọn nhân vật, địa danh, hoặc sự kiện..."
                    className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 text-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <datalist id="nodes-target">
                    {graphData.nodes.map(n => (
                      <option key={n.id} value={n.name}>{n.type} - {n.dynasty || 'Khác'}</option>
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Mối quan hệ</label>
                <input
                  type="text"
                  value={relationText}
                  onChange={e => setRelationText(e.target.value)}
                  placeholder="Vd: Lãnh đạo, Phó tướng, Nơi diễn ra trận chiến..."
                  className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 text-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 border border-primary/30 text-primary hover:bg-primary/5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraph;