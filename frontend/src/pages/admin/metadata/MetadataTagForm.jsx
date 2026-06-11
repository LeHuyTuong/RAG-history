import {  useState, useEffect  } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { generateSlug } from '../../../utils/stringUtils';

const MetadataTagForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

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

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const newCat = {
      id: 'cat_' + Date.now(),
      label: newCatName.trim(),
      icon: 'sell',
      color: 'bg-primary'
    };
    setCategories([...categories, newCat]);
    setCategory(newCat.id);
    setIsAddingCategory(false);
    setNewCatName('');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin_tag_categories.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching tag categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    if (id) {
      const fetchTagDetail = async () => {
        try {
          const response = await fetch('/api/admin_metadata.json'); 
          if (response.ok) {
            const data = await response.json();
            const tag = data.tags?.find(t => t.id === parseInt(id) || t.id === id);
            if (tag) {
              setTagName(tag.name || '');
              if (tag.type) {
                const categoryMatch = categories.find(c => c.label.toLowerCase() === tag.type.toLowerCase());
                if (categoryMatch) setCategory(categoryMatch.id);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching tag detail:', error);
        }
      };
      fetchTagDetail();
    }
  }, [id, categories.length]);

  return (
    <div className="flex-grow bg-surface min-h-screen font-body pb-20 animate-in fade-in duration-500">
      <main className="p-8 max-w-6xl mx-auto space-y-8">

        <div className="flex flex-col md:flex-row justify-between items-end border-b border-outline-variant/40 pb-6 gap-4">
          <div>
            <h2 className="font-headline text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              {id ? 'Hiệu đính Thẻ Metadata' : 'Khởi tạo Thẻ mới'}
            </h2>
            <p className="font-body text-sm text-on-surface-variant mt-3 italic flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">local_offer</span>
              Quản lý hệ thống thẻ phân loại dữ liệu lịch sử tinh gọn.
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
              onClick={() => {
                alert('Đã lưu!');
                navigate('/admin/metadata');
              }}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 flex items-center gap-2 transition-all active:scale-95 uppercase"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {id ? 'CẬP NHẬT' : 'LƯU THẺ'}
            </button>
          </div>
        </div>

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
                    onChange={(e) => setTagName(e.target.value)}
                    className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 placeholder:font-light"
                    placeholder="Ví dụ: Lý Thái Tổ..."
                  />
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
                    <label key={cat.id} className="cursor-pointer group relative">
                      <input
                        type="radio"
                        name="cat"
                        className="hidden"
                        checked={category === cat.id}
                        onChange={() => setCategory(cat.id)}
                      />
                      <div
                        className={`px-6 py-3 rounded-2xl font-body text-xs font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center shadow-sm ${
                          category === cat.id
                            ? 'bg-gradient-to-r from-gray-900 to-indigo-600 text-white shadow-lg shadow-indigo-900/20 scale-105'
                            : 'bg-amber-50/50 border border-amber-200/60 text-amber-900 hover:bg-amber-100 hover:border-amber-300'
                        }`}
                      >
                        {cat.label}
                      </div>
                    </label>
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
                        onKeyDown={e => { if(e.key === 'Enter') handleAddCategory() }}
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

          <aside className="col-span-12 lg:col-span-4">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-1 rounded-3xl shadow-xl sticky top-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 overflow-hidden">
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
          </aside>

        </div>
      </main>
    </div>
  );
};
export default MetadataTagForm;