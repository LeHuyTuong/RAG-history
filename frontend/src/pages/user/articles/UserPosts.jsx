import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageSquare } from 'lucide-react';
import Pagination from '../../../components/common/Pagination';

const UserPosts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/user_articles.json');
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        setArticles(data);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Lấy bài viết tiêu biểu (bài đầu tiên có featured: true)
  const featuredArt = articles.find(a => a.featured);
  // Lọc bài viết
  const filteredArticles = articles.filter(a => !a.featured && (
    String(a.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(a.summary || "").toLowerCase().includes(searchTerm.toLowerCase())
  ) && (
      filterPeriod ? String(a.dynasty || "").includes(filterPeriod.replace('Triều ', '')) : true
    ));

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset pagination
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPeriod]);

  // Danh sách các triều đại cố định để đồng bộ với các trang khác
  const periods = ['Triều Lý', 'Triều Trần', 'Triều Lê Sơ', 'Triều Nguyễn', 'Triều Hồ'];

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20">
      {/* HERO SECTION */}
      <section className="relative h-[450px] flex items-center justify-center overflow-hidden border-b border-[#d99b4a]/30">
        <div className="absolute inset-0 z-0 bg-[#2b0504]">
          <img
            className="w-full h-full object-cover grayscale-[30%] sepia-[40%] brightness-[0.4] animate-ken-burns origin-center"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGUI3HT9Jex5a-ZERUyLKKX086wzQHpxtpVeEbPJEpbnTS-rw0ElAg5co6141j6KJDTDCz1ORbq5naaR6yRj54VbXWefWH04BoEsovGxeQp_RFUEbdBmUClcwLmx3guee6Cg-dzz_WWbe_KByIYQUUoJXxlhsKBoU1OVMdNif6YQ-rPbN56YQNjt1Dwqs9vuDdE_LzBbakJz5a2f0D-msrRSxENoyfI4SU6jI0WnQ_Fb5KC5LHNrNpJVLFv-rEYPmp-8J8a9SWgOV2"
            alt="Articles Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2b0504]/90 via-[#2b0504]/40 to-[#fbf6e8] pointer-events-none"></div>
        </div>
        <div className="relative z-10 text-center space-y-4 max-w-4xl px-12 mt-10">
          <span className="text-[#d9c7a7] font-body text-[11px] font-bold uppercase tracking-[0.4em] mb-4 block drop-shadow-md">Tàng kinh các</span>
          <h1 className="font-headline text-5xl md:text-6xl lg:text-[72px] text-[#f7d78a] font-semibold tracking-tight drop-shadow-lg mb-4">Bài Viết Lịch Sử</h1>
          <p className="font-body text-sm md:text-base lg:text-lg text-[#f8ead0]/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Lưu trữ và hiệu đính các bản ghi chép về các triều đại, sự kiện và nhân vật quan trọng trong dòng chảy lịch sử Việt Nam.
          </p>
        </div>
      </section>

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
                      src={featuredArt.thumbnail_url}
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
                    {featuredArt.summary}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col gap-2 text-[#2b1a16]/60 font-body text-[10px] font-bold">
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-sm">schedule</span> {(featuredArt.readTime || '').toUpperCase()}</span>
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

        {/* 2. SEARCH AND FILTER */}
        <div className="-mt-16 relative z-20 mb-16">
          <div className="bg-[#fffdf8]/90 backdrop-blur-md rounded-xl shadow-md border border-[#d99b4a]/40 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-[#fcf9ee]/50 border border-[#d99b4a]/30 text-[#2b1a16] placeholder-[#6b0f0d]/40 rounded-lg py-3 pl-12 pr-4 outline-none focus:border-[#6b0f0d]/60 transition-colors font-body shadow-inner"
              />
            </div>
            <div className="relative md:w-64 w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60">filter_alt</span>
              <select
                value={filterPeriod}
                onChange={e => setFilterPeriod(e.target.value)}
                className="w-full bg-[#fcf9ee]/50 border border-[#d99b4a]/30 text-[#2b1a16] rounded-lg py-3 pl-12 pr-10 appearance-none outline-none focus:border-[#6b0f0d]/60 transition-colors font-body cursor-pointer shadow-inner"
              >
                <option value="">Tất cả thời kỳ</option>
                {periods.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60 pointer-events-none">expand_more</span>
            </div>
            <div className="flex items-center gap-4 px-4 font-body border-l border-[#d99b4a]/20">
              <span className="text-[#2b1a16]/60 text-[10px] font-bold uppercase hidden md:inline">Sắp xếp:</span>
              <button className="text-[#6b0f0d] font-bold text-[11px] uppercase tracking-widest border-b-2 border-[#6b0f0d]">Mới nhất</button>
              <button className="text-[#2b1a16]/60 font-bold text-[11px] uppercase tracking-widest hover:text-[#6b0f0d] transition-all">Đọc nhiều</button>
            </div>
          </div>
        </div>

        {/* 3. POST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {paginatedArticles.map((art) => (
            <article key={art.post_id} className="group bg-[#fffdf8] border border-[#d99b4a]/30 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-500 flex flex-col relative overflow-hidden">
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
                      src={art.thumbnail_url}
                      alt={art.title}
                    />
                  </Link>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/60 to-transparent opacity-70 pointer-events-none"></div>
                  <div className="absolute bottom-4 left-4 z-10">
                    <span className="bg-[#2b0504] text-[#ffe7b0] px-4 py-1.5 text-[9px] font-bold uppercase tracking-[0.2em] shadow-md border border-[#d99b4a]/30">{art.post_tags?.[0]?.tag_name}</span>
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
                    {art.summary}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#d99b4a]/20 mt-auto font-body">
                    <div className="flex gap-4">
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#6b0f0d]/70">
                        <Heart size={16} strokeWidth={2} /> {art.likes}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#6b0f0d]/70">
                        <MessageSquare size={16} strokeWidth={2} /> {art.comments}
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
        {/* 4. PAGINATION */}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </main>
    </div>
  );
};

export default UserPosts;