import { useState, useEffect } from 'react';

// --- COMPONENT CON 2: MODAL THÊM / SỬA THAM SỐ ---
const ParamModal = ({ onClose, editData = null }) => {
  const [form, setForm] = useState(
    editData || { key: '', value: '', desc: '' }
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">

        {/* Modal Header */}
        <div className="bg-gradient-to-br from-primary to-indigo-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-1/2 -translate-y-1/2 right-0 p-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[120px] mix-blend-overlay">settings_applications</span>
          </div>
          <h3 className="font-headline text-3xl font-bold italic relative z-10 tracking-tight">
            {editData ? 'Cập nhật Tham số' : 'Khởi tạo Tham số Mới'}
          </h3>
          <p className="font-body text-xs mt-2 opacity-90 relative z-10 font-medium">
            Thiết lập cấu hình vận hành lõi cho hệ thống.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-6 font-body">
          <div className="space-y-2">
            <label className="font-body text-[11px] font-bold uppercase opacity-70 flex items-center gap-2 text-primary tracking-widest">
              <span className="material-symbols-outlined text-[16px]">key</span> Khóa tham số (Key)
            </label>
            <input
              type="text"
              value={form.key}
              onChange={e => setForm({ ...form, key: e.target.value })}
              disabled={!!editData}
              className={`w-full bg-surface-low/50 border border-outline-variant/60 rounded-xl p-3 text-sm font-bold text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all ${editData ? 'opacity-60 cursor-not-allowed bg-surface-variant/20' : 'hover:border-primary'}`}
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

          <div className="flex gap-4 pt-6 mt-4 border-t border-outline-variant/40">
            <button
              onClick={onClose}
              className="flex-1 py-3 border-2 border-primary/20 text-primary font-bold rounded-xl hover:bg-primary/5 hover:border-primary/40 uppercase tracking-widest transition-all text-xs"
            >
              Hủy bỏ
            </button>
            <button
              onClick={() => { alert('Đã lưu!'); onClose() }}
              className="flex-1 py-3 bg-gradient-to-r from-primary to-indigo-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 uppercase tracking-widest transition-all text-xs flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">save</span>
              Lưu tham số
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const paramLabels = {
  'site_name': 'Tên hệ thống',
  'rag_threshold': 'Ngưỡng tương đồng RAG',
  'max_upload_size': 'Kích thước tải lên tối đa',
  'embedding_model': 'Mô hình Embedding AI'
};

// --- COMPONENT CHÍNH ---
const SystemSettings = () => {
  const [modalState, setModalState] = useState({ open: false, editData: null });
  const [data, setData] = useState({ stats: [], parameters: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin_settings.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching settings data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-surface pb-20 font-body animate-in fade-in duration-500">
      <main className="p-8 max-w-6xl mx-auto w-full space-y-10">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-end border-b border-outline-variant/40 pb-6 gap-4">
          <div>
            <h2 className="font-headline text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              Cài đặt Hệ thống
            </h2>
            <p className="font-body text-sm text-on-surface-variant mt-3 italic flex items-center gap-2 max-w-2xl">
              <span className="material-symbols-outlined text-[16px] text-primary">settings_applications</span>
              Quản lý tham số vận hành lõi. Đảm bảo tính nhất quán của cơ sở dữ liệu và hiệu năng tìm kiếm sử liệu.
            </p>
          </div>
        </div>



        {/* PARAMETERS TABLE */}
        <section className="bg-white rounded-3xl border border-outline-variant/60 shadow-sm overflow-hidden transition-all hover:shadow-md">
          <div className="p-6 border-b border-outline-variant/60 flex justify-between items-center bg-surface-low/30">
            <h3 className="font-headline text-xl text-primary font-bold italic flex items-center gap-2">
              <span className="material-symbols-outlined">tune</span>
              Bảng tham số cấu hình
            </h3>
            <button
              onClick={() => setModalState({ open: true, editData: null })}
              className="px-5 py-2.5 rounded-xl bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-primary hover:text-white transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Thêm tham số
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-body">
              <thead className="bg-surface-low/50 text-[10px] uppercase text-on-surface-variant border-b border-outline-variant/60 tracking-widest font-bold">
                <tr>
                  <th className="p-5 w-1/4">Tham số (Key)</th>
                  <th className="p-5 w-1/4">Giá trị (Value)</th>
                  <th className="p-5">Mô tả</th>
                  <th className="p-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center py-12">
                      <div className="flex flex-col items-center justify-center text-primary/50 space-y-2">
                        <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
                        <p className="font-bold text-xs uppercase tracking-widest">Đang tải tham số...</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.parameters.map((p) => (
                    <tr key={p.key} className="hover:bg-primary/5 transition-colors group">
                      <td className="p-5">
                        <p className="font-bold text-primary text-sm flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] opacity-70">label_important</span>
                          {paramLabels[p.key] || p.key}
                        </p>
                        <p className="text-[10px] text-on-surface-variant font-mono mt-1 ml-6 bg-surface-variant/20 inline-block px-2 py-0.5 rounded-md">{p.key}</p>
                      </td>
                      <td className="p-5 font-medium text-on-surface">
                        <span className="bg-surface-low border border-outline-variant/50 px-3 py-1.5 rounded-lg shadow-sm font-bold">
                          {p.value}
                        </span>
                      </td>
                      <td className="p-5 text-on-surface-variant italic text-[12px] leading-relaxed max-w-xs truncate">
                        {p.desc}
                      </td>
                      <td className="p-5 text-right">
                        <button
                          onClick={() => setModalState({ open: true, editData: p })}
                          className="w-10 h-10 rounded-full bg-surface-variant/20 text-on-surface-variant flex items-center justify-center hover:bg-primary hover:text-white hover:shadow-md transition-all inline-flex"
                          title="Chỉnh sửa tham số"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* --- MODAL SYSTEM --- */}
      {modalState.open && <ParamModal editData={modalState.editData} onClose={() => setModalState({ open: false, editData: null })} />}
    </div>
  );
};

export default SystemSettings;