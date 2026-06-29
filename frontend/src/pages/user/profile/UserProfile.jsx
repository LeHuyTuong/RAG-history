import { API_ENDPOINTS, apiClient, mockClient } from '../../../services';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('history');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { username: '', role: 'user', avatar: '' };
  });
  const [nameInput, setNameInput] = useState(user.username);
  const [avatarInput, setAvatarInput] = useState(user.avatar || '');
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
    }
    window.scrollTo(0, 0);
  }, [navigate]);

  const handleUpdateName = (e) => {
    e.preventDefault();
    const updatedUser = { ...user, username: nameInput, avatar: avatarInput };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    alert('Cập nhật thông tin thành công!');
    window.location.reload();
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    alert('Đổi mật khẩu thành công!');
  };

  const [mockHistory, setMockHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        let historyData = [];
        try {
          const response = await apiClient.get('/api/v1/members/me/history');
          historyData = response.data?.data || response.data || [];
        } catch (apiErr) {
          console.error('Failed to fetch profile history from API, falling back to mock:', apiErr);
        }

        if (!Array.isArray(historyData) || historyData.length === 0) {
          try {
            const mockRes = await mockClient.get('/api/user_profile_history.json');
            historyData = mockRes.data || [];
          } catch (mockErr) {
            console.error('Failed to fetch mock profile history:', mockErr);
          }
        }
        setMockHistory(Array.isArray(historyData) ? historyData : []);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20 pb-20">

      {/* 1. COVER HEADER */}
      <section className="relative w-full h-[25vh] md:h-[30vh] border-b-[4px] border-[#d99b4a]/40 shadow-md">
        <div className="absolute inset-0 bg-[#2b0504]">
          <div className="absolute inset-0 bg-[#fcf9ee]/5 mix-blend-overlay dong-son-pattern opacity-30 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201] via-[#2b0504]/60 to-[#2b0504]/10" />
        </div>
      </section>

      {/* 2. PROFILE INFO & TABS */}
      <section className="max-w-[1000px] mx-auto px-6 md:px-12 relative -mt-16 sm:-mt-20 z-20">
        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-8">
          {/* Avatar (Overlapping) */}
          <div 
            onClick={() => setActiveTab('profile')}
            className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-[#fbf6e8] bg-[#2b0504] shadow-2xl flex items-center justify-center overflow-hidden relative shrink-0 group cursor-pointer"
            title="Đổi ảnh đại diện"
          >
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            ) : (
              <span className="material-symbols-outlined text-7xl text-[#f7d78a]">account_circle</span>
            )}
            {/* Camera Overlay */}
            <div className="absolute inset-0 bg-[#1a0201]/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center z-10 backdrop-blur-[2px]">
              <span className="material-symbols-outlined text-white text-3xl mb-1 drop-shadow-md">photo_camera</span>
              <span className="text-white text-[10px] font-bold uppercase tracking-widest drop-shadow-md">Đổi ảnh</span>
            </div>
          </div>
          
          {/* User Name & Role */}
          <div className="text-center sm:text-left flex-1 pb-2">
            <h1 className="font-headline text-3xl sm:text-4xl text-[#2b1a16] font-bold drop-shadow-sm mb-1">{user.username}</h1>
            <span className="inline-block px-3 py-1 bg-[#6b0f0d] text-[#ffe7b0] text-[10px] uppercase tracking-widest font-bold rounded-sm shadow-sm border border-[#d99b4a]/30">
              {user.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}
            </span>
          </div>
        </div>

        {/* Horizontal Tab Bar */}
        <div className="flex overflow-x-auto no-scrollbar border-b border-[#d99b4a]/30 mb-10 gap-8 sm:gap-12 pb-1">
          <button 
            onClick={() => setActiveTab('history')}
            className={`pb-4 whitespace-nowrap font-headline text-lg sm:text-xl font-bold transition-all relative ${activeTab === 'history' ? 'text-[#6b0f0d]' : 'text-[#2b1a16]/50 hover:text-[#6b0f0d]/80'}`}
          >
            Lịch sử Tương tác
            {activeTab === 'history' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#6b0f0d] rounded-t-sm shadow-sm"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`pb-4 whitespace-nowrap font-headline text-lg sm:text-xl font-bold transition-all relative ${activeTab === 'profile' ? 'text-[#6b0f0d]' : 'text-[#2b1a16]/50 hover:text-[#6b0f0d]/80'}`}
          >
            Thông tin Cá nhân
            {activeTab === 'profile' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#6b0f0d] rounded-t-sm shadow-sm"></span>}
          </button>
          <button 
            onClick={() => setActiveTab('password')}
            className={`pb-4 whitespace-nowrap font-headline text-lg sm:text-xl font-bold transition-all relative ${activeTab === 'password' ? 'text-[#6b0f0d]' : 'text-[#2b1a16]/50 hover:text-[#6b0f0d]/80'}`}
          >
            Bảo mật
            {activeTab === 'password' && <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#6b0f0d] rounded-t-sm shadow-sm"></span>}
          </button>
        </div>

        {/* 3. TAB CONTENT */}
        <div className="min-h-[400px]">
          
          {/* Lịch sử */}
          {activeTab === 'history' && (
            <div className="animate-in fade-in duration-500">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockHistory.map((item, idx) => (
                  <Link to={item.link} key={idx} className="group block bg-[#fffdf8] border border-[#d99b4a]/40 shadow-sm hover:shadow-xl transition-all rounded-sm overflow-hidden">
                    <div className="h-40 overflow-hidden relative">
                      <img src={item.img} alt={item.title} className="w-full h-full object-cover grayscale-[0.4] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/90 to-transparent"></div>
                      <div className="absolute top-3 right-3 flex justify-between items-end z-20">
                        <span className="text-[10px] font-body font-bold text-[#fffdf8] uppercase tracking-widest bg-[#d99b4a] px-2 py-1 flex items-center gap-1 shadow-md rounded-sm">
                          <span className="material-symbols-outlined text-[12px]">{item.interaction === 'Đã thích' ? 'favorite' : 'comment'}</span>
                          {item.interaction}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-20">
                        <span className="text-[#f7d78a] font-headline text-lg font-bold line-clamp-1 drop-shadow-md">{item.title}</span>
                      </div>
                    </div>
                    <div className="p-4 flex justify-between items-center bg-[#fffdf8]">
                      <span className="text-[10px] font-body font-bold text-[#6b0f0d] uppercase tracking-widest bg-[#d99b4a]/20 px-2 py-1 rounded-sm border border-[#d99b4a]/20">{item.type}</span>
                      <span className="text-[11px] text-[#2b1a16]/60 italic">{item.date}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Thay đổi thông tin */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-500 flex justify-center">
              <div className="w-full max-w-xl bg-[#fffdf8] p-8 md:p-12 border border-[#d99b4a]/40 shadow-lg relative overflow-hidden rounded-sm">
                <div className="absolute inset-0 dong-son-pattern opacity-[0.03] pointer-events-none"></div>
                
                <div className="text-center mb-8 relative z-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#6b0f0d] text-[#ffe7b0] mb-4 shadow-md border-2 border-[#d99b4a]/50">
                    <span className="material-symbols-outlined text-[28px]">badge</span>
                  </div>
                  <h2 className="font-headline text-2xl text-[#6b0f0d] font-semibold mb-2">Cập nhật thông tin</h2>
                  <p className="text-[#2b1a16]/60 text-[13px] font-body">Cập nhật danh tính hiển thị của bạn trên hệ thống</p>
                </div>

                <form onSubmit={handleUpdateName} className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-widest font-bold block text-center">
                      Ảnh đại diện (Link URL)
                    </label>
                    <input
                      type="text"
                      value={avatarInput}
                      onChange={(e) => setAvatarInput(e.target.value)}
                      placeholder="Nhập đường dẫn ảnh..."
                      className="w-full bg-[#fcf9ee] border border-[#d9c7a7] focus:border-[#6b0f0d] focus:ring-1 focus:ring-[#6b0f0d]/30 p-4 text-sm outline-none font-body transition-colors text-[#2b1a16] shadow-inner text-center rounded-sm placeholder:text-[#2b1a16]/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-widest font-bold block text-center">
                      Tên hiển thị
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-[#fcf9ee] border border-[#d9c7a7] focus:border-[#6b0f0d] focus:ring-1 focus:ring-[#6b0f0d]/30 p-4 text-sm outline-none font-body transition-colors text-[#2b1a16] shadow-inner text-center rounded-sm"
                      required
                    />
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full bg-[#6b0f0d] text-[#ffe7b0] px-8 py-3.5 font-body font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#8b1512] transition-all active:scale-95 border border-[#d99b4a]/40 rounded-sm">
                      Lưu thay đổi
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Đổi mật khẩu */}
          {activeTab === 'password' && (
            <div className="animate-in fade-in duration-500 flex justify-center">
              <div className="w-full max-w-xl bg-[#fffdf8] p-8 md:p-12 border border-[#d99b4a]/40 shadow-lg relative overflow-hidden rounded-sm">
                <div className="absolute inset-0 dong-son-pattern opacity-[0.03] pointer-events-none"></div>
                
                <div className="text-center mb-8 relative z-10">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#6b0f0d] text-[#ffe7b0] mb-4 shadow-md border-2 border-[#d99b4a]/50">
                    <span className="material-symbols-outlined text-[28px]">lock_reset</span>
                  </div>
                  <h2 className="font-headline text-2xl text-[#6b0f0d] font-semibold mb-2">Bảo mật Tài khoản</h2>
                  <p className="text-[#2b1a16]/60 text-[13px] font-body">Đảm bảo an toàn cho dữ liệu cá nhân của bạn</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-widest font-bold block text-center">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      className="w-full bg-[#fcf9ee] border border-[#d9c7a7] focus:border-[#6b0f0d] focus:ring-1 focus:ring-[#6b0f0d]/30 p-4 text-sm outline-none font-body transition-colors text-[#2b1a16] shadow-inner text-center rounded-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-widest font-bold block text-center">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      className="w-full bg-[#fcf9ee] border border-[#d9c7a7] focus:border-[#6b0f0d] focus:ring-1 focus:ring-[#6b0f0d]/30 p-4 text-sm outline-none font-body transition-colors text-[#2b1a16] shadow-inner text-center rounded-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-widest font-bold block text-center">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      className="w-full bg-[#fcf9ee] border border-[#d9c7a7] focus:border-[#6b0f0d] focus:ring-1 focus:ring-[#6b0f0d]/30 p-4 text-sm outline-none font-body transition-colors text-[#2b1a16] shadow-inner text-center rounded-sm"
                      required
                    />
                  </div>
                  <div className="pt-4">
                    <button type="submit" className="w-full bg-[#6b0f0d] text-[#ffe7b0] px-8 py-3.5 font-body font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#8b1512] transition-all active:scale-95 border border-[#d99b4a]/40 rounded-sm">
                      Cập nhật mật khẩu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </section>

    </div>
  );
};

export default UserProfile;
