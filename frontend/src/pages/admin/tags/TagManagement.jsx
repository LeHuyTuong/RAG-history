import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, AdminLayout, ActionModal } from '../../../components/admin';
import { metadataService, ENDPOINTS, tagService, periodService } from '../../../services';


import useModalStore from '../../../store/zustand/useModalStore';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMetadataOverview, deleteTag } from '../../../store/redux/slices/metadataSlice';
import toast from 'react-hot-toast';

const TagManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.metadata);
  const { isOpen, modalType, modalData, openModal, closeModal } = useModalStore();
  
  const [tagColors, setTagColors] = useState({});

  useEffect(() => {
    dispatch(fetchMetadataOverview());
    
    metadataService.fetchColors().then(res => {
      setTagColors(res.tagColors || {});
    }).catch(err => {
      console.error('Lỗi khi tải màu tag:', err);
    });
  }, [dispatch]);

  const getTagStyle = (tagName) => {
    if (!tagName || !tagColors) return 'text-primary bg-primary/10 border-primary/20';
    const lowerTag = tagName.toLowerCase();
    if (tagColors[lowerTag]) return tagColors[lowerTag];
    return tagColors['default'] || 'text-primary bg-primary/10 border-primary/20';
  };

  const getIndividualTagStyle = (tagName) => {
    if (!tagName) return 'bg-surface-variant/30 text-on-surface-variant border-outline-variant/50';
    const lower = tagName.toLowerCase();

    // 1. Hash function for unique color
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
      if (type === 'thẻ') {
        await dispatch(deleteTag(id)).unwrap();
        dispatch(fetchMetadataOverview());
      }
      closeModal();
    } catch (e) {
      console.error('Lỗi khi xóa siêu dữ liệu:', e);
      toast.error('Có lỗi xảy ra khi xóa siêu dữ liệu!');
    }
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Quản lý Thẻ"
        subtitle="Quản lý thẻ phân loại cho toàn bộ hệ thống lưu trữ."
        actionLabel="Thêm thẻ mới"
        actionHref="/admin/tags/new"
        actionIcon="add"
      />

      <div className="mb-8">
        
      </div>

      <div className="space-y-8">

        {/* QUẢN LÝ THẺ (TAGS) */}
        <section className="bg-white border border-outline-variant p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-6">
            <div>
              <h3 className="font-headline text-2xl text-primary font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-2xl">sell</span> Phân loại theo Thẻ (Tags)
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">Quản lý danh sách các từ khóa, nhãn phân loại theo từng chủ đề hệ thống.</p>
            </div>
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
          onClick={() => navigate(`/admin/tags/new?type=${encodeURIComponent(type)}`)}
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
              <span className="font-body text-[10px] font-bold text-on-surface-variant/70">{tag.count || 0} liên kết</span>
              <div className="flex gap-1 transition-opacity">
                <button onClick={() => navigate(`/admin/tags/edit/${tag.id}`)} className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 rounded transition-all hover:bg-blue-500 hover:text-white" title="Sửa">
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

export default TagManagement;
