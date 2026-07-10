import { API_ENDPOINTS, apiClient, mockClient, postService } from '../../../services';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('history');
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : { username: '', role: 'user', avatar: '' };
  });
  const [nameInput, setNameInput] = useState(user.username);
  const [avatarInput, setAvatarInput] = useState(user.avatar || '');
  const [toastMsg, setToastMsg] = useState('');
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

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
    setToastMsg('Cập nhật thông tin thành công!');
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarInput(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    alert('Đổi mật khẩu thành công!');
  };

  const [mockHistory, setMockHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        let allArticles = [];
        try {
          const response = await Promise.race([
            postService.filter({ size: 500 }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
          ]);
          allArticles = response.items || [];
        } catch (apiErr) {
          console.error('Failed to fetch articles from API:', apiErr);
        }

        if (allArticles.length === 0) {
          try {
            const mockRes = await mockClient.get('/api/user_articles.json');
            allArticles = mockRes.data || [];
          } catch (mockErr) {
            console.error('Failed to fetch mock articles:', mockErr);
          }
        }

        const interactedHistory = [];
        allArticles.forEach(art => {
          const slug = art.slug || art.id;
          const isLiked = localStorage.getItem(`liked_${slug}`) === 'true';
          const commentsStr = localStorage.getItem(`comments_${slug}`);
          let hasComments = false;
          if (commentsStr) {
            try {
              const commentsArr = JSON.parse(commentsStr);
              hasComments = commentsArr.length > 0;
            } catch (e) {}
          }
          
          if (isLiked || hasComments) {
            let actionText = 'Đã tương tác';
            if (isLiked && hasComments) actionText = 'Đã thích & bình luận';
            else if (isLiked) actionText = 'Đã thích';
            else if (hasComments) actionText = 'Đã bình luận';
            
            interactedHistory.push({
              id: art.id,
              title: art.title,
              type: 'BÀI VIẾT',
              interaction: actionText,
              date: new Date().toISOString().split('T')[0],
              img: art.thumbnailUrl || art.thumbnail_url || 'https://upload.wikimedia.org/wikipedia/commons/4/48/Ngoc_Lu.jpg',
              link: `/articles/${slug}`
            });
          }
        });
        
        setMockHistory(interactedHistory.reverse());
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="w-full relative font-body selection:bg-[#d99b4a]/20 pb-20">
      
      {/* TOAST NOTIFICATION */}
      {toastMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-[#1a0201]/90 backdrop-blur-md text-[#ffe7b0] px-6 py-3 rounded-full shadow-2xl border border-[#d99b4a]/50 font-body font-bold text-[13px] tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4caf50]">check_circle</span>
            {toastMsg}
          </div>
        </div>
      )}

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
            onClick={() => {
              setActiveTab('profile');
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
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
                      Ảnh đại diện
                    </label>
                    <div className="flex flex-col items-center gap-4">
                      {avatarInput && (
                        <img src={avatarInput} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-[#d99b4a] shadow-sm" />
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleAvatarUpload}
                        className="w-full max-w-[280px] bg-[#fcf9ee] border border-[#d9c7a7] focus:border-[#6b0f0d] focus:ring-1 focus:ring-[#6b0f0d]/30 p-2 text-sm outline-none font-body transition-colors text-[#2b1a16] rounded-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:uppercase file:tracking-widest file:font-bold file:bg-[#6b0f0d] file:text-[#ffe7b0] hover:file:bg-[#8b1512] cursor-pointer text-center"
                      />
                    </div>
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
