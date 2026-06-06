import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const UserCharacters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activePeriod, setActivePeriod] = useState('Tất cả thời kỳ');

  const characters = [
    {
      id: 1,
      name: 'Lê Thái Tổ',
      realName: 'Lê Lợi',
      years: '1385 - 1433',
      dynasty: 'Nhà Lê Sơ',
      desc: 'Người khởi xướng khởi nghĩa Lam Sơn, đánh đuổi quân Minh và thành lập nhà Hậu Lê, mở ra thời kỳ độc lập tự chủ lâu dài cho dân tộc.',
      achievements: [
        'Lãnh đạo khởi nghĩa Lam Sơn thắng lợi',
        'Sáng lập triều đại nhà Hậu Lê'
      ],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkXCL0ZlfPvy43z13A0y1bG_eAez20SasQjlbmMYN0ksU6u2mv7H7wD2kxlQgr5TVFjQXQIMB18PYpL0LebO68DVPdFgMGK1agh4KI4EyQ4Me3ooBfg3K1JiZq7cmSnu-1GzPq8ZGlH-VSmNdibOhBNI1pOIAdA-TqjbomhMxBCsnmpa0JmnR7PFbba9_7Bb2hR96-_FaIwMv6EGVpO58GxtObun-s6BQINyccTPHf67jr-DfzH_Qpx755igURlGi5zCpsjNp-WJmX'
    },
    {
      id: 2,
      name: 'Nguyễn Trãi',
      realName: 'Ức Trai',
      years: '1380 - 1442',
      dynasty: 'Nhà Lê Sơ',
      desc: 'Anh hùng dân tộc, danh nhân văn hóa thế giới. Tác giả của Bình Ngô Đại Cáo - bản tuyên ngôn độc lập thứ hai của nước Việt.',
      achievements: [
        'Tác giả Bình Ngô Đại Cáo',
        'Khai quốc công thần nhà Hậu Lê'
      ],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOm0BuewNGMMyw3hbNXvp09kmzgSCa95fsr7xfiUxlvICLTrjie4q-P_kpsq1-_73pO_mgOU8hLTaQrzHvDaMYqlFUG2FrBoUcyfMkpG1lANyWQeqePO2u_YemlnwWAk9gtUHZtsVY3LL9QnlDgOnPfZdnfUUHlpFLc07haID26fE6xWRx8K7M2WAXSwgPBtANe1iypQc0J8akbCG6qc8vr_9EkIWL9IXDozwxHl8aNks3TY7Qd2PuTV3mBCUIGSBl_7yT23XtHidO'
    },
    {
      id: 3,
      name: 'Trần Hưng Đạo',
      realName: 'Trần Quốc Tuấn',
      years: '1228 - 1300',
      dynasty: 'Nhà Trần',
      desc: 'Vị tướng thiên tài ba lần lãnh đạo quân dân nhà Trần đánh bại quân xâm lược Nguyên Mông hùng mạnh nhất thế giới lúc bấy giờ.',
      achievements: [
        'Ba lần đánh bại quân Nguyên Mông',
        'Tác giả Hịch tướng sĩ'
      ],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKuKjwQFwNQohxy16nvgPodBX9xYlr_xfJyAOLcN1j3ReQY_2BJIBSqRQtNXYZyclOHFwkPeYLBnlikMDpNgGR6cMx-daUsK6HcblyL3JgmceKk24uLN64Cfwy0NVVPHqpaRNc2ly-EJQCL2iinxOqCCI4hauJSNHNDnEmU16YR5iLpog0SXF2T9R7VNsaXlSQwNrxQLlQhE8SG5hIpLchfYvsEBVJJeX4Ez0p4Lm6E2u-PzMPRPc8CC7_NspWPQZhmSiLo2qBr_9H'
    },
    {
      id: 4,
      name: 'Lý Thường Kiệt',
      realName: 'Ngô Tuấn',
      years: '1019 - 1105',
      dynasty: 'Nhà Lý',
      desc: 'Vị thái úy lỗi lạc, tác giả của bài thơ thần "Nam Quốc Sơn Hà" và chiến dịch phạt Tống lẫy lừng phương Bắc.',
      achievements: [
        'Tác giả Nam Quốc Sơn Hà',
        'Chỉ huy chiến dịch phạt Tống'
      ],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxohlRm6oJEIxb7Q32dWdgEtmNJ9C8kOK_OYXlTGjF6mAzT-bhvf_qbDN0xjjcA-N-S-W0anAvRa0G_WIYCHgEhnKlfVsfkoA_AiLpgmjN04u1Dhfqn_NTprJiPaZmFQY1_3IWZOTdomizXHnxRcKDRNqQk0QuIfgFoFVO12OqOa13lb2t0fTb1f897BvKcYezckMsQro_aNJEdd-wRYU8EDxaXSz-Rwo15yRsuccDhBdgg1u4lq_KHVxzNkrGQFGIa4Pq09wyvCD0'
    },
    {
      id: 5,
      name: 'Hồ Xuân Hương',
      realName: 'Bà chúa thơ Nôm',
      years: '1772 - 1822',
      dynasty: 'Tây Sơn / Nguyễn',
      desc: '"Bà chúa thơ Nôm" với những tác phẩm độc đáo, táo bạo, mang đậm tinh thần nhân văn và đấu tranh cho nữ quyền.',
      achievements: [
        'Được mệnh danh "Bà chúa thơ Nôm"',
        'Danh nhân văn hóa thế giới'
      ],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEqU9ughoF8Lb1OyIIdd3TMKkvgBGcLAxEbaSsQ0yk_XWi3GKPZwQQ1zlkZb73LawSDjLW9iQCar6TFU7XAZE-nA1ykBJhawTohOTraQtXMRjqvh7xfJF7dyIjyId4Xvg8wean3yJ3KpLUg9SP2NqYS-FK9CLXTW5YCS8Ib9Dcgs2UXn25GQNlY8Ssp5rr255X5-r0tZDrr2Gli3VAHxvLjE3qFIR8xoiIsQsTLTto-9iYz9aMrVq4eOgy_XJ_n5qxBrHfX-3TZ8wa'
    },
    {
      id: 6,
      name: 'Chu Văn An',
      realName: 'Tuyết Giang Phu Tử',
      years: '1292 - 1370',
      dynasty: 'Nhà Trần',
      desc: '"Người thầy của muôn đời", nổi tiếng với đạo đức trong sáng và tinh thần không khuất phục trước cường quyền.',
      achievements: [
        'Người thầy của muôn đời',
        'Dâng Thất trảm sớ'
      ],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2cNHZGKf1tEph8k3mfH5LBfN1X0x4eE-zzos4IYc58cNuYh8UawZwgBGApzvk4V3TIxBepyGKHyyS6jq_c93SaWAU4_2a9e2_ilbgZFR7SvCUjms2VpdjL0Z6o-04KinCJ-uRAXRaKNGSqipZdvYSwZn4tMMuuPn71SmGREiZm04HVjnJPP4bBMq6C_2NUD4dShAF_BkxRwUCfuEs0pVuSAXdzPFocwTPtzMtKVkqbPUWN-UltPHVc4VhR0J0nWe3BKUBBxj0zglW'
    }
  ];

  const periods = ['Tất cả thời kỳ', 'Nhà Lý', 'Nhà Trần', 'Nhà Lê Sơ', 'Tây Sơn / Nguyễn'];

  const filteredCharacters = characters.filter(char => {
    const matchesSearch = char.name.toLowerCase().includes(searchTerm.toLowerCase()) || char.realName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPeriod = activePeriod === 'Tất cả thời kỳ' || char.dynasty.includes(activePeriod);
    return matchesSearch && matchesPeriod;
  });

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20 pb-24 relative overflow-hidden">

      {/* Background Texture for Cinematic feel */}
      <div className="absolute top-0 left-0 right-0 h-[400px] bg-gradient-to-b from-[#fcf9ee] to-transparent pointer-events-none"></div>

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 py-16 relative z-10 animate-in fade-in slide-in-from-bottom-10 duration-700">

        {/* HEADER SECTION */}
        <header className="mb-14 flex flex-col items-center text-center">
          <h1 className="font-headline text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[#6b0f0d] drop-shadow-sm">
            Nhân vật lịch sử Việt Nam
          </h1>
          <p className="font-body text-[#2b1a16]/80 text-lg max-w-2xl italic">
            "Tuy mạnh yếu từng lúc khác nhau, song hào kiệt đời nào cũng có."
            <span className="block mt-2 text-[11px] not-italic uppercase tracking-widest text-[#d99b4a] font-bold">— Bình Ngô Đại Cáo —</span>
          </p>
        </header>

        {/* SEARCH & FILTER BAR */}
        <div className="bg-[#fffdf8]/90 backdrop-blur-md rounded-xl shadow-md border border-[#d99b4a]/40 p-4 mb-12 flex flex-col md:flex-row gap-4 items-center justify-between relative z-20">
          <div className="relative w-full md:w-[40%]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên nhân vật..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#fcf9ee]/50 border border-[#d99b4a]/30 rounded-lg text-[15px] font-body text-[#2b1a16] placeholder-[#6b0f0d]/40 focus:outline-none focus:ring-1 focus:ring-[#6b0f0d]/20 focus:border-[#6b0f0d]/60 transition-all shadow-inner"
            />
          </div>

          <div className="relative w-full md:w-[30%]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60">filter_alt</span>
            <select
              value={activePeriod}
              onChange={(e) => setActivePeriod(e.target.value)}
              className="w-full pl-12 pr-10 py-3 bg-[#fcf9ee]/50 border border-[#d99b4a]/30 rounded-lg text-[15px] font-body text-[#2b1a16] appearance-none focus:outline-none focus:ring-1 focus:ring-[#6b0f0d]/20 focus:border-[#6b0f0d]/60 transition-all cursor-pointer shadow-inner">
              {periods.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60 pointer-events-none">expand_more</span>
          </div>

          <div className="w-full md:w-auto flex items-center justify-end text-[14px] text-[#2b1a16]/70 gap-2 font-medium font-body uppercase tracking-wider text-[11px]">
            <span className="material-symbols-outlined text-[16px] text-[#d99b4a]">sort</span>
            Đang hiển thị {filteredCharacters.length} / {characters.length} nhân vật
          </div>
        </div>

        {/* GALLERY GRID */}
        {filteredCharacters.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredCharacters.map((char) => (
              <div key={char.id} className="bg-[#fffdf8] rounded-xl shadow-[0_4px_20px_rgba(43,5,4,0.06)] border border-[#d99b4a]/30 overflow-hidden flex flex-col group hover:shadow-[0_12px_30px_rgba(107,15,13,0.12)] transition-all duration-500 transform hover:-translate-y-1">

                {/* Image section */}
                <div className="relative h-[300px] w-full overflow-hidden shrink-0 border-b-2 border-[#d99b4a]/20">
                  <img
                    src={char.image}
                    alt={char.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 sepia-[0.1]"
                  />

                  {/* Dynasty badge */}
                  <div className="absolute top-4 right-4 bg-[#6b0f0d]/95 backdrop-blur-sm border border-[#d99b4a]/40 text-[#ffe7b0] text-[10px] font-bold px-4 py-1.5 rounded-full z-10 shadow-lg uppercase tracking-widest">
                    {char.dynasty}
                  </div>

                  {/* Gradient overlay for bottom text */}
                  <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#1a0201] via-[#1a0201]/50 to-transparent pointer-events-none"></div>

                  {/* Name and years */}
                  <div className="absolute bottom-5 left-5 right-5 text-[#ffe7b0] z-10">
                    <h2 className="font-headline text-[30px] font-bold tracking-wide leading-tight drop-shadow-md">
                      {char.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[16px] opacity-90 font-medium font-body text-[#f7d78a]">({char.realName})</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#d99b4a] opacity-80"></span>
                      <span className="text-[13px] opacity-80 font-medium tracking-widest">{char.years}</span>
                    </div>
                  </div>
                </div>

                {/* Content section */}
                <div className="p-6 flex flex-col flex-grow relative bg-[#fffdf8] dong-son-pattern-subtle">
                  <p className="text-[#2b1a16]/80 text-[14px] leading-relaxed mb-6 line-clamp-3 font-body relative z-10">
                    {char.desc}
                  </p>

                  <div className="mb-6 relative z-10">
                    <h3 className="text-[#6b0f0d] font-bold text-[14px] mb-4 flex items-center gap-2 uppercase tracking-wider text-[11px] border-b border-[#d99b4a]/20 pb-2">
                      <span className="material-symbols-outlined text-[18px] text-[#d99b4a]">military_tech</span> Chi Tiết Tiêu Biểu:
                    </h3>
                    <ul className="space-y-3">
                      {char.achievements.map((ach, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-[14px] text-[#2b1a16]/90 font-body">
                          <span className="w-1.5 h-1.5 rounded-sm bg-[#d99b4a] mt-2 shrink-0 shadow-sm border border-[#6b0f0d]/20"></span>
                          <span className="leading-snug">{ach}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto pt-4 flex border-t border-[#d99b4a]/20 relative z-10">
                    <Link to={`/characters/${char.id}`} className="text-[#6b0f0d] font-bold text-[13px] uppercase tracking-widest flex items-center gap-1 hover:text-[#d99b4a] transition-colors group/link">
                      Xem chi tiết
                      <span className="material-symbols-outlined text-[18px] group-hover/link:translate-x-1 transition-transform">chevron_right</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#fffdf8]/60 backdrop-blur-sm rounded-xl border border-[#d99b4a]/30 shadow-sm">
            <span className="material-symbols-outlined text-6xl text-[#6b0f0d]/40 mb-4">search_off</span>
            <h3 className="text-xl font-headline text-[#6b0f0d] font-bold mb-2">Không tìm thấy nhân vật</h3>
            <p className="text-[#2b1a16]/70 font-body">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default UserCharacters;