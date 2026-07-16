import { useState, useEffect, Fragment } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { apiClient } from '../services';
import LogoutModal from './LogoutModal';
import useSystemAppearance from '../hooks/useSystemAppearance';
import SystemBackground from './SystemBackground';

const AdminLayout = () => {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { siteName, logoUrl, backgroundUrl } = useSystemAppearance();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate('/login');
    } else {
      const user = JSON.parse(savedUser);
      if (user.role !== 'ROLE_ADMIN') {
        navigate('/');
      }
    }
  }, [navigate]);

  useEffect(() => {
    document.title = siteName + ' - Quản trị';
  }, [siteName]);

  const menuItems = [
    { icon: 'dashboard', label: 'Tổng quan', path: '/admin' },
    { icon: 'description', label: 'Bài viết', path: '/admin/articles' },
    { icon: 'timeline', label: 'Thời kỳ', path: '/admin/periods' },
    { icon: 'event_note', label: 'Sự kiện', path: '/admin/events' },
    { icon: 'person', label: 'Nhân vật', path: '/admin/characters' },
    { icon: 'map', label: 'Di tích', path: '/admin/locations' },
    // { icon: 'auto_stories', label: 'Sử liệu', path: '/admin/records' },
    { icon: 'sell', label: 'Thẻ', path: '/admin/tags' },
    // { icon: 'hub', label: 'Mối quan hệ', path: '/admin/hub' },
    // { icon: 'smart_toy', label: 'Quản trị AI', path: '/admin/ai' },
    // { icon: 'group', label: 'Thành viên', path: '/admin/members' },
  ];

  const isItemActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const handleConfirmLogout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      setIsLogoutOpen(false);
      navigate('/login');
    }
  };


  return (
    <div className={`flex min-h-screen relative ${backgroundUrl ? 'bg-[#f7fbf6]' : 'bg-surface'}`}>
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0 opacity-5"></div>
      <SystemBackground backgroundUrl={backgroundUrl} tintClassName="bg-[#f7fbf6]/85" />

      <aside className={`${isSidebarOpen ? 'w-64' : 'w-[80px]'} h-screen sticky top-0 left-0 bg-[#6b0f0d] text-[#ffe7b0] flex flex-col py-6 shrink-0 z-50 border-r border-[#d99b4a]/30 transition-all duration-300 overflow-hidden`}>
        <div className={`mb-8 cursor-pointer flex items-center ${isSidebarOpen ? 'px-8 justify-start' : 'justify-center'} transition-all`} onClick={() => navigate('/admin')}>
          <h1 className="font-headline text-3xl text-[#ffe7b0] font-bold tracking-wider hover:opacity-80 transition drop-shadow-md flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="w-8 h-8 object-contain rounded-sm bg-[#ffe7b0]/10 p-0.5" />
            ) : (
              <span className="material-symbols-outlined text-[28px] text-[#ffe7b0] shrink-0">account_balance</span>
            )}
            {isSidebarOpen && <span className="whitespace-nowrap transition-opacity duration-300">{siteName}</span>}
          </h1>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar px-3">
          {menuItems.map((item) => {
            const active = isItemActive(item.path);
            return (
              <Link key={item.path} to={item.path} title={!isSidebarOpen ? item.label : undefined}
                className={`flex items-center gap-4 py-3 rounded-lg transition-all ${isSidebarOpen ? 'px-4' : 'px-0 justify-center'} ${active ? 'bg-[#d99b4a]/20 text-[#ffe7b0] border-l-4 border-[#d99b4a] font-bold' : 'text-[#ffe7b0]/70 hover:bg-[#d99b4a]/10 hover:text-[#ffe7b0]'}`}>
                <span className="material-symbols-outlined text-[22px] shrink-0">{item.icon}</span>
                {isSidebarOpen && <span className="text-sm font-body font-medium whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-[#d99b4a]/20 px-3 space-y-1">
          <NavLink to="/admin/settings" title={!isSidebarOpen ? "Cài đặt" : undefined} className={({ isActive }) => `flex items-center gap-4 py-3 rounded-lg transition-all ${isSidebarOpen ? 'px-4' : 'px-0 justify-center'} ${isActive ? 'bg-[#d99b4a]/20 text-[#ffe7b0] font-bold' : 'text-[#ffe7b0]/60 hover:text-[#ffe7b0]'}`}>
            <span className="material-symbols-outlined text-[22px] shrink-0">settings</span>
            {isSidebarOpen && <span className="text-sm font-body whitespace-nowrap">Cài đặt</span>}
          </NavLink>
          <button onClick={() => setIsLogoutOpen(true)} title={!isSidebarOpen ? "Đăng xuất" : undefined} className={`w-full flex items-center gap-4 py-3 text-[#ffe7b0]/60 hover:text-[#ff6b6b] transition-colors ${isSidebarOpen ? 'px-4' : 'px-0 justify-center'}`}>
            <span className="material-symbols-outlined text-[22px] shrink-0">logout</span>
            {isSidebarOpen && <span className="text-sm font-body text-left whitespace-nowrap">Đăng xuất</span>}
          </button>
        </div>
      </aside>

      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-[#FDFBF0] border-b border-[#d99b4a]/20 flex items-center px-6 z-40 gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 text-on-surface hover:text-primary transition-colors flex items-center justify-center rounded hover:bg-surface-variant/30">
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
          <nav className="flex items-center gap-2 font-body text-[10px] uppercase tracking-widest text-on-surface-variant border-l border-outline-variant pl-4">
            <Link to="/admin" className="hover:text-primary flex items-center gap-1"><span className="material-symbols-outlined text-sm">home</span> TRANG CHỦ</Link>
            {(() => {
              const segments = location.pathname.split('/').filter(x => x && x !== 'admin');
              let accumulatedPath = '/admin';
              return segments.map((segment, index) => {
                accumulatedPath += `/${segment}`;
                const isLast = index === segments.length - 1;

                let label = segment.toUpperCase();
                const isId = !isNaN(segment) || (segment.length > 10 && segment.includes('-')) || /^(event|character|location)_[\w-]+$/i.test(segment);

                const hubIdMatch = segment.match(/^(event|character|location)_([\w-]+)$/i);
                if (hubIdMatch) {
                  const type = hubIdMatch[1].toLowerCase();
                  const idNum = hubIdMatch[2];
                  if (type === 'event') label = `SỰ KIỆN ${idNum}`;
                  else if (type === 'character') label = `NHÂN VẬT ${idNum}`;
                  else if (type === 'location') label = `DI TÍCH ${idNum}`;
                }

                const BREADCRUMB_MAP = {
                  'posts': 'BÀI VIẾT',
                  'articles': 'BÀI VIẾT',
                  'events': 'SỰ KIỆN',
                  'characters': 'NHÂN VẬT',
                  'locations': 'DI TÍCH',
                  'records': 'SỬ LIỆU',
                  'metadata': 'SIÊU DỮ LIỆU',
                  'tags': 'THẺ LỊCH SỬ',
                  'categories': 'DANH MỤC',
                  'periods': 'THỜI KỲ',
                  'hub': 'MỐI QUAN HỆ',
                  'relations': 'LIÊN KẾT',
                  'members': 'THÀNH VIÊN',
                  'settings': 'CÀI ĐẶT',
                  'new': 'TẠO MỚI',
                  'edit': 'CHỈNH SỬA',
                  'ai': 'TRỢ LÝ AI'
                };

                if (!hubIdMatch && BREADCRUMB_MAP[segment.toLowerCase()]) {
                  label = BREADCRUMB_MAP[segment.toLowerCase()];
                } else if (!hubIdMatch && isId) {
                  label = `${segment}`;
                }

                const isClickable = !isLast && segment.toLowerCase() !== 'edit' && !isId;

                return (
                  <Fragment key={accumulatedPath}>
                    <span className="material-symbols-outlined text-[12px] opacity-40">chevron_right</span>
                    {isClickable ? (
                      <Link to={accumulatedPath} className="hover:text-primary transition-colors">{label}</Link>
                    ) : (
                      <span className={isLast ? "text-primary font-bold" : "opacity-80"}>{label}</span>
                    )}
                  </Fragment>
                );
              });
            })()}
          </nav>
        </header>
        <main className="flex-1 custom-scrollbar bg-transparent">
          <Outlet />
        </main>
      </div>

      <LogoutModal isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} onConfirm={handleConfirmLogout} />
    </div>
  );
};

export default AdminLayout;
