import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const UserRecords = () => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' hoặc 'list'

  const records = [
    {
      id: 'SL-001',
      name: 'Đại Việt Sử Ký Toàn Thư',
      type: 'Imperial Record',
      period: 'Chính Hòa (1697)',
      author: 'Ngô Sĩ Liên & cộng sự',
      desc: 'Bộ chính sử lớn nhất Việt Nam thời trung đại, ghi chép lịch sử từ thời Hồng Bàng đến khi vua Lê Gia Tông lên ngôi.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDHCX219OduOWPwmW2kIgSRqByoswEIUiaosqjFuGFFcr52NLTu-QNIeZf8qLCtA6jGECS3erh686OMPJQhSFcx_-Dsc-LddNcJGLy1ALItx12jnIdr6P_XTuhyIp89XzRHD9DrtORbqLkg9DZ2ow2jSlFY9OMf8DESxvVFrDt_6QzoqH0gat7b37ieLVukWyg-THXb8kH2bu-ytad2zOD42kkv0POZ3wEfz0f8RBun1Orji-bYLe4gxtW5exF-w0W_7LMVQLmfWyTd'
    },
    {
      id: 'SL-002',
      name: 'Bia Tiến Sĩ Khoa Nhâm Tuất',
      type: 'Stelae',
      period: 'Đại Bảo (1442)',
      author: 'Hà Nội, Việt Nam',
      desc: 'Tấm bia đầu tiên trong hệ thống 82 bia Tiến sĩ tại Văn Miếu, vinh danh các bậc hiền tài là nguyên khí quốc gia.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDvK1N8AwpRu4tfBYVDqr7T4VKDWw2dDlV7fP_tO5XuZpTkZxcX1gt3hybNKQzZWjJCRJMeYZvrAKdGfSyIIERHg1HDDCsVQHl2H9TIR3pJBjGR2P-b9YAPAVnROcNX-tbkI8Laf4DCWKgqli4cump-itIwz9Gk09u_nXRRjAfwE2x68bmCEnT28fVgMK5gcOsOXXjQW7ovfnDVi1vxxC-Bvws1iXymINJJGG2xQ_XOgsCwQlsfwRiyvwSJPVhPCLov697LjrPCn7fL'
    },
    {
      id: 'SL-003',
      name: 'Mộc bản Triều Nguyễn',
      type: 'Woodblock',
      period: 'Thế kỷ XIX',
      author: 'Quốc Sử Quán triều Nguyễn',
      desc: 'Di sản tư liệu thế giới với hàng nghìn tấm bản khắc gỗ dùng để in ấn sách, lưu giữ các bộ sử và kinh văn quan trọng.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCghNjaFuleTxWw5ndbIacn2DuVF3LWPNKC34a81m9azGHAUZ4BVq_nbaJYVIhC92NNapIczPmFdYcfwPzJebFi2ZbtR5i7mhua01PS031DlE9eKakuoPOOhGYloreVfY-PSC8V4KqrFTUsRcPw40rpYeanX_aom7dG39EdqViPLobP5lKNlY8pz86rBxMBimLFUb6X3OWWYDUtRG5TdAyWs1EtxQByMhrI6yft314AavO2k_CLBfxy4pQvSGDh8LL8KaNWOErpxw30'
    },
    {
      id: 'SL-004',
      name: 'Bình Ngô Đại Cáo',
      type: 'Proclamation',
      period: 'Thuận Thiên (1428)',
      author: 'Nguyễn Trãi',
      desc: 'Bản tuyên ngôn độc lập thứ hai của dân tộc Việt Nam, khẳng định chủ quyền độc lập tự chủ sau khi quét sạch quân Minh.',
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBiraAFrruCThZ1t8_foxHjvJw21fCgE_Bag8_SEktlJ7Uevv5kW4bV_wh31kfbRSrgXU1VYg43DM4gOYnkjH2SPHgdK8KSAV8yvWNkBdQ_VDMjAUgMtMFH0lnjggXGSaJSxlhQr-bumtCxeNsw2Qkem661LzFeW1aaAf8dB220TQ_Q4wcU8loBuo8Nt2kd1KfGmj_bNaA2tux1TIjOCANUBXQeYKmn_8umb0VuQbq-sL9orQovdebK74HjNNtGrQpFUxhZ4Fnhe83s'
    }
  ];

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16 animate-in fade-in duration-700 relative z-10">

        {/* 1. BODY HEADER: TIÊU ĐỀ HOÀNH TRÁNG */}
        <header className="relative overflow-hidden p-12 bg-[#fffdf8] border border-[#d99b4a]/40 shadow-md mb-16">
          <div className="absolute inset-0 dong-son-pattern bg-[#fcf9ee] opacity-80"></div>
          {/* Decorative corners */}
          <div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-[#d99b4a] opacity-80 z-20"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-[#d99b4a] opacity-80 z-20"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-[#d99b4a] opacity-80 z-20"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-[#d99b4a] opacity-80 z-20"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="max-w-3xl space-y-4">
              <span className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-[0.3em]">Hệ thống Lưu trữ Quốc gia</span>
              <h1 className="font-headline text-5xl md:text-6xl text-[#6b0f0d] font-semibold tracking-tight">Thư viện Sử liệu</h1>
              <p className="font-body text-lg text-[#2b1a16]/80 leading-relaxed">
                "Dân ta phải biết sử ta, cho tường gốc tích nước nhà Việt Nam." — Một kho tàng số hóa các văn bản cổ, văn bia và mộc bản từ các triều đại tự chủ.
              </p>
            </div>
            {/* Chế độ xem */}
            <div className="flex bg-[#fcf9ee] p-1 border border-[#d99b4a]/40 shadow-sm relative z-10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-all ${viewMode === 'grid' ? 'bg-[#6b0f0d] text-[#ffe7b0] shadow-md' : 'text-[#2b1a16]/60 hover:text-[#6b0f0d]'}`}
              >
                <span className="material-symbols-outlined text-sm">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-all ${viewMode === 'list' ? 'bg-[#6b0f0d] text-[#ffe7b0] shadow-md' : 'text-[#2b1a16]/60 hover:text-[#6b0f0d]'}`}
              >
                <span className="material-symbols-outlined text-sm">list</span>
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">

          {/* 2. SIDEBAR BỘ LỌC */}
          <aside className="lg:col-span-1 space-y-12">
            {/* Phân loại */}
            <section>
              <h3 className="font-body text-[11px] text-[#6b0f0d] uppercase font-bold tracking-[0.25em] mb-6 border-b border-[#d99b4a]/40 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">folder_open</span> Phân loại
              </h3>
              <div className="space-y-4 font-body text-[14px]">
                {['Văn bia', 'Bản thảo', 'Mộc bản', 'Châu bản'].map(cat => (
                  <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input type="checkbox" className="peer appearance-none w-4 h-4 border border-[#d99b4a] bg-[#fffdf8] checked:bg-[#6b0f0d] checked:border-[#6b0f0d] transition-all cursor-pointer" />
                      <span className="material-symbols-outlined absolute text-white text-[12px] opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
                    </div>
                    <span className="text-[#2b1a16]/80 group-hover:text-[#6b0f0d] transition-colors font-semibold tracking-wide">{cat}</span>
                  </label>
                ))}
              </div>
            </section>

            {/* Niên đại */}
            <section>
              <h3 className="font-body text-[11px] text-[#6b0f0d] uppercase font-bold tracking-[0.25em] mb-6 border-b border-[#d99b4a]/40 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">hourglass_empty</span> Niên đại
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {['Lý - Trần', 'Lê Sơ', 'Mạc - Lê Trung Hưng', 'Tây Sơn', 'Nguyễn'].map(era => (
                  <button key={era} className="text-left font-body text-[10px] font-bold uppercase border border-[#d99b4a]/40 px-4 py-2 hover:bg-[#6b0f0d] hover:text-[#ffe7b0] transition-all tracking-widest text-[#2b0504]">
                    {era}
                  </button>
                ))}
              </div>
            </section>

            {/* Widget hỗ trợ */}
            <div className="p-6 bg-[#fffdf8] border border-[#d99b4a]/40 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#fcf9ee] opacity-40 dong-son-pattern"></div>
              <span className="material-symbols-outlined text-[#d99b4a] text-5xl absolute -right-2 -bottom-2 group-hover:scale-110 transition-transform opacity-30">history_edu</span>
              <h4 className="font-headline text-xl text-[#2b0504] font-semibold mb-2 relative z-10">Hỗ trợ Học thuật</h4>
              <p className="text-xs text-[#2b1a16]/80 mb-4 relative z-10">Bạn đang tìm kiếm tài liệu chưa có trong kho lưu trữ?</p>
              <button className="text-[#6b0f0d] font-body text-[9px] font-bold uppercase tracking-widest border-b border-[#d99b4a]/50 hover:border-[#6b0f0d] transition-all relative z-10 pb-0.5">Gửi yêu cầu số hóa</button>
            </div>
          </aside>

          {/* 3. MAIN CONTENT: GRID SỬ LIỆU */}
          <section className="lg:col-span-3">
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 gap-10" : "flex flex-col gap-6"}>
              {records.map((item) => (
                <article key={item.id} className={`group bg-[#fffdf8] border border-[#d99b4a]/40 shadow-lg hover:shadow-[0_20px_50px_rgba(43,5,4,0.12)] transition-all duration-700 flex p-1 ${viewMode === 'grid' ? 'flex-col' : 'flex-row h-48'}`}>
                  {/* Lớp viền trong cùng */}
                  <div className={`border border-[#d99b4a]/30 relative flex bg-[#fcf9ee] dong-son-pattern w-full ${viewMode === 'grid' ? 'flex-col' : 'flex-row'}`}>
                    {/* Decorative corners */}
                    <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#d99b4a] opacity-80 z-20"></div>
                    <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#d99b4a] opacity-80 z-20"></div>
                    <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#d99b4a] opacity-80 z-20"></div>
                    <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#d99b4a] opacity-80 z-20"></div>

                    {/* Ảnh sử liệu */}
                    <div className={`${viewMode === 'grid' ? 'h-56 w-full border-b' : 'w-48 h-full border-r'} border-[#d99b4a]/30 overflow-hidden relative shrink-0`}>
                      <img
                        src={item.image}
                        className="w-full h-full object-cover grayscale-[0.6] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0 group-hover:scale-105 transition-all duration-1000"
                        alt={item.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/60 via-transparent to-transparent opacity-80"></div>
                      <div className="absolute top-3 left-3 z-10">
                        <span className="bg-[#6b0f0d] text-[#ffe7b0] font-body text-[9px] font-bold px-2 py-1 uppercase tracking-widest shadow-md">
                          {item.type}
                        </span>
                      </div>
                    </div>

                    {/* Nội dung bản ghi */}
                    <div className="p-6 flex flex-col flex-grow relative z-10">
                      <span className="text-[#6b0f0d]/80 font-body text-[9px] font-bold uppercase tracking-widest mb-2">Niên hiệu: {item.period}</span>
                      <h3 className="font-headline text-2xl text-[#2b0504] font-semibold group-hover:text-[#6b0f0d] transition-colors tracking-tight leading-tight mb-3">
                        {item.name}
                      </h3>
                      <p className="font-body text-[14px] text-[#2b1a16]/80 line-clamp-3 leading-relaxed mb-6">
                        {item.desc}
                      </p>

                      <div className="mt-auto pt-4 border-t border-[#d99b4a]/20 flex justify-between items-center">
                        <span className="text-[#2b1a16]/60 font-body text-xs italic">{item.author}</span>
                        <Link
                          to={`/records/${item.id}`}
                          className="text-[#6b0f0d] font-body text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-1 group/link hover:bg-[#d99b4a]/10 px-2 py-1 transition-colors"
                        >
                          XEM CHI TIẾT <span className="material-symbols-outlined text-[14px] group-hover/link:translate-x-1 transition-transform text-[#6b0f0d]">east</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* 4. PAGINATION */}
            <nav className="mt-16 flex justify-center items-center gap-3">
              <button className="w-10 h-10 border border-[#d99b4a]/40 bg-[#fffdf8] flex items-center justify-center text-[#6b0f0d]/40 cursor-not-allowed"><span className="material-symbols-outlined">chevron_left</span></button>
              <button className="w-10 h-10 bg-[#6b0f0d] text-[#ffe7b0] font-bold text-[13px] shadow-md border border-[#6b0f0d]">1</button>
              <button className="w-10 h-10 border border-[#d99b4a]/60 bg-[#fffdf8] font-body text-[13px] font-bold text-[#6b0f0d] hover:bg-[#d99b4a]/20 transition-all">2</button>
              <span className="text-[#6b0f0d] font-body tracking-widest">...</span>
              <button className="w-10 h-10 border border-[#d99b4a]/60 bg-[#fffdf8] flex items-center justify-center text-[#6b0f0d] hover:bg-[#d99b4a]/20 transition-all"><span className="material-symbols-outlined">chevron_right</span></button>
            </nav>
          </section>
        </div>
      </div>
    </div>
  );
};

export default UserRecords;