import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const RecordManagement = () => {
  const navigate = useNavigate();
  const [deleteModal, setDeleteModal] = useState({ open: false, itemName: '', id: null });

  // Dữ liệu mẫu (Data)
  const records = [
    { id: 'SL-001', name: 'Đại Việt Sử Ký Toàn Thư', type: 'Bộ chính sử', dynasty: 'Hậu Lê', author: 'Ngô Sĩ Liên', icon: 'menu_book' },
    { id: 'SL-002', name: 'Khâm Định Việt Sử Thông Giám Cương Mục', type: 'Bộ chính sử', dynasty: 'Nhà Nguyễn', author: 'Quốc sử quán', icon: 'auto_stories' },
    { id: 'SL-045', name: 'Chiếu Dời Đô (Thuận Thiên)', type: 'Văn bản cổ', dynasty: 'Nhà Lý', author: 'Lý Công Uẩn', icon: 'description' },
    { id: 'SL-112', name: 'Bản đồ Hoàng triều trực tỉnh', type: 'Tài liệu số', dynasty: 'Nhà Nguyễn', author: 'N/A', icon: 'folder_zip' },
  ];

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-surface">

      <main className="p-8 max-w-[1600px] mx-auto w-full space-y-8 font-body">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-outline-variant/30 pb-6">
          <div>
            <h2 className="font-headline text-3xl text-primary font-bold tracking-tight">
              Quản lý Sử liệu
            </h2>

            <p className="text-on-surface-variant text-sm italic mt-1">
              Quản lý các bộ chính sử, văn bản cổ và tài liệu nghiên cứu gốc của dân tộc.
            </p>
          </div>

          <button
            onClick={() => navigate('/admin/records/new')}
            className="px-6 py-2 bg-primary text-white shadow-lg hover:bg-primary-container flex items-center gap-2 transition-all font-body text-[10px] font-bold tracking-widest"
          >
            <span className="material-symbols-outlined text-sm">
              add
            </span>
            THÊM SỬ LIỆU
          </button>
        </div>

        {/* 3. BENTO STATS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-variant/20 border border-outline-variant p-6 rounded-xl group transition-all hover:bg-surface-low">
            <p className="text-on-surface-variant font-body text-[10px] uppercase tracking-widest mb-1">Tổng số sử liệu</p>
            <h3 className="text-4xl font-headline text-primary font-bold">1,248</h3>
            <p className="text-[10px] text-green-700 mt-2 flex items-center gap-1 font-bold"><span className="material-symbols-outlined text-xs">trending_up</span> +12 trong tháng này</p>
          </div>
          <div className="bg-surface-variant/20 border border-outline-variant p-6 rounded-xl">
            <p className="text-on-surface-variant font-body text-[10px] uppercase tracking-widest mb-1">Đang chờ duyệt</p>
            <h3 className="text-4xl font-headline text-on-surface font-bold">266</h3>
            <p className="text-[10px] text-on-surface-variant mt-2 font-body uppercase">Cần xử lý trong 48h tới</p>
          </div>
        </div>

        {/* 4. DATA TABLE */}
        <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-surface-low border-b border-outline-variant font-body text-[10px] uppercase tracking-widest text-on-surface-variant">
              <tr>
                <th className="p-4">ID</th>
                <th className="p-4">Tên Sử Liệu</th>
                <th className="p-4">Loại hình</th>
                <th className="p-4">Triều đại</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant text-sm">
              {records.map((item, idx) => (
                <tr key={item.id} className={`${idx % 2 !== 0 ? 'bg-surface-low/30' : ''} hover:bg-surface-variant/20 transition-all group`}>
                  <td className="p-4 font-body text-xs text-primary">{item.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface-low border border-outline-variant flex items-center justify-center text-primary rounded group-hover:bg-primary group-hover:text-white transition-all">
                        <span className="material-symbols-outlined">{item.icon}</span>
                      </div>
                      <div>
                        <p className="font-headline font-bold text-base text-on-surface group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="text-[10px] text-on-surface-variant italic">Chủ biên: {item.author}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-primary/5 text-primary border border-primary/20 rounded-full text-[10px] font-bold uppercase">{item.type}</span>
                  </td>
                  <td className="p-4 font-medium">{item.dynasty}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => navigate(`/admin/records/edit/${item.id}`)} className="p-2 hover:text-primary"><span className="material-symbols-outlined text-sm">edit</span></button>
                      <button onClick={() => setDeleteModal({ open: true, itemName: item.name, id: item.id })} className="p-2 hover:text-red-600"><span className="material-symbols-outlined text-sm">delete</span></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* DELETE MODAL */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteModal({ ...deleteModal, open: false })}></div>
          <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl border border-outline-variant overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="h-1.5 w-full bg-primary"></div>
            <div className="p-10 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-red-600 text-4xl">warning</span>
              </div>
              <h3 className="font-headline text-2xl text-primary font-bold mb-2">Xác nhận xóa?</h3>
              <p className="font-body text-sm text-on-surface-variant mb-10 leading-relaxed">Bạn có chắc chắn muốn xóa bản ghi <br /><strong className="text-on-surface italic">"{deleteModal.itemName}"</strong>? <br />Hệ thống RAG sẽ bị ảnh hưởng bởi việc này.</p>
              <div className="flex gap-4 font-body text-[11px] font-bold uppercase tracking-widest">
                <button onClick={() => setDeleteModal({ ...deleteModal, open: false })} className="flex-1 py-3 border border-outline rounded-lg hover:bg-surface-low transition-all">Hủy bỏ</button>
                <button className="flex-1 py-3 bg-primary text-white rounded-lg shadow-md hover:bg-primary-container transition-all">Xóa ngay</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordManagement;