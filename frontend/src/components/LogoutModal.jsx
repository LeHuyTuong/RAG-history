import React from 'react';

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Lớp nền mờ */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Container Modal */}
      <div className="relative bg-[#fcf9ee] w-full max-w-md overflow-hidden border border-outline-variant/50 shadow-2xl animate-in fade-in zoom-in duration-300">
        {/* Đường kẻ trang trí phía trên */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-primary"></div>

        <div className="p-10 flex flex-col items-center text-center">
          {/* Icon cảnh báo */}
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-6 text-primary border border-primary/20">
            <span className="material-symbols-outlined text-4xl">logout</span>
          </div>

          {/* Nội dung chữ - Đồng bộ Typography */}
          <h2 className="font-headline text-2xl text-primary font-bold italic mb-3 uppercase tracking-tight">
            Xác nhận Đăng xuất?
          </h2>


          {/* Nút thao tác */}
          <div className="w-full flex flex-col sm:flex-row gap-3 font-body text-[11px] font-bold tracking-widest">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-outline text-on-surface-variant hover:bg-surface-low transition-all uppercase"
            >
              Hủy bỏ
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-6 py-3 bg-[#6B1515] text-white hover:bg-primary transition-all shadow-lg shadow-primary/20 uppercase"
            >
              Xác nhận
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-full h-12 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #7b5800 0, #7b5800 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }}></div>
      </div>
    </div>
  );
};

export default LogoutModal;