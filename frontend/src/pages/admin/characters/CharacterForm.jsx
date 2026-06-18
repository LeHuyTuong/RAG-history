import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { RichTextEditor, TagInput, EntityRelationInput, FormHeader } from '../../../components/admin';

const CharacterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', title: '', slug: '', years: '', biography: '', tags: [],
    relatedLocations: [], relatedCharacters: [], avatar: '', status: 'draft',
    parents: [], siblings: [], family: []
  });

  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          let foundChar = null;

          const newCharsStr = localStorage.getItem('admin_new_characters');
          if (newCharsStr) {
            const newChars = JSON.parse(newCharsStr);
            foundChar = newChars.find(c => String(c.id) === String(id));
          }

          if (!foundChar) {
            const response = await fetch('/api/admin_characters.json');
            if (response.ok) {
              const data = await response.json();
              foundChar = data.characters?.find(c => String(c.id) === String(id));
            }
          }

          if (foundChar) {
            setOriginalData(foundChar);
            setForm(prev => ({
              ...prev,
              name: foundChar.name || '',
              slug: foundChar.slug || generateSlug(foundChar.name || ''),
              realName: foundChar.realName || '',
              title: foundChar.title || foundChar.role || '',
              years: foundChar.years || '',
              dynasty: foundChar.dynasty || foundChar.period || 'Khác',
              avatar: foundChar.avatar || null,
              biography: foundChar.biography || foundChar.content || '',
              tags: foundChar.dynasties ? foundChar.dynasties : (foundChar.dynasty ? (Array.isArray(foundChar.dynasty) ? foundChar.dynasty : [foundChar.dynasty]) : []),
              status: (foundChar.status === 'published' || !foundChar.status || foundChar.status === 'Công khai') ? 'published' : 'draft',
              relatedLocations: foundChar.relatedLocations || foundChar.relatedLocation || [],
              relatedCharacters: foundChar.relatedCharacters || foundChar.relatedCharacter || [],
              parents: foundChar.parents || foundChar.parent || [],
              siblings: foundChar.siblings || [],
              family: foundChar.family || []
            }));
          }
        } catch (error) {
          console.error('Lỗi tải dữ liệu nhân vật:', error);
        }
      };
      fetchData();
    }

    const fetchAvailableData = async () => {
      try {
        const [locRes, charRes, metaRes] = await Promise.all([
          fetch('/api/admin_locations.json'),
          fetch('/api/admin_characters.json'),
          fetch('/api/admin_metadata.json')
        ]);

        if (locRes.ok) {
          const locData = await locRes.json();
          setAvailableLocations(locData.locations || []);
        }
        if (charRes.ok) {
          const charData = await charRes.json();
          setAvailableCharacters(charData.characters || []);
        }
        if (metaRes.ok) {
          const metaData = await metaRes.json();
          setAvailableTags(metaData.periods || []);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu liên kết:', error);
      }
    };
    fetchAvailableData();
  }, [id, isEdit]);

  const removeLocation = (locToRemove) => {
    setForm(prev => ({
      ...prev,
      relatedLocations: prev.relatedLocations.filter(l => l !== locToRemove)
    }));
  };

  const addLocation = (loc) => {
    setForm(prev => ({
      ...prev,
      relatedLocations: [...new Set([...(prev.relatedLocations || []), loc])]
    }));
  };

  const removeCharacter = (charToRemove) => {
    setForm(prev => ({
      ...prev,
      relatedCharacters: prev.relatedCharacters.filter(c => c !== charToRemove)
    }));
  };

  const addCharacter = (char) => {
    setForm(prev => ({
      ...prev,
      relatedCharacters: [...new Set([...(prev.relatedCharacters || []), char])]
    }));
  };

  const removeTag = (tagToRemove) => {
    setForm(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tagToRemove)
    }));
  };

  const handleAddTag = (tagName) => {
    setForm(prev => ({ ...prev, tags: [...new Set([...(prev.tags || []), tagName])] }));
  };

  const handleSave = () => {
    // Validation
    if (!form.name || !form.slug) {
      alert('Vui lòng điền các trường bắt buộc (*)');
      return;
    }

    const newChars = JSON.parse(localStorage.getItem('admin_new_characters') || '[]');
    
    const charData = {
      ...originalData,
      id: id ? (isNaN(Number(id)) ? id : Number(id)) : ('char_' + Date.now()),
      name: form.name,
      slug: form.slug,
      realName: form.realName,
      title: form.title,
      role: form.title,
      years: form.years,
      dynasties: form.tags,
      dynasty: form.tags && form.tags.length > 0 ? form.tags[0] : 'Khác',
      period: form.tags && form.tags.length > 0 ? form.tags[0] : 'Khác',
      avatar: form.avatar,
      biography: form.biography,
      content: form.biography,
      relatedLocations: form.relatedLocations,
      relatedCharacters: form.relatedCharacters,
      parents: form.parents,
      siblings: form.siblings,
      family: form.family,
      status: form.status === 'published' ? 'published' : 'draft'
    };

    const existingIndex = newChars.findIndex(c => String(c.id) === String(charData.id));
    if (existingIndex >= 0) {
      newChars[existingIndex] = { ...newChars[existingIndex], ...charData };
    } else {
      newChars.push(charData);
    }
    
    localStorage.setItem('admin_new_characters', JSON.stringify(newChars));
    navigate('/admin/characters');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex-grow bg-surface min-h-screen animate-in fade-in duration-500 pb-20">
      <main className="p-8 max-w-7xl mx-auto space-y-8 font-body">

        <FormHeader
          title={isEdit ? 'Chỉnh sửa Hồ sơ' : 'Hồ sơ Nhân vật Lịch sử'}
          subtitle="Kiến tạo bản ghi điện tử cho nhân vật trong hệ thống Sử Việt."
          icon="person_check"
          isEdit={isEdit}
          onCancel={() => navigate('/admin/characters')}
          onSave={handleSave}
        />

        <div className="grid grid-cols-12 gap-8 items-start">

          {/* CỘT TRÁI: FORM CHÍNH */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* SECTION 1: IDENTITY */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-8 relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute -top-12 -right-12 opacity-[0.02] text-primary pointer-events-none">
                <span className="material-symbols-outlined text-[200px]">account_box</span>
              </div>

              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-primary text-[18px]">badge</span>
                Thông tin Căn bản
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Tên nhân vật *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => {
                      const newName = e.target.value;
                      setForm({ ...form, name: newName, slug: generateSlug(newName) });
                    }}
                    className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 placeholder:font-light"
                    placeholder="Ví dụ: Trần Hưng Đạo..."
                  />
                </div>

                <div className="flex items-center gap-3 bg-surface-low/30 border border-outline-variant/40 rounded-xl p-3 text-on-surface-variant font-body text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-primary/60">link</span>
                  <span className="opacity-60 lowercase tracking-normal italic">suviet.vn/nhan-vat/</span>
                  <input
                    type="text"
                    value={form.slug}
                    readOnly
                    className="flex-1 bg-transparent border-none outline-none font-bold text-indigo-700 placeholder:text-outline-variant/40"
                    placeholder="tran-hung-dao"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-outline-variant/30">
                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Biệt hiệu / Tôn hiệu</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <input
                        type="text"
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-[13px] outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                        placeholder="Vd: Hưng Đạo Đại Vương"
                      />
                    </div>
                  </div>

                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Niên đại (Năm sinh - Năm mất)</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <input
                        type="text"
                        value={form.years}
                        onChange={e => setForm({ ...form, years: e.target.value })}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold"
                        placeholder="Vd: 1228 - 1300, Thế kỷ 13, Không rõ..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: BIOGRAPHY */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-6 transition-all hover:shadow-md">
              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">history_edu</span>
                Tiểu sử & Sự nghiệp
              </h3>

              <div className="space-y-2">
                <div className="rounded-2xl overflow-hidden border border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-surface-low/30">
                  <RichTextEditor
                    value={form.biography}
                    onChange={(biography) => setForm({ ...form, biography })}
                    placeholder="Viết tóm tắt về cuộc đời và sự nghiệp của nhân vật..."
                    className="min-h-[300px]"
                  />
                </div>
              </div>
            </section>

            {/* SECTION 3: FAMILY TREE */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-6 transition-all hover:shadow-md">
              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">family_history</span>
                Gia phả & Thân tộc
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-surface-low/30 p-4 rounded-2xl border border-outline-variant/40">
                  <EntityRelationInput
                    type="character"
                    label="Cha / Mẹ"
                    icon="escalator_warning"
                    itemIcon="person"
                    entities={form.parents}
                    availableEntities={availableCharacters}
                    onAdd={(charOrObj, isUpdating) => setForm(prev => {
                      if (isUpdating) {
                        return { ...prev, parents: prev.parents.map(c => c.name === charOrObj.name ? charOrObj : c) };
                      }
                      return { ...prev, parents: [...prev.parents, { name: charOrObj, relation: '' }] };
                    })}
                    onRemove={(charObj) => setForm(prev => ({ ...prev, parents: prev.parents.filter(c => (typeof c === 'object' ? c.name : c) !== (typeof charObj === 'object' ? charObj.name : charObj)) }))}
                  />
                </div>
                <div className="bg-surface-low/30 p-4 rounded-2xl border border-outline-variant/40">
                  <EntityRelationInput
                    type="character"
                    label="Anh / Chị / Em"
                    icon="group"
                    itemIcon="person"
                    entities={form.siblings}
                    availableEntities={availableCharacters}
                    onAdd={(charOrObj, isUpdating) => setForm(prev => {
                      if (isUpdating) {
                        return { ...prev, siblings: prev.siblings.map(c => c.name === charOrObj.name ? charOrObj : c) };
                      }
                      return { ...prev, siblings: [...prev.siblings, { name: charOrObj, relation: '' }] };
                    })}
                    onRemove={(charObj) => setForm(prev => ({ ...prev, siblings: prev.siblings.filter(c => (typeof c === 'object' ? c.name : c) !== (typeof charObj === 'object' ? charObj.name : charObj)) }))}
                  />
                </div>
                <div className="bg-surface-low/30 p-4 rounded-2xl border border-outline-variant/40">
                  <EntityRelationInput
                    type="character"
                    label="Phu nhân / Con cái"
                    icon="family_restroom"
                    itemIcon="person"
                    entities={form.family}
                    availableEntities={availableCharacters}
                    onAdd={(charOrObj, isUpdating) => setForm(prev => {
                      if (isUpdating) {
                        return { ...prev, family: prev.family.map(c => c.name === charOrObj.name ? charOrObj : c) };
                      }
                      return { ...prev, family: [...prev.family, { name: charOrObj, relation: '' }] };
                    })}
                    onRemove={(charObj) => setForm(prev => ({ ...prev, family: prev.family.filter(c => (typeof c === 'object' ? c.name : c) !== (typeof charObj === 'object' ? charObj.name : charObj)) }))}
                  />
                </div>
              </div>
            </section>
          </div>

          {/* CỘT PHẢI: LIÊN KẾT & TAGS */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-1 rounded-3xl shadow-xl sticky top-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
              <div className="bg-surface/95 backdrop-blur-xl p-6 rounded-[22px] h-full border border-white/10 flex flex-col space-y-6 relative">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Cấu hình Nhân vật
                </h4>

                {/* Publishing Info */}
                <div className="space-y-4 relative z-10 text-left">
                  <p className="font-body text-[10px] font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">publish</span> Xuất bản
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</label>
                      <div className="relative">
                        <select
                          value={form.status}
                          onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-sm font-bold text-on-surface outline-none cursor-pointer hover:border-amber-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none"
                        >
                          <option value="draft">Bản nháp</option>
                          <option value="published">Công khai</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                      </div>
                    </div>
                  </div>
                </div>

                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10 mt-6">
                  <span className="material-symbols-outlined text-[16px]">account_circle</span>
                  Ảnh Đại Diện
                </h4>

                <div 
                  className="aspect-square w-48 mx-auto rounded-[2rem] bg-surface-low border-4 border-white shadow-lg flex flex-col items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 transition-all group overflow-hidden relative cursor-pointer mb-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img 
                    src={form.avatar || "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png"} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-all duration-500" 
                    alt="Character Avatar" 
                  />
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-surface/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-2xl mb-1 text-primary">cloud_upload</span>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-primary">Đổi ảnh</p>
                  </div>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />

                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60 pb-3 pt-4 flex items-center justify-center gap-2 text-center relative z-10">
                  <span className="material-symbols-outlined text-[16px]">hub</span>
                  Liên kết Thông tin
                </h4>

                <EntityRelationInput
                  type="location"
                  label="Địa danh"
                  icon="location_on"
                  entities={form.relatedLocations}
                  availableEntities={availableLocations}
                  onAdd={addLocation}
                  onRemove={removeLocation}
                />

                <EntityRelationInput
                  type="character"
                  label="Nhân vật khác"
                  icon="groups"
                  itemIcon="person"
                  entities={form.relatedCharacters}
                  availableEntities={availableCharacters}
                  onAdd={addCharacter}
                  onRemove={removeCharacter}
                />

                <TagInput
                  tags={form.tags}
                  availableTags={availableTags}
                  onAddTag={handleAddTag}
                  onRemoveTag={removeTag}
                />

              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
};

export default CharacterForm;