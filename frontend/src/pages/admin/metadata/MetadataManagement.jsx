import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AdminLayout, StatsGrid, ActionModal } from '../../../components/admin';
import { usePeriodColors } from '../../../hooks/usePeriodColors';

const CategoryTreeItem = ({ category, level = 0, onEdit, onDelete, onAddChild }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div className={level === 0 ? "border border-outline-variant rounded-xl overflow-hidden shadow-sm bg-white mb-4" : ""}>
      <div
        className={`p-3 flex justify-between items-center group transition-colors ${level === 0 ? 'bg-surface-low/50 border-b border-outline-variant/50' : 'border-b border-outline-variant/30 hover:bg-surface-low last:border-0'}`}
        style={{ paddingLeft: `${1 + level * 1.5}rem` }}
      >
        <div className="flex items-center gap-3">
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-5 h-5 flex items-center justify-center text-on-surface-variant hover:bg-outline-variant/30 rounded transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">
                {isExpanded ? 'expand_more' : 'chevron_right'}
              </span>
            </button>
          ) : (
            <div className="w-5 h-5 flex items-center justify-center text-outline-variant/30">
              <span className="material-symbols-outlined text-[14px]">remove</span>
            </div>
          )}

          <span className={`material-symbols-outlined ${level === 0 ? 'text-primary' : 'text-on-surface-variant text-lg'}`}>
            {level === 0 ? 'folder_open' : (hasChildren ? 'folder' : 'article')}
          </span>
          <div>
            <p className={`font-bold text-sm ${level === 0 ? 'text-on-surface' : 'text-on-surface/90'}`}>{category.name}</p>
            {category.description && <p className="text-[11px] text-on-surface-variant italic mt-0.5">{category.description}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {category.count !== undefined && (
            <span className="text-[10px] font-bold bg-surface-variant/30 text-on-surface-variant px-2 py-1 rounded-full mr-2 hidden sm:inline-block">
              {category.count} bài viết
            </span>
          )}
          <div className={`flex gap-1.5 ${level === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
            <button onClick={() => onAddChild(category.id)} className="w-7 h-7 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded transition-all hover:bg-emerald-500 hover:text-white" title="Thêm danh mục con">
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
            <button onClick={() => onEdit(category.id)} className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 rounded transition-all hover:bg-blue-500 hover:text-white" title="Chỉnh sửa">
              <span className="material-symbols-outlined text-[14px]">edit_note</span>
            </button>
            <button onClick={() => onDelete('danh mục', category)} className="w-7 h-7 flex items-center justify-center bg-rose-50 text-rose-600 rounded transition-all hover:bg-rose-500 hover:text-white" title="Xóa">
              <span className="material-symbols-outlined text-[14px]">delete</span>
            </button>
          </div>
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className={`border-l-2 border-outline-variant/30 ${level === 0 ? 'ml-[38px] my-2' : 'ml-[22px]'}`}>
          {category.children.map(child => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
};

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
        const response = await fetch('/api/admin_metadata.json');
        const colorsRes = await fetch('/api/admin_tag_colors.json');

        if (response.ok) {
          const json = await response.json();
          const deletedIds = new Set(JSON.parse(localStorage.getItem('admin_deleted_ids') || '[]'));

          // Filter out deleted static items
          if (json.categories) {
            const filterRecursive = (cats) => cats.filter(c => !deletedIds.has(String(c.id))).map(c => ({
              ...c,
              children: c.children ? filterRecursive(c.children) : []
            }));
            json.categories = filterRecursive(json.categories);
          }
          if (json.tags) {
            json.tags = json.tags.filter(t => !deletedIds.has(String(t.id)));
          }
          if (json.periods) {
            json.periods = json.periods.filter(p => !deletedIds.has(String(p.id)));
          }

          // Merge tags
          const newTagsStr = localStorage.getItem('admin_new_tags');
          if (newTagsStr) {
            try {
              const newTags = JSON.parse(newTagsStr);
              const existingIds = new Set(newTags.map(t => String(t.id)));
              json.tags = [
                ...json.tags.filter(t => !existingIds.has(String(t.id))),
                ...newTags
              ];
            } catch (e) {
              console.error('Error parsing new tags', e);
            }
          }

          // Merge custom categories
          const newCatsStr = localStorage.getItem('admin_new_categories');
          if (newCatsStr) {
            try {
              const newCats = JSON.parse(newCatsStr);
              const newTree = JSON.parse(JSON.stringify(json.categories));
              const nodeMap = {};
              const traverse = (nodes) => {
                for (const node of nodes) {
                  nodeMap[String(node.id)] = node;
                  if (node.children) traverse(node.children);
                }
              };
              traverse(newTree);

              const roots = [...newTree];
              const newInsertions = [];

              for (const custom of newCats) {
                if (nodeMap[String(custom.id)]) {
                  Object.assign(nodeMap[String(custom.id)], custom);
                } else {
                  newInsertions.push(custom);
                }
              }

              // Pass 1: Add all new insertions to nodeMap
              for (const custom of newInsertions) {
                custom.children = custom.children || [];
                nodeMap[String(custom.id)] = custom;
              }

              // Pass 2: Connect to parents or add to roots
              for (const custom of newInsertions) {
                if (custom.parentId) {
                  const parent = nodeMap[String(custom.parentId)];
                  if (parent) {
                    parent.children = parent.children || [];
                    parent.children.push(custom);
                  } else {
                    roots.push(custom);
                  }
                } else {
                  roots.push(custom);
                }
              }
              json.categories = roots;
            } catch (e) { console.error('Error parsing new categories', e); }
          }

          // Merge custom periods
          const newPeriodsStr = localStorage.getItem('admin_new_periods');
          if (newPeriodsStr) {
            try {
              let newPeriods = JSON.parse(newPeriodsStr);
              // Migration: if any period has 'time' instead of 'range', it's from old buggy code. Wipe it so JSON takes over.
              if (newPeriods.some(p => p.time && !p.range)) {
                newPeriods = newPeriods.filter(p => !(p.time && !p.range));
                localStorage.setItem('admin_new_periods', JSON.stringify(newPeriods));
              }

              const newPeriodIds = new Set(newPeriods.map(p => String(p.id)));
              json.periods = [
                ...json.periods.filter(p => !newPeriodIds.has(String(p.id))),
                ...newPeriods
              ];
            } catch (e) { console.error('Error parsing new periods', e); }
          }

          // Automatically sort periods by chronological order
          const parseStartYear = (rangeStr) => {
            if (!rangeStr) return 999999; // Put undefined at the end
            const startPart = rangeStr.split('-')[0] || '';
            const yearMatch = startPart.match(/\d+/);
            if (!yearMatch) return 999999;
            let year = parseInt(yearMatch[0], 10);
            if (startPart.toUpperCase().includes('TCN')) {
              year = -year;
            }
            return year;
          };

          if (json.periods) {
            json.periods.sort((a, b) => parseStartYear(a.range) - parseStartYear(b.range));
          }

          setData(json);
        }
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

  const handleDeleteConfirm = () => {
    const { type, id } = deleteModal;
    if (id === null || id === undefined) return;

    if (type === 'danh mục') {
      const deleteRecursive = (cats) => {
        return cats.filter(c => c.id !== id).map(c => ({
          ...c,
          children: c.children ? deleteRecursive(c.children) : []
        }));
      };
      setData(prev => ({ ...prev, categories: deleteRecursive(prev.categories) }));

      const newCats = JSON.parse(localStorage.getItem('admin_new_categories') || '[]');
      const filteredCats = newCats.filter(c => c.id !== id);
      localStorage.setItem('admin_new_categories', JSON.stringify(filteredCats));

    } else if (type === 'thẻ') {
      setData(prev => ({ ...prev, tags: prev.tags.filter(t => t.id !== id) }));
      const newTags = JSON.parse(localStorage.getItem('admin_new_tags') || '[]');
      const filteredTags = newTags.filter(t => t.id !== id);
      localStorage.setItem('admin_new_tags', JSON.stringify(filteredTags));
    } else if (type === 'thời kỳ') {
      setData(prev => ({ ...prev, periods: prev.periods.filter(p => p.id !== id) }));

      const newPeriods = JSON.parse(localStorage.getItem('admin_new_periods') || '[]');
      const filteredPeriods = newPeriods.filter(p => p.id !== id);
      localStorage.setItem('admin_new_periods', JSON.stringify(filteredPeriods));
    }

    const deletedIds = JSON.parse(localStorage.getItem('admin_deleted_ids') || '[]');
    if (!deletedIds.includes(String(id))) {
      deletedIds.push(String(id));
      localStorage.setItem('admin_deleted_ids', JSON.stringify(deletedIds));
    }

    setDeleteModal({ open: false, type: '', name: '', id: null });
  };

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
                <CategoryTreeItem
                  key={cat.id}
                  category={cat}
                  onEdit={(id) => navigate(`/admin/metadata/categories/edit/${id}`)}
                  onDelete={(type, item) => openDelete(type, item)}
                  onAddChild={(parentId) => navigate(`/admin/metadata/categories/new?parentId=${parentId}`)}
                />
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
                <TagGroup
                  key={type}
                  type={type}
                  tags={tags}
                  getTagStyle={getTagStyle}
                  getIndividualTagStyle={getIndividualTagStyle}
                  navigate={navigate}
                  openDelete={openDelete}
                />
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
                      {p.philosophy && <p className="text-[10px] font-bold text-accent italic mt-0.5">{p.philosophy}</p>}
                      <p className="text-[11px] mt-1.5 italic leading-snug text-on-surface-variant line-clamp-3">{p.desc}</p>

                      {p.emperors && p.emperors.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-outline-variant/30 flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {p.emperors.map((emp, i) => (
                              <img
                                key={i}
                                src={emp.img}
                                alt={emp.name}
                                title={emp.name}
                                className="w-6 h-6 rounded-full border-2 border-white bg-surface-variant object-cover shadow-sm transition-all hover:scale-125 z-10 hover:z-20 relative"
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-body text-on-surface-variant uppercase tracking-widest font-bold">
                            {p.emperors.length} Vị Vua
                          </span>
                        </div>
                      )}
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
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};

const TagGroup = ({ type, tags, getTagStyle, getIndividualTagStyle, navigate, openDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden shadow-sm bg-white">
      <div
        className="px-4 py-3 bg-surface-low/50 border-b border-outline-variant flex items-center gap-2 cursor-pointer hover:bg-surface-low transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button className="w-5 h-5 flex items-center justify-center text-on-surface-variant hover:bg-outline-variant/30 rounded transition-all">
          <span className="material-symbols-outlined text-[18px]">
            {isExpanded ? 'expand_more' : 'chevron_right'}
          </span>
        </button>
        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getTagStyle(type)}`}>
          {type}
        </span>
        <span className="text-xs text-on-surface-variant font-medium">({tags.length} thẻ)</span>

        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/metadata/tags/new?type=${encodeURIComponent(type)}`); }}
          className="ml-auto w-6 h-6 flex items-center justify-center text-primary bg-primary/10 hover:bg-primary hover:text-white rounded transition-all"
          title={`Thêm thẻ mới vào ${type}`}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
        </button>
      </div>

      {isExpanded && (
        <table className="w-full text-left">
          <tbody className="text-sm">
            {tags.map(tag => (
              <tr key={tag.id} className="hover:bg-surface-low transition-all group border-b border-outline-variant/30 last:border-0">
                <td className="py-3 px-4 pl-10">
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
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/metadata/tags/edit/${tag.id}`); }} className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 rounded-md transition-all hover:bg-blue-500 hover:text-white" title="Chỉnh sửa">
                      <span className="material-symbols-outlined text-[16px]">edit_note</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); openDelete('thẻ', tag); }} className="w-7 h-7 flex items-center justify-center bg-rose-50 text-rose-600 rounded-md transition-all hover:bg-rose-500 hover:text-white" title="Xóa">
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MetadataManagement;