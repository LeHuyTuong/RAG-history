import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ArticleManagement = () => {
  const navigate = useNavigate();
  const [modal, setModal] = useState({ open: false, type: '', item: null });

  // Dữ liệu mẫu (Data)
  const articles = [
    { id: 1, title: 'Bình Ngô Đại Cáo - Tuyên ngôn độc lập', slug: 'binh-ngo-dai-cao', period: 'Nhà Hậu Lê (1428)', author: 'Ngô Sĩ Liên', status: 'published' },
    { id: 2, title: 'Chiến thắng Chương Dương - Hàm Tử', slug: 'chuong-duong-ham-tu', period: 'Nhà Trần (1285)', author: 'Lê Văn Hưu', status: 'review' },
    { id: 3, title: 'Sự biến Canh Tý - Lý Chiêu Hoàng', slug: 'su-bien-canh-ty', period: 'Chuyển giao Lý-Trần', author: 'Lê Văn Hưu', status: 'draft' }
  ];

  const openModal = (type, item) => setModal({ open: true, type, item });
  const closeModal = () => setModal({ open: false, type: '', item: null });

  return (
    <div className="p-8 max-w-[1600px] mx-auto w-full space-y-8 font-body animate-in fade-in duration-500">
      
      {/* 1. HEADER CỦA BODY: TIÊU ĐỀ VÀ NÚT THÊM MỚI */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b border-outline-variant/30 pb-8">
        <div>
          <h2 className="font-headline text-4xl text-primary font-bold italic tracking-tight">Quản lý Bài viết Lịch sử</h2>
          <p className="text-on-surface-variant text-sm mt-2 italic">Lưu trữ và hiệu đính các bản ghi chép về các triều đại, sự kiện và nhân vật quan trọng.</p>
        </div>
        <button 
          onClick={() => navigate('/admin/articles/new')}
          className="bg-primary text-white px-8 py-3 rounded-lg font-headline font-bold uppercase text-xs tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add_circle</span> THÊM BÀI VIẾT MỚI
        </button>
      </div>

      {/* 2. THỐNG KÊ (STAT BOXES) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatBox label="Tổng bài viết" value="1,284" sub="+12% tháng này" icon="description" />
        <StatBox label="Đang soạn thảo" value="42" icon="hourglass_empty" colorClass="text-accent" />
        <StatBox label="Nhân vật liên kết" value="318" icon="person" colorClass="text-on-surface" />
      </div>

      {/* 3. BẢNG DANH SÁCH */}
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-variant/50 border-b border-outline-variant font-body text-[10px] uppercase tracking-widest text-on-surface-variant">
            <tr>
              <th className="p-4">Sử liệu / Mã số</th>
              <th className="p-4">Thời kỳ</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant text-sm">
            {articles.map((item, idx) => (
              <tr key={item.id} className={`${idx % 2 !== 0 ? 'bg-surface-low/30' : ''} hover:bg-surface-variant/20 transition-all group`}>
                <td className="p-4">
                  <div className="flex flex-col">
                    <span className="font-headline text-primary font-semibold text-lg hover:underline cursor-pointer">{item.title}</span>
                    <code className="font-body text-[10px] text-on-surface-variant mt-1 italic opacity-60">slug: {item.slug}</code>
                  </div>
                </td>
                <td className="p-4 text-on-surface-variant font-body">
                  {item.period}
                  <p className="text-[10px] opacity-50 font-body mt-0.5 uppercase tracking-tighter">Tác giả: {item.author}</p>
                </td>
                <td className="p-4 text-center">
                  <StatusBadge status={item.status} />
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => navigate(`/admin/articles/edit/${item.id}`)} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors" title="Chỉnh sửa">
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onClick={() => openModal('archive', item)} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors" title="Lưu trữ">
                      <span className="material-symbols-outlined text-lg">archive</span>
                    </button>
                    <button onClick={() => openModal('delete', item)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Xóa bỏ">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 4. HỆ THỐNG MODAL */}
      <ActionModal 
        isOpen={modal.open} 
        type={modal.type} 
        item={modal.item} 
        onClose={closeModal} 
        onConfirm={() => { alert('Thao tác thành công!'); closeModal(); }}
      />
    </div>
  );
};

// --- CÁC COMPONENT BỔ TRỢ ---

const StatBox = ({ label, value, sub, icon, colorClass = "text-primary" }) => (
  <div className="bg-white border border-outline-variant p-6 rounded-xl shadow-sm flex items-center justify-between hover:-translate-y-1 transition-all">
    <div>
      <p className="font-body text-[9px] uppercase font-bold text-on-surface-variant tracking-widest">{label}</p>
      <h3 className={`font-headline text-3xl font-bold mt-1 ${colorClass}`}>{value}</h3>
      {sub && <p className="text-[10px] text-green-700 font-bold">{sub}</p>}
    </div>
    <span className="material-symbols-outlined text-primary opacity-10 text-4xl">{icon}</span>
  </div>
);

const StatusBadge = ({ status }) => {
  const configs = {
    published: { l: 'Công khai', s: 'bg-green-100 text-green-800' },
    review: { l: 'Xem xét', s: 'bg-amber-100 text-amber-800' },
    draft: { l: 'Bản nháp', s: 'bg-gray-100 text-gray-700' }
  };
  const c = configs[status] || configs.draft;
  return <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] uppercase ${c.s}`}>{c.l}</span>;
};

const ActionModal = ({ isOpen, type, item, onClose, onConfirm }) => {
  if (!isOpen) return null;
  const isDelete = type === 'delete';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden border-t-4 border-primary animate-in fade-in zoom-in duration-300">
        <div className="p-10 text-center">
          <span className={`material-symbols-outlined text-5xl mb-4 ${isDelete ? 'text-red-600' : 'text-primary'}`}>
            {isDelete ? 'delete_forever' : 'archive'}
          </span>
          <h3 className="font-headline text-2xl text-on-surface font-bold mb-2 italic">
            {isDelete ? 'Xác nhận xóa vĩnh viễn?' : 'Xác nhận đưa vào lưu trữ?'}
          </h3>
          <p className="font-body text-sm text-on-surface-variant mb-10 leading-relaxed">
            Bạn có chắc chắn muốn {isDelete ? 'xóa' : 'lưu trữ'} bài viết <br/>
            <strong className="text-primary italic">"{item?.title}"</strong>?
          </p>
          <div className="flex gap-4 font-body text-[11px] font-bold">
            <button onClick={onClose} className="flex-1 py-3 border border-outline rounded-lg hover:bg-surface-low transition-all">HỦY BỎ</button>
            <button onClick={onConfirm} className={`flex-1 py-3 text-white rounded-lg shadow-md transition-all ${isDelete ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary-container'}`}>XÁC NHẬN</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleManagement;