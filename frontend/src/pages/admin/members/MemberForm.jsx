import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { memberService, extractErrorMessage } from '../../../services';
import toast from 'react-hot-toast';
import { FormHeader } from '../../../components/admin';

const MemberForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  const [form, setForm] = useState({
    fullName: '', username: '', password: '', confirmPassword: '', bio: '', role: 'member', status: 'active'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      const fetchData = async () => {
        try {
          const member = await memberService.getById(id);
          if (member) {
            setForm(prev => ({
              ...prev,
              fullName: member.fullName || member.username || '',
              username: member.username || '',
              password: '',
              confirmPassword: '',
              bio: member.bio || '',
              role: member.role === 'ADMIN' ? 'admin' : member.role === 'SCHOLAR' ? 'scholar' : 'member',
              status: member.status === 'LOCKED' ? 'locked' : 'active'
            }));
          }
        } catch (error) {
          console.error('Error fetching member:', error);
        }
      };
      fetchData();
    }
  }, [id, isEdit]);

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    const newErrors = {};
    if (!form.username?.trim()) newErrors.username = 'Vui lòng nhập tên đăng nhập.';
    if (!form.fullName?.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên.';

    if (!isEdit && !form.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu cho tài khoản mới.';
    }
    if (form.password) {
      if (form.password.length < 6) newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Mật khẩu và Xác nhận mật khẩu không khớp.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      toast.error('Vui lòng kiểm tra lại thông tin nhập bị lỗi.');
      return;
    }
    setFormErrors({});

    try {
      const payload = {
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        status: form.status === 'locked' ? 'LOCKED' : 'ACTIVE',
      };
      if (form.password) {
        payload.password = form.password;
      }

      if (isEdit) {
        await memberService.update(id, payload);
      } else {
        await memberService.create(payload);
      }

      toast.success("Đã lưu hồ sơ thành viên!");
      navigate('/admin/members');
    } catch (error) {
      console.error('Lỗi khi lưu hồ sơ thành viên:', error);
      const errMsg = extractErrorMessage(error, 'Có lỗi xảy ra khi lưu hồ sơ thành viên!');
      toast.error(errMsg);
    }
  };

  const roles = [
    { id: 'member', label: 'Thành viên', icon: 'person', desc: 'Độc giả thông thường, tham gia thảo luận cơ bản.' }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 font-body">

      {/* Header */}
      <FormHeader
        loading={loading}
        title={isEdit ? 'Chỉnh sửa Hồ sơ' : 'Thiết lập Tài khoản Mới'}
        subtitle={isEdit ? 'Cập nhật thông tin thành viên trong hệ thống.' : 'Thiết lập tài khoản thành viên mới cho Cộng đồng Sử Việt.'}
        icon="badge"
        isEdit={isEdit}
        onCancel={() => navigate('/admin/members')}
        onSave={handleSave}
        status={form.status === 'Active' ? 'published' : 'hidden'}
        contentType="member"
      />

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
                  onChange={(e) => { handleChange('fullName', e.target.value); if(formErrors.fullName) setFormErrors(prev => ({ ...prev, fullName: null })); }}
                  className={`w-full bg-transparent border-0 border-b py-3 font-headline text-2xl text-on-surface font-bold outline-none transition-all placeholder:text-outline-variant/60 ${formErrors.fullName ? 'border-red-500 focus:border-red-600' : 'border-outline-variant/60 focus:border-primary'}`}
                  placeholder="Vd: Nguyễn Văn A..."
                />
                {formErrors.fullName && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {formErrors.fullName}</p>}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">Tên đăng nhập *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => { handleChange('username', e.target.value); if(formErrors.username) setFormErrors(prev => ({ ...prev, username: null })); }}
                  className={`w-full bg-surface-low/50 border rounded-xl p-3 text-sm font-bold text-on-surface outline-none focus:ring-2 transition-all placeholder:font-normal ${formErrors.username ? 'border-red-500 hover:border-red-600 focus:border-red-500 focus:ring-red-500/20' : 'border-outline-variant/60 hover:border-primary focus:border-primary focus:ring-primary/20'}`}
                  placeholder="nva_scholar"
                />
                {formErrors.username && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {formErrors.username}</p>}
              </div>

              <div className="space-y-2">
                <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                  Mật khẩu {isEdit && <span className="opacity-60 lowercase font-normal italic">(bỏ trống)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => { handleChange('password', e.target.value); if(formErrors.password) setFormErrors(prev => ({ ...prev, password: null })); }}
                    placeholder="••••••••"
                    className={`w-full bg-surface-low/50 border rounded-xl p-3 pr-12 text-sm font-bold text-on-surface outline-none focus:ring-2 transition-all placeholder:font-normal ${formErrors.password ? 'border-red-500 hover:border-red-600 focus:border-red-500 focus:ring-red-500/20' : 'border-outline-variant/60 hover:border-primary focus:border-primary focus:ring-primary/20'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {formErrors.password && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {formErrors.password}</p>}
              </div>

              <div className="space-y-2">
                <label className="font-body text-[11px] font-bold uppercase tracking-widest text-on-surface-variant block">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={form.confirmPassword}
                    onChange={(e) => { handleChange('confirmPassword', e.target.value); if(formErrors.confirmPassword) setFormErrors(prev => ({ ...prev, confirmPassword: null })); }}
                    placeholder="••••••••"
                    className={`w-full bg-surface-low/50 border rounded-xl p-3 pr-12 text-sm font-bold text-on-surface outline-none focus:ring-2 transition-all placeholder:font-normal ${formErrors.confirmPassword ? 'border-red-500 hover:border-red-600 focus:border-red-500 focus:ring-red-500/20' : 'border-outline-variant/60 hover:border-primary focus:border-primary focus:ring-primary/20'}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors focus:outline-none"
                  >
                    <span className="material-symbols-outlined text-[20px]">{showConfirmPassword ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                {formErrors.confirmPassword && <p className="text-red-500 text-[11px] font-bold mt-1 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">error</span> {formErrors.confirmPassword}</p>}
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
