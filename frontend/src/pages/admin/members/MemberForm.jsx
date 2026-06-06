import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const MemberForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    fullName: '', username: '', password: '', bio: '', role: 'scholar'
  });

  useEffect(() => {
    if (isEdit) {
      setForm({
        fullName: 'Trần Hoài',
        username: 'hoai.tran',
        password: '',
        bio: 'Nhà nghiên cứu sử học chuyên sâu về giai đoạn Lý - Trần...',
        role: 'scholar'
      });
    }
  }, [id, isEdit]);

  return (
    <div className="flex-grow bg-surface min-h-screen font-body pb-20">
      {/* Top Header */}

      <main className="p-8 max-w-5xl mx-auto space-y-10">
<div className="flex justify-between items-start border-b-2 border-primary/10 pb-6">

  {/* LEFT TITLE */}
  <div>
    <h2 className="font-headline text-3xl text-primary font-bold tracking-tight">
      {isEdit ? 'Chỉnh sửa Hồ sơ Thành viên' : 'Thiết lập Tài khoản Mới'}
    </h2>

    <p className="text-on-surface-variant text-sm mt-1 italic font-body">
      "Quản lý thông tin thành viên trong hệ thống học thuật."
    </p>
  </div>

  {/* RIGHT ACTIONS */}
  <div className="flex gap-3 items-center">

    <button
      onClick={() => navigate('/admin/members')}
      className="px-5 py-2 border border-primary text-primary font-body text-[10px] font-bold hover:bg-primary/5 transition-all uppercase"
    >
      HỦY BỎ
    </button>

    <button
      onClick={() => {
        console.log("SAVE MEMBER:", form);
        alert("Đã lưu hồ sơ!");
        // navigate('/admin/members')
      }}
      className="px-8 py-2 bg-primary text-white font-body text-[10px] font-bold shadow-lg hover:bg-primary-container flex items-center gap-2 transition-all uppercase"
    >
      <span className="material-symbols-outlined text-sm">save</span>
      LƯU HỒ SƠ
    </button>

  </div>

</div>
        <div className="grid grid-cols-12 gap-8 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-8">
            <section className="bg-white p-8 border border-outline-variant shadow-sm space-y-8 relative overflow-hidden">
               <div className="absolute -bottom-10 -right-10 opacity-[0.03] text-primary"><span className="material-symbols-outlined text-[200px]">history_edu</span></div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-1">
                    <label className="font-body text-[10px] font-bold uppercase opacity-60">Họ và tên *</label>
                    <input type="text" value={form.fullName} className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary py-2 font-headline text-xl" placeholder="Vd: Nguyễn Văn A..." />
                  </div>
                  <div className="space-y-1">
                    <label className="font-body text-[10px] font-bold uppercase opacity-60">Tên đăng nhập</label>
                    <input type="text" value={form.username} className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary py-2 font-body" placeholder="nva_scholar" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="font-body text-[10px] font-bold uppercase opacity-60">Mật khẩu {isEdit && '(Bỏ trống nếu không đổi)'}</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-primary py-2" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="font-body text-[10px] font-bold uppercase opacity-60">Tiểu sử & Giới thiệu</label>
                    <textarea rows="4" value={form.bio} className="w-full bg-surface-low border border-outline-variant p-4 rounded text-sm italic italic leading-relaxed" placeholder="Mô tả sơ lược về thành viên..." />
                  </div>
               </div>
            </section>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
             <div className="bg-white p-6 border border-outline-variant shadow-sm space-y-6">
                <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-primary border-b pb-2">Vai trò Hệ thống</h4>
                <div className="space-y-3">
                   {[
                     { id: 'admin', label: 'Quản trị viên', icon: 'verified_user' },
                     { id: 'scholar', label: 'Học giả', icon: 'school' },
                     { id: 'member', label: 'Thành viên', icon: 'person' }
                   ].map(role => (
                     <label key={role.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-low border border-transparent hover:border-primary cursor-pointer transition-all">
                        <input type="radio" name="role" className="hidden" checked={form.role === role.id} onChange={() => setForm({...form, role: role.id})} />
                        <span className={`material-symbols-outlined text-sm ${form.role === role.id ? 'text-primary' : 'text-on-surface-variant'}`}>{role.icon}</span>
                        <span className={`text-xs font-bold ${form.role === role.id ? 'text-primary' : 'text-on-surface-variant'}`}>{role.label}</span>
                        {form.role === role.id && <span className="material-symbols-outlined text-sm text-primary ml-auto">check_circle</span>}
                     </label>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MemberForm;