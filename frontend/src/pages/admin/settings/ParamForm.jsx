import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FormHeader } from '../../../components/admin';
import { settingsService } from '../../../services';
import toast from 'react-hot-toast';

const ParamForm = () => {
  const { key } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!key;

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    key: '',
    value: '',
    desc: '',
    status: 'published'
  });

  useEffect(() => {
    if (isEdit) {
      if (location.state?.editData) {
        setForm(location.state.editData);
      } else {
        // Fallback if accessed directly
        const fetchParam = async () => {
          setLoading(true);
          try {
            const settingsList = await settingsService.list();
            const found = settingsList.find(p => p.key === key);
            if (found) {
              setForm({
                key: found.key || '',
                value: found.value || '',
                desc: found.description || found.desc || '',
                status: found.status || 'published'
              });
            } else {
              toast.error('Không tìm thấy tham số!');
              navigate('/admin/settings');
            }
          } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Có lỗi xảy ra khi tải dữ liệu!');
          } finally {
            setLoading(false);
          }
        };
        fetchParam();
      }
    }
  }, [key, isEdit, location.state, navigate]);

  const handleSave = async () => {
    if (!form.key.trim() || !form.value.trim()) {
      toast.error('Vui lòng nhập Key và Value.');
      return;
    }

    const keyRegex = /^[a-z0-9]+(_[a-z0-9]+)*$/;
    if (!keyRegex.test(form.key.trim())) {
      toast.error('Key phải ở định dạng snake_case (chỉ chứa chữ thường, số và dấu gạch dưới).');
      return;
    }

    setLoading(true);
    try {
      await settingsService.upsert({
        key: form.key.trim(),
        value: form.value.trim(),
        description: form.desc.trim(),
        status: form.status,
      });

      toast.success(isEdit ? 'Cập nhật tham số thành công!' : 'Tạo tham số thành công!');
      navigate('/admin/settings');
    } catch (e) {
      console.error('Lỗi khi lưu tham số lên backend:', e);
      toast.error('Có lỗi xảy ra khi lưu tham số hệ thống!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow bg-surface min-h-screen animate-in fade-in duration-500 pb-20">
      <main className="p-8 max-w-7xl mx-auto space-y-8 font-body">

        <FormHeader 
          loading={loading}
          title={isEdit ? 'Cập nhật Tham số' : 'Khởi tạo Tham số Mới'}
          subtitle="Thiết lập cấu hình vận hành lõi cho hệ thống."
          icon="settings_applications"
          isEdit={isEdit}
          onCancel={() => navigate('/admin/settings')}
          onSave={handleSave}
          status={form.status}
          contentType="setting"
        />
        <div className="grid grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: NỘI DUNG */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-outline-variant/60 shadow-sm space-y-6">
              <div className="space-y-2">
                <label className="font-body text-[11px] font-bold uppercase opacity-70 flex items-center gap-2 text-primary tracking-widest">
                  <span className="material-symbols-outlined text-[16px]">key</span> Khóa tham số (Key)
                </label>
                <input
                value={form.key}
                onChange={e => setForm({ ...form, key: e.target.value })}
                disabled={isEdit}
                className={`w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 text-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${isEdit ? 'opacity-60 cursor-not-allowed bg-surface-variant/20' : 'hover:border-primary'}`}
                placeholder="Vd: rag_max_results"
              />
            </div>
            <div className="space-y-2">
              <label className="font-body text-[11px] font-bold uppercase opacity-70 flex items-center gap-2 text-primary tracking-widest">
                <span className="material-symbols-outlined text-[16px]">edit_note</span> Giá trị (Value)
              </label>
              <input
                type="text"
                value={form.value}
                onChange={e => setForm({ ...form, value: e.target.value })}
                className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 text-sm font-bold text-on-surface outline-none hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Nhập giá trị..."
              />
            </div>
            <div className="space-y-2">
              <label className="font-body text-[11px] font-bold uppercase opacity-70 flex items-center gap-2 text-primary tracking-widest">
                <span className="material-symbols-outlined text-[16px]">description</span> Mô tả ghi chú
              </label>
              <textarea
                rows="3"
                value={form.desc}
                onChange={e => setForm({ ...form, desc: e.target.value })}
                className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-4 text-sm italic leading-relaxed outline-none hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Giải thích ý nghĩa tham số..."
              />
            </div>
            </div>
          </div>

          {/* CỘT PHẢI: CẤU HÌNH */}
          <aside className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-6 border border-outline-variant shadow-sm rounded-3xl sticky top-8 flex flex-col space-y-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6b0f0d]/10 rounded-full blur-3xl pointer-events-none"></div>

              <h4 className="font-body text-[10px] font-bold uppercase tracking-widest text-[#6b0f0d] border-b border-outline-variant/60 pb-3 flex items-center justify-center gap-2 text-center relative z-10">
                <span className="material-symbols-outlined text-[16px]">tune</span>
                CẤU HÌNH THAM SỐ
              </h4>

              {/* 1. TRẠNG THÁI XUẤT BẢN */}
              <div className="space-y-4 relative z-10 text-left">
                <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest flex items-center gap-2 border-b border-outline-variant/30 pb-1">
                  <span className="material-symbols-outlined text-[14px]">publish</span> TRẠNG THÁI XUẤT BẢN
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Trạng thái</label>
                    <div className="relative">
                      <select
                        value={form.status}
                        onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                        className="w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-2.5 text-sm font-bold text-on-surface outline-none cursor-pointer hover:border-[#6b0f0d] focus:border-[#6b0f0d] focus:ring-2 focus:ring-[#6b0f0d]/20 transition-all appearance-none"
                      >
                        <option value="draft">Bản nháp</option>
                        <option value="published">Công khai</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default ParamForm;
