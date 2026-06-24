import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Pagination from '../../../components/common/Pagination';

import { API_ENDPOINTS } from '../../../services/api';
import apiClient, { mockClient } from '../../../services/apiClient';
const UserEvents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriods, setSelectedPeriods] = useState([]);
  const [searchYear, setSearchYear] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        let dbEvents = [];
        try {
          const response = await apiClient.get(API_ENDPOINTS.USER_EVENTS);
          dbEvents = response.data?.data?.result || response.data?.data?.content || response.data?.data || [];
        } catch (apiErr) {
          console.error('Lỗi gọi API sự kiện, chuyển sang dùng mock:', apiErr);
        }

        let mockEvents = [];
        try {
          const mockRes = await mockClient.get('/api/user_events.json');
          mockEvents = mockRes.data?.events || mockRes.data || [];
        } catch (err) {
          console.error('Error fetching mock events:', err);
        }

        let merged = [];
        if (dbEvents.length > 0) {
          merged = dbEvents.map(dbItem => {
            const mockItem = mockEvents.find(m => m.slug === dbItem.slug) || {};
            return {
              ...mockItem,
              ...dbItem,
              event_id: dbItem.id,
              name: dbItem.name,
              description: dbItem.description,
              year: dbItem.startYear !== undefined ? dbItem.startYear : mockItem.year,
              date: dbItem.startYear !== undefined 
                ? `${Math.abs(dbItem.startYear)} ${dbItem.startYear < 0 ? 'TCN' : ''}`
                : mockItem.date || '',
              category: dbItem.period?.name || mockItem.category || '',
            };
          });
        } else {
          merged = mockEvents.map(mockItem => ({
            ...mockItem,
            event_id: mockItem.id || mockItem.event_id,
            name: mockItem.name || mockItem.title || '',
            description: mockItem.description || '',
            year: mockItem.year || '',
            date: mockItem.date || '',
            category: mockItem.category || '',
          }));
        }

        setEvents(merged);
      } catch (error) {
        console.error('Error fetching events data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events
  const filteredEvents = events.filter(e => {
    const matchSearch = (e.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || (e.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchYear = searchYear ? String(e.year || "").includes(searchYear) : true;
    const matchPeriod = selectedPeriods.length > 0 ? selectedPeriods.some(p => (e.category || "").includes(p)) : true;
    return matchSearch && matchYear && matchPeriod;
  });

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);



  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20">
      {/* HERO SECTION */}
      <section className="relative h-[450px] flex items-center justify-center overflow-hidden border-b border-[#d99b4a]/30">
        <div className="absolute inset-0 z-0 bg-[#2b0504]">
          <img
            className="w-full h-full object-cover grayscale-[30%] sepia-[40%] brightness-[0.4] animate-ken-burns origin-center"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGUI3HT9Jex5a-ZERUyLKKX086wzQHpxtpVeEbPJEpbnTS-rw0ElAg5co6141j6KJDTDCz1ORbq5naaR6yRj54VbXWefWH04BoEsovGxeQp_RFUEbdBmUClcwLmx3guee6Cg-dzz_WWbe_KByIYQUUoJXxlhsKBoU1OVMdNif6YQ-rPbN56YQNjt1Dwqs9vuDdE_LzBbakJz5a2f0D-msrRSxENoyfI4SU6jI0WnQ_Fb5KC5LHNrNpJVLFv-rEYPmp-8J8a9SWgOV2"
            alt="Events Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2b0504]/90 via-[#2b0504]/40 to-[#fbf6e8] pointer-events-none"></div>
        </div>
        <div className="relative z-10 text-center space-y-4 max-w-4xl px-12 mt-10">
          <span className="text-[#d9c7a7] font-body text-[11px] font-bold uppercase tracking-[0.4em] mb-4 block drop-shadow-md">Cột mốc vàng son</span>
          <h1 className="font-headline text-5xl md:text-6xl lg:text-[72px] text-[#f7d78a] font-semibold tracking-tight drop-shadow-lg mb-4">Niên Biểu Sự Kiện</h1>
          <p className="font-body text-sm md:text-base lg:text-lg text-[#f8ead0]/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Khám phá những cột mốc vàng son trong dòng chảy lịch sử dân tộc.
          </p>
        </div>
      </section>

      {/* SEARCH AND FILTER */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 -mt-8 relative z-20 mb-8">
        <div className="bg-[#fffdf8]/90 backdrop-blur-md rounded-xl shadow-md border border-[#d99b4a]/40 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60">search</span>
            <input
              type="text"
              placeholder="Tìm kiếm sự kiện..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#fcf9ee]/50 border border-[#d99b4a]/30 text-[#2b1a16] placeholder-[#6b0f0d]/40 rounded-lg py-3 pl-12 pr-4 outline-none focus:border-[#6b0f0d]/60 transition-colors font-body shadow-inner"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            <div className="relative md:w-56 w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60">filter_alt</span>
              <select
                value={selectedPeriods.length > 0 ? selectedPeriods[0] : ""}
                onChange={e => {
                  setSelectedPeriods(e.target.value ? [e.target.value] : []);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#fcf9ee]/50 border border-[#d99b4a]/30 text-[#2b1a16] rounded-lg py-3 pl-12 pr-10 appearance-none outline-none focus:border-[#6b0f0d]/60 transition-colors font-body cursor-pointer shadow-inner"
              >
                <option value="">Tất cả thời kỳ</option>
                {[...new Set(events.map(e => e.category).filter(Boolean))].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60 pointer-events-none">expand_more</span>
            </div>

            <div className="relative md:w-48 w-full">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60">calendar_month</span>
              <input
                type="text"
                placeholder="Năm (VD: 1288)"
                value={searchYear}
                onChange={e => {
                  setSearchYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#fcf9ee]/50 border border-[#d99b4a]/30 text-[#2b1a16] placeholder-[#6b0f0d]/40 rounded-lg py-3 pl-12 pr-4 outline-none focus:border-[#6b0f0d]/60 transition-colors font-body shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-12 mt-8 mb-20 animate-in fade-in duration-700 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {loading ? (
              <div className="col-span-full text-center text-[#6b0f0d] py-10 font-body">Đang tải dữ liệu...</div>
            ) : paginatedEvents.map((event) => (
                <article key={event.event_id} className="group bg-[#fffdf8] border border-[#d99b4a]/40 shadow-lg hover:shadow-[0_20px_50px_rgba(43,5,4,0.12)] transition-all duration-700 flex flex-col p-2">

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
                        alt={event.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/60 to-transparent opacity-70"></div>
                      <div className="absolute top-3 left-3 z-10">
                        <span className="bg-[#6b0f0d] text-[#ffe7b0] font-body text-[11px] font-bold px-3 py-1.5 shadow-md border border-[#d99b4a]/40">{event.year}</span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-4 flex-grow relative z-10 flex flex-col">
                      <span className="font-body text-[9px] font-bold text-[#6b0f0d] uppercase tracking-widest block border-b border-[#d99b4a]/30 pb-2">{(event.category || "").includes('Nhà') ? (event.category || "").replace('Nhà', 'Triều') : (event.category || "Chưa rõ")}</span>
                      <h3 className="font-headline text-2xl text-[#2b0504] font-semibold tracking-tight leading-tight group-hover:text-[#6b0f0d] transition-colors">{event.name}</h3>
                      <p className="font-body text-[14px] text-[#2b1a16]/80 leading-relaxed line-clamp-3">
                        {event.description ? event.description.replace(/<[^>]*>/g, '') : ''}
                      </p>
                      <div className="pt-4 mt-auto">
                        <Link to={`/events/${event.event_id}`} className="text-[#6b0f0d] font-body text-[10px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 group/link border-t border-[#d99b4a]/20 pt-4 hover:bg-[#d99b4a]/10 transition-colors pb-2">
                          XEM CHI TIẾT <span className="material-symbols-outlined text-[14px] group-hover/link:translate-x-2 transition-transform">east</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
          </div>

          {/* 4. PAGINATION */}
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  );
};

export default UserEvents;