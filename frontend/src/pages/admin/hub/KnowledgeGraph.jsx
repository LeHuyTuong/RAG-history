import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const KnowledgeGraph = () => {
  const navigate = useNavigate();
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Dữ liệu mẫu các nút (Nodes)
  const nodes = [
    { id: 1, name: 'Lê Thánh Tông', type: 'Nhân vật', pos: { top: '50%', left: '50%' }, size: 'w-20 h-20' },
    { id: 2, name: 'Thăng Long', type: 'Địa danh', pos: { top: '30%', left: '40%' }, size: 'w-12 h-12' },
    { id: 3, name: 'Cải cách Hồng Đức', type: 'Sự kiện', pos: { top: '35%', left: '60%' }, size: 'w-14 h-14' },
    // { id: 4, name: 'Hồng Đức Bản Đồ', type: 'Sử liệu', pos: { top: '75%', left: '45%' }, size: 'w-12 h-12' },
  ];

  return (
    <div className="flex flex-col h-screen bg-surface font-body overflow-hidden">
      {/* 1. TOP ACTION BAR */}
      <header className="h-16 border-b border-outline-variant px-8 flex items-center justify-between bg-white/80 backdrop-blur z-20">
        <div>
           <h2 className="font-headline text-xl text-primary font-bold uppercase tracking-tighter">Mạng lưới Tri thức</h2>
           <p className="text-[10px] text-on-surface-variant italic leading-none">Minh họa các mối quan hệ đa chiều trong sử liệu Việt Nam</p>
        </div>
        <div className="flex items-center bg-surface-low border border-outline-variant p-1 rounded-lg">
           <button className="p-1.5 hover:bg-white rounded transition-all"><span className="material-symbols-outlined text-sm">zoom_in</span></button>
           <button className="p-1.5 hover:bg-white rounded transition-all"><span className="material-symbols-outlined text-sm">zoom_out</span></button>
           <div className="w-px h-4 bg-outline-variant mx-1"></div>
           <button className="p-1.5 hover:bg-white rounded transition-all text-[10px] font-bold px-3">TỰ ĐỘNG CĂN CHỈNH</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* 2. KHÔNG GIAN SƠ ĐỒ (GRAPH CANVAS) */}
        <section className="flex-1 relative overflow-hidden bg-[#FDFBF0]">
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#89716f 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
           
           {/* Các đường nối (SVG Lines) */}
           <svg className="absolute inset-0 w-full h-full opacity-30">
              <line x1="50%" y1="50%" x2="40%" y2="30%" stroke="#4b0004" strokeWidth="1" strokeDasharray="4" />
              <line x1="50%" y1="50%" x2="60%" y2="35%" stroke="#4b0004" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="45%" y2="75%" stroke="#4b0004" strokeWidth="1" />
           </svg>

           {/* Các thực thể (Nodes) */}
           {nodes.map(node => (
             <div 
               key={node.id} 
               onClick={() => setSelectedEntity(node)}
               style={{ top: node.pos.top, left: node.pos.left }}
               className={`absolute -translate-x-1/2 -translate-y-1/2 z-10 group cursor-pointer transition-all hover:scale-110`}
             >
                <div className={`${node.size} rounded-full border-2 border-accent bg-white flex items-center justify-center shadow-lg group-hover:border-primary transition-all`}>
                   <span className="material-symbols-outlined text-primary">{node.id === 1 ? 'person' : node.id === 3 ? 'event' : 'location_on'}</span>
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                   {node.name}
                </div>
             </div>
           ))}

           {/* Chú giải góc trái */}
           <div className="absolute bottom-6 left-6 bg-white/90 p-4 rounded-lg border border-outline-variant shadow-xl text-[10px] font-body space-y-2">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-primary"></span> Nhân vật</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent"></span> Địa danh</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-secondary"></span> Sự kiện</div>
           </div>
        </section>

        {/* 3. SIDE PANEL CHI TIẾT (Right Sidebar) */}
        <aside className={`w-[350px] bg-white border-l border-outline-variant transition-all duration-500 overflow-y-auto custom-scrollbar ${selectedEntity ? 'translate-x-0' : 'translate-x-full'}`}>
           {selectedEntity && (
             <div className="p-8 space-y-8">
                <div className="flex justify-between items-start">
                   <span className="bg-primary/10 text-primary px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest">{selectedEntity.type}</span>
                   <button onClick={() => setSelectedEntity(null)} className="material-symbols-outlined text-sm opacity-30 hover:opacity-100">close</button>
                </div>
                <div>
                   <h3 className="font-headline text-3xl text-primary font-bold leading-tight">{selectedEntity.name}</h3>
                   <p className="text-on-surface-variant text-sm italic mt-2">"Vị minh quân lỗi lạc thời Lê Sơ, người khởi xướng Hồng Đức Bản Đồ..."</p>
                </div>
                <div className="aspect-video bg-surface-low rounded-lg overflow-hidden border border-outline-variant">
                   <img className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBNfiTVo5os9QtaCn3VrsO1XcNZsTmiWe87vp1XlvMoeJuMGsZnOH082GUdhWPAWWyhUqOj5sqccrXHibVO4RsZnfE69p20XFNroA2b9q3x2JeS1yODf0lDdw4NZj1tid9h8_eF4p9NcJwcB4MEKfhjR40Av4MUKpQ6usFe9iRj5qjpxuInHSBK8ZZ4bTckfV-Z-bNiS-DlL6EXFo5gK2qlsM0-xKfR1BV8NNaHvBrsVt3snQnMpJgPuXNLNS2cHm9jEuB6dK0eykY" alt="preview" />
                </div>
                <div className="space-y-4">
                   <h4 className="font-body text-[10px] font-bold uppercase border-b pb-2">Liên kết thực thể (6)</h4>
                   <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 hover:bg-surface-low rounded transition-all cursor-pointer text-sm">
                         <span className="material-symbols-outlined text-primary text-sm">gavel</span>
                         <span>Bộ luật Hồng Đức</span>
                      </div>
                   </div>
                </div>
                <button 
                  onClick={() => navigate(`/admin/hub/edit/${selectedEntity.id}`)}
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