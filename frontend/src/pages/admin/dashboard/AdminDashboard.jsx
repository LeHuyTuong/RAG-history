import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const [opacity, setOpacity] = useState(0);
  const [dashboardData, setDashboardData] = useState({ stats: [], activities: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setOpacity(1);

    // Giả lập gọi API bằng cách fetch file JSON từ thư mục public
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
          <h2 className="font-headline text-4xl text-primary font-bold italic tracking-tight">
            Bảng điều khiển Quản trị
          </h2>
          {/* Lời dẫn: Manrope */}
          <p className="font-body text-sm text-on-surface-variant mt-2">
            Chào mừng quay trở lại. Giám sát và quản lý các hoạt động trên hệ thống dữ liệu lịch sử.
          </p>
        </div>

        {/* 1. THỐNG KÊ TỔNG QUAN */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full text-center text-on-surface-variant py-4 font-body">Đang tải dữ liệu...</div>
          ) : (
            dashboardData.stats.map(stat => (
              <StatCard key={stat.id} icon={stat.icon} title={stat.title} value={stat.value} iconBg={stat.iconBg} />
            ))
          )}
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
              {loading ? (
                <div className="text-center text-on-surface-variant py-8 font-body">Đang tải hoạt động...</div>
              ) : (
                dashboardData.activities.map(act => (
                  <ActivityItem
                    key={act.id}
                    icon={act.icon}
                    color={act.color}
                    bg={act.bg}
                    textHtml={act.textHtml}
                    time={act.time}
                  />
                ))
              )}
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

const ActivityItem = ({ icon, color, bg, textHtml, time }) => (
  <div className="px-8 py-4 flex items-center gap-4 hover:bg-white/50 transition-all cursor-default">
    <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>
      <span className={`material-symbols-outlined ${color} text-[20px]`}>{icon}</span>
    </div>
    {/* Phần text hiển thị từ HTML */}
    <div className="flex-1 text-on-surface font-body text-sm" dangerouslySetInnerHTML={{ __html: textHtml }} />
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