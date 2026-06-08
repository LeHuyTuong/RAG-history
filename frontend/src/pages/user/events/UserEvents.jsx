import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const UserEvents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [searchYear, setSearchYear] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/user_events.json');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const togglePeriod = (period) => {
    setSelectedPeriods(prev => 
      prev.includes(period) ? prev.filter(p => p !== period) : [...prev, period]
    );
  };



  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16 animate-in fade-in duration-700 relative z-10">
        {/* 1. HERO HEADER */}
        <header className="mb-16 relative h-64 overflow-hidden shadow-2xl p-2 bg-[#fffdf8] border border-[#d99b4a]/40 group">
          <div className="border border-[#d99b4a]/30 relative h-full overflow-hidden w-full bg-[#fcf9ee] dong-son-pattern">
            {/* Decorative corners */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-[#d99b4a] opacity-80 z-20"></div>
            <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-[#d99b4a] opacity-80 z-20"></div>
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-[#d99b4a] opacity-80 z-20"></div>
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-[#d99b4a] opacity-80 z-20"></div>

            <img
              className="w-full h-full object-cover grayscale-[0.5] sepia-[0.3] group-hover:grayscale-[0.1] group-hover:sepia-[0.1] transition-all duration-1000 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAVKTpmIOsVPz71VTF7L-eaHzXN4Oh6ub8EnTMlfUxrO0hDH1qbwKqQtEnBGtuK1LPKBy5AJGrq5evViTFpOavYjCKc58Nv9n6_KOuHFJmbJp9zdQyAwqo25I9dqHTc82z_zNxCvJEdmuN7_Gfjkz4j9mxGG-E-Ip-ns87D3W7Hvs0eWMOiKI9S5Ng0eSOpToLtO9W5MjbkR0iTXZZR8SBLrVLBIAitzFajiYDuc-aFI2C0FXPJgzc0QWAMp4Dl6sTZfmH2AhB54N6"
              alt="history header"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/90 via-[#2b0504]/50 to-transparent flex flex-col justify-end p-10 z-10">
              <h1 className="font-headline text-5xl text-[#f7d78a] font-semibold tracking-tight drop-shadow-md">Niên Biểu Sự Kiện</h1>
              <p className="text-[#f8ead0]/90 text-[16px] mt-3 max-w-xl">Khám phá những cột mốc vàng son trong dòng chảy lịch sử dân tộc.</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* 2. SIDEBAR FILTER */}
          <aside className="w-full lg:w-64 flex-shrink-0 space-y-12 lg:sticky lg:top-24 h-fit">
            {/* SEARCH BAR */}
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60 group-focus-within:text-[#6b0f0d] transition-colors">search</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm sự kiện, cột mốc lịch sử..."
                className="w-full bg-[#fcf9ee] border border-[#d99b4a]/40 pl-12 pr-4 py-3 font-body text-[14px] text-[#2b1a16] placeholder-[#2b1a16]/40 focus:outline-none focus:border-[#6b0f0d] focus:bg-[#fffdf8] shadow-inner transition-all"
              />
            </div>

            <section>
              <h3 className="font-body text-[11px] text-[#6b0f0d] uppercase font-bold tracking-[0.25em] mb-6 border-b border-[#d99b4a]/40 pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">filter_list</span> BỘ LỌC
              </h3>
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest border-l-2 border-[#d99b4a] pl-2 mb-4">Thời kỳ</p>
                  {['Triều Lý', 'Triều Trần', 'Triều Lê Sơ', 'Triều Nguyễn', 'Triều Hồ'].map(t => (
                    <label key={t} className="flex items-center gap-3 cursor-pointer group text-[14px]">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={selectedPeriods.includes(t)}
                          onChange={() => togglePeriod(t)}
                          className="peer appearance-none w-4 h-4 border border-[#d99b4a] bg-[#fffdf8] checked:bg-[#6b0f0d] checked:border-[#6b0f0d] transition-all cursor-pointer" 
                        />
                        <span className="material-symbols-outlined absolute text-white text-[12px] opacity-0 peer-checked:opacity-100 pointer-events-none">check</span>
                      </div>
                      <span className="text-[#2b1a16]/80 group-hover:text-[#6b0f0d] transition-colors font-semibold tracking-wide">{t}</span>
                    </label>
                  ))}
                </div>
                
                <div className="space-y-3 pt-6 border-t border-[#d99b4a]/20">
                  <p className="font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest border-l-2 border-[#d99b4a] pl-2 mb-4">Năm</p>
                  <input
                    type="text"
                    value={searchYear}
                    onChange={(e) => setSearchYear(e.target.value)}
                    placeholder="Nhập năm (VD: 1288)"
                    className="w-full bg-[#fcf9ee] border border-[#d99b4a]/40 px-4 py-2.5 font-body text-[14px] text-[#2b1a16] placeholder-[#2b1a16]/40 focus:outline-none focus:border-[#6b0f0d] focus:bg-[#fffdf8] shadow-inner transition-all"
                  />
                </div>
              </div>
            </section>


          </aside>

          {/* 3. CONTENT GRID */}
          <div className="flex-1">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {loading ? (
                <div className="col-span-full text-center text-[#6b0f0d] py-10 font-body">Đang tải dữ liệu...</div>
              ) : events
                .filter(e => {
                  const matchSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) || e.desc.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchYear = searchYear ? e.year.includes(searchYear) : true;
                  const matchPeriod = selectedPeriods.length > 0 ? selectedPeriods.some(p => e.category.includes(p)) : true;
                  return matchSearch && matchYear && matchPeriod;
                })
                .map((event) => (
                  <article key={event.id} className="group bg-[#fffdf8] border border-[#d99b4a]/40 shadow-lg hover:shadow-[0_20px_50px_rgba(43,5,4,0.12)] transition-all duration-700 flex flex-col p-2">

                    {/* Lớp viền trong cùng */}
                    <div className="border border-[#d99b4a]/30 relative flex flex-col h-full bg-[#fcf9ee] dong-son-pattern w-full">
                      {/* Decorative corners */}
                      <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-[#d99b4a] opacity-80 z-20"></div>
                      <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-[#d99b4a] opacity-80 z-20"></div>
                      <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-[#d99b4a] opacity-80 z-20"></div>
                      <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-[#d99b4a] opacity-80 z-20"></div>

                      {/* Image header */}
                      <div className="h-56 overflow-hidden relative border-b border-[#d99b4a]/30 shrink-0">
                        <img
                          src={event.image}
                          className="w-full h-full object-cover grayscale-[0.6] sepia-[0.3] group-hover:grayscale-[0.1] group-hover:sepia-[0.1] group-hover:scale-105 transition-all duration-1000"
                          alt={event.title}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/60 to-transparent opacity-70"></div>
                        <div className="absolute top-3 left-3 z-10">
                          <span className="bg-[#6b0f0d] text-[#ffe7b0] font-body text-[11px] font-bold px-3 py-1.5 shadow-md border border-[#d99b4a]/40">{event.year}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-4 flex-grow relative z-10 flex flex-col">
                        <span className="font-body text-[9px] font-bold text-[#6b0f0d] uppercase tracking-widest block border-b border-[#d99b4a]/30 pb-2">{event.category}</span>
                        <h3 className="font-headline text-2xl text-[#2b0504] font-semibold tracking-tight leading-tight group-hover:text-[#6b0f0d] transition-colors">{event.title}</h3>
                        <p className="font-body text-[14px] text-[#2b1a16]/80 leading-relaxed line-clamp-3">
                          {event.desc}
                        </p>
                        <div className="pt-4 mt-auto">
                          <Link to={`/events/${event.id}`} className="text-[#6b0f0d] font-body text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 group/link border-t border-[#d99b4a]/20 pt-4 hover:bg-[#d99b4a]/10 transition-colors pb-2">
                            XEM CHI TIẾT <span className="material-symbols-outlined text-[14px] group-hover/link:translate-x-2 transition-transform">east</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
            </div>

            {/* 4. PAGINATION */}
            <div className="mt-20 flex justify-center items-center gap-4 relative z-10">
              <button className="w-10 h-10 rounded-sm border border-[#d99b4a]/40 flex items-center justify-center text-[#6b0f0d]/40 cursor-not-allowed bg-[#fffdf8]"><span className="material-symbols-outlined">chevron_left</span></button>
              <button className="w-10 h-10 rounded-sm bg-[#6b0f0d] text-[#ffe7b0] font-bold text-[13px] shadow-lg border border-[#6b0f0d]">1</button>
              <button className="w-10 h-10 rounded-sm border border-[#d99b4a]/60 flex items-center justify-center text-[#6b0f0d] hover:bg-[#d99b4a]/20 transition-all font-bold text-[13px] bg-[#fffdf8]">2</button>
              <span className="text-[#6b0f0d] font-body tracking-widest">...</span>
              <button className="w-10 h-10 rounded-sm border border-[#d99b4a]/60 flex items-center justify-center text-[#6b0f0d] hover:bg-[#d99b4a]/20 transition-all bg-[#fffdf8]"><span className="material-symbols-outlined">chevron_right</span></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEvents;