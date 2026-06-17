import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StatsGrid } from '../../../components/admin';

const CHART_DATA = [35, 50, 25, 70, 45, 90, 60, 80, 40, 65, 85, 55, 75, 45, 60];

const QUICK_ACTIONS = [
  { id: 'event', icon: 'history_edu', label: 'Sự kiện', path: '/admin/events/new', colorClasses: 'hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700' },
  { id: 'location', icon: 'explore', label: 'Địa danh', path: '/admin/locations/new', colorClasses: 'hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700' },
  { id: 'character', icon: 'person_pin_circle', label: 'Nhân vật', path: '/admin/characters/new', colorClasses: 'hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700' },
  { id: 'hub', icon: 'hub', label: 'Hub', path: '/admin/hub', colorClasses: 'hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700' }
];

const AdminDashboard = () => {
  const [opacity, setOpacity] = useState(0);
  const [dashboardData, setDashboardData] = useState({ stats: [], metadataStats: [], activities: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    setOpacity(1);

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
      className="p-8 lg:p-12 transition-opacity duration-700 ease-out font-body animate-in fade-in min-h-screen bg-surface"
      style={{ opacity: opacity }}
    >
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* --- BENTO BLOCK 1: PAGE HEADER --- */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-surface-low to-white p-10 shadow-sm border border-outline-variant/30 group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-700"></div>
          <div className="absolute top-0 right-10 p-8 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-1000 pointer-events-none">
            <span className="material-symbols-outlined text-[200px] leading-none text-primary">account_balance</span>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="font-headline text-4xl lg:text-5xl text-primary font-bold italic tracking-tight mb-4">
                Bảng điều khiển Quản trị
              </h2>
              <p className="font-body text-sm text-on-surface-variant max-w-xl leading-relaxed">
                Giám sát tổng quan hệ thống dữ liệu lịch sử Đại Việt. Theo dõi lưu lượng truy cập, quản lý nội dung và cập nhật các hoạt động mới nhất từ AI và thành viên.
              </p>
            </div>
            <div className="flex gap-4">
              <button onClick={() => navigate('/admin/articles/new')} className="px-6 py-3 bg-primary hover:bg-primary-container text-white hover:-translate-y-1 active:scale-95 border border-primary/20 rounded-xl text-[11px] uppercase tracking-widest font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">edit_document</span>
                Viết Bài
              </button>
              <button onClick={() => navigate('/admin/settings')} className="p-3 bg-surface hover:bg-surface-high text-primary hover:-translate-y-1 active:scale-95 border border-outline-variant/50 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center">
                <span className="material-symbols-outlined">settings</span>
              </button>
            </div>
          </div>
        </div>

        {/* --- BENTO BLOCK 2: TỔNG QUAN --- */}
        <section>
          <StatsGrid stats={dashboardData.stats} loading={loading} />
        </section>

        {/* --- MAIN BENTO GRID --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* BENTO BLOCK 3: QUICK ACTIONS & METADATA (Col Span 3) */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {/* Thao tác nhanh */}
            <div className="bg-white/80 backdrop-blur-xl border border-outline-variant/50 rounded-[2rem] shadow-sm p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full -z-10 group-hover:bg-amber-500/20 transition-colors pointer-events-none"></div>
              <h3 className="font-headline text-xl text-primary font-bold italic mb-5 flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">bolt</span>
                Thao tác nhanh
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {QUICK_ACTIONS.map(action => (
                  <button
                    key={action.id}
                    onClick={() => navigate(action.path)}
                    className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-surface-low border border-outline-variant/50 transition-all group/btn text-on-surface-variant ${action.colorClasses}`}
                  >
                    <span className="material-symbols-outlined text-[28px] group-hover/btn:scale-110 transition-transform">{action.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-center">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metadata Stats */}
            <div className="bg-gradient-to-br from-surface-low to-white border border-outline-variant/30 rounded-[2rem] shadow-sm p-6 flex-1 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-[0.03] mix-blend-overlay pointer-events-none"></div>
              <h3 className="font-headline text-lg text-primary font-bold italic mb-6 relative z-10 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary/70 text-[20px]">database</span>
                Hệ thống Dữ liệu
              </h3>
              <div className="space-y-4 relative z-10">
                {dashboardData.metadataStats?.map((meta, i) => (
                  <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-outline-variant/30 hover:border-primary/20 hover:shadow-sm transition-all">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary/60 text-[18px]">{meta.icon}</span>
                      <span className="text-xs text-on-surface font-medium">{meta.label}</span>
                    </div>
                    <span className="text-sm font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">{meta.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BENTO BLOCK 4: BIỂU ĐỒ (Col Span 6) */}
          <div className="lg:col-span-6 bg-white/80 backdrop-blur-xl border border-outline-variant/50 rounded-[2rem] shadow-sm p-8 flex flex-col relative overflow-hidden group">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-primary/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-700"></div>

            <div className="flex justify-between items-end mb-10 relative z-10">
              <div>
                <h3 className="font-headline text-2xl text-primary font-bold italic">Lưu lượng truy cập</h3>
                <p className="text-[11px] text-on-surface-variant font-bold uppercase tracking-widest mt-1">30 Ngày gần nhất</p>
              </div>
              <div className="flex gap-3 bg-surface-low p-1.5 rounded-full border border-outline-variant/50 shadow-inner">
                <span className="px-4 py-1.5 bg-white text-primary text-[10px] font-bold rounded-full shadow-sm">LƯỢT XEM</span>
                <span className="px-4 py-1.5 text-on-surface-variant text-[10px] font-bold rounded-full hover:bg-white/50 cursor-pointer transition-colors">TƯƠNG TÁC</span>
              </div>
            </div>

            <div className="flex-1 flex items-end gap-3 h-72 mt-auto w-full relative z-10">
              {/* Cột biểu đồ CSS với thiết kế bo tròn tinh tế */}
              {CHART_DATA.map((h, i) => {
                const isPeak = h >= 80;
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end group/bar h-full">
                    <div
                      className={`w-full rounded-full transition-all duration-700 relative cursor-pointer ${isPeak ? 'bg-gradient-to-t from-primary/60 to-primary shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'bg-gradient-to-t from-emerald-500/20 to-emerald-400/40 hover:from-emerald-500/40 hover:to-emerald-400/60'}`}
                      style={{ height: `${h}%` }}
                    >
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover/bar:opacity-100 transition-all pointer-events-none whitespace-nowrap z-20 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-emerald-400">visibility</span>
                        {h * 125}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Lưới nền nét đứt thanh lịch */}
            <div className="absolute inset-x-8 bottom-8 top-32 flex flex-col justify-between pointer-events-none z-0">
              <div className="border-t border-dashed border-outline-variant/40 w-full relative"><span className="absolute -top-3 -left-2 text-[9px] font-bold text-on-surface-variant/50">10k</span></div>
              <div className="border-t border-dashed border-outline-variant/30 w-full relative"><span className="absolute -top-3 -left-2 text-[9px] font-bold text-on-surface-variant/50">5k</span></div>
              <div className="border-t border-solid border-outline-variant/20 w-full relative"><span className="absolute -top-3 -left-2 text-[9px] font-bold text-on-surface-variant/50">0</span></div>
            </div>
          </div>

          {/* BENTO BLOCK 5: HOẠT ĐỘNG MỚI (Col Span 3) */}
          <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl border border-outline-variant/50 rounded-[2rem] shadow-sm p-6 flex flex-col relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-headline text-xl text-primary font-bold italic">Hoạt động mới</h3>
              <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-low transition-colors group">
                <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary transition-colors">more_horiz</span>
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto pr-2 custom-scrollbar relative">
              {loading ? (
                <div className="text-center text-[11px] text-on-surface-variant py-4 font-body animate-pulse">Đang tải hoạt động...</div>
              ) : (
                <>
                  <div className="absolute top-2 bottom-2 left-[15px] w-0.5 bg-gradient-to-b from-primary/30 via-outline-variant/30 to-transparent"></div>
                  {dashboardData.activities?.map((act, index) => {
                    const actColor = act.color || 'text-primary';
                    return (
                    <div key={act.id || index} className="relative pl-10 group/act cursor-pointer">
                      <div className={`absolute top-1 left-[7px] w-4 h-4 rounded-full flex items-center justify-center bg-white border-2 border-white shadow-sm z-10 transition-transform group-hover/act:scale-125 ${actColor.replace('text', 'bg').replace('bg-on-surface', 'bg-slate-400')}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>

                      <div className="bg-surface-low/50 group-hover/act:bg-surface p-3.5 rounded-2xl border border-outline-variant/30 group-hover/act:border-primary/20 group-hover/act:shadow-md transition-all duration-300">
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className={`material-symbols-outlined text-[14px] ${actColor}`}>{act.icon}</span>
                          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">{act.time}</p>
                        </div>
                        <p className="text-[12px] text-on-surface leading-relaxed" dangerouslySetInnerHTML={{ __html: act.textHtml || '' }}></p>
                      </div>
                    </div>
                  )})}
                </>
              )}
            </div>

            <button className="w-full mt-4 py-3 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors flex items-center justify-center gap-2">
              Xem toàn bộ lịch sử
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>

        </section>

      </div>
    </main>
  );
};

export default AdminDashboard;