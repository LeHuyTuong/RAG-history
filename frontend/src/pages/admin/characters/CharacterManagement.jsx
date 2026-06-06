import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CharacterManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, name: '', id: null });

  const characters = [
    { id: 'PER-1001', name: 'Trần Hưng Đạo', title: 'Hưng Đạo Đại Vương', years: '1228 - 1300', dynasty: 'Nhà Trần' },
    { id: 'PER-1285', name: 'Lý Thường Kiệt', title: 'Phụ Quốc Thái Phó', years: '1019 - 1105', dynasty: 'Nhà Lý' },
    { id: 'PER-1418', name: 'Lê Lợi', title: 'Bình Định Vương', years: '1385 - 1433', dynasty: 'Nhà Lê' },
    { id: 'PER-1789', name: 'Nguyễn Huệ', title: 'Quang Trung Hoàng Đế', years: '1753 - 1792', dynasty: 'Nhà Tây Sơn' },
  ];

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full space-y-10 animate-in fade-in duration-500">
      
      {/* PAGE TITLE & SUBTITLE */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-outline-variant/30 pb-8">
        <div>
          <h2 className="font-headline text-4xl text-primary font-bold">Quản lý Nhân vật Lịch sử</h2>
          <p className="font-body text-sm text-on-surface-variant italic mt-2">Quản lý hồ sơ, tiểu sử và các mối liên kết thực thể trong hệ thống Sử Việt.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/characters/new')}
          className="bg-primary text-white px-8 py-3 rounded-lg font-headline font-bold uppercase text-xs tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">person_add</span> THÊM NHÂN VẬT MỚI
        </button>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatCard label="TỔNG NHÂN VẬT" value="3,100" icon="group" />
        <StatCard label="CHỜ DUYỆT HỒ SƠ" value="250" icon="pending_actions" colorClass="text-red-700" />
      </div>

      {/* MEMBER TABLE */}
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-variant/30 border-b border-outline-variant font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <tr>
              <th className="p-4">ID</th>
              <th className="p-4">HỌ VÀ TÊN</th>
              <th className="p-4">BIỆT HIỆU</th>
              <th className="p-4 text-center">NIÊN ĐẠI</th>
              <th className="p-4 text-right">THAO TÁC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm">
            {characters.map((char, idx) => (
              <tr key={char.id} className={`${idx % 2 !== 0 ? 'bg-surface-low/30' : ''} hover:bg-surface-variant/20 transition-all group`}>
                <td className="p-4 font-body text-[11px] text-on-surface-variant">#{char.id}</td>
                <td className="p-4 font-headline text-primary font-bold text-lg tracking-tight">{char.name}</td>
                <td className="p-4 text-on-surface-variant font-body italic">{char.title}</td>
                <td className="p-4 font-body text-center text-xs font-bold uppercase">{char.years}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => navigate(`/admin/characters/edit/${char.id}`)} className="p-2 hover:text-primary transition-colors"><span className="material-symbols-outlined text-sm">edit</span></button>
                    <button onClick={() => setDeleteModal({ open: true, name: char.name })} className="p-2 hover:text-red-600 transition-colors"><span className="material-symbols-outlined text-sm">delete</span></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* DELETE MODAL (typography synced) */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border-t-4 border-red-600 p-10 text-center animate-in fade-in zoom-in duration-300">
            <span className="material-symbols-outlined text-red-600 text-5xl mb-4">delete_forever</span>
            <h3 className="font-headline text-2xl text-primary font-bold mb-2">Xác nhận xóa nhân vật?</h3>
            <p className="font-body text-sm text-on-surface-variant mb-10">Bạn chắc chắn muốn xóa hồ sơ <br/><strong className="text-on-surface italic">"{deleteModal.name}"</strong>?</p>
            <div className="flex gap-4 font-body text-[11px] font-bold tracking-widest">
              <button onClick={() => setDeleteModal({ open: false })} className="flex-1 py-3 border border-outline rounded-lg hover:bg-surface-low transition-all">HỦY BỎ</button>
              <button className="flex-1 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-all">XÓA NGAY</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Component con hỗ trợ
const StatCard = ({ label, value, icon, colorClass = "text-primary" }) => (
  <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-sm flex items-center justify-between hover:-translate-y-1 transition-all">
    <div>
      <p className="font-body text-[10px] uppercase font-bold text-on-surface-variant tracking-widest">{label}</p>
      <h3 className={`font-headline text-3xl font-bold mt-1 ${colorClass}`}>{value}</h3>
    </div>
    <span className="material-symbols-outlined text-primary opacity-10 text-4xl">{icon}</span>
  </div>
);

export default CharacterManagement;