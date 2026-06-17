import {  useState, useEffect  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';
import { RichTextEditor, EntityRelationInput, FormHeader } from '../../../components/admin';

const EventForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    startDate: '',
    endDate: '',
    description: '',
    relatedLocations: [],
    relatedCharacters: []
  });

  const [availableLocations, setAvailableLocations] = useState([]);
  const [availableCharacters, setAvailableCharacters] = useState([]);

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const response = await fetch('/api/user_event_detail.json');
          if (response.ok) {
            const data = await response.json();
            setFormData(prev => ({
              ...prev,
              name: data.name || data.title || '',
              slug: generateSlug(data.name || data.title || ''),
              startDate: data.time?.match(/\d+/)?.[0] || '',
              description: data.description || data.content?.map(c => c.text).join('<br/>') || '',
              relatedLocations: data.relatedLocations || [],
              relatedCharacters: data.relatedCharacters || []
            }));
          }
        } catch (error) {
          console.error('Lỗi tải dữ liệu sự kiện:', error);
        }
      };
      fetchData();
    }

    const fetchAvailableData = async () => {
      try {
        const [locRes, charRes] = await Promise.all([
          fetch('/api/admin_locations.json'),
          fetch('/api/admin_characters.json')
        ]);

        if (locRes.ok) {
          const locData = await locRes.json();
          setAvailableLocations(locData.locations || []);
        }
        if (charRes.ok) {
          const charData = await charRes.json();
          setAvailableCharacters(charData.characters || []);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu liên kết:', error);
      }
    };
    fetchAvailableData();
  }, [id, isEdit]);

  const removeLocation = (locToRemove) => {
    setFormData(prev => ({
      ...prev,
      relatedLocations: prev.relatedLocations.filter(l => l !== locToRemove)
    }));
  };

  const addLocation = (loc) => {
    setFormData(prev => ({
      ...prev,
      relatedLocations: [...new Set([...(prev.relatedLocations || []), loc])]
    }));
  };

  const removeCharacter = (charToRemove) => {
    setFormData(prev => ({
      ...prev,
      relatedCharacters: prev.relatedCharacters.filter(c => c !== charToRemove)
    }));
  };

  const addCharacter = (char) => {
    setFormData(prev => ({
      ...prev,
      relatedCharacters: [...new Set([...(prev.relatedCharacters || []), char])]
    }));
  };

  return (
    <div className="flex-grow bg-surface min-h-screen animate-in fade-in duration-500 pb-20">
      <main className="p-8 max-w-7xl mx-auto space-y-8 font-body">

        <FormHeader 
          title={isEdit ? 'Hiệu đính Sự kiện' : 'Thêm Sự kiện Lịch sử Mới'}
          subtitle='"Ghi chép những cột mốc vàng son của dân tộc"'
          icon="history"
          isEdit={isEdit}
          onCancel={() => navigate('/admin/events')}
          onSave={() => {}}
        />

        <div className="grid grid-cols-12 gap-8 items-start">

          {/* CỘT TRÁI: FORM CHÍNH */}
          <div className="col-span-12 lg:col-span-8 space-y-8">

            {/* SECTION 1: IDENTITY */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-8 relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute -top-12 -right-12 opacity-[0.02] text-primary pointer-events-none">
                <span className="material-symbols-outlined text-[200px]">event</span>
              </div>

              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-primary text-[18px]">event_note</span>
                Thông tin Sự kiện
              </h3>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Tên sự kiện lịch sử *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => {
                      const newName = e.target.value;
                      setFormData({ ...formData, name: newName, slug: generateSlug(newName) });
                    }}
                    className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 placeholder:font-light"
                    placeholder="Ví dụ: Định đô Thăng Long..."
                  />
                </div>

                <div className="flex items-center gap-3 bg-surface-low/30 border border-outline-variant/40 rounded-xl p-3 text-on-surface-variant font-body text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-primary/60">link</span>
                  <span className="opacity-60 lowercase tracking-normal italic">suviet.vn/su-kien/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    readOnly
                    className="flex-1 bg-transparent border-none outline-none font-bold text-indigo-700 placeholder:text-outline-variant/40"
                    placeholder="dinh-do-thang-long"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-outline-variant/30">
                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Ngày bắt đầu</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">Ngày kết thúc</label>
                    <div className="bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full h-full bg-transparent border-none px-3 font-body text-xs outline-none placeholder:text-outline-variant/60 font-bold text-on-surface"
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
                Diễn biến chi tiết
              </h3>

              <div className="space-y-2">
                <div className="rounded-2xl overflow-hidden border border-outline-variant/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all bg-surface-low/30">
                  <RichTextEditor
                    value={formData.description}
                    onChange={(description) => setFormData({ ...formData, description })}
                    placeholder="Bắt đầu ghi chép sử liệu chi tiết tại đây..."
                    className="min-h-[500px]"
                  />
                </div>
              </div>
            </section>

          </div>

          {/* CỘT PHẢI: LIÊN KẾT */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-1 rounded-3xl shadow-xl sticky top-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 overflow-hidden">
              <div className="bg-surface/95 backdrop-blur-xl p-6 rounded-[22px] h-full border border-white/10 flex flex-col space-y-6 relative">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>

                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
                  <span className="material-symbols-outlined text-[16px]">hub</span>
                  Liên kết Thông tin
                </h4>

                <EntityRelationInput
                  type="location"
                  label="Địa danh liên quan"
                  icon="location_on"
                  entities={formData.relatedLocations}
                  availableEntities={availableLocations}
                  onAdd={addLocation}
                  onRemove={removeLocation}
                />

                <EntityRelationInput
                  type="character"
                  label="Nhân vật then chốt"
                  icon="groups"
                  itemIcon="person"
                  entities={formData.relatedCharacters}
                  availableEntities={availableCharacters}
                  onAdd={addCharacter}
                  onRemove={removeCharacter}
                />

              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
};

export default EventForm;