import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AdminLayout, ActionModal } from '../../../components/admin';
import { usePeriodColors } from '../../../hooks/usePeriodColors';
import { metadataService, mockClient, ENDPOINTS, tagService, periodService } from '../../../services';

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

import useModalStore from '../../../store/zustand/useModalStore';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMetadataOverview, deleteTag, deletePeriod, deleteCategoryLocal, reorderPeriodsLocal } from '../../../store/redux/slices/metadataSlice';

const MetadataManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.metadata);
  const { isOpen, modalType, modalData, openModal, closeModal } = useModalStore();
  
  const [tagColors, setTagColors] = useState({});
  const { periodColors } = usePeriodColors();
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'before' | 'after'

  useEffect(() => {
    dispatch(fetchMetadataOverview());
    
    mockClient.get(ENDPOINTS.MOCK.TAG_COLORS).then(res => {
      setTagColors(res.data);
    });
  }, [dispatch]);

  const handlePeriodDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.setData('text/plain', String(index));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handlePeriodDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) {
      setDragOverIndex(null);
      setDropPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isAfter = x > rect.width / 2;

    setDragOverIndex(index);
    setDropPosition(isAfter ? 'after' : 'before');
  };

  const handlePeriodDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const handlePeriodDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndexStr = e.dataTransfer.getData('text/plain');
    if (dragIndexStr === '') return;
    const dragIndex = parseInt(dragIndexStr, 10);
    
    if (dragIndex !== dropIndex && draggedIndex !== null) {
      const updatedPeriods = [...data.periods];
      const [draggedItem] = updatedPeriods.splice(dragIndex, 1);
      
      let targetIndex = dropIndex;
      if (dragIndex < dropIndex) {
        targetIndex = dropPosition === 'after' ? dropIndex : dropIndex - 1;
      } else {
        targetIndex = dropPosition === 'after' ? dropIndex + 1 : dropIndex;
      }
      
      updatedPeriods.splice(targetIndex, 0, draggedItem);
      dispatch(reorderPeriodsLocal(updatedPeriods));
    }

    handlePeriodDragEnd();
  };

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
    for (const key in periodColors || {}) {
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

  const openDelete = (type, item) =>
    openModal('delete_metadata', { type, name: item.name, id: item.id });

  const handleDeleteConfirm = async () => {
    if (!modalData) return;
    const { type, id } = modalData;
    if (id === null || id === undefined) return;

    try {
      if (type === 'danh mục') {
        dispatch(deleteCategoryLocal(id));
      } else if (type === 'thẻ') {
        await dispatch(deleteTag(id)).unwrap();
      } else if (type === 'thời kỳ') {
        await dispatch(deletePeriod(id)).unwrap();
      }
      closeModal();
    } catch (e) {
      console.error('Lỗi khi xóa siêu dữ liệu:', e);
      alert('Có lỗi xảy ra khi xóa siêu dữ liệu!');
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý Siêu dữ liệu"
        subtitle="Quản lý thẻ phân loại và dòng thời gian cho toàn bộ hệ thống lưu trữ."
      />

      <div className="mb-8">
        
      </div>

      <div className="space-y-8">
        {/* QUẢN LÝ THỜI KỲ (PERIODS) */}
        <section className="bg-surface-low border border-outline-variant p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline text-2xl text-primary font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl">timeline</span> Dòng chảy Thời kỳ (Timeline)
            </h3>
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
                data.periods.map((p, index) => (
                  <div
                    key={p.id}
                    draggable="true"
                    onDragStart={(e) => handlePeriodDragStart(e, index)}
                    onDragOver={(e) => handlePeriodDragOver(e, index)}
                    onDragEnd={handlePeriodDragEnd}
                    onDrop={(e) => handlePeriodDrop(e, index)}
                    className={`shrink-0 w-48 cursor-move relative p-3.5 border rounded-xl transition-all group bg-white snap-center flex flex-col justify-between ${
                      draggedIndex === index
                        ? 'opacity-40 border-dashed border-amber-400 bg-amber-50/20 shadow-inner scale-95'
                        : 'border-outline-variant hover:-translate-y-1 hover:shadow-xl'
                    }`}
                  >
                    {/* Drag insertion indicators */}
                    {dragOverIndex === index && dropPosition === 'before' && (
                      <div className="absolute left-[-10px] top-0 bottom-0 w-[4px] bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse z-30"></div>
                    )}
                    {dragOverIndex === index && dropPosition === 'after' && (
                      <div className="absolute right-[-10px] top-0 bottom-0 w-[4px] bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse z-30"></div>
                    )}
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

        {/* QUẢN LÝ THẺ (TAGS) */}
        <section className="bg-white border border-outline-variant p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-6">
            <div>
              <h3 className="font-headline text-2xl text-primary font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl">sell</span> Phân loại theo Thẻ (Tags)
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">Quản lý danh sách các từ khóa, nhãn phân loại theo từng chủ đề hệ thống.</p>
            </div>
            <button onClick={() => navigate('/admin/metadata/tags/new')} className="text-[10px] font-bold uppercase border border-primary text-primary px-3 py-1.5 rounded hover:bg-primary/5 transition-all flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">add</span> Thẻ Tags
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 font-body text-sm text-on-surface-variant">Đang tải thẻ...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(
                data.tags.reduce((acc, tag) => {
                  const type = tag.type || 'Khác';
                  if (!acc[type]) acc[type] = [];
                  acc[type].push(tag);
                  return acc;
                }, {})
              ).map(([type, tags]) => (
                <TagGroupCard
                  key={type}
                  type={type}
                  tags={tags}
                  getTagStyle={getTagStyle}
                  getIndividualTagStyle={getIndividualTagStyle}
                  navigate={navigate}
                  openDelete={openDelete}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* MODAL XÓA CHUNG */}
      <ActionModal
        isOpen={isOpen && modalType === 'delete_metadata'}
        onClose={closeModal}
        type="delete"
        item={{ name: modalData?.name }}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};

const TagGroupCard = ({ type, tags, getTagStyle, getIndividualTagStyle, navigate, openDelete }) => {
  return (
    <div className="border border-outline-variant rounded-xl overflow-hidden shadow-sm bg-white flex flex-col h-[400px]">
      <div className="px-4 py-3.5 bg-surface-low/50 border-b border-outline-variant flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${getTagStyle(type)}`}>
            {type}
          </span>
          <span className="text-xs text-on-surface-variant font-medium">({tags.length} thẻ)</span>
        </div>
        <button
          onClick={() => navigate(`/admin/metadata/tags/new?type=${encodeURIComponent(type)}`)}
          className="w-7 h-7 flex items-center justify-center text-primary bg-primary/10 hover:bg-primary hover:text-white rounded transition-all"
          title={`Thêm thẻ mới vào ${type}`}
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
        </button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 custom-scrollbar space-y-3">
        {tags.map(tag => (
          <div key={tag.id} className="flex justify-between items-center group/tag border-b border-outline-variant/30 pb-2.5 last:border-0 last:pb-0">
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border font-body inline-flex items-center gap-1.5 shadow-sm ${getIndividualTagStyle(tag.name)}`}>
              #{tag.name}
            </span>
            <div className="flex items-center gap-3">
              <span className="font-body text-[10px] font-bold text-on-surface-variant/70">{tag.count || 0} bài</span>
              <div className="flex gap-1 opacity-0 group-hover/tag:opacity-100 transition-opacity">
                <button onClick={() => navigate(`/admin/metadata/tags/edit/${tag.id}`)} className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 rounded transition-all hover:bg-blue-500 hover:text-white" title="Sửa">
                  <span className="material-symbols-outlined text-[13px]">edit_note</span>
                </button>
                <button onClick={() => openDelete('thẻ', tag)} className="w-6 h-6 flex items-center justify-center bg-rose-50 text-rose-600 rounded transition-all hover:bg-rose-500 hover:text-white" title="Xóa">
                  <span className="material-symbols-outlined text-[13px]">delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        {tags.length === 0 && (
          <div className="text-center py-8 text-xs text-on-surface-variant italic">Không có thẻ nào</div>
        )}
      </div>
    </div>
  );
};

export default MetadataManagement;
