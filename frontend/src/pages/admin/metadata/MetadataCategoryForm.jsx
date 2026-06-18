import {  useState, useEffect, useRef  } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';

const CategoryTreeItem = ({ category, level = 0, onEdit }) => {
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
            <button onClick={(e) => { e.stopPropagation(); onEdit(category.id); }} className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 rounded transition-all hover:bg-blue-500 hover:text-white" title="Chỉnh sửa">
              <span className="material-symbols-outlined text-[14px]">edit_note</span>
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
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MetadataCategoryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const parentIdParam = searchParams.get('parentId');
  const isEdit = !!id;
  const fileInputRef = useRef(null);

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    parentId: '',
    description: '',
    image: null
  });
  const [originalData, setOriginalData] = useState({});

  const [categories, setCategories] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [parentPath, setParentPath] = useState([]);
  const hasInitializedPath = useRef(false);

  useEffect(() => {
    if (!isEdit && parentIdParam) {
      setForm(f => ({ ...f, parentId: parseInt(parentIdParam) || parentIdParam }));
    }
  }, [isEdit, parentIdParam]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/admin_metadata.json');
        if (response.ok) {
          const data = await response.json();
          let cats = data.categories || [];
          
          const customCatsStr = localStorage.getItem('admin_new_categories');
          if (customCatsStr) {
            try {
              const customCats = JSON.parse(customCatsStr);
              
              const newTree = JSON.parse(JSON.stringify(cats));
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
              
              for (const custom of customCats) {
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
              cats = roots;
            } catch (e) { console.error(e); }
          }
          setCategories(cats);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();

    if (isEdit) {
      const fetchCategory = async () => {
        try {
          const customCats = JSON.parse(localStorage.getItem('admin_new_categories') || '[]');
          const localMatch = customCats.find(c => String(c.id) === String(id));

          if (localMatch) {
            setOriginalData(localMatch);
            setForm({
              name: localMatch.name || '',
              slug: localMatch.slug || '',
              parentId: localMatch.parentId || '',
              description: localMatch.description || '',
              image: localMatch.image || null
            });
            setImagePreview(localMatch.image || null);
            return;
          }

          const response = await fetch('/api/admin_metadata.json');
          if (!response.ok) throw new Error('Network error');
          const data = await response.json();
          
          let foundCat = null;
          const searchTree = (nodes) => {
            for (const node of nodes) {
              if (String(node.id) === String(id)) {
                foundCat = node;
                return true;
              }
              if (node.children && searchTree(node.children)) return true;
            }
            return false;
          };
          
          if (data.categories) {
            searchTree(data.categories);
          }

          if (foundCat) {
            setOriginalData(foundCat);
            setForm({
              name: foundCat.name || '',
              slug: foundCat.slug || '',
              parentId: foundCat.parentId || '', // Will be empty for roots
              description: foundCat.description || '',
              image: foundCat.image || null
            });
            setImagePreview(foundCat.image || null);
          }
        } catch (error) {
          console.error('Error fetching category:', error);
        }
      };
      fetchCategory();
    }
  }, [id, isEdit]);

  useEffect(() => {
    // Initialize parentPath once categories are loaded and parentId is set
    if (categories.length > 0 && form.parentId && !hasInitializedPath.current) {
      const findPathToNode = (nodes, targetId, currentPath = []) => {
        for (const node of nodes) {
          if (String(node.id) === String(targetId)) return [...currentPath, node.id];
          if (node.children) {
            const found = findPathToNode(node.children, targetId, [...currentPath, node.id]);
            if (found) return found;
          }
        }
        return null;
      };
      
      const path = findPathToNode(categories, form.parentId);
      if (path) {
        setParentPath(path);
      } else {
        // Fallback for custom categories not in the tree yet
        setParentPath([form.parentId]); 
      }
      hasInitializedPath.current = true;
    } else if (!isEdit && parentIdParam && categories.length > 0 && !hasInitializedPath.current) {
      // For "Thêm danh mục con" from the tree
      const findPathToNode = (nodes, targetId, currentPath = []) => {
        for (const node of nodes) {
          if (String(node.id) === String(targetId)) return [...currentPath, node.id];
          if (node.children) {
            const found = findPathToNode(node.children, targetId, [...currentPath, node.id]);
            if (found) return found;
          }
        }
        return null;
      };
      const path = findPathToNode(categories, parentIdParam);
      if (path) setParentPath(path);
      else setParentPath([parentIdParam]);
      hasInitializedPath.current = true;
    }
  }, [categories, form.parentId, parentIdParam, isEdit]);

  const handleSelectLevel = (levelIndex, value) => {
    let newPath = parentPath.slice(0, levelIndex);
    if (value) newPath.push(value);
    
    setParentPath(newPath);
    setForm({ ...form, parentId: newPath.length > 0 ? newPath[newPath.length - 1] : '' });
  };

  const renderParentSelects = () => {
    const selects = [];
    let currentOptions = categories;
    let level = 0;

    while (currentOptions && currentOptions.length > 0) {
      const currentLevel = level;
      const selectedValue = parentPath[currentLevel] || '';
      
      // Filter out the category itself to prevent circular reference
      const options = currentOptions.filter(c => String(c.id) !== String(id));
      if (options.length === 0) break;

      selects.push(
        <div key={`level-${currentLevel}`} className={`relative ${currentLevel > 0 ? 'mt-3 pt-3 border-t border-outline-variant/30' : ''}`}>
          <div className="flex items-center gap-2 mb-2">
            {currentLevel > 0 && <span className="material-symbols-outlined text-[16px] text-primary">subdirectory_arrow_right</span>}
            <span className="font-body text-[10px] font-bold uppercase text-on-surface-variant tracking-widest">
              {currentLevel === 0 ? "Danh mục cấp 1" : `Danh mục cấp ${currentLevel + 1}`}
            </span>
          </div>
          <div className="relative">
            <select 
              value={selectedValue} 
              onChange={e => handleSelectLevel(currentLevel, e.target.value)}
              className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 text-sm font-bold text-on-surface outline-none hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            >
              <option value="">{currentLevel === 0 ? "Không có (Làm danh mục gốc)" : "--- Chọn làm danh mục con ---"}</option>
              {options.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">expand_more</span>
          </div>
        </div>
      );

      if (!selectedValue) break; // Stop rendering deeper levels if no selection

      const selectedCat = currentOptions.find(c => String(c.id) === String(selectedValue));
      currentOptions = selectedCat ? (selectedCat.children || []) : [];
      level++;
    }

    return selects;
  };

  const currentCategoryInTree = (() => {
    if (!id || categories.length === 0) return null;
    const search = (nodes) => {
      for (const node of nodes) {
        if (String(node.id) === String(id)) return node;
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return search(categories);
  })();

  const childrenCategories = currentCategoryInTree ? (currentCategoryInTree.children || []) : [];

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    setForm({ ...form, image: file });
  };

  const removeImage = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, image: null });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const generateSlug = (text) => {
    return text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^0-9a-z-\s])/g, '')
      .replace(/(\s+)/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (e) => {
    const name = e.target.value;
    setForm({ ...form, name, slug: generateSlug(name) });
  };

  const handleSave = () => {
    const newCats = JSON.parse(localStorage.getItem('admin_new_categories') || '[]');
    
    // We only save image reference string if possible, or null
    // (If it was a real File object, we can't JSON stringify it easily, 
    // so we just leave it out or save a mock URL if needed)
    
    const catData = {
      ...originalData,
      id: id ? (isNaN(Number(id)) ? id : Number(id)) : ('cat_' + Date.now()),
      name: form.name,
      slug: form.slug || generateSlug(form.name),
      parentId: form.parentId ? (!String(form.parentId).startsWith('cat_') ? parseInt(form.parentId) : form.parentId) : undefined,
      description: form.description,
      image: imagePreview || null,
      children: [] // Root by default
    };

    const existingIndex = newCats.findIndex(c => String(c.id) === String(id));
    if (existingIndex >= 0) {
      newCats[existingIndex] = { ...newCats[existingIndex], ...catData };
    } else {
      newCats.push(catData);
    }
    
    localStorage.setItem('admin_new_categories', JSON.stringify(newCats));

    setShowSuccess(true);
    setTimeout(() => {
      navigate('/admin/metadata');
    }, 1500);
  };

  return (
    <div className="flex-grow bg-surface min-h-screen font-body pb-20 animate-in fade-in duration-500">
      <main className="p-8 max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-outline-variant/40 pb-6 gap-4">
          <div>
            <h2 className="font-headline text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              {isEdit ? 'Hiệu đính Danh mục' : 'Kiến tạo Danh mục mới'}
            </h2>
            <p className="font-body text-sm text-on-surface-variant mt-3 italic flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">account_tree</span>
              Tổ chức kiến thức lịch sử theo hệ thống phân cấp.
            </p>
          </div>
          <div className="flex gap-3 font-body text-xs font-bold tracking-widest">
            <button
              onClick={() => navigate('/admin/metadata')}
              className="px-6 py-2.5 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all uppercase"
            >
              HỦY BỎ
            </button>
            <button
              onClick={handleSave}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 flex items-center gap-2 transition-all active:scale-95 uppercase"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {isEdit ? 'CẬP NHẬT' : 'KHỞI TẠO'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          
          {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-8 relative overflow-hidden transition-all hover:shadow-md">
               {/* Họa tiết hoa sen chìm */}
               <div className="absolute -top-12 -right-12 opacity-[0.03] text-primary pointer-events-none">
                  <span className="material-symbols-outlined text-[200px]">filter_vintage</span>
               </div>

               <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2 relative z-10">
                 <span className="material-symbols-outlined text-primary text-[18px]">info</span>
                 Thông tin Danh mục
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  {/* Tên danh mục */}
                  <div className="space-y-2 md:col-span-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Tên danh mục *</label>
                    <input 
                      type="text" value={form.name} onChange={handleNameChange}
                      className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 placeholder:font-light"
                      placeholder="Ví dụ: Lịch sử Chính trị..."
                    />
                  </div>

                  {/* Danh mục cha */}
                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Phân cấp danh mục</label>
                    <div className="bg-surface-low/30 border border-outline-variant/40 rounded-xl p-4">
                      {renderParentSelects()}
                    </div>
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Đường dẫn (Slug)</label>
                    <div className="flex items-center gap-2 text-on-surface-variant font-body text-[12px] bg-surface-low/50 p-3 rounded-xl border border-outline-variant/40 h-[46px]">
                       <span className="material-symbols-outlined text-[16px] text-primary">link</span>
                       <span className="opacity-70 tracking-normal">/danh-muc/</span>
                       <input 
                         type="text" value={form.slug} readOnly
                         className="flex-1 bg-transparent border-none text-primary font-bold outline-none cursor-not-allowed opacity-90 truncate"
                       />
                       <span className="material-symbols-outlined text-[14px] opacity-40 ml-auto">lock</span>
                    </div>
                  </div>

                  {/* Mô tả */}
                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Mô tả (Không bắt buộc)</label>
                    <textarea 
                      value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                      rows={4}
                      className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-4 text-sm font-body text-on-surface outline-none hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline-variant/60 resize-none"
                      placeholder="Mô tả ngắn gọn về danh mục này..."
                    />
                  </div>
                </div>
            </section>

            {isEdit && childrenCategories.length > 0 && (
              <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-6 relative overflow-hidden transition-all hover:shadow-md">
                <div className="absolute -top-12 -right-12 opacity-[0.03] text-primary pointer-events-none">
                  <span className="material-symbols-outlined text-[200px]">account_tree</span>
                </div>
                <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2 relative z-10">
                  <span className="material-symbols-outlined text-primary text-[18px]">account_tree</span>
                  Các Danh mục con trực thuộc ({childrenCategories.length})
                </h3>
                <div className="space-y-0 relative z-10">
                  {childrenCategories.map(child => (
                    <CategoryTreeItem 
                      key={child.id} 
                      category={child} 
                      onEdit={(childId) => navigate(`/admin/metadata/categories/edit/${childId}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* CỘT PHẢI: MEDIA & WIDGETS */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Ảnh đại diện */}
            <div className="bg-white p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-5 transition-all hover:shadow-md">
              <h4 className="font-body text-[11px] font-bold text-on-surface uppercase border-b border-outline-variant/60 pb-3 tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">image</span>
                Ảnh đại diện lưu trữ
              </h4>

              <input
                type="file" accept="image/*" className="hidden"
                ref={fileInputRef} onChange={handleImageChange}
              />
              
              <div 
                onClick={() => fileInputRef.current.click()}
                className="relative aspect-video bg-surface-low/50 border-2 border-dashed border-outline-variant/60 rounded-2xl flex flex-col items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary hover:bg-primary/5 cursor-pointer transition-all duration-300 group overflow-hidden"
              >
                {(imagePreview || form.image) ? (
                  <>
                    <img
                      src={imagePreview || form.image}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      alt="category"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
                      <span className="text-white font-body text-[11px] font-bold uppercase tracking-widest">Thay đổi</span>
                      <button
                        onClick={removeImage}
                        className="p-2.5 bg-rose-500 text-white rounded-full hover:bg-rose-600 hover:scale-110 transition-all shadow-lg"
                        title="Xóa ảnh"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                      <span className="material-symbols-outlined text-2xl text-primary">add_photo_alternate</span>
                    </div>
                    <span className="font-body text-[10px] font-bold uppercase tracking-wider">Tải lên ảnh bìa</span>
                  </>
                )}
              </div>

              <p className="text-[10px] text-on-surface-variant italic leading-tight text-center px-4">
                Gợi ý: Sử dụng hoa văn cổ, bảo vật quốc gia hoặc phong cảnh di tích.
              </p>
            </div>

          </div>
        </div>
      </main>

      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h3 className="font-headline text-2xl font-bold text-on-surface">
              {isEdit ? 'Cập nhật thành công!' : 'Khởi tạo thành công!'}
            </h3>
            <p className="text-on-surface-variant text-sm">Đang chuyển hướng về trang quản lý...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetadataCategoryForm;