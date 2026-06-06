import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const EventManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, itemName: '', id: null });

  const events = [
    { id: 'EVT-1010', name: 'Định đô Thăng Long', sub: 'Chiếu dời đô của Lý Công Uẩn', time: 'Năm 1010', dynasty: 'Nhà Lý' },
    { id: 'EVT-1285', name: 'Trận Hàm Tử', sub: 'Chiến thắng quân Nguyên lần thứ hai', time: 'Năm 1285', dynasty: 'Nhà Trần' },
    { id: 'EVT-1418', name: 'Khởi nghĩa Lam Sơn', sub: 'Lê Lợi xưng Bình Định Vương', time: '1418 - 1427', dynasty: 'Nhà Lê' },
    { id: 'EVT-1789', name: 'Chiến thắng Ngọc Hồi - Đống Đa', sub: 'Quang Trung đại phá quân Thanh', time: 'Năm 1789', dynasty: 'Nhà Tây Sơn' },
  ];

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-surface">

      <main className="p-8 max-w-[1600px] mx-auto w-full space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="font-headline text-3xl text-primary font-bold">Quản lý Sự kiện Lịch sử</h2>
            <p className="font-body text-sm text-on-surface-variant mt-1 italic">Lưu trữ và hiệu đính các cột mốc quan trọng trong tiến trình lịch sử dân tộc.</p>
          </div>
          <button onClick={() => navigate('/admin/events/new')} className="bg-primary text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:opacity-90 active:scale-95 shadow-md font-headline font-bold uppercase text-sm">
            <span className="material-symbols-outlined">add</span> Thêm sự kiện mới
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface-container border border-outline-variant p-6 rounded-xl">
             <p className="font-body text-[10px] text-on-surface-variant uppercase tracking-widest">Tổng sự kiện</p>
             <h3 className="font-headline text-3xl text-primary font-bold mt-1">4,200</h3>
          </div>
          <div className="bg-surface-variant/30 border border-outline-variant p-6 rounded-xl text-on-primary-container">
             <p className="font-body text-[10px] uppercase tracking-widest">Chờ duyệt</p>
             <h3 className="font-headline text-3xl font-bold mt-1 text-primary">350</h3>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface-low p-4 rounded-t-lg border border-outline-variant flex items-center gap-4">
           <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-outline-variant rounded-md font-body text-sm text-on-surface-variant">
              <span>Triều đại:</span>
              <select className="bg-transparent border-none focus:ring-0 py-0 cursor-pointer">
                <option>Tất cả</option>
                <option>Nhà Lý</option>
                <option>Nhà Trần</option>
                <option>Nhà Lê</option>
              </select>
           </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border-x border-b border-outline-variant rounded-b-lg overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse font-body">
            <thead className="bg-surface-variant/50 font-body text-[10px] uppercase tracking-widest text-on-surface border-b border-outline-variant">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Tên sự kiện</th>
                <th className="px-6 py-4">Thời gian</th>
                <th className="px-6 py-4">Triều đại</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-surface-low transition-colors group">
                  <td className="px-6 py-4 font-body text-xs text-on-surface-variant">{event.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-headline text-primary font-bold text-base group-hover:underline cursor-pointer">{event.name}</div>
                    <div className="text-[11px] text-on-surface-variant italic">{event.sub}</div>
                  </td>
                  <td className="px-6 py-4 font-medium">{event.time}</td>
                  <td className="px-6 py-4">
                    <span className="bg-primary/5 text-primary border border-primary/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-tighter">
                      {event.dynasty}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => navigate(`/admin/events/edit/${event.id}`)} className="p-2 hover:text-primary"><span className="material-symbols-outlined text-sm">edit</span></button>
                      <button onClick={() => setDeleteModal({ open: true, itemName: event.name, id: event.id })} className="p-2 hover:text-red-600"><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal({ ...deleteModal, open: false })}></div>
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl border-t-4 border-red-600 p-8 text-center animate-in fade-in zoom-in duration-300">
            <span className="material-symbols-outlined text-red-600 text-5xl mb-4">delete_forever</span>
            <h3 className="font-headline text-2xl text-on-surface font-bold mb-2">Xác nhận xóa sự kiện?</h3>
            <p className="font-body text-sm text-on-surface-variant mb-8">Bạn có chắc chắn muốn xóa bản ghi <br/><strong className="text-primary italic">"{deleteModal.itemName}"</strong>?</p>
            <div className="flex gap-3 font-body text-[11px] font-bold">
              <button onClick={() => setDeleteModal({ ...deleteModal, open: false })} className="flex-1 py-3 border border-outline rounded-lg hover:bg-surface-low transition-all">HỦY BỎ</button>
              <button onClick={() => { alert('Đã xóa'); setDeleteModal({ ...deleteModal, open: false }) }} className="flex-1 py-3 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition-all">XÓA NGAY</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventManagement;