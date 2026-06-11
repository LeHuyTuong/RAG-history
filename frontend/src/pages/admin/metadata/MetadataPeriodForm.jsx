import {  useState, useEffect  } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MetadataPeriodForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    startYear: '',
    endYear: '',
    eraTypeStart: 'SCN',
    eraTypeEnd: 'SCN',
    philosophy: '',
    description: '',
    emperors: []
  });

  const [availableCharacters, setAvailableCharacters] = useState([]);

  // States cho tính năng thêm/sửa nhân vật mới
  const [isAddingEmperor, setIsAddingEmperor] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState(null);
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpYears, setNewEmpYears] = useState('');

  const handleAddEmperor = () => {
    if (!newEmpName.trim()) return;

    if (editingEmpId) {
      // Chỉnh sửa nhân vật hiện tại
      setForm(prev => ({
        ...prev,
        emperors: prev.emperors.map(e => 
          e.id === editingEmpId 
            ? { ...e, name: newEmpName.trim(), years: newEmpYears.trim() || 'Chưa xác định' } 
            : e
        )
      }));
    } else {
      // Thêm nhân vật mới
      const newEmp = {
        id: 'emp_' + Date.now(),
        name: newEmpName.trim(),
        years: newEmpYears.trim() || 'Chưa xác định',
        img: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' // Default avatar placeholder
      };
      setForm({ ...form, emperors: [...form.emperors, newEmp] });
    }

    resetEmperorForm();
  };

  const handleEditEmperor = (emp) => {
    setIsAddingEmperor(true);
    setEditingEmpId(emp.id);
    setNewEmpName(emp.name);
    setNewEmpYears(emp.years);
  };

  const resetEmperorForm = () => {
    setIsAddingEmperor(false);
    setEditingEmpId(null);
    setNewEmpName('');
    setNewEmpYears('');
  };


  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const response = await fetch('/api/user_period_detail.json');
          if (response.ok) {
            const data = await response.json();
            setForm(prev => ({
              ...prev,
              name: data.name || '',
              startYear: data.time?.match(/\d+/)?.[0] || '',
              endYear: data.time?.match(/\d+$/)?.[0] || '',
              philosophy: data.features?.[0] || '',
              description: data.description || '',
              emperors: data.figures || []
            }));
          }
        } catch (error) {
          console.error('Error fetching period:', error);
        }
      };
      fetchData();
    }

    // Luôn fetch danh sách nhân vật để gợi ý
    const fetchCharacters = async () => {
      try {
        const response = await fetch('/api/admin_characters.json');
        if (response.ok) {
          const data = await response.json();
          setAvailableCharacters(data.characters || []);
        }
      } catch (error) {
        console.error('Error fetching characters:', error);
      }
    };
    fetchCharacters();
  }, [id, isEdit]);

  const removeEmperor = (empId) => {
    setForm({...form, emperors: form.emperors.filter(e => e.id !== empId)});
  };

  return (
    <div className="flex-grow bg-surface min-h-screen font-body pb-20 animate-in fade-in duration-500">
      <main className="p-8 max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-outline-variant/40 pb-6 gap-4">
          <div>
            <h2 className="font-headline text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              {isEdit ? 'Hiệu đính Kỷ nguyên' : 'Ghi chép Kỷ nguyên mới'}
            </h2>
            <p className="font-body text-sm text-on-surface-variant mt-3 italic flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">history_edu</span>
              Đảm bảo tính chính xác về thời gian và ngôn ngữ để lưu trữ vĩnh viễn.
            </p>
          </div>
          <div className="flex gap-3 font-body text-xs font-bold tracking-widest">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all uppercase"
            >
              HỦY BỎ
            </button>
            <button
              onClick={() => {
                console.log("SAVE PERIOD:", form);
                alert("Đã lưu dữ liệu!");
                // navigate('/admin/periods')
              }}
              className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 flex items-center gap-2 transition-all active:scale-95 uppercase"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              {isEdit ? 'LƯU THAY ĐỔI' : 'TẠO THỜI KỲ'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-8">
            
            {/* SECTION 1: IDENTITY */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-8 relative overflow-hidden transition-all hover:shadow-md">
              <div className="absolute -top-12 -right-12 opacity-[0.03] text-primary pointer-events-none">
                <span className="material-symbols-outlined text-[200px]">account_balance</span>
              </div>
              
              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2 relative z-10">
                <span className="material-symbols-outlined text-primary text-[18px]">stars</span>
                Danh tính & Niên đại
              </h3>
               
              <div className="grid grid-cols-2 gap-8 relative z-10">
                <div className="col-span-2 space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Tên Thời kỳ / Triều đại *
                  </label>
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-3 font-headline text-3xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 placeholder:font-light"
                    placeholder="Ví dụ: Nhà Lý (Hậu Lý)..."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Khởi điểm (Năm bắt đầu)
                  </label>
                  <div className="flex items-center gap-2 bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                    <input 
                      type="number" 
                      value={form.startYear} 
                      onChange={e => setForm({...form, startYear: e.target.value})}
                      className="flex-1 bg-transparent border-none px-3 text-sm font-bold text-on-surface outline-none placeholder:text-outline-variant/60 placeholder:font-normal" 
                      placeholder="1009" 
                    />
                    <select 
                      value={form.eraTypeStart}
                      onChange={e => setForm({...form, eraTypeStart: e.target.value})}
                      className="bg-white border border-outline-variant/40 rounded-lg px-3 py-1.5 text-[11px] font-bold text-on-surface outline-none cursor-pointer hover:bg-gray-50"
                    >
                      <option>SCN</option>
                      <option>TCN</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Kết thúc (Năm kết thúc)
                  </label>
                  <div className="flex items-center gap-2 bg-surface-low/50 border border-outline-variant/60 rounded-xl overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all p-1 h-12">
                    <input 
                      type="number" 
                      value={form.endYear} 
                      onChange={e => setForm({...form, endYear: e.target.value})}
                      className="flex-1 bg-transparent border-none px-3 text-sm font-bold text-on-surface outline-none placeholder:text-outline-variant/60 placeholder:font-normal" 
                      placeholder="1225" 
                    />
                    <select 
                      value={form.eraTypeEnd}
                      onChange={e => setForm({...form, eraTypeEnd: e.target.value})}
                      className="bg-white border border-outline-variant/40 rounded-lg px-3 py-1.5 text-[11px] font-bold text-on-surface outline-none cursor-pointer hover:bg-gray-50"
                    >
                      <option>SCN</option>
                      <option>TCN</option>
                    </select>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 2: CONTEXT */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-6 transition-all hover:shadow-md">
              <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">auto_stories</span>
                Bối cảnh & Ý nghĩa
              </h3>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Triết lý / Khẩu hiệu
                  </label>
                  <input 
                    type="text" 
                    value={form.philosophy} 
                    onChange={e => setForm({...form, philosophy: e.target.value})}
                    className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-2 font-body text-base italic text-on-surface outline-none transition-all placeholder:text-outline-variant/60" 
                    placeholder="Ví dụ: Nam Quốc Sơn Hà Nam Đế Cư..." 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest">
                    Mô tả chi tiết sử liệu
                  </label>
                  <textarea 
                    rows="6" 
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})}
                    className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-4 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none font-body" 
                    placeholder="Viết về các thay đổi chính trị - xã hội trong thời kỳ này..." 
                  />
                </div>
              </div>
            </section>

            {/* SECTION 3: EMPERORS */}
            <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-6 transition-all hover:shadow-md">
              <div className="flex justify-between items-center border-b border-outline-variant/60 pb-3">
                <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">groups</span>
                  Các Vị Vua / Lãnh đạo Tiêu biểu
                </h3>
                {!isAddingEmperor && (
                  <button 
                    onClick={() => setIsAddingEmperor(true)}
                    className="text-[11px] font-bold text-primary hover:text-indigo-600 flex items-center gap-1 transition-colors uppercase tracking-widest bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-lg"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    Thêm nhân vật
                  </button>
                )}
              </div>
               
              {isAddingEmperor && (
                <div className="bg-surface-low/50 p-6 rounded-2xl border border-outline-variant/60 space-y-4 shadow-inner animate-in fade-in zoom-in-95 duration-300">
                  <h4 className="font-body text-[11px] font-bold uppercase text-on-surface-variant tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">{editingEmpId ? 'edit' : 'person_add'}</span>
                    {editingEmpId ? 'Chỉnh sửa nhân vật' : 'Thông tin nhân vật mới'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input 
                        type="text" 
                        list="character-list"
                        placeholder="Tên nhân vật (Vd: Lý Thái Tổ)..."
                        value={newEmpName}
                        onChange={e => {
                          setNewEmpName(e.target.value);
                          const matched = availableCharacters.find(c => c.name === e.target.value);
                          if (matched && !newEmpYears) {
                            setNewEmpYears(matched.years);
                          }
                        }}
                        className="w-full bg-white border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-3 text-sm font-bold text-on-surface outline-none transition-all"
                        autoFocus
                      />
                      <datalist id="character-list">
                        {availableCharacters.map(c => (
                          <option key={c.id} value={c.name}>{c.title || c.dynasty}</option>
                        ))}
                      </datalist>
                    </div>
                    <div>
                      <input 
                        type="text" 
                        placeholder="Trị vì / Hoạt động (Vd: 1009 - 1028)..."
                        value={newEmpYears}
                        onChange={e => setNewEmpYears(e.target.value)}
                        className="w-full bg-white border border-outline-variant/60 focus:border-primary rounded-xl px-4 py-3 text-sm font-bold text-on-surface outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button 
                      onClick={resetEmperorForm}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-black/5 transition-all uppercase tracking-widest"
                    >
                      HỦY
                    </button>
                    <button 
                      onClick={handleAddEmperor}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-primary to-indigo-600 text-white hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md uppercase tracking-widest"
                    >
                      {editingEmpId ? 'LƯU THAY ĐỔI' : 'LƯU NHÂN VẬT'}
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.emperors.length === 0 ? (
                  <div className="col-span-2 py-8 text-center border-2 border-dashed border-outline-variant/60 rounded-2xl bg-surface-low/50">
                    <span className="material-symbols-outlined text-4xl text-outline-variant mb-2">person_add_disabled</span>
                    <p className="font-body text-sm text-on-surface-variant italic">Chưa có nhân vật tiêu biểu nào được thêm.</p>
                  </div>
                ) : (
                  form.emperors.map(emp => (
                    <div key={emp.id} className="flex items-center gap-4 p-3 bg-white border border-outline-variant/60 rounded-2xl group hover:border-primary/50 transition-all shadow-sm hover:shadow-md relative overflow-hidden">
                      <div className="absolute top-0 right-0 bottom-0 w-1 bg-gradient-to-b from-primary to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <img 
                        src={emp.img} 
                        className="w-12 h-12 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all border border-outline-variant/40" 
                        alt={emp.name} 
                      />
                      <div className="flex-1">
                        <p className="font-bold text-sm text-on-surface">{emp.name}</p>
                        <p className="text-[10px] font-body text-on-surface-variant uppercase tracking-widest">{emp.years}</p>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditEmperor(emp)} 
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-primary hover:bg-primary/10 transition-colors"
                          title="Chỉnh sửa nhân vật"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button 
                          onClick={() => removeEmperor(emp.id)} 
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Xóa nhân vật"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: PREVIEW */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-1 rounded-3xl shadow-xl sticky top-8 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 overflow-hidden">
              <div className="bg-surface/95 backdrop-blur-xl p-6 rounded-[22px] text-center h-full border border-white/10 flex flex-col">
                
                <p className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center justify-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  Bản xem trước
                </p>

                {/* THUMBNAIL UPLOAD IN PREVIEW */}
                <div className="aspect-[4/3] rounded-2xl bg-surface-low border-2 border-dashed border-outline-variant/60 flex flex-col items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group overflow-hidden relative cursor-pointer mb-6">
                  <img 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC985CMRZP23HpJ5za85ebR1crUKhsr0KCyJ_BcF266K2Sz4XpMW5IxI4b43YV0Q4sm4n5_61Nt7iLIX_owe7vciBN27Tl2TOr70qKuktVe_M0TE2Y4a6lnt7_UixDOQoLkeJHFYonX0sxb9kEpl1tE-f2boPacsBAa9VxbOi0iXjlzn0JLIPF_XLpVuxdVmm8jFd3nKtO2eEJndLW5vwfSlYORL9ZKKoqIjJso5kawMxks1hpaqWDyNDHzWNGTJ0Lb3jnQiRZlfRU" 
                    className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-80 transition-all duration-700" 
                    alt="Period Cover" 
                  />
                  <div className="relative z-10 flex flex-col items-center bg-surface/80 backdrop-blur-sm p-3 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-2xl mb-1">cloud_upload</span>
                    <p className="text-[9px] font-bold uppercase tracking-widest">Tải ảnh nền</p>
                  </div>
                </div>

                {/* DYNAMIC CONTENT */}
                <div className="flex flex-col items-center relative flex-1">
                  <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl -z-10"></div>
                  
                  <div className="px-4 py-1.5 text-white text-[10px] font-bold rounded-full mb-3 uppercase tracking-widest shadow-sm ring-2 ring-white/50 bg-gradient-to-r from-primary to-indigo-600">
                    {form.startYear && form.endYear 
                      ? `${form.startYear} ${form.eraTypeStart} - ${form.endYear} ${form.eraTypeEnd}` 
                      : 'Khoảng thời gian'}
                  </div>

                  <h4 className="font-headline text-3xl font-bold bg-gradient-to-r from-gray-900 to-primary bg-clip-text text-transparent transition-all duration-300 mb-2">
                    {form.name || 'Tên Kỷ nguyên'}
                  </h4>

                  {form.philosophy && (
                    <p className="font-body text-xs text-on-surface-variant italic leading-relaxed px-4 opacity-80 line-clamp-3">
                      "{form.philosophy}"
                    </p>
                  )}
                </div>

                <div className="mt-6 p-4 bg-surface-low/50 rounded-xl border border-dashed border-outline-variant/60 text-[11px] text-on-surface-variant leading-relaxed font-body italic">
                  Giao diện này sẽ xuất hiện trên trang giới thiệu Kỷ nguyên và Timeline lịch sử tương tác.
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default MetadataPeriodForm;