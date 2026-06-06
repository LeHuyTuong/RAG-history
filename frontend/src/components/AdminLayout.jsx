import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import LogoutModal from './LogoutModal';

const AdminLayout = () => {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (!savedUser) {
      navigate('/login');
    } else {
      const user = JSON.parse(savedUser);
      if (user.role !== 'admin') {
        navigate('/');
      }
    }
  }, [navigate]);

  const menuItems = [
    { icon: 'dashboard', label: 'Tổng quan', path: '/admin' },
    { icon: 'description', label: 'Bài viết', path: '/admin/articles' },
    { icon: 'event_note', label: 'Sự kiện', path: '/admin/events' },
    { icon: 'person', label: 'Nhân vật', path: '/admin/characters' },
    { icon: 'map', label: 'Địa danh', path: '/admin/locations' },
    // { icon: 'auto_stories', label: 'Sử liệu', path: '/admin/records' },
    { icon: 'database', label: 'Siêu dữ liệu', path: '/admin/metadata' },
    { icon: 'hub', label: 'Mối quan hệ', path: '/admin/hub' },
    // { icon: 'smart_toy', label: 'Quản trị AI', path: '/admin/ai' },
    { icon: 'group', label: 'Thành viên', path: '/admin/members' },
  ];

  const handleConfirmLogout = () => {
    localStorage.removeItem('user');
    setIsLogoutOpen(false);
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-surface">
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0 opacity-5"></div>

      <aside className="w-64 h-screen sticky top-0 left-0 bg-[#6B1515] text-white flex flex-col py-6 shrink-0 z-50 border-r border-white/10">
        <div className="px-8 mb-8 cursor-pointer" onClick={() => navigate('/admin')}>
          <h1 className="font-headline text-2xl text-[#FFFF00] font-bold italic tracking-tighter">Sử Việt</h1>
        </div>
        
        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar px-3">
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/admin'}
              className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-white/15 text-white border-l-4 border-[#FFFF00] font-bold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="text-sm font-body font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-white/10 px-3 space-y-1">
          <NavLink to="/admin/settings" className={({ isActive }) => `flex items-center gap-4 px-4 py-3 rounded-lg ${isActive ? 'bg-white/10 text-white font-bold' : 'text-white/60 hover:text-white'}`}>
            <span className="material-symbols-outlined text-[22px]">settings</span>
            <span className="text-sm font-body">Cài đặt</span>
          </NavLink>
          <button onClick={() => setIsLogoutOpen(true)} className="w-full flex items-center gap-4 px-4 py-3 text-white/60 hover:text-red-400 transition-colors">
            <span className="material-symbols-outlined text-[22px]">logout</span>
            <span className="text-sm font-body text-left">Đăng xuất</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white/80 backdrop-blur-md border-b border-outline-variant flex items-center px-8 z-40">
          <nav className="flex items-center gap-2 font-body text-[10px] uppercase tracking-widest text-on-surface-variant">
            <Link to="/admin" className="hover:text-primary flex items-center gap-1"><span className="material-symbols-outlined text-sm">home</span> HOME</Link>
            {location.pathname.split('/').filter(x => x && x !== 'admin').map((path, index, array) => (
              <React.Fragment key={path}>
                <span className="material-symbols-outlined text-[12px] opacity-40">chevron_right</span>
                {index === array.length - 1 ? <span className="text-primary font-bold">{path.toUpperCase()}</span> : <Link to={`/admin/${path}`} className="hover:text-primary">{path.toUpperCase()}</Link>}
              </React.Fragment>
            ))}
          </nav>
        </header>
        <main className="flex-1 overflow-y-auto bg-[#FDFBF0] custom-scrollbar">
          <Outlet />
        </main>
      </div>

      <LogoutModal isOpen={isLogoutOpen} onClose={() => setIsLogoutOpen(false)} onConfirm={handleConfirmLogout} />
    </div>
  );
};

export default AdminLayout;