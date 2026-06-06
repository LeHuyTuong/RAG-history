import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('history');
  const [user, setUser] = useState({ username: '', role: 'user' });
  const [nameInput, setNameInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      navigate('/login');
    } else {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setNameInput(parsed.username);
    }
    window.scrollTo(0, 0);
  }, [navigate]);

  const handleUpdateName = (e) => {
    e.preventDefault();
    const updatedUser = { ...user, username: nameInput };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
    alert('Cập nhật tên thành công!');
    window.location.reload();
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    alert('Đổi mật khẩu thành công!');
  };

  const mockHistory = [
    { id: 'EVT-1288', title: 'Trận Bạch Đằng Lần Thứ Ba', type: 'Sự kiện', interaction: 'Đã thích', date: 'Hôm nay', link: '/events/EVT-1288', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBArlscw3wc_0llom4YXbNv7OUtmTW1u8adGJtB0r_R9ouLWRlOhBtwANhi8h-y-oKCXyjtcMAw-fv_DqJa8j9I0UYbf6VIaYfgHL50aCXOYoKCdQKYmjZdoMl1JYnzrRbkzkf79To66-2d-f1XfB1xrJTtxZoVqJiuNrqbgJSqttpHAF3wZGHnereJFQmlr7zvRv_OYZP3ifnXN8WYT8_1w8_n43OLOx1lJp01FpEjYuFGNSEqolT22CJMX1LelRwU2FVHe3Qq_fbP' },
    { id: 'HUE-1', title: 'Cố đô Huế', type: 'Địa danh', interaction: 'Đã bình luận', date: 'Hôm qua', link: '/locations/1', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKLHWeWj3vTsKv2mconxq0gMjej8NpLLxS7ULSYKb17LLtEilBkjNNXRpGgmXsa5cit6jAVKY4R2EamuEXXjxJffT5d4La1xt3teUTz0dKXgG-ooZwoGtUMQ4jqEV8UM5eVRcELZb6IoF7-WzB4Sbt4xt-lKU3DzW8pL1xFrwxl-bYoN0KeNvHkFX2NdMQZ3m2wqs6-HuhE1MePvHSq-F62T1hwexNusRgGgJL0zwRXASpQmfrZACwD8jgyH-5N1MN8mLhT2T1TGhR' },
    { id: 'CHAR-2', title: 'Vua Quang Trung', type: 'Nhân vật', interaction: 'Đã thích', date: '3 ngày trước', link: '/characters/1', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9sXk9256E1K8rK242r4y48o_3x2B-p7G8h0U1w02rT5-D0yI3rN97V4x0O7O6-hG4zR77wR8P0x5pE9J3D7Z4g-3W_s2n-9V4x0O7O6-hG4zR77wR8P0x5pE9J3D7Z4g' },
  ];

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20 pb-20">

      {/* 1. HERO HEADER */}
      <section className="relative h-[40vh] w-full overflow-hidden border-b-[6px] border-[#d99b4a]/40 flex items-center justify-center">
        <div className="absolute inset-0 z-0 bg-[#2b0504]">
          <div className="absolute inset-0 bg-[#fcf9ee]/5 mix-blend-overlay dong-son-pattern opacity-30 pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201] via-[#2b0504]/60 to-[#2b0504]/20" />
        </div>
        <div className="relative z-10 text-center space-y-4 max-w-4xl px-12 mt-10">
          <span className="text-[#d9c7a7] font-body text-[11px] font-bold uppercase tracking-[0.4em] mb-4 block drop-shadow-md">
            Hồ sơ cá nhân
          </span>
          <h1 className="font-headline text-5xl md:text-7xl text-[#f7d78a] font-semibold tracking-tight drop-shadow-lg">
            {user.username}
          </h1>
        </div>
      </section>

      {/* 2. MAIN CONTENT */}
      <div className="max-w-[1280px] mx-auto px-6 md:px-16 py-12 relative z-10 flex flex-col md:flex-row gap-12">

        {/* SIDEBAR TABS */}
        <aside className="w-full md:w-64 shrink-0 space-y-4">
          <button
            onClick={() => setActiveTab('history')}
            className={`w-full text-left px-6 py-4 font-headline text-xl font-bold transition-all border-l-4 ${activeTab === 'history' ? 'border-[#6b0f0d] bg-[#6b0f0d]/10 text-[#6b0f0d]' : 'border-transparent text-[#2b1a16]/60 hover:bg-[#d99b4a]/10 hover:text-[#6b0f0d]'}`}
          >
            Bài viết đã tương tác
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full text-left px-6 py-4 font-headline text-xl font-bold transition-all border-l-4 ${activeTab === 'profile' ? 'border-[#6b0f0d] bg-[#6b0f0d]/10 text-[#6b0f0d]' : 'border-transparent text-[#2b1a16]/60 hover:bg-[#d99b4a]/10 hover:text-[#6b0f0d]'}`}
          >
            Thay đổi thông tin
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`w-full text-left px-6 py-4 font-headline text-xl font-bold transition-all border-l-4 ${activeTab === 'password' ? 'border-[#6b0f0d] bg-[#6b0f0d]/10 text-[#6b0f0d]' : 'border-transparent text-[#2b1a16]/60 hover:bg-[#d99b4a]/10 hover:text-[#6b0f0d]'}`}
          >
            Đổi mật khẩu
          </button>
        </aside>

        {/* TAB CONTENT */}
        <div className="flex-1 bg-[#fffdf8] border border-[#d99b4a]/40 p-8 md:p-12 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[#fcf9ee] opacity-30 pointer-events-none dong-son-pattern"></div>

          <div className="relative z-10">
            {activeTab === 'history' && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <h2 className="font-headline text-3xl text-[#6b0f0d] font-semibold mb-6 border-b border-[#d99b4a]/30 pb-4">
                  Bài viết đã tương tác
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {mockHistory.map((item, idx) => (
                    <Link to={item.link} key={idx} className="group block bg-[#fcf9ee] border border-[#d99b4a]/30 shadow-md hover:shadow-xl transition-all">
                      <div className="h-40 overflow-hidden relative">
                        <img src={item.img} alt={item.title} className="w-full h-full object-cover grayscale-[0.4] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/90 to-transparent"></div>
                        <div className="absolute top-3 right-3 flex justify-between items-end z-20">
                          <span className="text-[10px] font-body font-bold text-[#fffdf8] uppercase tracking-widest bg-[#d99b4a] px-2 py-1 flex items-center gap-1 shadow-md">
                            <span className="material-symbols-outlined text-[12px]">{item.interaction === 'Đã thích' ? 'favorite' : 'comment'}</span>
                            {item.interaction}
                          </span>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end z-20">
                          <span className="text-[#f7d78a] font-headline text-lg font-bold line-clamp-1 drop-shadow-md">{item.title}</span>
                        </div>
                      </div>
                      <div className="p-4 flex justify-between items-center bg-[#fffdf8]">
                        <span className="text-[10px] font-body font-bold text-[#6b0f0d] uppercase tracking-widest bg-[#d99b4a]/20 px-2 py-1">{item.type}</span>
                        <span className="text-[11px] text-[#2b1a16]/60 italic">{item.date}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in duration-500 max-w-xl">
                <h2 className="font-headline text-3xl text-[#6b0f0d] font-semibold mb-6 border-b border-[#d99b4a]/30 pb-4">
                  Cập nhật thông tin
                </h2>

                <form onSubmit={handleUpdateName} className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-wider font-bold block">
                      Tên hiển thị
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="w-full bg-[#fcf9ee] border border-[#d9c7a7] focus:border-[#6b0000] p-4 text-sm outline-none font-body transition-colors text-[#2b1a16] shadow-inner"
                      required
                    />
                  </div>
                  <button type="submit" className="bg-[#6b0f0d] text-[#ffe7b0] px-8 py-3 font-body font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#8b1512] transition-all active:scale-95 border border-[#d99b4a]/40">
                    Lưu thay đổi
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-8 animate-in fade-in duration-500 max-w-xl">
                <h2 className="font-headline text-3xl text-[#6b0f0d] font-semibold mb-6 border-b border-[#d99b4a]/30 pb-4">
                  Đổi mật khẩu
                </h2>

                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-wider font-bold block">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      className="w-full bg-[#fcf9ee] border border-[#d9c7a7] focus:border-[#6b0000] p-4 text-sm outline-none font-body transition-colors text-[#2b1a16] shadow-inner"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-wider font-bold block">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      className="w-full bg-[#fcf9ee] border border-[#d9c7a7] focus:border-[#6b0000] p-4 text-sm outline-none font-body transition-colors text-[#2b1a16] shadow-inner"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-wider font-bold block">
                      Xác nhận mật khẩu mới
                    </label>
                    <input
                      type="password"
                      className="w-full bg-[#fcf9ee] border border-[#d9c7a7] focus:border-[#6b0000] p-4 text-sm outline-none font-body transition-colors text-[#2b1a16] shadow-inner"
                      required
                    />
                  </div>
                  <button type="submit" className="bg-[#6b0f0d] text-[#ffe7b0] px-8 py-3 font-body font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#8b1512] transition-all active:scale-95 border border-[#d99b4a]/40">
                    Cập nhật mật khẩu
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default UserProfile;
