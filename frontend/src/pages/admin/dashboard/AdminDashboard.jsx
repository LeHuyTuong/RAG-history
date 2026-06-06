import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [opacity, setOpacity] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setOpacity(1);
  }, []);

  return (
    <main
      className="p-12 transition-opacity duration-700 ease-out font-body animate-in fade-in"
      style={{ opacity: opacity }}
    >
      <div className="max-w-[1280px] mx-auto space-y-12">

        {/* --- PAGE HEADER --- */}
        <div className="mb-10 border-b border-outline-variant/30 pb-8">
          {/* Tiêu đề lớn: Playfair Display */}
          <h2 className="font-headline text-4xl text-primary font-bold tracking-tight">
            Bảng điều khiển Quản trị
          </h2>
          {/* Lời dẫn: Manrope */}
          <p className="font-body text-sm text-on-surface-variant mt-2">
            Chào mừng quay trở lại. Giám sát và quản lý các hoạt động trên hệ thống dữ liệu lịch sử.
          </p>
        </div>

        {/* 1. THỐNG KÊ TỔNG QUAN */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon="menu_book" title="Tổng Bài viết" value="12.4K" iconBg="bg-primary/10" />
          <StatCard icon="history_edu" title="Sự kiện Lịch sử" value="4.2K" iconBg="bg-accent/10" />
          <StatCard icon="person_pin_circle" title="Nhân vật" value="3.1K" iconBg="bg-surface-variant" />
          <StatCard icon="group" title="Thành viên" value="4.0K" iconBg="bg-primary/5" />
        </section>

        {/* 2. HỆ THỐNG HOẠT ĐỘNG & THAO TÁC NHANH */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* HOẠT ĐỘNG GẦN ĐÂY */}
          <div className="lg:col-span-2 bg-admin-card border border-outline-variant/20 rounded shadow-sm overflow-hidden">
            <div className="px-8 py-5 border-b border-outline-variant/20 flex justify-between items-center bg-white/30">
              <h3 className="font-headline text-xl text-primary font-bold italic">Hoạt động Gần đây</h3>
              <button
                onClick={() => navigate('/admin/articles')}
                className="font-body text-[10px] uppercase font-bold tracking-widest text-on-surface-variant hover:text-primary transition-all"
              >
                Tất cả
              </button>
            </div>
            <div className="divide-y divide-outline-variant/10">
              <ActivityItem
                icon="verified"
                color="text-primary"
                bg="bg-primary/10"
                text={<><strong>Admin</strong> đã duyệt bài: <span className="font-headline text-primary font-bold text-lg ml-1">Trận Bạch Đằng 1288</span></>}
                time="2 phút trước"
              />
              <ActivityItem
                icon="person_add"
                color="text-on-surface"
                bg="bg-accent/10"
                text={<>Thành viên mới: <span className="font-headline text-primary font-bold text-lg ml-1">Lê Văn Hùng</span></>}
                time="15 phút trước"
              />
              <ActivityItem
                icon="memory"
                color="text-primary"
                bg="bg-surface-variant"
                text={<>AI vừa hoàn thành nạp liệu từ <span className="font-headline text-primary font-bold text-lg ml-1">Đại Việt Sử Ký</span></>}
                time="1 giờ trước"
              />
            </div>
          </div>

          {/* THAO TÁC NHANH */}
          <div className="bg-primary text-white rounded p-8 shadow-xl relative overflow-hidden flex flex-col">
            <div className="motif-corner-tl !border-white/20"></div>
            <div className="motif-corner-br !border-white/20"></div>

            <h3 className="font-headline text-2xl mb-8 relative z-10 italic border-b border-white/10 pb-4">Thao tác Nhanh</h3>

            <div className="flex flex-col gap-3 relative z-10">
              <QuickButton label="Soạn Bài viết" icon="add_circle" onClick={() => navigate('/admin/articles/new')} />
              <QuickButton label="Thêm Sự kiện" icon="event" onClick={() => navigate('/admin/events/new')} />
              <QuickButton label="Thêm Nhân vật" icon="person_add" onClick={() => navigate('/admin/characters/new')} />
              <QuickButton label="Thêm Địa danh" icon="location_on" onClick={() => navigate('/admin/locations/new')} />
            </div>
          </div>

        </section>
      </div>
    </main>
  );
};

// --- COMPONENT CON TÁI SỬ DỤNG ---

const StatCard = ({ icon, title, value, iconBg }) => (
  <div className="bg-admin-card p-6 border border-outline-variant/20 rounded shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div className={`p-2 w-fit mb-4 ${iconBg} rounded`}>
      <span className="material-symbols-outlined text-primary">{icon}</span>
    </div>
    {/* Nhãn dữ liệu: Inter */}
    <h3 className="font-body text-[10px] uppercase font-bold tracking-widest text-on-surface-variant mb-1">
      {title}
    </h3>
    {/* Giá trị: Inter */}
    <p className="text-3xl font-body text-primary font-bold">{value}</p>
  </div>
);

const ActivityItem = ({ icon, color, bg, text, time }) => (
  <div className="px-8 py-4 flex items-center gap-4 hover:bg-white/50 transition-all cursor-default">
    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
      <span className={`material-symbols-outlined ${color} text-[20px]`}>{icon}</span>
    </div>
    {/* Phần text chứa đối tượng đã được xử lý font-headline trong props 'text' */}
    <div className="flex-1 text-on-surface font-body text-sm">{text}</div>
    {/* Thời gian: Inter */}
    <p className="font-body text-[10px] uppercase font-bold tracking-widest text-on-surface-variant">
      {time}
    </p>
  </div>
);

const QuickButton = ({ label, icon, onClick }) => (
  <button
    onClick={onClick}
    className="w-full py-4 px-6 border border-white/20 rounded flex items-center justify-between hover:bg-white/10 transition-all group active:scale-95"
  >
    <span className="font-body text-sm font-medium">{label}</span>
    <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">{icon}</span>
  </button>
);

export default AdminDashboard;