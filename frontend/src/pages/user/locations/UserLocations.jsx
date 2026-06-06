import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import VietnamMap from '../../../components/VietnamMap';

// --- MẢNG DỮ LIỆU ĐỊA DANH LỊCH SỬ ---
const locations = [
  {
    id: 1,
    name: 'Cố đô Huế',
    province: 'Thừa Thiên Huế',
    type: 'Kinh đô cổ',
    period: 'Nhà Nguyễn',
    x: 63, y: 50,
    desc: 'Kinh đô của triều đại nhà Nguyễn, biểu tượng cho quyền lực và sự tinh xảo trong kiến trúc phong kiến.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAy9HOsSy2w5f4u8FOROpkAqDh91oFc040gmrIqvtUnfdASl5Yv9fpuP_-v4xHO4hsVTXFgvPoQU1zC-N-xtLmqBi7yI1Z5ywQqyAB92yDXzJ00RHI38gz9tYVAVrPha-f4mvXsYjgaUHHeWvmRY0PhijQlbC0VRcBNS3-RfERtElu_eZ5o6c8rXInSXEzTRrYZaxDQ65FF6EICyYGBypPopErqsIRLrd_nuI4027TYKL4-azB9b0bnqQbJXIfHzi3tPXRGwi212ueN',
    famousCharacters: ['Vua Gia Long', 'Vua Minh Mạng'],
    timeline: [{ year: '1802', event: 'Định đô' }, { year: '1945', event: 'Thoái vị' }],
    aiPrompt: 'Tại sao Vua Gia Long lại quyết định dời đô vào Phú Xuân Huế?'
  },
  {
    id: 2,
    name: 'Hoàng Thành Thăng Long',
    province: 'Hà Nội',
    type: 'Hoàng thành',
    period: 'Nhà Lý',
    x: 48, y: 20,
    desc: 'Trung tâm chính trị, văn hóa quan trọng nhất của Việt Nam trong suốt 13 thế kỷ liên tiếp từ thời Lý đến Nguyễn.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCc93rr9Ln2v2v8oDXqcTThoFyvbU-lGRm-n2qyByLfGgx6QaY8sv2gDhR7DX3C83E0dbHwOLQSfFneh__EzEdMIz5U1dLpfRjorC21h4GwJ1bAJ3Vl2qOppE6m6VD4jtyZ2jO6RuPzfsRHwZdIp8QH-Bgt0FH1yyQKXZ-5zdQx0pJHYJ5aSKr4B2aRWDJMh4kFEjJT5T9SRT20VT6MDYN7vANjbJ2FcJ3nj4xLYwONlrcSAe0eCojuMEzE0EMelzyrqrXy6TDFvRWW',
    famousCharacters: ['Lý Thái Tổ', 'Lê Thánh Tông'],
    timeline: [{ year: '1010', event: 'Dời đô' }],
    aiPrompt: 'Hoàng thành Thăng Long có những hiện vật quý giá nào?'
  },
  {
    id: 3,
    name: 'Cố đô Hoa Lư',
    province: 'Ninh Bình',
    type: 'Kinh đô cổ',
    period: 'Nhà Đinh',
    x: 52, y: 25,
    desc: 'Kinh đô đầu tiên của nước Việt độc lập sau 1000 năm Bắc thuộc, gắn liền với sự nghiệp thống nhất của Đinh Bộ Lĩnh.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4zEJVUzoNRwMJqYZdNwfr3q46wbgd1Hrw79_Mrt3_mSJVw9bDu4ty1xtGhd2WK13hV5LE4tvo-wI2GtqJv4U3w-soRt_ywdRAGCGL4bosK_ZmVvCPzizbLil7IDmYzsyz3QssJMF5u9zfxauzzPQ0z4yRTsF0VJyJyaFh3CSaceFdiTeEan44feuxMDSnkuNeXhg_b2CQezVPHci4oGO9PrrDXqsB_0wP3V4jwpH9Akka8QC3XacpsLnreP6LoTmLCn08_v3Yds6s',
    famousCharacters: ['Đinh Tiên Hoàng', 'Lê Đại Hành'],
    timeline: [{ year: '968', event: 'Lập quốc' }],
    aiPrompt: 'Địa thế Hoa Lư hiểm trở như thế nào?'
  },
  {
    id: 4,
    name: 'Văn Miếu - Quốc Tử Giám',
    province: 'Hà Nội',
    type: 'Di tích văn hóa',
    period: 'Nhà Lý',
    x: 48, y: 19,
    desc: 'Trường đại học đầu tiên của Việt Nam, nơi lưu giữ tinh hoa khoa bảng ngàn năm và 82 tấm bia Tiến sĩ quý giá.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmNocjFRWbOeTTb4D0X6GrSEqRqAXqYKuZffaLLwlhDsSOh0IFLQkAgBfW2d1MdC4FTUsi96mBv2FryFIh-X2wAsezin7d4QckXyAroun0MplIEGEDNN6v6Y6vsl1otxU8kond2lnWMMIZdA1xNS5XKkNquZrLNF83nVGEYXFHFFKkc1gAgMDV_OLj-wHq6I7ziUbvMbrilELjQCgrDGH3ua9wBkEfakzf1loum-zGM5B7q7hkOf7FFNZJh7sLDFiihew0LiUD-bCo',
    famousCharacters: ['Chu Văn An', 'Lý Nhân Tông'],
    timeline: [{ year: '1070', event: 'Khởi dựng' }],
    aiPrompt: 'Ý nghĩa của 82 bia Tiến sĩ tại Văn Miếu.'
  },
  {
    id: 5,
    name: 'Di tích Lam Kinh',
    province: 'Thanh Hóa',
    type: 'Khu lăng tẩm',
    period: 'Nhà Lê Sơ',
    x: 46, y: 30,
    desc: 'Nơi phát tích của cuộc khởi nghĩa Lam Sơn và là khu lăng tẩm hoàng gia linh thiêng của vương triều Hậu Lê.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDh48rEx3whFt-uLgXeFfaouAxswoghSNKU3kZ0uZthttK9uZCGTtlrwat-dkOuIDQm8JgoQQgtoI5UE7kWk5locGj5ph9lA_kJAM1vAKKqJp6lTSacw_RMEvhyo3E4Crdwo-zQY3o80VtVsvTy8v-t1RELwDqRYwfd7MTtX9U1B9MtfFli_rLejuz-vyFk7E25UI5VQYur_BU3UwparR335gjSs06YNDEsCDfa1gea0wCV15Q-yk7VAsxz7yMHk6wx439Phkko_zFW',
    famousCharacters: ['Lê Lợi', 'Nguyễn Trãi'],
    timeline: [{ year: '1433', event: 'Xây dựng' }],
    aiPrompt: 'Kiến trúc phong thủy của khu lăng tẩm Lam Kinh.'
  },
  {
    id: 6,
    name: 'Sông Bạch Đằng',
    province: 'Quảng Ninh - Hải Phòng',
    type: 'Di tích lịch sử',
    period: 'Nhà Ngô',
    x: 52, y: 15,
    desc: 'Dòng sông lịch sử nơi Ngô Quyền đánh tan quân Nam Hán năm 938, mở đầu thời kỳ độc lập dân tộc.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBArlscw3wc_0llom4YXbNv7OUtmTW1u8adGJtB0r_R9ouLWRlOhBtwANhi8h-y-oKCXyjtcMAw-fv_DqJa8j9I0UYbf6VIaYfgHL50aCXOYoKCdQKYmjZdoMl1JYnzrRbkzkf79To66-2d-f1XfB1xrJTtxZoVqJiuNrqbgJSqttpHAF3wZGHnereJFQmlr7zvRv_OYZP3ifnXN8WYT8_1w8_n43OLOx1lJp01FpEjYuFGNSEqolT22CJMX1LelRwU2FVHe3Qq_fbP',
    famousCharacters: ['Ngô Quyền', 'Trần Hưng Đạo'],
    timeline: [{ year: '938', event: 'Đại thắng Nam Hán' }],
    aiPrompt: 'Trận cọc gỗ Bạch Đằng năm 938.'
  },
  {
    id: 7,
    name: 'Đường Lâm',
    province: 'Hà Nội',
    type: 'Làng cổ',
    period: 'Nhà Ngô',
    x: 47, y: 19,
    desc: 'Làng cổ nghìn năm tuổi, quê hương của Ngô Quyền vị vua mở đầu kỷ nguyên độc lập dân tộc.',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDDTXt3tOmQLzCboBJbQ63U5COKxdxaq5GrOn1775TXtXg3zq28AuTTb3mfVjKs6uj5Nkhc7auEFnCrMuCs6G4YIcZmzBgEE4ZdY3awqlP12VklH3BWkRe6Q83fhxNWatx1MbYcLIq7RztTsqI3HQRxPVW7T-TPQdwD7HM2eOSpwVHwup9Hp3K7KuNRjtoiaNSNbwvYXV_yv4pvRx5WIpTl05zH0YYusegbAB7v9qKEqrHI9SzL2DI2Hb0snIW35b9H7yKKrRRXIf79',
    famousCharacters: ['Ngô Quyền', 'Phùng Hưng'],
    timeline: [{ year: '898', event: 'Ngô Quyền ra đời' }],
    aiPrompt: 'Đường Lâm ấp 2 vua.'
  }
];

export default function UserLocations() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDynasty, setSelectedDynasty] = useState('');
  const navigate = useNavigate();

  // Map state
  const [selectedSite, setSelectedSite] = useState(locations[0]);
  const [hoveredSite, setHoveredSite] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Filter logic
  let displayedLocations = locations;
  if (selectedDynasty) {
    displayedLocations = displayedLocations.filter(loc => loc.period === selectedDynasty);
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    displayedLocations = displayedLocations.filter(loc =>
      loc.name.toLowerCase().includes(q) ||
      loc.province.toLowerCase().includes(q)
    );
  }

  // Get unique dynasties for filter
  const dynasties = [...new Set(locations.map(l => l.period))];

  return (
    <div className="bg-[#f4f6f8] min-h-screen font-body pb-20 relative">
      {/* RED BANNER HEADER */}
      <div className="bg-[#9e1b1b] text-white pt-10 pb-12 px-6 md:px-12 w-full">
        <div className="max-w-[1440px] mx-auto">

          <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4 drop-shadow-md">Di Tích Lịch Sử Việt Nam</h1>
          <p className="text-white/90 max-w-2xl text-base mb-10 leading-relaxed font-body">
            Khám phá di sản văn hóa đa dạng của Việt Nam qua những công trình kiến trúc, đền đài, lăng tẩm có giá trị lịch sử, văn hóa, và khoa học.
          </p>

          <div className="flex flex-col md:flex-row gap-4 max-w-3xl">
            {/* Search */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/70">search</span>
              <input
                type="text"
                placeholder="Tìm kiếm di tích..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 rounded-md py-3 pl-12 pr-4 outline-none focus:bg-white/20 transition-colors font-body"
              />
            </div>
            {/* Filter */}
            <div className="relative md:w-64">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/70">filter_alt</span>
              <select
                value={selectedDynasty}
                onChange={e => setSelectedDynasty(e.target.value)}
                className="w-full bg-transparent border border-white/40 text-white rounded-md py-3 pl-12 pr-10 appearance-none outline-none focus:bg-white/10 transition-colors font-body cursor-pointer [&>option]:text-black"
              >
                <option value="">Tất cả thời kỳ</option>
                {dynasties.map(dyn => (
                  <option key={dyn} value={dyn}>{dyn}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">expand_more</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 mt-8">
        {/* VIEW MODE TOGGLE */}
        <div className="flex justify-end mb-6 relative z-10">
          <div className="flex bg-white/80 backdrop-blur rounded-lg p-1 shadow-sm border border-gray-100">
            <button onClick={() => setViewMode('grid')} className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#9e1b1b]' : 'text-gray-500 hover:text-gray-700'}`}>
              <span className="material-symbols-outlined text-[18px]">grid_view</span> Lưới
            </button>
            <button onClick={() => setViewMode('map')} className={`px-4 py-1.5 rounded-md flex items-center gap-2 text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-[#9e1b1b]' : 'text-gray-500 hover:text-gray-700'}`}>
              <span className="material-symbols-outlined text-[18px]">map</span> Bản đồ
            </button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        {viewMode === 'grid' ? (
          /* GRID VIEW */
          displayedLocations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedLocations.map((loc) => (
                <motion.div
                  key={loc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => navigate(`/locations/${loc.id}`)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow cursor-pointer group flex flex-col h-full border border-gray-100"
                >
                  <div className="relative h-60 w-full overflow-hidden">
                    <img
                      src={loc.image}
                      alt={loc.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-[#9e1b1b] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {loc.province}
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      {loc.period}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-wider rounded-md w-fit mb-3">
                      {loc.type}
                    </div>
                    <h3 className="font-headline text-2xl font-bold text-gray-900 mb-3 group-hover:text-[#9e1b1b] transition-colors line-clamp-1">{loc.name}</h3>
                    <p className="text-gray-600 font-body text-sm leading-relaxed line-clamp-3 mb-4">
                      {loc.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <div className="inline-flex w-20 h-20 bg-gray-100 rounded-full items-center justify-center text-gray-400 mb-4">
                <span className="material-symbols-outlined text-4xl">search_off</span>
              </div>
              <h3 className="font-headline text-2xl font-bold text-gray-700 mb-2">Không tìm thấy di tích nào</h3>
              <p className="text-gray-500 font-body">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          )
        ) : (
          /* MAP VIEW */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch mt-4">
            {/* CỘT TRÁI: BẢN ĐỒ TƯƠNG TÁC */}
            <div className="lg:col-span-7 relative bg-[#fffdf8] border border-gray-200 rounded-2xl p-8 shadow-sm overflow-hidden flex flex-col justify-center min-h-[700px]">
              <div className="absolute inset-0 dong-son-pattern opacity-[0.03] pointer-events-none"></div>

              <div className="relative w-full max-w-[450px] aspect-square mx-auto flex items-center justify-center z-10">
                <VietnamMap
                  className="absolute inset-0 w-full h-full drop-shadow-[0_15px_30px_rgba(158,27,27,0.2)] transition-transform duration-700"
                />

                {displayedLocations.map((site) => {
                  const isSelected = selectedSite?.id === site.id;
                  return (
                    <div
                      key={site.id}
                      className="absolute cursor-pointer transition-all duration-500 z-20"
                      style={{ left: `${site.x}%`, top: `${site.y}%` }}
                      onClick={() => setSelectedSite(site)}
                      onMouseEnter={() => setHoveredSite(site)}
                      onMouseLeave={() => setHoveredSite(null)}
                    >
                      <div className="relative flex items-center justify-center">
                        <div className={`absolute rounded-full transition-all duration-1000 ${isSelected ? 'w-14 h-14 bg-[#9e1b1b]/20 animate-ping' : 'w-0 h-0'}`} />

                        <div className={`relative w-8 h-8 flex items-center justify-center rounded-full border-2 transition-all duration-300 ${isSelected
                          ? 'bg-[#9e1b1b] border-white text-white scale-125 shadow-lg z-30'
                          : 'bg-white border-[#9e1b1b]/30 text-[#9e1b1b] hover:border-[#9e1b1b] z-20'
                          }`}>
                          <span className="material-symbols-outlined text-[16px]">
                            {site.type === 'Hoàng thành' ? 'castle' : (site.type === 'Di tích văn hóa' || site.type === 'Khu lăng tẩm') ? 'history_edu' : 'account_balance'}
                          </span>
                        </div>

                        <div className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-[10px] font-bold tracking-widest uppercase rounded-sm shadow-xl whitespace-nowrap transition-all duration-300 pointer-events-none ${hoveredSite?.id === site.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                          {site.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-between items-center text-[10px] font-body font-bold text-gray-400 uppercase tracking-[0.2em]">
                <span>* Chạm vào điểm mốc để diện kiến sử xanh</span>
                <span>Đại Việt Quốc Đồ</span>
              </div>
            </div>

            {/* CỘT PHẢI: CHI TIẾT */}
            <div className="lg:col-span-5 flex flex-col relative z-20">
              <AnimatePresence mode="wait">
                {selectedSite && displayedLocations.find(l => l.id === selectedSite.id) ? (
                  <motion.div
                    key={selectedSite.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    className="bg-white border border-gray-200 p-8 shadow-sm rounded-2xl flex flex-col h-full relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-6 relative z-10">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 bg-gray-50 w-fit px-2 py-1 rounded-md text-gray-600">
                          <span className="material-symbols-outlined text-[14px]">
                            {selectedSite.type === 'Hoàng thành' ? 'castle' : (selectedSite.type === 'Di tích văn hóa' || selectedSite.type === 'Khu lăng tẩm') ? 'history_edu' : 'account_balance'}
                          </span>
                          <span className="font-body text-[10px] font-bold uppercase tracking-widest">
                            {selectedSite.type}
                          </span>
                        </div>
                        <h3 className="font-headline text-3xl lg:text-4xl text-gray-900 font-bold leading-tight">{selectedSite.name}</h3>
                      </div>
                    </div>

                    <div className="w-full h-48 mb-6 relative overflow-hidden rounded-xl">
                      <img
                        src={selectedSite.image}
                        alt={selectedSite.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Location Badge */}
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur text-[#9e1b1b] text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                        {selectedSite.province}
                      </div>
                      {/* Period Badge */}
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur text-gray-700 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {selectedSite.period}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-6 relative z-10">
                      <p className="font-headline text-lg text-gray-800 mb-2 font-semibold">Tóm lược sớ sử</p>
                      <p className="text-gray-600 leading-relaxed font-body text-sm">{selectedSite.desc}</p>
                    </div>

                    {selectedSite.famousCharacters && (
                      <div className="mb-8 relative z-10">
                        <p className="font-body text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]">history_edu</span> Nhân vật liên quan
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSite.famousCharacters.map(char => (
                            <span key={char} className="px-3 py-1.5 bg-white text-gray-700 text-[11px] font-bold rounded-md shadow-sm border border-gray-200">{char}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto space-y-3 relative z-10">
                      <button
                        onClick={() => navigate(`/locations/${selectedSite.id}`)}
                        className="w-full py-3.5 bg-[#9e1b1b] text-white font-bold text-sm rounded-xl shadow-md hover:bg-[#b02a2a] active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        XEM CHI TIẾT <span className="material-symbols-outlined text-[18px]">east</span>
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-40 bg-white border border-gray-200 rounded-2xl">
                    <span className="material-symbols-outlined text-[80px] mb-4 text-gray-400">explore</span>
                    <p className="font-headline text-xl font-bold text-gray-600">Chọn một điểm di tích trên Bản đồ</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}