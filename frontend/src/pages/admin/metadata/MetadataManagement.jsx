import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MetadataManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', name: '', id: null });

  // Dữ liệu mẫu
  const categories = [
    { id: 1, name: 'Lịch sử Chính trị', sub: 'Nghiên cứu văn bia, chiếu chỉ' },
    { id: 2, name: 'Di sản Văn hóa', sub: 'Kiến trúc, nghệ thuật' },
  ];

  const tags = [
    { id: 1, name: 'Nhà Trần', slug: 'nha-tran', count: 1240, usage: 85 },
    { id: 2, name: 'Nhà Lý', slug: 'nha-ly', count: 892, usage: 62 },
  ];

  const periods = [
    { id: 1, name: 'Hồng Bàng', range: '2879 TCN - 258 TCN', desc: 'Kinh Dương Vương khởi đầu.' },
    { id: 2, name: 'Nhà Lý', range: '1009 - 1225', desc: 'Dời đô về Thăng Long.' },
    { id: 3, name: 'Nhà Trần', range: '1225 - 1400', desc: 'Đại thắng Nguyên Mông.', active: true },
  ];

  const openDelete = (type, item) => setDeleteModal({ open: true, type, name: item.name, id: item.id });

  return (
    <div className="flex-grow min-h-screen bg-surface font-body pb-20">
      <header className="h-16 sticky top-0 z-40 bg-surface-low/90 backdrop-blur border-b border-outline-variant px-8 flex items-center justify-between">
        <h2 className="font-headline text-2xl text-primary font-bold italic tracking-tighter uppercase">Quản lý Siêu dữ liệu</h2>
        <div className="flex gap-3">
           <button onClick={() => navigate('/admin/metadata/categories/new')} className="text-[10px] font-bold uppercase border border-primary text-primary px-4 py-2 rounded hover:bg-primary/5 transition-all"> + Danh mục</button>
           <button onClick={() => navigate('/admin/metadata/tags/new')} className="text-[10px] font-bold uppercase border border-primary text-primary px-4 py-2 rounded hover:bg-primary/5 transition-all"> + Thẻ Tags</button>
           <button onClick={() => navigate('/admin/metadata/periods/new')} className="text-[10px] font-bold uppercase bg-primary text-white px-4 py-2 rounded shadow-md transition-all"> + Thời kỳ</button>
        </div>
      </header>

      <main className="p-8 space-y-10 max-w-[1600px] mx-auto">
        {/* STATS BENTO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard label="Danh mục chính" value="18" icon="category" />
          <StatCard label="Tổng thẻ (Tags)" value="1,482" icon="sell" />
          <StatCard label="Thời kỳ lịch sử" value="12" icon="timeline" />
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          {/* QUẢN LÝ DANH MỤC */}
          <section className="col-span-12 lg:col-span-5 bg-white border border-outline-variant p-6 rounded-xl shadow-sm">
            <h3 className="font-headline text-xl text-primary font-bold flex items-center gap-2 border-b border-outline-variant pb-3 mb-6">
              <span className="material-symbols-outlined">account_tree</span> Phân cấp Danh mục
            </h3>
            <div className="space-y-3">
              {categories.map(cat => (
                <div key={cat.id} className="p-4 border border-surface-variant rounded-lg flex justify-between items-center hover:bg-surface-low transition-all group">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-accent">folder_open</span>
                    <div>
                      <p className="font-bold text-sm text-on-surface">{cat.name}</p>
                      <p className="text-[10px] text-on-surface-variant italic">{cat.sub}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 ">
                     <button onClick={() => navigate(`/admin/metadata/categories/edit/${cat.id}`)} className="material-symbols-outlined text-sm hover:text-primary">edit</button>
                     <button onClick={() => openDelete('danh mục', cat)} className="material-symbols-outlined text-sm hover:text-red-600">delete</button>
                  </div>
                  
                </div>
              ))}
            </div>
          </section>

          {/* QUẢN LÝ THẺ (TAGS) */}
          <section className="col-span-12 lg:col-span-7 bg-white border border-outline-variant p-6 rounded-xl shadow-sm">
            <h3 className="font-headline text-xl text-primary font-bold flex items-center gap-2 border-b border-outline-variant pb-3 mb-6">
              <span className="material-symbols-outlined">sell</span> Quản lý Thẻ (Tags)
            </h3>
            <table className="w-full text-left">
              <thead className="font-body text-[10px] uppercase text-on-surface-variant border-b border-outline-variant">
                <tr><th className="pb-3 px-2">Tên thẻ</th><th className="pb-3">Sử dụng</th><th className="pb-3 text-right">#</th></tr>
              </thead>
              <tbody className="text-sm">
                {tags.map(tag => (
                  <tr key={tag.id} className="hover:bg-surface-low transition-all group">
                    <td className="py-4 px-2 font-bold text-primary font-headline tracking-wide">#{tag.name}</td>
                    <td>
                       <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-surface-variant rounded-full overflow-hidden">
                             <div className="bg-accent h-full" style={{width: `${tag.usage}%`}}></div>
                          </div>
                          <span className="font-body text-[10px] font-bold">{tag.count}</span>
                       </div>
                    </td>
                    <td className="text-right">
                       <button onClick={() => navigate(`/admin/metadata/tags/edit/${tag.id}`)} className="material-symbols-outlined text-sm mr-2 hover:text-primary transition-all">edit</button>
                       <button onClick={() => openDelete('thẻ', tag)} className="material-symbols-outlined text-sm hover:text-red-600 transition-all">delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* QUẢN LÝ THỜI KỲ (PERIODS) */}
          <section className="col-span-12 bg-surface-low border border-outline-variant p-8 rounded-xl shadow-sm">
            <h3 className="font-headline text-2xl text-primary font-bold mb-8 italic">Dòng chảy Thời kỳ (Timeline)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
              <div className="absolute top-1/2 left-0 right-0 h-[1px] border-t border-dashed border-accent hidden md:block"></div>
              {periods.map(p => (
                <div key={p.id} className={`relative z-10 p-5 border rounded-lg transition-all hover:scale-105 hover:shadow-xl group ${p.active ? 'bg-primary text-white border-primary' : 'bg-white border-outline-variant'}`}>
                  <span className={`font-body text-[9px] font-bold uppercase tracking-widest ${p.active ? 'text-accent' : 'text-on-surface-variant'}`}>{p.range}</span>
                  <h4 className="font-headline font-bold text-xl mt-1">{p.name}</h4>
                  <p className={`text-[11px] mt-2 italic leading-relaxed line-clamp-2 ${p.active ? 'opacity-80' : 'text-on-surface-variant'}`}>{p.desc}</p>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-current transition-all">
                    <button onClick={() => navigate(`/admin/metadata/periods/edit/${p.id}`)} className="material-symbols-outlined text-xs">edit</button>
                    <button onClick={() => openDelete('thời kỳ', p)} className="material-symbols-outlined text-xs">delete</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* MODAL XÓA CHUNG */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border-t-4 border-red-600 animate-in fade-in zoom-in duration-300">
             <div className="p-10 text-center">
                <span className="material-symbols-outlined text-5xl text-red-600 mb-4">warning</span>
                <h3 className="font-headline text-2xl font-bold text-primary italic">Xác nhận xóa {deleteModal.type}?</h3>
                <p className="font-body text-sm text-on-surface-variant mt-4">Dữ liệu của <strong>"{deleteModal.name}"</strong> sẽ bị gỡ bỏ vĩnh viễn khỏi các liên kết sử liệu.</p>
                <div className="flex gap-4 mt-10 font-body text-[11px] font-bold">
                   <button onClick={() => setDeleteModal({ ...deleteModal, open: false })} className="flex-1 py-3 border border-outline rounded-lg hover:bg-surface-low transition-all">HỦY BỎ</button>
                   <button className="flex-1 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-all">XÁC NHẬN XÓA</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon }) => (
  <div className="bg-white border border-outline-variant p-6 rounded-xl flex items-center justify-between shadow-sm hover:-translate-y-1 transition-all">
    <div>
      <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">{label}</p>
      <h3 className="font-headline text-3xl text-primary font-bold mt-1">{value}</h3>
    </div>
    <span className="material-symbols-outlined text-accent opacity-20 text-4xl">{icon}</span>
  </div>
);

export default MetadataManagement;