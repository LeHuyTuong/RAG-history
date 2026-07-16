import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { ActionModal, FormHeader } from '../../../components/admin';
import { apiClient, extractErrorMessage, API_ENDPOINTS } from '../../../services';

import toast from 'react-hot-toast';

const TagForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  const generateRandomHex = () => {
    const r = Math.floor(Math.random() * 200).toString(16).padStart(2, '0');
    const g = Math.floor(Math.random() * 200).toString(16).padStart(2, '0');
    const b = Math.floor(Math.random() * 200).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  };

  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(generateRandomHex());
  const [category, setCategory] = useState('dynasty');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [status, setStatus] = useState('published');
  const [originalData, setOriginalData] = useState({});
  const [linkedItems, setLinkedItems] = useState({
    articles: [],
    events: [],
    characters: [],
    locations: []
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editCatName, setEditCatName] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, label: '' });

  const handleSave = async () => {
    const newErrors = {};
    if (!tagName?.trim()) newErrors.tagName = 'Vui lòng nhập tên thẻ hệ thống.';

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error('Vui lòng kiểm tra lại thông tin nhập bị lỗi.');
      return;
    }
    setFormErrors({});

    try {
      const payload = {
        name: tagName,
        slug: generateSlug(tagName),
        description: `Type: ${categories.find(c => c.id === category)?.label || 'Khác'}`
      };

      if (id && !isNaN(Number(id))) {
        await apiClient.put(`${API_ENDPOINTS.ADMIN_TAG_CATEGORIES}/${id}`, payload);
      } else {
        await apiClient.post(API_ENDPOINTS.ADMIN_TAG_CATEGORIES, payload);
      }

      // Save local frontend-only fields
      const savedId = id || payload.slug;
      localStorage.setItem(`local_tag_relations_${savedId}`, JSON.stringify({
        color: tagColor,
        status: status,
        category: category
      }));
      toast.success('Đã lưu thẻ thành công!');
      navigate('/admin/tags');
    } catch (e) {
      console.error('Lỗi khi lưu thẻ metadata:', e);
      const errMsg = extractErrorMessage(e, 'Có lỗi xảy ra khi lưu thẻ metadata!');
      toast.error(errMsg);
    }
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = {
      id: 'cat_' + Date.now(),
      label: newCatName.trim(),
      icon: 'sell',
      color: 'bg-primary'
    };

    const updatedCategories = [...categories, newCat];
    setCategories(updatedCategories);
    setCategory(newCat.id);
    setIsAddingCategory(false);
    setNewCatName('');
  };

  const startEditCategory = (id, label, e) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingCategoryId(id);
    setEditCatName(label);
  };

  const handleSaveCategory = () => {
    if (!editCatName.trim() || !editingCategoryId) return;

    // Update state
    const updatedCategories = categories.map(c =>
      c.id === editingCategoryId ? { ...c, label: editCatName.trim() } : c
    );
    setCategories(updatedCategories);

    setEditingCategoryId(null);
    setEditCatName('');
  };

  const openDeleteModal = (id, label, e) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteModal({ open: true, id, label });
  };

  const confirmDeleteCategory = () => {
    const { id } = deleteModal;

    // Remove from categories state
    const updatedCategories = categories.filter(c => c.id !== id);
    setCategories(updatedCategories);

    if (category === id) {
      setCategory(updatedCategories.length > 0 ? updatedCategories[0].id : '');
    }

    setDeleteModal({ open: false, id: null, label: '' });
  };

    useEffect(() => {
    const init = async () => {
      let loadedCategories = [];
      try {
        // Tag Categories should be fetched from API if available,
        // but for now we initialize empty or with defaults if no endpoint exists
        loadedCategories = [];
        setCategories(loadedCategories);
      } catch (error) {
        console.error('Error fetching tag categories:', error);
      } finally {
        setLoading(false);
      }

      if (id) {
        try {
          let tagMatch = null;
          try {
            const realRes = await apiClient.get(API_ENDPOINTS.ADMIN_TAG_CATEGORIES, { params: { size: 500 } });
            const realTags = realRes.data?.data?.result || realRes.data?.data?.content || realRes.data || [];
            tagMatch = realTags.find(t => String(t.id) === String(id));
          } catch(e) {
            console.error('Cannot fetch from API', e);
          }

          if (tagMatch) {
            setOriginalData(tagMatch);
            setTagName(tagMatch.name || tagMatch.label || '');
            // Hydrate local relations for Tag (color, status, category)
            const cached = localStorage.getItem(`local_tag_relations_${id}`);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.color) setTagColor(parsed.color);
                if (parsed.status) setStatus(parsed.status);
                if (parsed.category) setCategory(parsed.category);
            } else {
                if (tagMatch.color) setTagColor(tagMatch.color);
                if (tagMatch.status) setStatus(tagMatch.status);
                const typeStr = tagMatch.type || tagMatch.description?.replace('Type: ', '') || '';
                const categoryMatch = loadedCategories.find(c => c.label.toLowerCase() === typeStr.toLowerCase());
                if (categoryMatch) setCategory(categoryMatch.id);
            }

            // TÌM KIẾM LIÊN KẾT (Auto-link fallback)
            const tagNameStr = tagMatch.name || tagMatch.label || '';
            const tagLower = tagNameStr.toLowerCase();
            let arts = [], evts = [], chars = [], locs = [];

            try {
              const artRes = await apiClient.get(API_ENDPOINTS.ADMIN_ARTICLES, { params: { size: 500 } }).catch(() => ({ data: [] }));
              const allArts = artRes.data?.data?.result || artRes.data?.data?.content || artRes.data || [];
              arts = allArts.filter(a =>
                a.tags?.some(t => t.name === tagNameStr || String(t.id) === String(id)) ||
                (a.title && a.title.toLowerCase().includes(tagLower)) ||
                (a.category && a.category.toLowerCase().includes(tagLower))
              );
            } catch(e) {}

            try {
              const evtRes = await apiClient.get(API_ENDPOINTS.ADMIN_EVENTS, { params: { size: 500 } }).catch(() => ({ data: [] }));
              const allEvts = evtRes.data?.data?.result || evtRes.data?.data?.content || evtRes.data || [];
              evts = allEvts.filter(e => {
                const localData = localStorage.getItem(`local_event_relations_${e.id}`);
                const hasTag = localData && JSON.parse(localData).tags?.includes(tagNameStr);
                const hasNameMatch = e.name && e.name.toLowerCase().includes(tagLower);
                return hasTag || hasNameMatch;
              });
            } catch(e) {}

            try {
              const charRes = await apiClient.get(API_ENDPOINTS.ADMIN_CHARACTERS, { params: { size: 500 } }).catch(() => ({ data: [] }));
              const allChars = charRes.data?.data?.result || charRes.data?.data?.content || charRes.data || [];
              chars = allChars.filter(c => {
                const localData = localStorage.getItem(`local_char_relations_${c.id}`);
                const hasTag = localData && JSON.parse(localData).tags?.includes(tagNameStr);
                const hasNameMatch = c.name && c.name.toLowerCase().includes(tagLower);
                return hasTag || hasNameMatch;
              });
            } catch(e) {}

            try {
              const locRes = await apiClient.get(API_ENDPOINTS.ADMIN_LOCATIONS, { params: { size: 500 } }).catch(() => ({ data: [] }));
              const allLocs = locRes.data?.data?.result || locRes.data?.data?.content || locRes.data || [];
              locs = allLocs.filter(l => {
                const localData = localStorage.getItem(`local_loc_relations_${l.id}`);
                const hasTag = localData && JSON.parse(localData).tags?.includes(tagNameStr);
                const hasNameMatch = l.name && l.name.toLowerCase().includes(tagLower);
                return hasTag || hasNameMatch;
              });
            } catch(e) {}

            setLinkedItems({
              articles: arts,
              events: evts,
              characters: chars,
              locations: locs
            });
          }
        } catch (error) {
          console.error('Error fetching tag detail:', error);
        }
      } else {
        // Handle new tag with ?type= parameter
        const defaultType = searchParams.get('type');
        if (defaultType) {
          const categoryMatch = loadedCategories.find(c => c.label.toLowerCase() === defaultType.toLowerCase());
          if (categoryMatch) {
            setCategory(categoryMatch.id);
          }
        }
      }
    };

    init();
  }, [id, searchParams]);

  return (
    <div className="flex-grow bg-surface min-h-screen font-body pb-20 animate-in fade-in duration-500">
      <main className="p-8 max-w-6xl mx-auto space-y-8">

        <FormHeader
          loading={loading}
          title={id ? 'Hiệu đính Thẻ Metadata' : 'Khởi tạo Thẻ mới'}
          subtitle="Quản lý hệ thống thẻ phân loại dữ liệu lịch sử tinh gọn."
          icon="local_offer"
          isEdit={!!id}
          onCancel={() => navigate('/admin/tags')}
          onSave={handleSave}
          status={status}
          contentType="metadata"
        />

        <div className="grid grid-cols-12 gap-8 items-start">

          <div className="col-span-12 lg:col-span-8 space-y-6">
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-8 relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute -top-12 -right-12 opacity-[0.03] text-primary pointer-events-none">
                <span className="material-symbols-outlined text-[200px]">fingerprint</span>
              </div>

              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                Định danh Thẻ
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Tên thẻ hệ thống *
                  </label>
                  <input
                    type="text"
                    value={tagName}
                    onChange={(e) => { setTagName(e.target.value); if(formErrors.tagName) setFormErrors(prev => ({ ...prev, tagName: null })); }}
                    className={`w-full bg-transparent border-0 border-b py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 placeholder:font-light ${formErrors.tagName ? 'border-red-500 focus:border-red-600' : 'border-outline-variant/60 focus:border-primary'}`}
                    placeholder="Ví dụ: Lý Thái Tổ..."
                  />
                  {formErrors.tagName && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {formErrors.tagName}</p>}
                </div>

                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Đường dẫn (Slug)
                  </label>
                  <div className="flex items-center gap-2 text-on-surface-variant font-body text-[12px] bg-surface-low/50 p-3 rounded-xl border border-outline-variant/40 h-[46px]">
                    <span className="material-symbols-outlined text-[16px] text-primary">link</span>
                    <span className="opacity-70 tracking-normal">/tag/</span>
                    <input
                      type="text" value={generateSlug(tagName)} readOnly
                      className="flex-1 bg-transparent border-none text-primary font-bold outline-none cursor-not-allowed opacity-90 truncate"
                    />
                    <span className="material-symbols-outlined text-[14px] opacity-40 ml-auto">lock</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Màu sắc nhận diện thẻ
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl shadow-inner border border-outline-variant/40 flex-shrink-0 cursor-pointer overflow-hidden relative transition-all hover:scale-105">
                      <input
                        type="color"
                        value={tagColor}
                        onChange={(e) => setTagColor(e.target.value)}
                        className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 bg-surface-low/50 border border-outline-variant/60 rounded-xl px-4 py-[11px] font-body text-sm font-bold text-on-surface uppercase tracking-widest text-center" style={{ color: tagColor }}>
                      {tagColor}
                    </div>
                    <button
                      onClick={() => setTagColor(generateRandomHex())}
                      className="p-[11px] bg-surface-low/50 hover:bg-primary/10 text-primary border border-outline-variant/60 hover:border-primary/40 rounded-xl transition-all flex items-center justify-center active:scale-95"
                      title="Đổi màu ngẫu nhiên"
                    >
                      <span className="material-symbols-outlined text-[18px]">autorenew</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Mô tả ghi chú
                  </label>
                  <textarea
                    rows="4"
                    className="w-full bg-surface-low/50 border border-outline-variant/60 p-4 rounded-xl text-sm italic font-body outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    placeholder="Nhập mô tả bối cảnh lịch sử hoặc quy tắc sử dụng thẻ này..."
                  />
                </div>
              </div>
            </section>

            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-6 transition-all hover:shadow-md">
              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">sell</span>
                Phân loại tính chất thẻ
              </h3>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-4">
                  {categories.map(cat => (
                    <div key={cat.id} className="relative group">
                      {editingCategoryId === cat.id ? (
                        <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-300 p-1.5 rounded-2xl shadow-sm z-20 relative">
                          <input
                            type="text"
                            value={editCatName}
                            onChange={e => setEditCatName(e.target.value)}
                            className="bg-transparent border-none font-body text-xs font-bold text-indigo-900 outline-none w-32 px-3 placeholder:text-indigo-900/40 uppercase tracking-widest"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') handleSaveCategory() }}
                          />
                          <button onClick={handleSaveCategory} className="w-8 h-8 flex items-center justify-center bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </button>
                          <button onClick={() => setEditingCategoryId(null)} className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer group relative block">
                          <input
                            type="radio"
                            name="cat"
                            className="hidden"
                            checked={category === cat.id}
                            onChange={() => setCategory(cat.id)}
                          />
                          <div
                            className={`px-6 py-3 rounded-2xl font-body text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center shadow-sm relative overflow-visible ${category === cat.id
                              ? 'bg-gradient-to-r from-gray-900 to-indigo-600 text-white shadow-lg shadow-indigo-900/20 scale-105'
                              : 'bg-amber-50/50 border border-amber-200/60 text-amber-900 hover:bg-amber-100 hover:border-amber-300'
                              }`}
                          >
                            {cat.label}

                            <button
                              onClick={(e) => startEditCategory(cat.id, cat.label, e)}
                              className="absolute -top-2 right-4 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10 hover:bg-amber-600 hover:scale-110"
                              title="Chỉnh sửa phân loại này"
                            >
                              <span className="material-symbols-outlined text-[12px]">edit</span>
                            </button>

                            <button
                              onClick={(e) => openDeleteModal(cat.id, cat.label, e)}
                              className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10 hover:bg-rose-600 hover:scale-110"
                              title="Xóa phân loại này"
                            >
                              <span className="material-symbols-outlined text-[12px]">close</span>
                            </button>
                          </div>
                        </label>
                      )}
                    </div>
                  ))}

                  {isAddingCategory ? (
                    <div className="flex items-center gap-2 bg-amber-50/50 border border-amber-300 p-1.5 rounded-2xl shadow-sm">
                      <input
                        type="text"
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="Nhập phân loại..."
                        className="bg-transparent border-none font-body text-xs font-bold text-amber-900 outline-none w-32 px-3 placeholder:text-amber-900/40 uppercase tracking-widest"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleAddCategory() }}
                      />
                      <button onClick={handleAddCategory} className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-xl hover:bg-indigo-600 transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                      </button>
                      <button onClick={() => setIsAddingCategory(false)} className="w-8 h-8 flex items-center justify-center bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-colors">
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingCategory(true)}
                      className="px-6 py-3 rounded-2xl font-body text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border border-dashed border-outline-variant/60 text-on-surface-variant hover:bg-primary/5 hover:text-primary hover:border-primary/40 group"
                    >
                      <span className="material-symbols-outlined text-[16px] group-hover:scale-110 transition-transform">add</span>
                      THÊM MỚI
                    </button>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* CỘT PHẢI: CẤU HÌNH */}
          <aside className="col-span-12 lg:col-span-4 space-y-6 sticky top-8 self-start">
            <div className="bg-white p-6 border border-outline-variant shadow-sm rounded-3xl flex flex-col space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6b0f0d]/10 rounded-full blur-3xl pointer-events-none"></div>

              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                CẤU HÌNH THẺ
              </h4>

              {/* 1. TRẠNG THÁI XUẤT BẢN */}
              <div className="space-y-4 relative z-10 text-left">
                <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest flex items-center gap-2 border-b border-outline-variant/30 pb-1">
                  <span className="material-symbols-outlined text-[14px]">publish</span> TRẠNG THÁI XUẤT BẢN
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-sm font-bold text-on-surface outline-none cursor-pointer hover:border-[#6b0f0d] focus:border-[#6b0f0d] focus:ring-2 focus:ring-[#6b0f0d]/20 transition-all appearance-none"
                      >
                        <option value="draft">Bản nháp</option>
                        <option value="published">Công khai</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-1 rounded-3xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
              <div className="bg-surface/95 backdrop-blur-xl p-8 rounded-[22px] text-center space-y-6 h-full border border-white/10">

                <p className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  Bản xem trước
                </p>

                <div className="flex flex-col items-center py-6 relative">
                  <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10"></div>

                  {categories.find(c => c.id === category) && (
                    <div
                      className={`px-4 py-1.5 text-white text-[10px] font-bold rounded-full mb-4 uppercase tracking-widest shadow-sm ring-2 ring-white/50 ${categories.find(c => c.id === category)?.color || 'bg-primary'
                        }`}
                    >
                      <span className="hidden bg-primary bg-indigo-600 bg-rose-600 bg-emerald-600"></span>
                      {categories.find(c => c.id === category)?.label}
                    </div>
                  )}

                  <h4
                    className="font-headline text-3xl font-bold bg-clip-text text-transparent transition-all duration-300"
                    style={{ backgroundImage: `linear-gradient(to right, ${tagColor}, ${tagColor}88)` }}
                  >
                    #{tagName || 'Tên Thẻ'}
                  </h4>
                </div>

                <div className="p-4 bg-surface-low/50 rounded-xl border border-dashed border-outline-variant/60 text-[11px] text-on-surface-variant leading-relaxed font-body italic">
                  Đây là cách thẻ sẽ được hiển thị khi liên kết dữ liệu và xuất hiện trong hệ thống tìm kiếm đa chiều của RAG.
                </div>
              </div>
            </div>

            {id && (
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/60 mt-6">
                <p className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] flex items-center justify-center gap-2 border-b border-outline-variant/30 pb-3 mb-4">
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  THÔNG TIN LIÊN KẾT
                </p>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-body">
                    <span className="text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">description</span> Bài viết:</span>
                    <span className="font-bold text-primary">{linkedItems.articles.length}</span>
                  </div>
                  {linkedItems.articles.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {linkedItems.articles.map(a => (
                        <Link key={`a-${a.id}`} to={`/admin/articles/edit/${a.id}`} className="text-[10px] bg-primary/5 text-primary px-2 py-1 rounded hover:bg-primary/10 transition-colors line-clamp-1 max-w-full" title={a.title}>
                          {a.title}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm font-body border-t border-outline-variant/20 pt-3">
                    <span className="text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">history_edu</span> Sự kiện:</span>
                    <span className="font-bold text-accent">{linkedItems.events.length}</span>
                  </div>
                  {linkedItems.events.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {linkedItems.events.map(e => (
                        <Link key={`e-${e.id}`} to={`/admin/events/edit/${e.id}`} className="text-[10px] bg-accent/5 text-accent px-2 py-1 rounded hover:bg-accent/10 transition-colors line-clamp-1 max-w-full" title={e.name}>
                          {e.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm font-body border-t border-outline-variant/20 pt-3">
                    <span className="text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">person</span> Nhân vật:</span>
                    <span className="font-bold text-indigo-600">{linkedItems.characters.length}</span>
                  </div>
                  {linkedItems.characters.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {linkedItems.characters.map(c => (
                        <Link key={`c-${c.id}`} to={`/admin/characters/edit/${c.id}`} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100 transition-colors line-clamp-1 max-w-full" title={c.name}>
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm font-body border-t border-outline-variant/20 pt-3">
                    <span className="text-on-surface-variant flex items-center gap-2"><span className="material-symbols-outlined text-[16px]">explore</span> Di tích:</span>
                    <span className="font-bold text-emerald-600">{linkedItems.locations.length}</span>
                  </div>
                  {linkedItems.locations.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {linkedItems.locations.map(l => (
                        <Link key={`l-${l.id}`} to={`/admin/locations/edit/${l.id}`} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-1 rounded hover:bg-emerald-100 transition-colors line-clamp-1 max-w-full" title={l.name}>
                          {l.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>

        </div>
      </main>

      <ActionModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ ...deleteModal, open: false })}
        type="delete"
        item={{ name: deleteModal.label }}
        onConfirm={confirmDeleteCategory}
      />
    </div>
  );
};
export default TagForm;
