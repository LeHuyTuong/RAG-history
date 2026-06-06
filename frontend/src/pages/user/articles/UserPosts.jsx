import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const UserPosts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDynasty, setFilterDynasty] = useState('Tất cả Triều đại');

  // Dữ liệu bài viết
  const articles = [
    {
      id: 1,
      tag: "Kiến trúc",
      dynasty: "Hậu Lê (1428–1527)",
      title: "Kiến trúc Cung điện Thăng Long: Biểu tượng Quyền lực và Văn hóa",
      slug: "kien-truc-thang-long", // Khớp với ArticleDetail
      excerpt: "Phân tích sự giao thoa kiến trúc giữa các triều đại và ảnh hưởng của Nho giáo trong quy hoạch cung đình thời Lê Sơ.",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDiaBD8cV4iBRP9zjbZQw4_Vj_gsiyTIWMdR0dlYOaEfq1Tf9vcfZhm8SOPhu08iK2P2g79gUtu3PEuojk3AOkK43P4MqTIm6kTwhOA0QhjPAbFDNXw72IDZPOD5qNp6ECqBwYv9FKtMsXJtePf5TCDDTBGSTJXGWiWrCnD-jpiLs5Tqq_GV4D-YSJ8CdBc1wnXnteLTUzZ7KMqdXAGAHN3W8srpGGpNjPxygJXs3VUub5dW0qljkAR0wd_lTzL--nkhQRPukBdw208",
      likes: "1.2k",
      comments: 42,
      readTime: "15 phút đọc",
      featured: true // Đánh dấu là bài tiêu biểu
    },
    {
      id: 2,
      tag: "Quân sự",
      dynasty: "Nhà Trần (1225–1400)",
      title: "Chiến thuật quân sự thời Trần: Nghệ thuật lấy yếu thắng mạnh",
      slug: "chien-thuat-quan-su-tran",
      excerpt: "Phân tích chuyên sâu về kế sách 'Vườn không nhà trống' và cách thức huy động sức mạnh toàn dân trong ba lần kháng chiến chống Nguyên Mông...",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuD3a77zZzYMUsdTOHvAF9_PiEOkVKvj0_uWPBw0XOjIvwzLpkJ1bUAXzyWp8_UF2OoVT8k932oFMseFCy-5WElGsQZUPqSjs4cz-sryMw2jgxC2j81tklVq5cl9HbymrSqz16aPc5EeYXQFV2w2wyIRd-LUU3opyR7oP7QiQxI88NqZe49bjFSLhEh0FHPNxXaLoc_9r9aYOGlE559Q0AW8TXozYq5w3xDE-ufs8aR2yX7oj3hoMwzNjXOzMJwUJX2PVVtTK7PLam7Q",
      likes: "1.2k",
      comments: 84,
      readTime: "12 phút đọc"
    },
    {
      id: 3,
      tag: "Ngoại giao",
      dynasty: "Nhà Lê Sơ (1428–1527)",
      title: "Ngoại giao thời Lê Sơ: Bản lĩnh cương nhu của một quốc gia độc lập",
      slug: "ngoai-giao-le-so",
      excerpt: "Nghiên cứu về các văn bản bang giao giữa Đại Việt và nhà Minh, khẳng định chủ quyền lãnh thổ thông qua luận điểm chính nghĩa...",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOs5npR0CdWtGFo-0OPI7dJyYo42tKGWhiEl5t2xrEoV-z84zKAZhyz3WqtGk7m8XfCsCgePy_TMtk0tGl9vZjcNBGWiTlwmqbLQv2ufC937Dd5W2WT7OZmi1m4gGyHBvqTK__w2AKvJKcCUm8jzGK4eEwRlnXk4u2xMrlnryCfvnFmDtiUYGIodWC6GKcmmuMmZMgZI1YTvMVXIwb-ezJJBXztHaAnLp_Du1F2cGDnJr9KVi3Muv_Cbvoua1gw_cp2UnhYIw9Zy01",
      likes: "856",
      comments: 42,
      readTime: "18 phút đọc"
    },
    {
      id: 4,
      tag: "Văn hóa",
      dynasty: "Nhà Nguyễn (1802–1945)",
      title: "Lễ nhạc cung đình Huế: Di sản tinh thần của vương triều cuối cùng",
      slug: "le-nhac-cung-dinh-hue",
      excerpt: "Tìm hiểu về Nhã nhạc cung đình Huế - kiệt tác truyền khẩu và phi vật thể của nhân loại, biểu trưng cho sự hài hòa giữa con người...",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAfz81rCs9YqMYEFHI-wcQUH5rmc9bQpaGpVvfTGlSANJRXJi_GeiPpYGWIj4iIAGMp34nxm-8L4HFl03NFvuRNYTuk7yOwMTwHz2fmpSlhl1P5dJpJWAxZsejXAAlxjlKptb52C8Iyl8RgrjGlw3mAMcL210xSm6AjYBShvpuv9-wcLnDYvFE9oHyKNSFn3EzgDDc2CnF_hPgs0vLkmQLeVzutLzT4YVI3NhEnaP5U-ZzLINNVzLIipX6j1EIG2ajvWNigBvp1O5L7",
      likes: "2.1k",
      comments: 156,
      readTime: "25 phút đọc"
    }
  ];

  // Lấy bài viết tiêu biểu (bài đầu tiên có featured: true)
  const featuredArt = articles.find(a => a.featured);
  // Danh sách còn lại
  const regularArticles = articles.filter(a => !a.featured);

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20">
      <main className="max-w-[1280px] mx-auto px-6 md:px-12 py-12">
        
        {/* 1. FEATURED RESEARCH SECTION */}
        <section className="mb-20">
          <div className="flex items-center gap-4 mb-10">
            <span className="h-px flex-grow bg-[#d99b4a]/30"></span>
            <h2 className="font-headline text-2xl text-[#6b0f0d] uppercase tracking-[0.3em] px-4 text-center md:text-left font-bold">Công trình tiêu biểu</h2>
            <span className="h-px flex-grow bg-[#d99b4a]/30"></span>
          </div>
          
          {featuredArt && (
            <div className="grid grid-cols-1 lg:grid-cols-12 bg-[#fffdf8] border border-[#d99b4a]/40 shadow-xl overflow-hidden group p-2 relative">
              <div className="absolute inset-0 bg-[#fcf9ee] dong-son-pattern opacity-40"></div>
              
              {/* Lớp viền trong cùng chung cho cả khối */}
              <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 border border-[#d99b4a]/30 relative z-10 w-full h-full">
                {/* Decorative corners cho khối lớn */}
                <div className="absolute top-1 left-1 w-4 h-4 border-t border-l border-[#d99b4a] opacity-80 z-20 pointer-events-none"></div>
                <div className="absolute top-1 right-1 w-4 h-4 border-t border-r border-[#d99b4a] opacity-80 z-20 pointer-events-none"></div>
                <div className="absolute bottom-1 left-1 w-4 h-4 border-b border-l border-[#d99b4a] opacity-80 z-20 pointer-events-none"></div>
                <div className="absolute bottom-1 right-1 w-4 h-4 border-b border-r border-[#d99b4a] opacity-80 z-20 pointer-events-none"></div>

                <div className="lg:col-span-7 relative h-[400px] lg:h-auto overflow-hidden border-b lg:border-b-0 lg:border-r border-[#d99b4a]/30">
                  <Link to={`/articles/${featuredArt.slug}`}>
                    <img 
                      className="w-full h-full object-cover grayscale-[0.6] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-1000 scale-105 group-hover:scale-100 cursor-pointer" 
                      src={featuredArt.image} 
                      alt="Featured" 
                    />
                  </Link>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/60 to-transparent opacity-60 pointer-events-none"></div>
                  <div className="absolute top-6 left-6 z-10">
                    <span className="bg-[#6b0f0d] text-[#ffe7b0] px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-md">Nghiên cứu đặc biệt</span>
                  </div>
                </div>
                
                <div className="lg:col-span-5 p-12 flex flex-col justify-center bg-[#fcf9ee]/90 backdrop-blur-sm relative">
                  <span className="text-[#6b0f0d]/80 font-body text-[10px] font-bold uppercase tracking-widest mb-3">{featuredArt.dynasty}</span>
                  <Link to={`/articles/${featuredArt.slug}`}>
                    <h3 className="font-headline text-4xl text-[#2b0504] mb-6 leading-tight font-semibold hover:text-[#6b0f0d] transition-colors cursor-pointer tracking-tight">
                      {featuredArt.title}
                    </h3>
                  </Link>
                  <p className="font-body text-[15px] text-[#2b1a16]/80 mb-10 leading-relaxed">
                    {featuredArt.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col gap-2 text-[#2b1a16]/60 font-body text-[10px] font-bold">
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">schedule</span> {featuredArt.readTime.toUpperCase()}</span>
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">verified</span> CHỨNG THỰC</span>
                    </div>
                    <Link 
                      to={`/articles/${featuredArt.slug}`} 
                      className="bg-[#6b0f0d] text-[#ffe7b0] px-8 py-3 font-bold text-[10px] uppercase tracking-widest hover:bg-[#8b1512] transition-all shadow-md border border-[#d99b4a]/50 flex items-center gap-2 group/btn"
                    >
                      KHÁM PHÁ <span className="material-symbols-outlined text-[14px] group-hover/btn:translate-x-1 transition-transform">east</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2. FILTERS AND SORTING (GIỮ NGUYÊN NHƯNG ĐỔI STYLE) */}
        <div className="sticky top-20 z-40 bg-[#fcf9ee]/95 backdrop-blur-md py-6 border-y border-[#d99b4a]/30 mb-16 px-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
            <div className="flex flex-wrap gap-6 items-center">
              <div className="relative group">
                <select 
                  value={filterDynasty}
                  onChange={(e) => setFilterDynasty(e.target.value)}
                  className="appearance-none bg-transparent border-none border-b-2 border-[#d99b4a]/40 text-[#6b0f0d] font-bold text-[11px] uppercase tracking-widest pr-10 py-2 focus:ring-0 focus:border-[#6b0f0d] cursor-pointer transition-all outline-none"
                >
                  <option>Tất cả Triều đại</option>
                  <option>Nhà Lý</option>
                  <option>Nhà Trần</option>
                  <option>Nhà Lê Sơ</option>
                </select>
                <span className="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#6b0f0d] text-sm">expand_more</span>
              </div>
              
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-0 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60 group-focus-within:text-[#6b0f0d] transition-colors text-lg">search</span>
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm bài viết..." 
                  className="w-full sm:w-[250px] bg-transparent border-b-2 border-[#d99b4a]/40 pl-8 pr-4 py-2 font-body text-[13px] text-[#2b1a16] placeholder-[#2b1a16]/40 focus:outline-none focus:border-[#6b0f0d] transition-all"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-6 border-l border-[#d99b4a]/40 pl-8 font-body">
              <span className="text-[#2b1a16]/60 text-[10px] font-bold uppercase">Sắp xếp:</span>
              <button className="text-[#6b0f0d] font-bold text-[11px] uppercase tracking-widest border-b-2 border-[#6b0f0d]">Mới nhất</button>
              <button className="text-[#2b1a16]/60 font-bold text-[11px] uppercase tracking-widest hover:text-[#6b0f0d] transition-all">Đọc nhiều</button>
            </div>
          </div>
        </div>

        {/* 3. POST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {regularArticles
            .filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.excerpt.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((art) => (
            <article key={art.id} className="group bg-[#fffdf8] border border-[#d99b4a]/30 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-500 flex flex-col relative overflow-hidden">
              {/* Lớp viền trong cùng */}
              <div className="border border-[#d99b4a]/30 relative flex flex-col h-full bg-[#fcf9ee] dong-son-pattern">
                {/* Decorative corners */}
                <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#d99b4a] opacity-80 z-20"></div>
                <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#d99b4a] opacity-80 z-20"></div>
                <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#d99b4a] opacity-80 z-20"></div>
                <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#d99b4a] opacity-80 z-20"></div>

                <div className="h-56 overflow-hidden relative border-b border-[#d99b4a]/30">
                  <Link to={`/articles/${art.slug}`}>
                    <img 
                      className="w-full h-full object-cover grayscale-[0.6] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0 group-hover:scale-110 transition-transform duration-700" 
                      src={art.image} 
                      alt={art.title} 
                    />
                  </Link>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/60 to-transparent opacity-70 pointer-events-none"></div>
                  <div className="absolute bottom-4 left-4 z-10">
                    <span className="bg-[#2b0504] text-[#ffe7b0] px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] shadow-md border border-[#d99b4a]/30">{art.tag}</span>
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow relative z-10">
                  <span className="text-[#6b0f0d]/80 font-body text-[9px] font-bold uppercase tracking-widest mb-3 block">{art.dynasty}</span>
                  <Link to={`/articles/${art.slug}`}>
                    <h4 className="font-headline text-2xl text-[#2b0504] font-semibold group-hover:text-[#6b0f0d] transition-colors mb-4 leading-tight tracking-tight">
                      {art.title}
                    </h4>
                  </Link>
                  <p className="font-body text-[14px] text-[#2b1a16]/80 line-clamp-3 mb-6 leading-relaxed">
                    {art.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#d99b4a]/20 mt-auto font-body">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#6b0f0d]/70">
                        <span className="material-symbols-outlined text-[16px]">favorite</span> {art.likes}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#6b0f0d]/70">
                        <span className="material-symbols-outlined text-[16px]">chat_bubble</span> {art.comments}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-[#2b1a16]/50 tracking-widest">{art.readTime}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* 4. PAGINATION */}
        <div className="mt-24 flex justify-center items-center gap-4">
          <button className="w-10 h-10 border border-[#d99b4a]/40 bg-[#fffdf8] flex items-center justify-center text-[#6b0f0d]/40 cursor-not-allowed">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-10 h-10 bg-[#6b0f0d] text-[#ffe7b0] font-bold text-[13px] shadow-md border border-[#6b0f0d]">1</button>
          <button className="w-10 h-10 border border-[#d99b4a]/60 bg-[#fffdf8] font-body text-[13px] font-bold text-[#6b0f0d] hover:bg-[#d99b4a]/20 transition-all">2</button>
          <button className="w-10 h-10 border border-[#d99b4a]/60 bg-[#fffdf8] font-body text-[13px] font-bold text-[#6b0f0d] hover:bg-[#d99b4a]/20 transition-all">3</button>
          <span className="text-[#6b0f0d] px-2 font-bold tracking-widest">...</span>
          <button className="w-10 h-10 border border-[#d99b4a]/60 bg-[#fffdf8] flex items-center justify-center hover:bg-[#d99b4a]/20 text-[#6b0f0d] transition-all">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </main>
    </div>
  );
};

export default UserPosts;