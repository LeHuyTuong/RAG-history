import { useState, useEffect, Fragment } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import LogoutModal from './LogoutModal';

const AdminLayout = () => {
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [siteName, setSiteName] = useState('Sử Việt');
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

  useEffect(() => {
    const customSettings = JSON.parse(localStorage.getItem('admin_new_settings') || '[]');
    const siteNameParam = customSettings.find(p => p.key === 'site_name');
    if (siteNameParam) {
      setSiteName(siteNameParam.value);
    } else {
      fetch('/api/admin_settings.json')
        .then(res => res.json())
        .then(data => {
          const defaultSiteName = data.parameters?.find(p => p.key === 'site_name')?.value;
          if (defaultSiteName) {
            setSiteName(defaultSiteName);
          }
        })
        .catch(err => console.error('Error loading settings:', err));
    }
  }, []);

  useEffect(() => {
    document.title = siteName + ' - Quản trị';
  }, [siteName]);

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

      <aside className={`${isSidebarOpen ? 'w-64' : 'w-[80px]'} h-screen sticky top-0 left-0 bg-[#6b0f0d] text-[#ffe7b0] flex flex-col py-6 shrink-0 z-50 border-r border-[#d99b4a]/30 transition-all duration-300 overflow-hidden`}>
        <div className={`mb-8 cursor-pointer flex items-center ${isSidebarOpen ? 'px-8 justify-start' : 'justify-center'} transition-all`} onClick={() => navigate('/admin')}>
          <h1 className="font-headline text-3xl text-[#ffe7b0] font-bold tracking-wider hover:opacity-80 transition drop-shadow-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-[#ffe7b0] shrink-0">account_balance</span>
            {isSidebarOpen && <span className="whitespace-nowrap transition-opacity duration-300">{siteName}</span>}
          </h1>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto custom-scrollbar px-3">
          {menuItems.map((item) => (
            <NavLink key={item.path} to={item.path} end={item.path === '/admin'} title={!isSidebarOpen ? item.label : undefined}
              className={({ isActive }) => `flex items-center gap-4 py-3 rounded-lg transition-all ${isSidebarOpen ? 'px-4' : 'px-0 justify-center'} ${isActive ? 'bg-[#d99b4a]/20 text-[#ffe7b0] border-l-4 border-[#d99b4a] font-bold' : 'text-[#ffe7b0]/70 hover:bg-[#d99b4a]/10 hover:text-[#ffe7b0]'}`}>
              <span className="material-symbols-outlined text-[22px] shrink-0">{item.icon}</span>
              {isSidebarOpen && <span className="text-sm font-body font-medium whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-[#FDFBF0] border-b border-[#d99b4a]/20 flex items-center px-6 z-40 gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 text-on-surface hover:text-primary transition-colors flex items-center justify-center rounded hover:bg-surface-variant/30">
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
          <nav className="flex items-center gap-2 font-body text-[10px] uppercase tracking-widest text-on-surface-variant border-l border-outline-variant pl-4">
            <Link to="/admin" className="hover:text-primary flex items-center gap-1"><span className="material-symbols-outlined text-sm">home</span> HOME</Link>
            {location.pathname.split('/').filter(x => x && x !== 'admin').map((path, index, array) => (
              <Fragment key={path}>
                <span className="material-symbols-outlined text-[12px] opacity-40">chevron_right</span>
                {index === array.length - 1 ? <span className="text-primary font-bold">{path.toUpperCase()}</span> : <Link to={`/admin/${path}`} className="hover:text-primary">{path.toUpperCase()}</Link>}
              </Fragment>
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