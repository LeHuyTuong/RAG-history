import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

import { API_ENDPOINTS } from '../../../services/api';
import apiClient, { mockClient } from '../../../services/apiClient';
const PeriodDetail = () => {
  const { id } = useParams();

  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedEvents, setRelatedEvents] = useState([]);

  // Mapping period names to beautiful hero images
  const getHeroImage = (periodName) => {
    if (!periodName) return "/images/home.png";
    const name = periodName.toLowerCase();
    if (name.includes('hùng vương') || name.includes('hồng bàng')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuCVTT2QqvD6K9-wucC1WkR7VZnFnP0rjHn6TrcyVqbMkCLEt-GrSb7RFMcwfuFYl9579qyI-CbhlttwgMYFgZtqaEK6hcj7gIzEvC-x8r1WJkxShSTdvgJAiGZim3mnjYlIdJsvmeUw2bip5ou99uGqVBVApXptp6Lpy5LmjEOMY2yZYFGSQzjZdZ5ZBKHO-vZMXFRcwX7gOF6f0s6dB3ZlO7K3KuUYQcdtVpUeP-fDnTut1_okhKeJqvG2OJTJ0xZCroTJlNoWryp1";
    if (name.includes('lý')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuB-vfyWu8AZJ8zXJcGYqxgtuwF8kgnNnxqHfqVCWu6IexNxd58MLyYryN2Pd4GPPIwQcgir92iGx39PPcocu5YwY0dKB88RM80ItVGkDs80nIlov0g4PRkKkWZqNqeAX2cgwfngoBoFqIt07Pir--2qzfNsUbTW8P_bXbYNjOL9IKt34YPVLuKa93Sk3GhQCaHLTecwGQGCZuSq0bnrOOq6oXKKmx5RiNGxRXHOQb6CiTjXlTeHajpZq_8iG4JClpUY9GWZsiRXvkTh";
    if (name.includes('trần')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuBArlscw3wc_0llom4YXbNv7OUtmTW1u8adGJtB0r_R9ouLWRlOhBtwANhi8h-y-oKCXyjtcMAw-fv_DqJa8j9I0UYbf6VIaYfgHL50aCXOYoKCdQKYmjZdoMl1JYnzrRbkzkf79To66-2d-f1XfB1xrJTtxZoVqJiuNrqbgJSqttpHAF3wZGHnereJFQmlr7zvRv_OYZP3ifnXN8WYT8_1w8_n43OLOx1lJp01FpEjYuFGNSEqolT22CJMX1LelRwU2FVHe3Qq_fbP";
    if (name.includes('lê')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuDDTXt3tOmQLzCboBJbQ63U5COKxdxaq5GrOn1775TXtXg3zq28AuTTb3mfVjKs6uj5Nkhc7auEFnCrMuCs6G4YIcZmzBgEE4ZdY3awqlP12VklH3BWkRe6Q83fhxNWatx1MbYcLIq7RztTsqI3HQRxPVW7T-TPQdwD7HM2eOSpwVHwup9Hp3K7KuNRjtoiaNSNbwvYXV_yv4pvRx5WIpTl05zH0YYusegbAB7v9qKEqrHI9SzL2DI2Hb0snIW35b9H7yKKrRRXIf79";
    return "/images/home.png";
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchPeriod = async () => {
      try {
        let dbPeriod = null;
        try {
          const url = typeof API_ENDPOINTS.USER_PERIOD_DETAIL === 'function' 
            ? API_ENDPOINTS.USER_PERIOD_DETAIL(id) 
            : `${API_ENDPOINTS.USER_PERIOD_DETAIL}/${id}`;
          const response = await apiClient.get(url);
          dbPeriod = response.data?.data || response.data;
          
          if (dbPeriod) {
            setPeriod({
              ...dbPeriod,
              period_id: dbPeriod.id,
              start_year: dbPeriod.startYear,
              end_year: dbPeriod.endYear,
              description: dbPeriod.description || '',
            });
          }
        } catch (apiErr) {
          console.error('Failed to fetch period detail from API:', apiErr);
        }
      } catch (error) {
        console.error('Error fetching period:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchEvents = async () => {
      try {
        let eventList = [];
        try {
          const response = await apiClient.get(API_ENDPOINTS.USER_EVENTS);
          eventList = response.data?.data?.result || response.data?.data?.content || response.data?.data || [];
          setRelatedEvents(eventList.slice(0, 3).map(e => ({
            ...e,
            year: e.startYear !== undefined ? e.startYear : '',
            image: e.image || "/images/home.png"
          })));
        } catch (apiErr) {
          console.error('Failed to fetch user events:', apiErr);
        } 
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchPeriod();
    fetchEvents();
  }, [id]);

  if (loading) return <div className="min-h-screen bg-[#fbf6e8] flex items-center justify-center font-body text-[#6b0f0d]">Đang tải thời kỳ...</div>;
  if (!period) return <div className="min-h-screen bg-[#fbf6e8] flex items-center justify-center font-body text-[#6b0f0d]">Không tìm thấy thời kỳ.</div>;

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20 pb-20">
      <main className="max-w-[1440px] mx-auto px-6 md:px-12 py-16">

        {/* Breadcrumb */}
        <nav className="mb-12 flex items-center space-x-2 font-body text-[10px] uppercase tracking-widest text-[#2b1a16]/60">
          <Link to="/" className="hover:text-[#6b0f0d] transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-xs opacity-40">chevron_right</span>
          <Link to="/periods" className="hover:text-[#6b0f0d] transition-colors">Dòng thời gian</Link>
          <span className="material-symbols-outlined text-xs opacity-40">chevron_right</span>
          <span className="text-[#6b0f0d] font-bold">{period.name}</span>
        </nav>

        {/* 1. HERO SECTION & OVERVIEW */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-32 relative">
          <div className="lg:col-span-6 space-y-8 relative z-10">
            <span className="inline-block bg-[#6b0f0d] text-[#ffe7b0] px-4 py-1 font-body text-[10px] font-bold uppercase tracking-[0.3em] shadow-sm border border-[#d99b4a]/40">
              {period.start_year && period.end_year ? `Năm ${Math.abs(period.start_year)}${period.start_year < 0 ? ' TCN' : ''} - ${Math.abs(period.end_year)}${period.end_year < 0 ? ' TCN' : ''}` : 'Thời Kỳ Lịch Sử'}
            </span>
            <h1 className="font-headline text-5xl md:text-7xl text-[#6b0f0d] font-semibold leading-tight tracking-tight">
              {period.name && period.name.includes('Nhà') ? period.name.replace('Nhà', 'Triều') : period.name}
            </h1>
            <div className="h-1 w-24 bg-[#d99b4a]"></div>
            
            <p className="font-body text-[16px] leading-loose text-[#2b1a16]/90 pt-4 drop-cap whitespace-pre-line border-l-4 border-[#d99b4a] pl-6">
              {period.description || "Nội dung tổng quan đang được cập nhật..."}
            </p>
          </div>

          <div className="lg:col-span-6 relative group">
            <div className="aspect-[4/5] overflow-hidden border-2 border-[#d99b4a]/40 shadow-2xl relative bg-[#fcf9ee] p-2 transform rotate-2 group-hover:rotate-0 transition-transform duration-700">
              <div className="w-full h-full border border-[#d99b4a]/30 relative overflow-hidden">
                <img src={getHeroImage(period.name)} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale-[0.3] sepia-[0.3]" alt={period.name} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/50 to-transparent pointer-events-none mix-blend-overlay"></div>
                <div className="absolute inset-0 border-[12px] border-[#fcf9ee]/20 pointer-events-none"></div>
              </div>
            </div>
            <div className="absolute -bottom-12 -left-12 w-48 h-48 opacity-20 dong-son-pattern animate-pulse pointer-events-none z-0"></div>
          </div>
        </section>

        {/* 2. RELATED EVENTS */}
        {relatedEvents.length > 0 && (
          <section className="mb-32">
            <h2 className="font-headline text-4xl text-[#6b0f0d] font-semibold mb-12 flex items-center gap-4 border-b border-[#d99b4a]/30 pb-4">
              <span className="material-symbols-outlined text-4xl text-[#d99b4a]">history</span>
              Các Sự Kiện Tiêu Biểu
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedEvents.map((evt, idx) => (
                <Link to={`/events/${evt.id}`} key={idx} className="bg-[#fffdf8] border border-[#d99b4a]/30 rounded-xl overflow-hidden hover:shadow-[0_12px_30px_rgba(107,15,13,0.12)] transition-all duration-500 transform hover:-translate-y-1 group flex flex-col">
                  <div className="h-48 relative overflow-hidden border-b border-[#d99b4a]/20">
                    <img src={evt.image || "/images/home.png"} alt={evt.name} className="w-full h-full object-cover grayscale-[0.3] sepia-[0.2] group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute top-3 right-3 bg-[#6b0f0d]/90 backdrop-blur-sm text-[#ffe7b0] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-[#d99b4a]/40 z-10 shadow-lg">
                      {evt.year}
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-grow relative">
                    <div className="absolute inset-0 dong-son-pattern opacity-5 pointer-events-none mix-blend-overlay"></div>
                    <h3 className="font-headline text-2xl font-bold text-[#6b0f0d] mb-3 group-hover:text-[#8b1512] transition-colors relative z-10 line-clamp-2">{evt.name}</h3>
                    <p className="text-[#2b1a16]/70 text-[14px] leading-relaxed line-clamp-3 font-body italic relative z-10">
                      {evt.description}
                    </p>
                    <div className="mt-auto pt-4 flex items-center justify-end text-[#d99b4a] font-bold text-[12px] uppercase tracking-widest relative z-10">
                      Chi tiết <span className="material-symbols-outlined text-[16px] ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default PeriodDetail;