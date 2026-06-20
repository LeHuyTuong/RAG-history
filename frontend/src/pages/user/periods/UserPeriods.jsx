import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { API_ENDPOINTS } from '../../../services/api';
const UserPeriods = () => {
  const navigate = useNavigate();

  const [periodsData, setPeriodsData] = useState([]);
  const [activePeriod, setActivePeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef({});
  const sidebarListRef = useRef(null);

  useEffect(() => {
    if (activePeriod && sidebarListRef.current) {
      const activeElement = sidebarListRef.current.querySelector(`[data-period-id="${activePeriod}"]`);
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activePeriod]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.USER_PERIODS);
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        setPeriodsData(data);
        if (data.length > 0) {
          setActivePeriod(data[0].period_id);
        }
      } catch (error) {
        console.error('Error fetching periods:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (periodsData.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActivePeriod(Number(entry.target.id));
          }
        });
      },
      { rootMargin: '-35% 0px -45% 0px' }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [periodsData]);

  const scrollToPeriod = (id) => {
    setActivePeriod(id);
    const element = sectionRefs.current[id];
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const displayedPeriods = periodsData;

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20">

      {/* 1. HERO SECTION */}
      <section className="relative h-[450px] flex items-center justify-center overflow-hidden border-b border-[#d99b4a]/30">
        <div className="absolute inset-0 z-0 bg-[#2b0504]">
          <img
            className="w-full h-full object-cover grayscale-[30%] sepia-[40%] brightness-[0.4] animate-ken-burns origin-center"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAVKTpmIOsVPz71VTF7L-eaHzXN4Oh6ub8EnTMlfUxrO0hDH1qbwKqQtEnBGtuK1LPKBy5AJGrq5evViTFpOavYjCKc58Nv9n6_KOuHFJmbJp9zdQyAwqo25I9dqHTc82z_zNxCvJEdmuN7_Gfjkz4j9mxGG-E-Ip-ns87D3W7Hvs0eWMOiKI9S5Ng0eSOpToLtO9W5MjbkR0iTXZZR8SBLrVLBIAitzFajiYDuc-aFI2C0FXPJgzc0QWAMp4Dl6sTZfmH2AhB54N6"
            alt="Hero"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2b0504]/90 via-[#2b0504]/40 to-[#fbf6e8] pointer-events-none"></div>
        </div>
        <div className="relative z-10 text-center space-y-4 max-w-4xl px-12 mt-10">
          <span className="text-[#d9c7a7] font-body text-[11px] font-bold uppercase tracking-[0.4em] mb-4 block drop-shadow-md">Hành trình nghìn năm văn hiến</span>
          <h1 className="font-headline text-5xl md:text-6xl lg:text-[72px] text-[#f7d78a] font-semibold tracking-tight drop-shadow-lg mb-4">Dòng Chảy Lịch Sử</h1>
          <p className="font-body text-sm md:text-base lg:text-lg text-[#f8ead0]/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md">
            Khám phá những triều đại huy hoàng, từ thuở dựng nước đến những mốc son chói lọi của nền độc lập tự chủ Đại Việt.
          </p>
        </div>
      </section>




      {/* 2. TIMELINE CONTENT & SIDEBAR */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 pb-16 lg:pb-24 pt-4 lg:pt-8 flex flex-col lg:flex-row gap-12 relative">

        {/* Left Sidebar (Sticky) */}
        <aside className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-24 self-start z-20">
          <div className="bg-[#fffdf8] border border-[#d99b4a]/30 shadow-lg relative overflow-hidden">
            {/* Decorative corners */}
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#d99b4a] opacity-70 pointer-events-none"></div>
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#d99b4a] opacity-70 pointer-events-none"></div>
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#d99b4a] opacity-70 pointer-events-none"></div>
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#d99b4a] opacity-70 pointer-events-none"></div>

            <div className="bg-[#6b0f0d] p-5 text-center">
              <h2 className="text-[#ffe7b0] font-headline text-2xl font-bold uppercase tracking-widest">Các Thời Kỳ</h2>
            </div>

            <ul ref={sidebarListRef} className="py-2 overflow-y-auto max-h-[60vh] lg:max-h-[calc(100vh-12rem)] scrollbar-thin scrollbar-thumb-[#d99b4a]/50 scrollbar-track-transparent">
              {displayedPeriods.map(p => (
                <li key={p.period_id} data-period-id={p.period_id}>
                  <button
                    onClick={() => scrollToPeriod(p.period_id)}
                    className={`w-full text-left px-6 py-4 font-body text-[15px] transition-all border-l-4 group ${activePeriod === p.period_id
                        ? 'bg-[#d99b4a]/10 border-[#6b0f0d] text-[#6b0f0d] font-bold shadow-inner'
                        : 'border-transparent text-[#2b1a16] hover:bg-[#fcf9ee] hover:text-[#6b0f0d]'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{p.category && p.category.includes('Nhà') ? p.category.replace('Nhà ', 'Triều ') : p.name}</span>
                      <span className={`material-symbols-outlined text-[18px] transition-transform ${activePeriod === p.period_id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>east</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Main Content */}
        <main className="flex-1 relative pb-32">
          {/* Vertical Rail */}
          <div className="absolute left-[11px] lg:left-[23px] top-4 bottom-0 w-[2px] bg-gradient-to-b from-[#6b0f0d] via-[#d99b4a]/60 to-transparent"></div>

          <div className="space-y-20 lg:space-y-32">
            {displayedPeriods.map((p, idx) => (
              <section
                key={p.period_id}
                id={p.period_id}
                ref={(el) => (sectionRefs.current[p.period_id] = el)}
                className="relative pl-10 lg:pl-16 group"
              >
                {/* Timeline Node */}
                <div className={`absolute left-0 lg:left-[12px] top-6 w-6 h-6 rounded-full border-[4px] shadow-[0_0_15px_rgba(107,15,13,0.4)] z-10 transition-all duration-500 ${activePeriod === p.period_id
                    ? 'bg-[#6b0f0d] border-[#d99b4a] scale-125'
                    : 'bg-[#fbf6e8] border-[#6b0f0d] group-hover:bg-[#6b0f0d] group-hover:scale-125'
                  }`}></div>

                {/* Card */}
                <div className={`shadow-xl hover:shadow-[0_20px_50px_rgba(43,5,4,0.08)] transition-all duration-500 relative group/card border-2 p-8 lg:p-12 ${activePeriod === p.period_id
                    ? 'bg-[#fffcf3] border-[#6b0f0d] shadow-2xl scale-[1.01]'
                    : 'bg-[#fffdf8] border-[#d99b4a]/40'
                  }`}>
                  {/* Decorative */}
                  <div className={`absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 opacity-50 transition-colors ${activePeriod === p.period_id ? 'border-[#6b0f0d]' : 'border-[#d99b4a]'}`}></div>
                  <div className={`absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 opacity-50 transition-colors ${activePeriod === p.period_id ? 'border-[#6b0f0d]' : 'border-[#d99b4a]'}`}></div>
                  <div className={`absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 opacity-50 transition-colors ${activePeriod === p.period_id ? 'border-[#6b0f0d]' : 'border-[#d99b4a]'}`}></div>
                  <div className={`absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 opacity-50 transition-colors ${activePeriod === p.period_id ? 'border-[#6b0f0d]' : 'border-[#d99b4a]'}`}></div>

                  <div className="flex flex-col xl:flex-row gap-10 items-start">
                    {/* Text content */}
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                        <span className={`font-body text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest transition-colors duration-500 ${activePeriod === p.period_id ? 'bg-[#ffe7b0] text-[#6b0f0d]' : 'bg-[#6b0f0d] text-[#ffe7b0]'}`}>{p.category && p.category.includes('Nhà') ? p.category.replace('Nhà', 'Triều') : p.category}</span>
                        <span className="font-headline text-[#d99b4a] font-bold text-lg">{p.range}</span>
                      </div>

                      <h3 className={`font-headline text-3xl md:text-4xl font-bold tracking-tight transition-colors duration-500 ${activePeriod === p.period_id ? 'text-[#6b0f0d]' : 'text-[#2b0504] group-hover/card:text-[#6b0f0d]'}`}>{p.name}</h3>

                      <p className="font-body text-[15px] text-[#2b1a16]/80 leading-relaxed pt-2">"{p.description}"</p>

                      <div className="space-y-3 py-4 border-t border-b border-[#d99b4a]/20">
                        {(p.details || []).map(detail => (
                          <div key={detail} className="flex items-center gap-3 text-[#2b1a16]">
                            <div className="w-1 h-1 rotate-45 bg-[#6b0f0d]"></div>
                            <span className="font-body text-[14px] text-[#4a2a22] font-semibold">{detail}</span>
                          </div>
                        ))}
                      </div>

                      <Link
                        to={`/periods/${p.period_id}`}
                        className="inline-flex items-center gap-2 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-[#6b0f0d] border border-[#d99b4a] px-6 py-3 hover:bg-[#6b0f0d] hover:text-[#ffe7b0] transition-colors group/btn"
                      >
                        Khám phá thời kỳ <span className="material-symbols-outlined text-[16px] group-hover/btn:translate-x-1 transition-transform">east</span>
                      </Link>
                    </div>

                    {/* Image */}
                    <div className="w-full xl:w-[45%] h-[300px] xl:h-[400px] overflow-hidden relative border border-[#d99b4a]/30 shadow-md">
                      <img
                        src={p.image}
                        className="w-full h-full object-cover grayscale-[0.3] sepia-[0.2] group-hover/card:grayscale-0 group-hover/card:sepia-0 group-hover/card:scale-110 transition-all duration-1000"
                        alt={p.name}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#2b0504]/50 to-transparent pointer-events-none opacity-60 group-hover/card:opacity-30 transition-opacity"></div>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default UserPeriods;