import {  useState, useEffect  } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AdminLayout, StatsGrid, ActionModal } from '../../../components/admin';
import { usePeriodColors } from '../../../hooks/usePeriodColors';
const MetadataManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', name: '', id: null });
  const [data, setData] = useState({ stats: [], categories: [], tags: [], periods: [] });
  const [tagColors, setTagColors] = useState({});
  const { periodColors } = usePeriodColors();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metaRes, colorsRes] = await Promise.all([
          fetch('/api/admin_metadata.json'),
          fetch('/api/tag_colors.json')
        ]);

        if (metaRes.ok) setData(await metaRes.json());
        if (colorsRes.ok) setTagColors(await colorsRes.json());
      } catch (error) {
        console.error('Error fetching metadata:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTagStyle = (tagName) => {
    if (!tagName || !tagColors) return 'text-primary bg-primary/10 border-primary/20';
    const lowerTag = tagName.toLowerCase();
    if (tagColors[lowerTag]) return tagColors[lowerTag];
    return tagColors['default'] || 'text-primary bg-primary/10 border-primary/20';
  };

  const getIndividualTagStyle = (tagName) => {
    if (!tagName) return 'bg-surface-variant/30 text-on-surface-variant border-outline-variant/50';
    const lower = tagName.toLowerCase();

    // 1. Check if it matches period colors
    for (const key in periodColors) {
      if (key !== 'default' && lower.includes(key)) return periodColors[key];
    }

    // 2. Hash function for unique color
    const palettes = [
      'bg-amber-50 text-amber-700 border-amber-200',
      'bg-rose-50 text-rose-700 border-rose-200',
      'bg-emerald-50 text-emerald-700 border-emerald-200',
      'bg-sky-50 text-sky-700 border-sky-200',
      'bg-purple-50 text-purple-700 border-purple-200',
      'bg-teal-50 text-teal-700 border-teal-200',
      'bg-cyan-50 text-cyan-700 border-cyan-200',
      'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
      'bg-orange-50 text-orange-700 border-orange-200',
      'bg-indigo-50 text-indigo-700 border-indigo-200',
      'bg-pink-50 text-pink-700 border-pink-200',
    ];

    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % palettes.length;
    return palettes[index];
  };

  const openDelete = (type, item) => setDeleteModal({ open: true, type, name: item.name, id: item.id });

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý Siêu dữ liệu"
        subtitle="Quản lý danh mục, thẻ phân loại và dòng thời gian cho toàn bộ hệ thống lưu trữ."
        icon="database"
      />

      <div className="mb-8">
        <StatsGrid stats={data.stats} loading={loading} />
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* QUẢN LÝ DANH MỤC */}
        <section className="col-span-12 lg:col-span-5 bg-white border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-6">
            <h3 className="font-headline text-xl text-primary font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">account_tree</span> Phân cấp Danh mục
            </h3>
            <button onClick={() => navigate('/admin/metadata/categories/new')} className="text-[10px] font-bold uppercase border border-primary text-primary px-3 py-1.5 rounded hover:bg-primary/5 transition-all flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add</span> Danh mục
            </button>
          </div>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-4 font-body text-sm text-on-surface-variant">Đang tải danh mục...</div>
            ) : (
              data.categories.map(cat => (
                <div key={cat.id} className="border border-outline-variant rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="p-4 bg-surface-low/50 flex justify-between items-center group border-b border-outline-variant/50">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-xl">folder_open</span>
                      <div>
                        <p className="font-bold text-sm text-on-surface">{cat.name}</p>
                        <p className="text-[11px] text-on-surface-variant italic mt-0.5">{cat.description || cat.sub}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/admin/metadata/categories/edit/${cat.id}`)} className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 rounded-md transition-all hover:bg-blue-500 hover:text-white" title="Chỉnh sửa">
                        <span className="material-symbols-outlined text-[16px]">edit_note</span>
                      </button>
                      <button onClick={() => openDelete('danh mục', cat)} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-600 rounded-md transition-all hover:bg-rose-500 hover:text-white" title="Xóa">
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </button>
                    </div>
                  </div>
                  {cat.children && cat.children.length > 0 && (
                    <div className="bg-white">
                      {cat.children.map(child => (
                        <div key={child.id} className="flex justify-between items-center px-4 py-3 pl-12 border-b border-outline-variant/30 last:border-0 hover:bg-surface-low transition-colors">
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-on-surface-variant text-lg">subdirectory_arrow_right</span>
                            <span className="text-sm font-medium text-on-surface">{child.name}</span>
                          </div>
                          <span className="text-[10px] font-bold bg-surface-variant/30 text-on-surface-variant px-2 py-1 rounded-full">
                            {child.count} bài viết
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* QUẢN LÝ THẺ (TAGS) */}
        <section className="col-span-12 lg:col-span-7 bg-white border border-outline-variant p-6 rounded-xl shadow-sm">
          <div className="flex justify-between items-center border-b border-outline-variant pb-3 mb-6">
            <h3 className="font-headline text-xl text-primary font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">sell</span> Quản lý Thẻ (Tags)
            </h3>
            <button onClick={() => navigate('/admin/metadata/tags/new')} className="text-[10px] font-bold uppercase border border-primary text-primary px-3 py-1.5 rounded hover:bg-primary/5 transition-all flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add</span> Thẻ Tags
            </button>
          </div>
          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="text-center py-4 font-body text-sm text-on-surface-variant">Đang tải thẻ...</div>
            ) : (
              Object.entries(
                data.tags.reduce((acc, tag) => {
                  const type = tag.type || 'Khác';
                  if (!acc[type]) acc[type] = [];
                  acc[type].push(tag);
                  return acc;
                }, {})
              ).map(([type, tags]) => (
                <div key={type} className="border border-outline-variant rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="px-4 py-3 bg-surface-low/50 border-b border-outline-variant flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getTagStyle(type)}`}>
                      {type}
                    </span>
                    <span className="text-xs text-on-surface-variant font-medium">({tags.length} thẻ)</span>
                  </div>
                  <table className="w-full text-left">
                    <tbody className="text-sm">
                      {tags.map(tag => (
                        <tr key={tag.id} className="hover:bg-surface-low transition-all group border-b border-outline-variant/30 last:border-0">
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold border font-body inline-flex items-center gap-1.5 shadow-sm ${getIndividualTagStyle(tag.name)}`}>
                              #{tag.name}
                            </span>
                          </td>
                          <td className="py-3 px-4 w-48 hidden sm:table-cell">
                            <div className="flex items-center gap-3">
                              <div className="w-full h-1.5 bg-surface-variant rounded-full overflow-hidden">
                                <div className="bg-accent h-full" style={{ width: `${tag.usage}%` }}></div>
                              </div>
                              <span className="font-body text-[10px] font-bold w-8">{tag.count}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right w-24">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => navigate(`/admin/metadata/tags/edit/${tag.id}`)} className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 rounded-md transition-all hover:bg-blue-500 hover:text-white" title="Chỉnh sửa">
                                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                              </button>
                              <button onClick={() => openDelete('thẻ', tag)} className="w-7 h-7 flex items-center justify-center bg-rose-50 text-rose-600 rounded-md transition-all hover:bg-rose-500 hover:text-white" title="Xóa">
                                <span className="material-symbols-outlined text-[16px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </div>
        </section>

        {/* QUẢN LÝ THỜI KỲ (PERIODS) */}
        <section className="col-span-12 bg-surface-low border border-outline-variant p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline text-2xl text-primary font-bold italic">Dòng chảy Thời kỳ (Timeline)</h3>
            <button onClick={() => navigate('/admin/metadata/periods/new')} className="text-[10px] font-bold uppercase border border-primary text-primary px-3 py-1.5 rounded hover:bg-primary/5 transition-all flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add</span> Thời kỳ
            </button>
          </div>
          <div className="relative">
            <div className="absolute top-1/2 left-0 right-0 h-[1px] border-t-2 border-dashed border-accent/40 hidden md:block z-0 pointer-events-none"></div>
            
            <div className="flex gap-4 overflow-x-auto custom-scrollbar pb-4 pt-2 px-2 snap-x relative z-10 items-stretch">
              {loading ? (
                <div className="w-full text-center py-4 font-body text-sm text-on-surface-variant">Đang tải thời kỳ...</div>
              ) : (
                data.periods.map(p => (
                  <div key={p.id} draggable="true" className="shrink-0 w-48 cursor-move relative p-3.5 border rounded-xl transition-all hover:-translate-y-1 hover:shadow-xl group bg-white border-outline-variant snap-center flex flex-col justify-between">
                    <div>
                      <div className="absolute top-1.5 right-1.5 text-on-surface-variant opacity-20 group-hover:opacity-60 transition-opacity">
                        <span className="material-symbols-outlined text-[15px]">drag_indicator</span>
                      </div>
                      <span className="font-body text-[9px] font-bold uppercase tracking-widest text-on-surface-variant bg-surface-low px-1.5 py-1 rounded border border-outline-variant/50 inline-block">{p.range}</span>
                      <h4 className="font-headline font-bold text-base mt-2 text-primary pr-4 leading-tight">{p.name}</h4>
                      <p className="text-[11px] mt-1.5 italic leading-snug text-on-surface-variant line-clamp-3">{p.desc}</p>
                    </div>
                    <div className="flex justify-end gap-1.5 mt-3 pt-2.5 border-t border-outline-variant/50 transition-all">
                      <button onClick={() => navigate(`/admin/metadata/periods/edit/${p.id}`)} className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 rounded transition-all hover:bg-blue-500 hover:text-white" title="Chỉnh sửa">
                        <span className="material-symbols-outlined text-[14px]">edit_note</span>
                      </button>
                      <button onClick={() => openDelete('thời kỳ', p)} className="w-6 h-6 flex items-center justify-center bg-rose-50 text-rose-600 rounded transition-all hover:bg-rose-500 hover:text-white" title="Xóa">
                        <span className="material-symbols-outlined text-[14px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
      {/* MODAL XÓA CHUNG */}
      <ActionModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ ...deleteModal, open: false })}
        type="delete"
        item={{ name: deleteModal.name }}
        onConfirm={() => { alert('Đã xóa'); setDeleteModal({ ...deleteModal, open: false }); }}
        title={`Xác nhận xóa ${deleteModal.type}?`}
        description={`Dữ liệu của <strong>"${deleteModal.name}"</strong> sẽ bị gỡ bỏ vĩnh viễn khỏi các liên kết sử liệu.`}
      />
    </AdminLayout>
  );
};

export default MetadataManagement;