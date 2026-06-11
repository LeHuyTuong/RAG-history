import {  useState, useEffect  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const MemberForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({
    fullName: '', username: '', password: '', confirmPassword: '', bio: '', role: 'member', status: 'active'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const response = await fetch('/api/admin_members.json');
          if (response.ok) {
            const data = await response.json();
            const member = data.members?.find(m => m.id === id) || data.members?.[0];
            if (member) {
              setForm(prev => ({
                ...prev,
                fullName: member.name || '',
                username: member.username || member.name?.toLowerCase().replace(/\s+/g, '') || '',
                password: '',
                confirmPassword: '',
                bio: member.specialty || '',
                role: member.role === 'Quản trị viên' ? 'admin' : member.role === 'Học giả' ? 'scholar' : 'member',
                status: member.status || 'active'
              }));
            }
          }
        } catch (error) {
          console.error('Error fetching member:', error);
        }
      };
      fetchData();
    }
  }, [id, isEdit]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = () => {
    console.log("SAVE MEMBER:", form);
    alert("Đã lưu hồ sơ thành viên!");
    navigate('/admin/members');
  };

  const roles = [
    { id: 'member', label: 'Thành viên', icon: 'person', desc: 'Độc giả thông thường, tham gia thảo luận cơ bản.' }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 font-body">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-outline-variant/40 pb-6 mb-8 gap-4">
        <div>
          <h2 className="font-headline text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
            {isEdit ? 'Chỉnh sửa Hồ sơ' : 'Thiết lập Tài khoản Mới'}
          </h2>
          <p className="font-body text-sm text-on-surface-variant mt-3 italic flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
            {isEdit ? 'Cập nhật thông tin thành viên trong hệ thống.' : 'Thiết lập tài khoản thành viên mới cho Cộng đồng Sử Việt.'}
          </p>
        </div>
        <div className="flex gap-3 font-body text-xs font-bold tracking-widest">
          <button
            onClick={() => navigate('/admin/members')}
            className="px-6 py-2.5 rounded-xl border-2 border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all uppercase"
          >
            Hủy bỏ
          </button>
          <button
            onClick={handleSave}
            className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 flex items-center gap-2 transition-all active:scale-95 uppercase"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            LƯU HỒ SƠ
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* Left Column: Basic Info */}
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <section className="bg-white p-8 rounded-3xl border border-outline-variant/60 shadow-sm space-y-8 relative overflow-hidden transition-all hover:shadow-md">
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] text-primary pointer-events-none">
              <span className="material-symbols-outlined text-[200px]">history_edu</span>
            </div>
            
            <h3 className="font-body text-xs font-bold text-on-surface uppercase tracking-widest border-b border-outline-variant/60 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">account_box</span>
              Thông tin cơ bản
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
              <div className="md:col-span-2 space-y-2">
                <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">Họ và tên *</label>
                <input 
                  type="text" 
                  value={form.fullName} 
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-outline-variant/60 focus:border-primary py-3 font-headline text-2xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60" 
                  placeholder="Vd: Nguyễn Văn A..." 
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">Tên đăng nhập *</label>
                <input 
                  type="text" 
                  value={form.username} 
                  onChange={(e) => handleChange('username', e.target.value)}
                  className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 text-sm font-bold text-on-surface outline-none hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:font-normal" 
                  placeholder="nva_scholar" 
                />
              </div>

              <div className="space-y-2">
                <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                  Mật khẩu {isEdit && <span className="opacity-60 lowercase font-normal italic">(bỏ trống)</span>}
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={form.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 pr-12 text-sm font-bold text-on-surface outline-none hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:font-normal" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={form.confirmPassword}
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 pr-12 text-sm font-bold text-on-surface outline-none hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:font-normal" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">Tiểu sử & Giới thiệu</label>
                <textarea 
                  rows="4" 
                  value={form.bio} 
                  onChange={(e) => handleChange('bio', e.target.value)}
                  className="w-full bg-surface-low/50 border border-outline-variant/60 p-4 rounded-xl text-sm italic leading-relaxed outline-none hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
                  placeholder="Mô tả sơ lược về thành viên, chuyên môn, lĩnh vực nghiên cứu..." 
                />
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Settings */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <section className="bg-white p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-5 transition-all hover:shadow-md">
            <h4 className="font-body text-[11px] font-bold uppercase tracking-widest text-primary border-b border-outline-variant/60 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">shield_person</span>
              Vai trò Hệ thống
            </h4>
            <div className="space-y-3">
              {roles.map(role => (
                <label 
                  key={role.id} 
                  className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-300 ${form.role === role.id ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20' : 'bg-surface-low/50 border-outline-variant/60 hover:border-primary/40'}`}
                >
                  <input 
                    type="radio" 
                    name="role" 
                    className="hidden" 
                    checked={form.role === role.id} 
                    onChange={() => handleChange('role', role.id)} 
                  />
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${form.role === role.id ? 'bg-primary text-white shadow-md' : 'bg-white border border-outline-variant text-on-surface-variant shadow-sm'}`}>
                    <span className="material-symbols-outlined text-[20px]">{role.icon}</span>
                  </div>
                  <div>
                    <h5 className={`font-headline font-bold text-[15px] transition-colors ${form.role === role.id ? 'text-primary' : 'text-on-surface'}`}>{role.label}</h5>
                    <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">{role.desc}</p>
                  </div>
                  {form.role === role.id && <span className="material-symbols-outlined text-primary ml-auto self-center animate-in zoom-in fade-in">check_circle</span>}
                </label>
              ))}
            </div>
          </section>

          <section className="bg-white p-6 rounded-3xl border border-outline-variant/60 shadow-sm space-y-5 transition-all hover:shadow-md">
            <h4 className="font-body text-[11px] font-bold uppercase tracking-widest text-primary border-b border-outline-variant/60 pb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">toggle_on</span>
              Trạng thái truy cập
            </h4>
            <div className="flex items-center gap-4 p-5 bg-surface-low/50 rounded-2xl border border-outline-variant/60 transition-all hover:border-primary/40">
               <div className={`w-14 h-7 rounded-full flex items-center p-1 cursor-pointer transition-colors duration-300 ${form.status === 'active' ? 'bg-emerald-500 justify-end shadow-inner' : 'bg-rose-500 justify-start shadow-inner'}`}
                    onClick={() => handleChange('status', form.status === 'active' ? 'locked' : 'active')}
               >
                 <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
               </div>
               <div>
                 <p className={`font-bold text-[15px] ${form.status === 'active' ? 'text-emerald-700' : 'text-rose-700'}`}>{form.status === 'active' ? 'Đang hoạt động' : 'Tạm khóa'}</p>
                 <p className="text-[11px] text-on-surface-variant mt-0.5">{form.status === 'active' ? 'Có quyền đăng nhập bình thường.' : 'Tài khoản bị cấm truy cập.'}</p>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MemberForm;