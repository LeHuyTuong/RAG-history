import {  useState, useEffect, useRef, useCallback  } from 'react';
import { useNavigate } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';

const KnowledgeGraph = () => {
  const navigate = useNavigate();
  const graphRef = useRef();
  
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [charsRes, evtsRes, locsRes] = await Promise.all([
          fetch('/api/admin_characters.json').then(r => r.json()),
          fetch('/api/admin_events.json').then(r => r.json()),
          fetch('/api/admin_locations.json').then(r => r.json())
        ]);

        const newNodes = [];
        const newLinks = [];

        // 1. Process Characters
        charsRes.characters.forEach(c => {
          newNodes.push({
            id: c.id,
            name: c.name,
            group: 'character',
            type: 'Nhân vật',
            dynasty: c.dynasty,
            desc: c.title + ' (' + c.years + ')'
          });
        });

        // 2. Process Events
        evtsRes.events.forEach(e => {
          newNodes.push({
            id: e.id,
            name: e.name,
            group: 'event',
            type: 'Sự kiện',
            dynasty: e.dynasty,
            desc: e.sub + ' (' + e.time + ')'
          });
        });

        // 3. Process Locations
        locsRes.locations.forEach(l => {
          newNodes.push({
            id: l.id,
            name: l.name,
            group: 'location',
            type: 'Địa danh',
            dynasties: l.dynasties, // Array
            desc: l.type + ' (' + l.coords + ')'
          });
        });

        // 4. Generate Links
        // Connect nodes that share a common dynasty to form meaningful historic clusters
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
                if (d1 === d2 && d1) {
                  hasOverlap = true;
                  break;
                }
              }
              if (hasOverlap) break;
            }

            // Also connect specific hardcoded lore lines to make the graph rich
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

        setGraphData({ nodes: newNodes, links: newLinks });
      } catch (error) {
        console.error('Error fetching graph data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleZoomIn = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom * 1.5, 400);
    }
  };

  const handleZoomOut = () => {
    if (graphRef.current) {
      const currentZoom = graphRef.current.zoom();
      graphRef.current.zoom(currentZoom / 1.5, 400);
    }
  };

  const handleFitCenter = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(600, 50);
    }
  };

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
    ctx.fillStyle = '#1c1b1b'; // Dark text
    
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
      {/* 1. TOP ACTION BAR */}
      <header className="h-16 border-b border-outline-variant px-8 flex items-center justify-between bg-white/80 backdrop-blur z-20">
        <div>
           <h2 className="font-headline text-4xl text-primary font-bold italic tracking-tight">Mạng lưới Tri thức</h2>
           <p className="text-[10px] text-on-surface-variant italic leading-none">Minh họa các mối quan hệ đa chiều trong sử liệu Việt Nam</p>
        </div>
        <div className="flex items-center bg-surface-low border border-outline-variant p-1 rounded-lg">
           <button onClick={handleZoomIn} className="p-1.5 hover:bg-white rounded transition-all"><span className="material-symbols-outlined text-sm">zoom_in</span></button>
           <button onClick={handleZoomOut} className="p-1.5 hover:bg-white rounded transition-all"><span className="material-symbols-outlined text-sm">zoom_out</span></button>
           <div className="w-px h-4 bg-outline-variant mx-1"></div>
           <button onClick={handleFitCenter} className="p-1.5 hover:bg-white rounded transition-all text-[10px] font-bold px-3">TỰ ĐỘNG CĂN CHỈNH</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {/* 2. KHÔNG GIAN SƠ ĐỒ (GRAPH CANVAS) */}
        <section ref={containerRef} className="flex-1 relative bg-[#FDFBF0]">
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#89716f 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
           
           {loading ? (
              <div className="absolute inset-0 flex items-center justify-center font-body text-primary z-50 bg-[#FDFBF0]/80 backdrop-blur-sm">
                Đang nạp dữ liệu và tính toán lực hấp dẫn...
              </div>
           ) : (
             <ForceGraph2D
                ref={graphRef}
                width={dimensions.width}
                height={dimensions.height}
                graphData={graphData}
                nodeLabel={() => ''} // Tooltip is handled manually or disabled
                nodeCanvasObject={drawNode}
                onNodeClick={(node) => setSelectedEntity(node)}
                linkDirectionalParticles={2}
                linkDirectionalParticleSpeed={d => d.value * 0.005}
                linkColor={() => 'rgba(75, 0, 4, 0.15)'}
                linkWidth={1.5}
                d3VelocityDecay={0.3} // Slightly more fluid
             />
           )}

           {/* Chú giải góc trái */}
           <div className="absolute bottom-6 left-6 bg-white/90 p-4 rounded-lg border border-outline-variant shadow-xl text-[10px] font-body space-y-2 pointer-events-none">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary"></span> Nhân vật</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Địa danh</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-secondary"></span> Sự kiện</div>
           </div>
        </section>

        {/* 3. SIDE PANEL CHI TIẾT (Right Sidebar) */}
        <aside className={`w-[350px] bg-white border-l border-outline-variant transition-transform duration-500 overflow-y-auto custom-scrollbar absolute right-0 top-0 bottom-0 z-30 ${selectedEntity ? 'translate-x-0' : 'translate-x-full'}`}>
           {selectedEntity && (
             <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                   <span className="bg-primary/10 text-primary px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest">{selectedEntity.type}</span>
                   <button onClick={() => setSelectedEntity(null)} className="material-symbols-outlined text-sm opacity-30 hover:opacity-100">close</button>
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
                   <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                      {graphData.links
                        .filter(l => l.source.id === selectedEntity.id || l.target.id === selectedEntity.id)
                        .map((l, idx) => {
                           const otherNode = l.source.id === selectedEntity.id ? l.target : l.source;
                           return (
                             <div key={idx} onClick={() => setSelectedEntity(otherNode)} className="flex items-center gap-3 p-2 hover:bg-surface-low rounded transition-all cursor-pointer text-sm border border-transparent hover:border-outline-variant">
                                <span className={`material-symbols-outlined text-sm ${otherNode.group === 'character' ? 'text-primary' : otherNode.group === 'location' ? 'text-accent' : 'text-secondary'}`}>
                                  {otherNode.group === 'character' ? 'person' : otherNode.group === 'location' ? 'location_on' : 'event'}
                                </span>
                                <span className="font-bold">{otherNode.name}</span>
                             </div>
                           );
                        })
                      }
                   </div>
                </div>
                
                <button 
                  onClick={() => navigate(`/admin/${selectedEntity.group}s/edit/${selectedEntity.id}`)}
                  className="w-full py-3 bg-primary text-white font-headline font-bold uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all"
                >
                  Sửa dữ liệu thực thể
                </button>
             </div>
           )}
        </aside>
      </main>
    </div>
  );
};

export default KnowledgeGraph;