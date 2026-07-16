import { apiClient } from '../services';
import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, NavLink, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import { login, logout } from '../store/redux/slices/authSlice';
import useModalStore from '../store/zustand/useModalStore';
import LogoutModal from "./LogoutModal";
import ChatBox from "./ChatBox";
import DongSonDrumIcon from "./DongSonDrumIcon";
import useSystemAppearance from '../hooks/useSystemAppearance';
import SystemBackground from './SystemBackground';

const HEADER_HEIGHT = 80;

const UserLayout = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const { isOpen, modalType, openModal, closeModal } = useModalStore();

  const navigate = useNavigate();
  const location = useLocation();

  // Reset modal states when navigating or pressing back to prevent getting stuck
  useEffect(() => {
    closeModal();
    setIsChatOpen(false);
  }, [location.pathname]);

  const { siteName, logoUrl, backgroundUrl } = useSystemAppearance();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("accessToken");
    if (savedUser && savedToken) {
      dispatch(login({ user: JSON.parse(savedUser), token: savedToken }));
    }
  }, [dispatch]);

  useEffect(() => {

    document.title = siteName;
  }, [siteName]);

  const handleConfirmLogout = async () => {
    try {
      await apiClient.post('/api/v1/auth/logout');
    } catch (error) {
      console.error("Logout error", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      dispatch(logout());
      closeModal();
      navigate("/login");
      window.location.reload();
    }
  };




  const navLinkClass = ({ isActive }) =>
    `relative font-headline text-sm xl:text-base uppercase tracking-[0.15em] font-bold transition-colors ${isActive ? "text-[#f7d78a]" : "text-[#d9c7a7]/70 hover:text-[#f7d78a]"
    } after:absolute after:left-1/2 after:-bottom-3 after:h-[2px] after:bg-[#d99b4a] after:transition-all after:-translate-x-1/2 ${isActive ? "after:w-full" : "after:w-0 hover:after:w-1/2"
    }`;

  return (
    <div className={`min-h-screen font-body selection:bg-[#d99b4a]/20 relative flex flex-col ${backgroundUrl ? 'bg-[#fbf6e8]' : 'bg-[#fbf6e8] parchment-texture'}`}>
      <div className="grain-overlay pointer-events-none fixed inset-0 z-0 opacity-5" />

      <SystemBackground backgroundUrl={backgroundUrl} />

      {/* HEADER */}
      <header
        className="fixed top-0 left-0 right-0 z-[70] h-20 bg-[#2b0504]/95 backdrop-blur-md border-b border-[#d99b4a]/30 shadow-md"
        style={{ height: `${HEADER_HEIGHT}px` }}
      >
        {/* Decorative border line at the bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#d99b4a]/50 to-transparent"></div>

        <div className="h-full w-full px-6 lg:px-14 xl:px-20 relative z-10">
          <nav className="h-full flex items-center justify-between gap-8 max-w-[1440px] mx-auto">
            {/* Logo */}
            <Link
              to={user?.role === 'admin' ? '/admin' : '/'}
              className="shrink-0 font-headline text-[26px] lg:text-[30px] font-bold text-[#f7d78a] tracking-wider hover:opacity-80 transition drop-shadow-md flex items-center gap-3"
            >
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} className="w-9 h-9 lg:w-10 lg:h-10 object-contain rounded-sm bg-[#f7d78a]/10 p-0.5" />
              ) : (
                <span className="material-symbols-outlined text-[28px] lg:text-[32px] text-[#f7d78a]">account_balance</span>
              )}
              {siteName}
            </Link>

            {/* Menu */}
            <nav className="hidden lg:flex flex-1 items-center justify-center gap-8 xl:gap-10 font-body text-sm xl:text-base font-bold uppercase tracking-[0.2em]">
              <NavLink to="/" end className={navLinkClass}>
                Trang chủ
              </NavLink>

              <NavLink to="/posts" className={(navData) => navLinkClass({ isActive: navData.isActive || location.pathname.startsWith('/articles') })}>
                Bài viết
              </NavLink>

              <NavLink to="/periods" className={navLinkClass}>
                Thời kỳ
              </NavLink>

              <NavLink to="/events" className={navLinkClass}>
                Sự kiện
              </NavLink>

              <NavLink to="/characters" className={navLinkClass}>
                Nhân vật
              </NavLink>

              <NavLink to="/locations" className={navLinkClass}>
                Di tích
              </NavLink>


            </nav>

            {/* Auth */}
            <div className="shrink-0 flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4 border-l border-[#d99b4a]/30 pl-5">
                  <div className="hidden xl:block">
                    <Link to="/profile" className="w-10 h-10 rounded-full border-2 border-[#d99b4a]/50 flex items-center justify-center bg-[#2b0504] text-[#f7d78a] hover:bg-[#4a0a08] hover:scale-105 hover:border-[#d99b4a] transition-all overflow-hidden shadow-lg group">
                      {user.avatar ? (
                        <img src={user.avatar} alt="avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                      ) : (
                        <span className="material-symbols-outlined text-[24px]">account_circle</span>
                      )}
                    </Link>
                  </div>
                  <button
                    onClick={() => openModal('logout')}
                    className="h-10 px-5 rounded-sm bg-[#6b0f0d] text-[#ffe7b0] font-body font-bold text-[10.5px] uppercase tracking-widest shadow-lg hover:bg-[#8b1512] transition-all active:scale-95"
                  >
                    Đăng xuất
                  </button>
                </div>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="h-10 px-6 rounded-sm bg-transparent text-[#f7d78a] font-body font-bold text-[11px] uppercase tracking-widest hover:bg-[#4a0a08]/50 transition-all active:scale-95 flex items-center justify-center border border-transparent hover:border-[#d99b4a]/30"
                  >
                    Đăng nhập
                  </Link>

                  <Link
                    to="/register"
                    className="h-10 px-6 rounded-sm border border-[#d99b4a]/50 bg-[#6b0f0d] text-[#ffe7b0] font-body font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#8b1512] transition-all active:scale-95 flex items-center justify-center"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* MAIN */}
      <main
        className="relative z-10 flex-grow"
        style={{ paddingTop: `${HEADER_HEIGHT}px` }}
      >
        <Outlet context={{ backgroundUrl }} />
      </main>

      {/* FOOTER */}
      <footer className="bg-surface-container-highest border-t border-outline-variant/30 py-16 relative z-20">
        <div className="max-w-[1440px] mx-auto px-8 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 text-center md:text-left">
          <div className="space-y-4">
            <h4 className="font-headline text-2xl text-primary font-bold italic">
              {siteName}
            </h4>

            <p className="text-on-surface-variant text-sm max-w-md mx-auto md:mx-0 leading-relaxed font-body">
              Hệ thống lưu trữ và giải mã tri thức lịch sử dân tộc thông qua
              công nghệ trí tuệ nhân tạo RAG.
            </p>
          </div>

          <div className="flex justify-center md:justify-end gap-12 font-body text-[10px] font-bold uppercase tracking-widest text-on-surface-variant self-end">
            <button onClick={() => openModal('rules')} className="hover:text-primary uppercase cursor-pointer">
              Quy định
            </button>
          </div>
        </div>
      </footer>

      {/* QUY DINH MODAL */}
      {isOpen && modalType === 'rules' && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#fbf6e8] w-full max-w-2xl rounded-sm shadow-2xl overflow-hidden border border-[#d99b4a]/50">
            <div className="bg-[#6b0f0d] p-5 flex justify-between items-center text-[#ffe7b0]">
              <h3 className="font-headline text-xl font-bold uppercase tracking-widest">Quy Định Sử Dụng</h3>
              <button onClick={closeModal} className="hover:rotate-90 transition-transform"><span className="material-symbols-outlined">close</span></button>
            </div>
            <div className="p-8 font-body text-[#2b1a16] space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <h4 className="font-bold text-lg text-[#6b0f0d] flex items-center gap-2"><span className="material-symbols-outlined text-[#d99b4a]">verified</span> 1. Mục đích hoạt động</h4>
                <p className="pl-8 leading-relaxed opacity-90">Hệ thống <strong className="text-[#8b1512]">{siteName}</strong> được xây dựng với mục đích lưu trữ, bảo tồn và lan tỏa các giá trị lịch sử, văn hóa truyền thống của dân tộc Việt Nam đến với đông đảo công chúng.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-lg text-[#6b0f0d] flex items-center gap-2"><span className="material-symbols-outlined text-[#d99b4a]">gavel</span> 2. Trách nhiệm người dùng</h4>
                <p className="pl-8 leading-relaxed opacity-90">Người dùng khi tham gia đóng góp, bình luận hoặc tương tác trên nền tảng cần tuân thủ các quy tắc ứng xử chuẩn mực, tôn trọng sự thật lịch sử, không xuyên tạc, bôi nhọ hay có những phát ngôn vi phạm pháp luật và thuần phong mỹ tục.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-lg text-[#6b0f0d] flex items-center gap-2"><span className="material-symbols-outlined text-[#d99b4a]">copyright</span> 3. Bản quyền nội dung</h4>
                <p className="pl-8 leading-relaxed opacity-90">Mọi dữ liệu lịch sử được tham khảo từ các nguồn chính thống và các bộ chính sử. Vui lòng ghi rõ nguồn "{siteName}" khi trích dẫn lại các nội dung phân tích hoặc hình ảnh thuộc bản quyền của hệ thống.</p>
              </div>
            </div>
            <div className="p-4 border-t border-[#d99b4a]/30 bg-[#fcf9ee] text-right">
              <button onClick={closeModal} className="px-8 py-2.5 bg-[#6b0f0d] text-[#ffe7b0] hover:bg-[#8b1512] font-bold uppercase tracking-widest text-[11px] rounded-sm shadow-md transition-colors">Đồng ý & Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      <LogoutModal
        isOpen={isOpen && modalType === 'logout'}
        onClose={closeModal}
        onConfirm={handleConfirmLogout}
      />

      {/* Nút Chat AI Floating */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="group fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#9e1b1b] rounded-full shadow-[0_8px_30px_rgba(158,27,27,0.4)] flex items-center justify-center hover:bg-[#b02a2a] hover:scale-110 active:scale-95 transition-all duration-300 overflow-hidden p-2.5"
      >
        <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-500 origin-center"></div>
        <DongSonDrumIcon className="w-full h-full text-white relative z-10 animate-[spin_10s_linear_infinite]" />

        {/* Tooltip */}
        <div className="absolute right-[110%] top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-[11px] font-bold tracking-widest uppercase rounded shadow-lg opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 pointer-events-none transition-all duration-300 whitespace-nowrap">
          Hỏi Đáp AI
        </div>
      </button>

      {/* ChatBox Component */}
      <ChatBox isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default UserLayout;
