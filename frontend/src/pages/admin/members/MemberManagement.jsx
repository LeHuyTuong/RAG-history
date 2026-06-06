import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MemberManagement = () => {
  const navigate = useNavigate();
  // State quản lý các loại Modal
  const [activeModal, setActiveModal] = useState({ type: null, data: null });

  const members = [
    { id: 'MB-2041', name: 'Trần Hoài', email: 'hoai.tran@suviet.vn', role: 'Học giả cao cấp', status: 'active', joinDate: '12/10/2022' },
    { id: 'MB-2042', name: 'Lê Minh', email: 'minh.le@suviet.vn', role: 'Độc giả', status: 'locked', joinDate: '05/01/2023' },
    { id: 'MB-2043', name: 'Phạm Lan', email: 'lan.pham@suviet.vn', role: 'Biên tập viên', status: 'active', joinDate: '20/03/2023' },
  ];

  const closeModal = () => setActiveModal({ type: null, data: null });

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-surface font-body">
      {/* 1. TOP BAR */}

      <main className="p-8 max-w-[1600px] mx-auto w-full space-y-10 pb-24">
        {/* 2. HEADER ACTIONS */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="font-headline text-4xl text-primary font-bold italic tracking-tight">Cộng đồng Sử Việt</h2>
            <p className="text-on-surface-variant text-sm mt-1">Giám sát các học giả và độc giả tham gia nghiên cứu sử liệu.</p>
          </div>
          <button 
            onClick={() => navigate('/admin/members/new')}
            className="bg-primary text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all text-xs uppercase font-headline"
          >
            <span className="material-symbols-outlined text-sm align-middle mr-2">person_add</span> Thêm thành viên
          </button>
        </div>

        {/* 3. STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatBox label="Tổng thành viên" value="12,482" sub="+5.2%" icon="group" />
          <StatBox label="Đang hoạt động" value="1,894" sub="Trong 24h" icon="bolt" />
          <StatBox label="Đăng ký mới" value="412" sub="Tháng này" icon="person_add_alt" />
        </div>

        {/* 4. MEMBER TABLE */}
        <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-low border-b border-outline-variant font-body text-[10px] uppercase text-on-surface-variant">
              <tr>
                <th className="p-4">Thành viên / ID</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4">Ngày tham gia</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-surface-low transition-colors group">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-variant flex items-center justify-center font-bold text-primary font-headline shadow-inner">{member.name.charAt(0)}</div>
                      <div>
                        <p className="font-bold text-on-surface leading-none">{member.name}</p>
                        <p className="text-[10px] text-primary italic mt-1">{member.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase ${member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {member.status === 'active' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                  <td className="p-4 font-body text-xs text-on-surface-variant">{member.joinDate}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setActiveModal({ type: 'view', data: member })} className="p-2 hover:bg-primary/5 rounded" title="Xem nhanh"><span className="material-symbols-outlined text-sm">visibility</span></button>
                      <button onClick={() => setActiveModal({ type: 'role', data: member })} className="p-2 hover:bg-primary/5 rounded" title="Phân quyền"><span className="material-symbols-outlined text-sm">manage_accounts</span></button>
                      <button onClick={() => navigate(`/admin/members/edit/${member.id}`)} className="p-2 hover:bg-primary/5 rounded" title="Sửa"><span className="material-symbols-outlined text-sm">edit</span></button>
                      <button onClick={() => setActiveModal({ type: 'lock', data: member })} className="p-2 hover:bg-red-50 text-red-600 rounded" title="Khóa"><span className="material-symbols-outlined text-sm">block</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* --- MODAL SYSTEM --- */}
      {activeModal.type === 'view' && <QuickViewModal data={activeModal.data} onClose={closeModal} />}
      {activeModal.type === 'lock' && <LockConfirmModal data={activeModal.data} onClose={closeModal} />}
      {activeModal.type === 'role' && <RoleManageModal data={activeModal.data} onClose={closeModal} />}
    </div>
  );
};

// --- SUB-COMPONENTS & MODALS ---

const StatBox = ({ label, value, sub, icon }) => (
  <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-sm flex items-center gap-5 hover:-translate-y-1 transition-all">
    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
      <span className="material-symbols-outlined text-2xl">{icon}</span>
    </div>
    <div>
       <p className="font-body text-[9px] uppercase font-bold text-on-surface-variant tracking-widest">{label}</p>
       <h3 className="font-headline text-3xl font-bold text-primary leading-tight">{value}</h3>
       <p className="text-[10px] text-green-700 font-bold">{sub}</p>
    </div>
  </div>
);

// MODAL 1: XEM NHANH HỒ SƠ
const QuickViewModal = ({ data, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
    <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
       <div className="w-full md:w-1/3 bg-primary text-white p-8 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full border-4 border-accent overflow-hidden mb-4 shadow-lg">
             <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuAT7Eun6P5a5j9t0Ha7agNr8GmSebCaslKHDba0sUNVH_N_52BCgWQcOKpY3iGdks_qyGhVU9048F4D1LkVsKeVN8s86BCO5TAJj2l2o0ArnWCoqDZUUXPpxZtesKwdi4JGNu3X0EoPzZlT5dgkxjU2GawsCkoLCy0vjYeOP9QSq4zU8gkPiKcSHBLMoIpgNFgNSgWSv3gTB1Y-zSwP7wGtCvPoQOwj3iJp8fRj35VGrIerPL8IypAGaB5cuukoelC1JFRbLwD1CWY" alt="avatar" />
          </div>
          <h3 className="font-headline text-2xl font-bold">{data.name}</h3>
          <p className="text-[10px] font-body opacity-60 uppercase mt-1 tracking-widest">{data.role}</p>
          <div className="mt-8 space-y-3 text-[11px] w-full text-left opacity-80 border-t border-white/20 pt-6">
             <div className="flex justify-between"><span>Gia nhập:</span><span>{data.joinDate}</span></div>
             <div className="flex justify-between"><span>Cấp bậc:</span><span className="text-accent font-bold">Hàn Lâm Sĩ</span></div>
          </div>
          <button onClick={onClose} className="mt-auto w-full py-2 border border-accent text-accent font-bold text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all">Đóng</button>
       </div>
       <div className="flex-1 p-8 bg-surface-low overflow-y-auto max-h-[500px]">
          <h4 className="font-headline text-lg font-bold text-primary border-b border-outline-variant pb-2 mb-4">Hoạt động gần đây</h4>
          <div className="space-y-4 font-body">
             {[1, 2, 3].map(i => (
               <div key={i} className="bg-white p-4 rounded border border-outline-variant/30 text-xs italic leading-relaxed text-on-surface-variant">
                  "Đã đóng góp hiệu đính cho sử liệu Chiến thắng Ngọc Hồi..."
                  <span className="block mt-2 font-body text-[9px] not-italic opacity-50 uppercase tracking-widest">2 giờ trước</span>
               </div>
             ))}
          </div>
       </div>
    </div>
  </div>
);

// MODAL 2: XÁC NHẬN KHÓA
const LockConfirmModal = ({ data, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
     <div className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-8 text-center animate-in fade-in zoom-in duration-300 border-t-8 border-red-600">
        <span className="material-symbols-outlined text-red-600 text-5xl mb-4">block</span>
        <h3 className="font-headline text-2xl font-bold text-primary mb-2 italic">Khóa tài khoản?</h3>
        <p className="text-sm text-on-surface-variant mb-6 font-body leading-relaxed">Xác nhận đình chỉ quyền truy cập của <br/><strong>"{data.name}"</strong> vào hệ thống Sử Việt?</p>
        <textarea className="w-full bg-surface-low border border-outline-variant p-3 text-xs mb-6 rounded outline-none focus:ring-1 focus:ring-red-600" placeholder="Nhập lý do khóa..." />
        <div className="flex gap-3 font-body text-[11px] font-bold">
           <button onClick={onClose} className="flex-1 py-3 border border-outline rounded-lg hover:bg-surface-low">HỦY BỎ</button>
           <button onClick={() => {alert('Đã khóa'); onClose()}} className="flex-1 py-3 bg-red-600 text-white rounded-lg shadow-md">XÁC NHẬN KHÓA</button>
        </div>
     </div>
  </div>
);

// MODAL 3: QUẢN LÝ QUYỀN HẠN
const RoleManageModal = ({ data, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
     <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 border border-outline-variant">
        <div className="bg-primary text-white p-6 flex justify-between items-center">
           <h3 className="font-headline text-xl font-bold italic tracking-wide">Thiết lập Quyền hạn</h3>
           <button onClick={onClose} className="material-symbols-outlined text-sm opacity-60">close</button>
        </div>
        <div className="p-8 space-y-6">
           <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest opacity-60">Cấp quyền cho: {data.name}</p>
           <div className="grid grid-cols-1 gap-3">
              {['Quản lý bài viết', 'Quản lý sự kiện', 'Quản lý người dùng', 'Xuất bản kho số'].map(perm => (
                <label key={perm} className="flex items-center gap-3 p-4 rounded-lg bg-surface-low border border-transparent hover:border-primary transition-all cursor-pointer">
                   <input type="checkbox" className="w-4 h-4 rounded text-primary focus:ring-primary border-outline" defaultChecked={perm === 'Quản lý bài viết'} />
                   <span className="text-sm font-bold text-on-surface">{perm}</span>
                </label>
              ))}
           </div>
           <button onClick={() => {alert('Đã cập nhật quyền'); onClose()}} className="w-full py-4 bg-primary text-white font-bold text-xs uppercase tracking-[0.2em] shadow-lg rounded-lg">Cập nhật quyền hạn</button>
        </div>
     </div>
  </div>
);

export default MemberManagement;