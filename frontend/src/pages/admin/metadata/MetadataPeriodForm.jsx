import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const MetadataPeriodForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [form, setForm] = useState({
    name: '',
    startYear: '',
    endYear: '',
    eraType: 'SCN',
    philosophy: '',
    description: '',
    emperors: [
      { id: 1, name: 'Trần Thái Tông', years: '1225 - 1258', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlb5e1Oz5B_OPS-pk9qWAOX6ZIzg77dFEWycdPVTIU0qsWu48YaI8AN249WPxlFlL2dryLtg3cjsojHbqbbvy9N8Jg03QKqvfKgWIOa9U06Lh6OYL72nR4BaV9gn2c4FYeuAMvRpNR98kiFATVgfLpN2tXNkRhJ8Sgc1Gyb_bzNsKQB-tAnAjWLT1F8z4gDgR7aVoM4PBuZmZ_i74bH0Wl0LIyChd2MT2xRbI9UNkdl48eWILaSpW-ZsNqr8Yq_g1mzZX9pKAm5JU' },
      { id: 2, name: 'Trần Nhân Tông', years: '1278 - 1293', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC9eoXDl2f_mu4ERdE14oS-oGOwgzaFmU-gFsOTdX72fc6kD63bh_gO2IP-PJLs5LHgZjwWAOhUS4vrlsctPq9u20iMaTKO5Ewc4ORH0y9ruFlvXVZwdAFREz5xKA-n_UEN0KXVFMLXyiRGKFC8haTtIbL8nD9dL1RktvzfJoZMrgRTRwew9B4o9TTy9DH5t-Wbeo12F0E32qEnhz-BVsiTY3TqdlPJScrSov39PFTOxWUhXOOgD8PpPw8aSpBQAvZ0HEDQIoL-N8s' }
    ]
  });

  useEffect(() => {
    if (isEdit) {
      setForm(prev => ({
        ...prev,
        name: 'Nhà Trần',
        startYear: '1225',
        endYear: '1400',
        philosophy: 'Hào khí Đông A',
        description: 'Triều Trần là một triều đại quân chủ rực rỡ, ba lần đại thắng quân Nguyên Mông...'
      }));
    }
  }, [id, isEdit]);

  const removeEmperor = (empId) => {
    setForm({...form, emperors: form.emperors.filter(e => e.id !== empId)});
  };

  return (
    <div className="flex-grow bg-surface min-h-screen font-body pb-20">

      <main className="p-8 max-w-7xl mx-auto space-y-10">
        <div className="flex justify-between items-start border-b-2 border-primary/10 pb-6">

  {/* LEFT TITLE */}
  <div>
    <h2 className="font-headline text-3xl text-primary font-bold tracking-tight">
      Ghi chép Kỷ nguyên mới
    </h2>
    <p className="text-on-surface-variant text-sm mt-1 italic font-body">
      "Đảm bảo tính chính xác về thời gian và ngôn ngữ để lưu trữ vĩnh viễn."
    </p>
  </div>

  {/* RIGHT ACTIONS */}
  <div className="flex gap-3 items-center">

    <button
      onClick={() => navigate(-1)}
      className="px-5 py-2 border border-primary text-primary font-body text-[10px] font-bold hover:bg-primary/5 transition-all uppercase"
    >
      HỦY BỎ
    </button>

    <button
      onClick={() => {
        console.log("SAVE PERIOD:", form);
        alert("Đã lưu dữ liệu!");
        // navigate('/admin/periods')
      }}
      className="px-6 py-2 bg-primary text-white font-body text-[10px] font-bold shadow-lg hover:bg-primary-container flex items-center gap-2 transition-all uppercase"
    >
      <span className="material-symbols-outlined text-sm">save</span>
      {isEdit ? 'LƯU THAY ĐỔI' : 'TẠO THỜI KỲ'}
    </button>

  </div>

</div>

        <div className="grid grid-cols-12 gap-10">
          <div className="col-span-12 lg:col-span-8 space-y-10">
            {/* SECTION 1: IDENTITY */}
            <section className="bg-white p-8 border border-outline-variant shadow-sm rounded-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5"><span className="material-symbols-outlined text-8xl">stars</span></div>
               <h3 className="font-headline text-xl text-primary font-bold mb-8 border-b border-outline-variant pb-3">Danh tính & Kỷ nguyên</h3>
               
               <div className="grid grid-cols-2 gap-8 relative z-10">
                  <div className="col-span-2 space-y-1">
                    <label className="font-body text-[10px] font-bold uppercase opacity-60">Tên Thời kỳ / Triều đại</label>
                    <input 
                      type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      className="w-full bg-transparent border-b-2 border-outline-variant focus:border-primary py-2 font-headline text-2xl text-primary outline-none transition-all"
                      placeholder="vd: Nhà Lý (Hậu Lý)..."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-body text-[10px] font-bold uppercase opacity-60">Năm bắt đầu</label>
                    <div className="flex gap-2">
                       <input type="number" value={form.startYear} className="flex-1 bg-surface-low border border-outline-variant rounded p-2 text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="1009" />
                       <select className="bg-surface-low border border-outline-variant rounded px-2 text-[10px] font-bold">
                          <option>SCN</option><option>TCN</option>
                       </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="font-body text-[10px] font-bold uppercase opacity-60">Năm kết thúc</label>
                    <div className="flex gap-2">
                       <input type="number" value={form.endYear} className="flex-1 bg-surface-low border border-outline-variant rounded p-2 text-sm outline-none focus:ring-1 focus:ring-primary" placeholder="1225" />
                       <select className="bg-surface-low border border-outline-variant rounded px-2 text-[10px] font-bold">
                          <option>SCN</option><option>TCN</option>
                       </select>
                    </div>
                  </div>
               </div>
            </section>

            {/* SECTION 2: CONTEXT */}
            <section className="bg-white p-8 border border-outline-variant shadow-sm rounded-lg">
               <h3 className="font-headline text-xl text-primary font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined">auto_stories</span> Bối cảnh & Ý nghĩa
               </h3>
               <div className="space-y-6">
                  <div className="space-y-1">
                    <label className="font-body text-[10px] font-bold uppercase opacity-60">Triết lý / Khẩu hiệu</label>
                    <input type="text" value={form.philosophy} className="w-full bg-transparent border-b border-outline-variant focus:border-primary py-2 font-body text-base italic text-primary outline-none" placeholder="vd: Nam Quốc Sơn Hà Nam Đế Cư..." />
                  </div>
                  <div className="space-y-1">
                    <label className="font-body text-[10px] font-bold uppercase opacity-60">Mô tả chi tiết</label>
                    <textarea rows="6" value={form.description} className="w-full bg-surface-low border border-outline-variant rounded p-4 text-sm leading-relaxed outline-none focus:ring-1 focus:ring-primary/30 resize-none" placeholder="Viết về các thay đổi chính trị - xã hội..." />
                  </div>
               </div>
            </section>

            {/* SECTION 3: EMPERORS */}
            <section className="bg-white p-8 border border-outline-variant shadow-sm rounded-lg">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="font-headline text-xl text-primary font-bold italic">Các Vị Vua Tiêu Biểu</h3>
                  <button className="font-body text-[10px] font-bold text-primary hover:underline flex items-center gap-1">+ THÊM VỊ VUA</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.emperors.map(emp => (
                    <div key={emp.id} className="flex items-center gap-4 p-4 bg-surface-low border border-outline-variant/30 rounded group hover:border-primary transition-all">
                       <img src={emp.img} className="w-12 h-12 rounded-full object-cover grayscale group-hover:grayscale-0 transition-all border border-outline-variant" alt={emp.name} />
                       <div className="flex-1">
                          <p className="font-bold text-sm text-primary">{emp.name}</p>
                          <p className="text-[10px] font-body opacity-60 uppercase tracking-tighter">{emp.years}</p>
                       </div>
                       <button onClick={() => removeEmperor(emp.id)} className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 hover:text-red-600">close</button>
                    </div>
                  ))}
               </div>
            </section>
          </div>

          {/* RIGHT COLUMN: PREVIEW */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
             <div className="bg-primary text-white p-8 rounded-lg shadow-2xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
                <h4 className="font-headline text-2xl mb-8 border-b border-white/20 pb-4">Trình quản lý</h4>
                <div className="space-y-4 font-body text-[11px]">
                   <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="opacity-60 uppercase">Dữ liệu RAG</span>
                      <span className="text-accent font-bold">ĐÃ ĐỒNG BỘ</span>
                   </div>
                   <div className="flex justify-between border-b border-white/10 pb-2">
                      <span className="opacity-60 uppercase">Thẻ liên kết</span>
                      <span className="font-bold">24 Items</span>
                   </div>
                </div>
                <button className="w-full mt-10 py-3 bg-white/10 border border-white/30 rounded font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                   <span className="material-symbols-outlined text-sm">visibility</span> XEM TRƯỚC
                </button>
             </div>

             <div className="bg-white p-6 border border-outline-variant shadow-sm">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant pb-2 mb-4">Hình ảnh Đặc trưng</h4>
                <div className="aspect-[4/3] bg-surface-low border-2 border-dashed border-outline-variant flex flex-col items-center justify-center text-on-surface-variant hover:text-primary transition-all group overflow-hidden relative">
                   <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuC985CMRZP23HpJ5za85ebR1crUKhsr0KCyJ_BcF266K2Sz4XpMW5IxI4b43YV0Q4sm4n5_61Nt7iLIX_owe7vciBN27Tl2TOr70qKuktVe_M0TE2Y4a6lnt7_UixDOQoLkeJHFYonX0sxb9kEpl1tE-f2boPacsBAa9VxbOi0iXjlzn0JLIPF_XLpVuxdVmm8jFd3nKtO2eEJndLW5vwfSlYORL9ZKKoqIjJso5kawMxks1hpaqWDyNDHzWNGTJ0Lb3jnQiRZlfRU" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" alt="period" />
                   <span className="material-symbols-outlined text-3xl relative z-10">cloud_upload</span>
                   <p className="text-[9px] font-bold uppercase relative z-10 mt-2">Thay đổi ảnh</p>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MetadataPeriodForm;