import { API_ENDPOINTS, apiClient, postService, periodService } from '../../../services';
import { useState, useEffect } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';
import { Heart, MessageSquare } from 'lucide-react';
import Pagination from '../../../components/common/Pagination';
import { usePeriodColors } from '../../../hooks/usePeriodColors';
import { stripHtml } from '../../../utils/stringUtils';
import { IMAGES, MISC_IMAGES } from '../../../config/constants';

const getFallbackImage = (period) => {
  if (!period) return "/images/dong_son_drum.png";
  const periodName = typeof period === 'object' ? (period.name || period.title || '') : period;
  if (!periodName || typeof periodName !== 'string') return "/images/dong_son_drum.png";
  const name = periodName.toLowerCase();
  if (name.includes('hùng vương') || name.includes('hồng bàng') || name.includes('âu lạc') || name.includes('văn lang')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuCVTT2QqvD6K9-wucC1WkR7VZnFnP0rjHn6TrcyVqbMkCLEt-GrSb7RFMcwfuFYl9579qyI-CbhlttwgMYFgZtqaEK6hcj7gIzEvC-x8r1WJkxShSTdvgJAiGZim3mnjYlIdJsvmeUw2bip5ou99uGqVBVApXptp6Lpy5LmjEOMY2yZYFGSQzjZdZ5ZBKHO-vZMXFRcwX7gOF6f0s6dB3ZlO7K3KuUYQcdtVpUeP-fDnTut1_okhKeJqvG2OJTJ0xZCroTJlNoWryp1";
  if (name.includes('lý') || name.includes('ngô') || name.includes('đinh') || name.includes('tiền lê')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuB-vfyWu8AZJ8zXJcGYqxgtuwF8kgnNnxqHfqVCWu6IexNxd58MLyYryN2Pd4GPPIwQcgir92iGx39PPcocu5YwY0dKB88RM80ItVGkDs80nIlov0g4PRkKkWZqNqeAX2cgwfngoBoFqIt07Pir--2qzfNsUbTW8P_bXbYNjOL9IKt34YPVLuKa93Sk3GhQCaHLTecwGQGCZuSq0bnrOOq6oXKKmx5RiNGxRXHOQb6CiTjXlTeHajpZq_8iG4JClpUY9GWZsiRXvkTh";
  if (name.includes('trần') || name.includes('hồ') || name.includes('khúc') || name.includes('dương')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuBArlscw3wc_0llom4YXbNv7OUtmTW1u8adGJtB0r_R9ouLWRlOhBtwANhi8h-y-oKCXyjtcMAw-fv_DqJa8j9I0UYbf6VIaYfgHL50aCXOYoKCdQKYmjZdoMl1JYnzrRbkzkf79To66-2d-f1XfB1xrJTtxZoVqJiuNrqbgJSqttpHAF3wZGHnereJFQmlr7zvRv_OYZP3ifnXN8WYT8_1w8_n43OLOx1lJp01FpEjYuFGNSEqolT22CJMX1LelRwU2FVHe3Qq_fbP";
  if (name.includes('lê') || name.includes('mạc') || name.includes('trịnh') || name.includes('nguyễn') || name.includes('tây sơn')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuDDTXt3tOmQLzCboBJbQ63U5COKxdxaq5GrOn1775TXtXg3zq28AuTTb3mfVjKs6uj5Nkhc7auEFnCrMuCs6G4YIcZmzBgEE4ZdY3awqlP12VklH3BWkRe6Q83fhxNWatx1MbYcLIq7RztTsqI3HQRxPVW7T-TPQdwD7HM2eOSpwVHwup9Hp3K7KuNRjtoiaNSNbwvYXV_yv4pvRx5WIpTl05zH0YYusegbAB7v9qKEqrHI9SzL2DI2Hb0snIW35b9H7yKKrRRXIf79";
  
  if (name.includes('quân sự') || name.includes('chiến thắng') || name.includes('khởi nghĩa') || name.includes('kháng chiến') || name.includes('trận') || name.includes('điện biên phủ') || name.includes('độc lập')) return "/images/post_war.png";
  if (name.includes('văn hóa') || name.includes('xã hội') || name.includes('kinh tế') || name.includes('văn học') || name.includes('cải cách')) return "/images/post_culture.png";
  if (name.includes('lịch sử') || name.includes('tổng hợp') || name.includes('chính trị') || name.includes('cổ đại') || name.includes('cận đại') || name.includes('triều đại') || name.includes('bắc thuộc') || name.includes('địa danh')) return "/images/post_history.png";
  return "/images/dong_son_drum.png";
};

const UserPosts = () => {
  const { backgroundUrl = '' } = useOutletContext() || {};
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get('search') || '';
  const { getPeriodStyle } = usePeriodColors();
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [filterPeriod, setFilterPeriod] = useState('');
  const [articles, setArticles] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const ITEMS_PER_PAGE = 6;

  useEffect(() => {
    const fetchData = async () => {
      try {
        let dbPosts = [];
        try {
          const response = await postService.filter({ size: 500, status: 'PUBLISHED' });
          dbPosts = response.items || [];
        } catch (apiErr) {
          console.error('Lỗi gọi API bài viết:', apiErr);
        }

        try {
          const pRes = await periodService.filter({ size: 500, status: 'PUBLISHED' });
          const rawPeriods = pRes.items || [];
          setPeriods(rawPeriods.map(p => p.name).filter(Boolean));
        } catch (pErr) {
          console.error('Lỗi gọi API thời kỳ:', pErr);
        }

        let merged = dbPosts.map((dbItem, index) => {
          return {
            featured: index === 0,
            ...dbItem,
            id: dbItem.id,
            thumbnail_url: dbItem.imageUrl,
            dynasty: dbItem.tags?.[0]?.name || 'Lịch sử',
            dynasties: dbItem.tags && dbItem.tags.length > 0
              ? dbItem.tags.map(t => typeof t === 'object' ? t.name : t)
              : [dbItem.tags?.[0]?.name || 'Lịch sử'],
            startYear: dbItem.startYear || dbItem.event?.startYear || dbItem.eventStartYear,
            endYear: dbItem.endYear || dbItem.event?.endYear || dbItem.eventEndYear,
            readTime: '5 MIN',
            likes: parseInt(localStorage.getItem(`likesCount_${dbItem.slug || dbItem.id}`) || '0', 10),
            isLiked: localStorage.getItem(`liked_${dbItem.slug || dbItem.id}`) === 'true',
            comments: (() => {
              try {
                return JSON.parse(localStorage.getItem(`comments_${dbItem.slug || dbItem.id}`) || '[]').length;
              } catch (e) {
                return 0;
              }
            })(),
            author: dbItem.authorName || dbItem.createdBy,
            views: dbItem.viewCount || dbItem.views,
            createdAt: dbItem.createdAt ? new Date(dbItem.createdAt).toLocaleDateString('vi-VN') : null
          };
        });

        setArticles(merged);
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
  const safeSearchTermPosts = String(searchTerm || "").toLowerCase();
  let filteredArticles = articles.filter(a => !a.featured && (
    String(a.title || "").toLowerCase().includes(safeSearchTermPosts) ||
    String(a.summary || "").toLowerCase().includes(safeSearchTermPosts)
  ) && (
      filterPeriod ? (a.dynasties || [a.dynasty]).some(dyn => String(dyn || "").includes(filterPeriod.replace('Triều ', ''))) : true
    ));

  // Sắp xếp
  filteredArticles = [...filteredArticles].sort((a, b) => {
    if (sortBy === 'newest') {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : a.id;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : b.id;
      return dateB - dateA;
    } else if (sortBy === 'popular') {
      return (b.likes || 0) - (a.likes || 0);
    }
    return 0;
  });

  const totalPages = Math.ceil(filteredArticles.length / ITEMS_PER_PAGE);
  const paginatedArticles = filteredArticles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset pagination is now handled directly in input onChange handlers to satisfy eslint rules


  if (loading) return <div className="w-full min-h-[60vh] bg-transparent flex items-center justify-center font-body text-[#6b0f0d]">Đang tải bài viết...</div>;

  return (
    <div className="w-full relative font-body selection:bg-[#d99b4a]/20">
      {/* HERO SECTION */}
      <section className="relative h-[450px] flex items-center justify-center overflow-hidden border-b border-[#d99b4a]/30">
        <div className="absolute inset-0 z-0 bg-[#2b0504]">
          <img
            className="w-full h-full object-cover grayscale-[30%] sepia-[40%] brightness-[0.4] animate-ken-burns origin-center"
            src={backgroundUrl || MISC_IMAGES.DEFAULT_ERROR_FALLBACK}
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
                      src={featuredArt.thumbnail_url ? featuredArt.thumbnail_url + '?v=2' : undefined}
                      alt="Featured"
                      onError={(e) => {
                        e.target.onerror = null;
                        const dynasty = (featuredArt.dynasties || [featuredArt.dynasty])[0] || '';
                        e.target.src = getFallbackImage(dynasty);
                      }}
                    />
                  </Link>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/60 to-transparent opacity-60 pointer-events-none"></div>
                  <div className="absolute top-6 left-6 z-10">
                    <span className="bg-[#6b0f0d] text-[#ffe7b0] px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest shadow-md">Nghiên cứu đặc biệt</span>
                  </div>
                </div>

                <div className="lg:col-span-5 p-12 flex flex-col justify-center bg-[#fcf9ee]/90 backdrop-blur-sm relative">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(featuredArt.dynasties || [featuredArt.dynasty]).map((dyn, idx) => (
                      <span key={idx} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${getPeriodStyle(dyn)}`}>
                        {dyn}
                      </span>
                    ))}
                  </div>
                  <Link to={`/articles/${featuredArt.slug}`}>
                    <h3 className="font-headline text-4xl text-[#2b0504] mb-6 leading-tight font-semibold hover:text-[#6b0f0d] transition-colors cursor-pointer tracking-tight">
                      {featuredArt.title}
                    </h3>
                  </Link>
                  <p className="font-body text-[15px] text-[#2b1a16]/80 mb-6 leading-relaxed">
                    {stripHtml(featuredArt.summary || '')}
                  </p>

                  {(featuredArt.startYear || featuredArt.endYear) && (
                    <div className="flex items-center gap-2 mb-4 font-body text-[12px] text-[#6b0f0d] font-bold uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                      <span>
                        {featuredArt.startYear === featuredArt.endYear || !featuredArt.endYear
                          ? featuredArt.startYear
                          : !featuredArt.startYear ? featuredArt.endYear : `${featuredArt.startYear} - ${featuredArt.endYear}`}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-8 text-[#2b1a16]/60 text-xs font-body font-medium">
                    {featuredArt.author && <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">edit_square</span> Biên soạn: {featuredArt.author}</div>}
                    {featuredArt.views != null && <div className="flex items-center gap-1.5"><span className="material-symbols-outlined text-[14px]">visibility</span> {featuredArt.views} lượt xem</div>}
                  </div>

                  <div className="flex items-center justify-end mt-auto">
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
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#fcf9ee]/50 border border-[#d99b4a]/30 text-[#2b1a16] placeholder-[#6b0f0d]/40 rounded-lg py-3 pl-12 pr-4 outline-none focus:border-[#6b0f0d]/60 transition-colors font-body shadow-inner"
              />
            </div>
            <div className="relative md:w-64 w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60">filter_alt</span>
              <select
                value={filterPeriod}
                onChange={e => {
                  setFilterPeriod(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#fcf9ee]/50 border border-[#d99b4a]/30 text-[#2b1a16] rounded-lg py-3 pl-12 pr-10 appearance-none outline-none focus:border-[#6b0f0d]/60 transition-colors font-body cursor-pointer shadow-inner"
              >
                <option value="">Tất cả triều đại</option>
                {periods.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60 pointer-events-none">expand_more</span>
            </div>
            <div className="flex items-center gap-4 px-4 font-body border-l border-[#d99b4a]/20">
              <span className="text-[#2b1a16]/60 text-[10px] font-bold uppercase hidden md:inline">Sắp xếp:</span>
              <button
                onClick={() => { setSortBy('newest'); setCurrentPage(1); }}
                className={`${sortBy === 'newest' ? 'text-[#6b0f0d] border-b-2 border-[#6b0f0d]' : 'text-[#2b1a16]/60 hover:text-[#6b0f0d]'} font-bold text-[11px] uppercase tracking-widest transition-all`}
              >
                Mới nhất
              </button>
              <button
                onClick={() => { setSortBy('popular'); setCurrentPage(1); }}
                className={`${sortBy === 'popular' ? 'text-[#6b0f0d] border-b-2 border-[#6b0f0d]' : 'text-[#2b1a16]/60 hover:text-[#6b0f0d]'} font-bold text-[11px] uppercase tracking-widest transition-all`}
              >
                Đọc nhiều
              </button>
            </div>
          </div>
        </div>

        {/* 3. POST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {paginatedArticles.map((art) => (
            <article key={art.id || art.post_id} className="group bg-[#fffdf8] border border-[#d99b4a]/30 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-500 flex flex-col relative overflow-hidden">
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
                      src={art.thumbnail_url ? art.thumbnail_url + '?v=2' : undefined}
                      alt={art.title}
                      onError={(e) => {
                        e.target.onerror = null;
                        const dynasty = (art.dynasties || [art.dynasty])[0] || '';
                        e.target.src = getFallbackImage(dynasty);
                      }}
                    />
                  </Link>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/60 to-transparent opacity-70 pointer-events-none"></div>
                  <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-1.5">
                    {(art.dynasties || []).map((dyn, idx) => (
                      <span key={idx} className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border shadow-md ${getPeriodStyle(dyn)}`}>
                        {dyn}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow relative z-10">
                  <Link to={`/articles/${art.slug}`}>
                    <h4 className="font-headline text-2xl text-[#2b0504] font-semibold group-hover:text-[#6b0f0d] transition-colors mb-4 leading-tight tracking-tight">
                      {art.title}
                    </h4>
                  </Link>
                  <p className="font-body text-[14px] text-[#2b1a16]/80 line-clamp-3 mb-4 leading-relaxed">
                    {stripHtml(art.summary)}
                  </p>

                  {(art.startYear || art.endYear) && (
                    <div className="flex items-center gap-1.5 mb-3 font-body text-[10px] text-[#6b0f0d] font-bold uppercase tracking-widest">
                      <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                      <span>
                        {art.startYear === art.endYear || !art.endYear
                          ? art.startYear
                          : !art.startYear ? art.endYear : `${art.startYear} - ${art.endYear}`}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-x-4 gap-y-2 mb-6 text-[#2b1a16]/50 text-[10px] font-body uppercase tracking-wider font-bold">
                    {art.author && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">person</span> {art.author}</span>}
                    {art.createdAt && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">update</span> {art.createdAt}</span>}
                    {art.views != null && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">visibility</span> {art.views}</span>}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#d99b4a]/20 mt-auto font-body">
                    <div className="flex gap-4">
                      <span className={`flex items-center gap-1.5 text-[10px] font-bold ${art.isLiked ? 'text-[#6b0f0d]' : 'text-[#6b0f0d]/70'}`}>
                        <Heart size={16} strokeWidth={2} fill={art.isLiked ? 'currentColor' : 'none'} /> {art.likes}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-[#6b0f0d]/70">
                        <MessageSquare size={16} strokeWidth={2} /> {art.comments}
                      </span>
                    </div>
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
