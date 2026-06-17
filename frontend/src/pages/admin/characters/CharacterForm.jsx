import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { RichTextEditor, TagInput, EntityRelationInput, FormHeader } from '../../../components/admin';

const CharacterForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '', title: '', slug: '', birthYear: '', deathYear: '', biography: '', tags: [],
    relatedLocations: [], relatedCharacters: []
  });

  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableCharacters, setAvailableCharacters] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const response = await fetch('/api/user_character_detail.json');
          if (response.ok) {
            const data = await response.json();
            setForm({
              name: data.name || '',
              slug: generateSlug(data.name || ''),
              title: data.title || '',
              birthYear: data.birthYear || '',
              deathYear: data.deathYear || '',
              biography: data.biography || data.shortDesc || '',
              tags: data.tags || [],
              relatedLocations: data.relatedLocations || [],
              relatedCharacters: data.relatedCharacters || []
            });
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
          setAvailableTags(metaData.tags || []);
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

  return (
    <div className="flex-grow bg-surface min-h-screen animate-in fade-in duration-500 pb-20">
      <main className="p-8 max-w-7xl mx-auto space-y-8 font-body">

        <FormHeader
          title={isEdit ? 'Chỉnh sửa Hồ sơ' : 'Hồ sơ Nhân vật Lịch sử'}
          subtitle="Kiến tạo bản ghi điện tử cho nhân vật trong hệ thống Sử Việt."
          icon="person_check"
          isEdit={isEdit}
          onCancel={() => navigate('/admin/characters')}
          onSave={() => { }}
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

                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Năm sinh</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <input
                        type="number"
                        value={form.birthYear}
                        onChange={e => setForm({ ...form, birthYear: e.target.value })}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold"
                        placeholder="1228"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Năm mất</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <input
                        type="number"
                        value={form.deathYear}
                        onChange={e => setForm({ ...form, deathYear: e.target.value })}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold"
                        placeholder="1300"
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Cha/Mẹ', 'Anh/Chị/Em', 'Phu nhân / Con cái'].map((label, idx) => (
                  <div key={idx} className="p-5 border-2 border-dashed border-outline-variant/60 rounded-2xl bg-surface-low/30 flex flex-col items-center justify-center gap-3 group cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[120px]">
                    <span className="material-symbols-outlined text-3xl text-outline-variant group-hover:text-primary transition-colors">person_add</span>
                    <span className="font-body text-[10px] uppercase tracking-widest font-bold text-on-surface-variant group-hover:text-primary transition-colors">{label}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* CỘT PHẢI: LIÊN KẾT & TAGS */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-1 rounded-3xl shadow-xl sticky top-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
              <div className="bg-surface/95 backdrop-blur-xl p-6 rounded-[22px] h-full border border-white/10 flex flex-col space-y-6 relative">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
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