import { API_ENDPOINTS, apiClient, eventService, periodService, personService, locationService, postService } from '../../../services';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { stripHtml } from '../../../utils/stringUtils';

const UserPeriods = () => {
  const { backgroundUrl = '' } = useOutletContext() || {};

  const [periodsData, setPeriodsData] = useState([]);
  const [eventsData, setEventsData] = useState([]);
  const [personsData, setPersonsData] = useState([]);
  const [locationsData, setLocationsData] = useState([]);
  const [postsData, setPostsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activePeriod, setActivePeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const sectionRefs = useRef({});
  const sidebarListRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (activePeriod && sidebarListRef.current) {
      const activeElement = sidebarListRef.current.querySelector(`[data-period-id="${activePeriod}"]`);
      if (activeElement) {
        const container = sidebarListRef.current;
        const elementTop = activeElement.offsetTop;
        const elementBottom = elementTop + activeElement.offsetHeight;
        const containerTop = container.scrollTop;
        const containerBottom = containerTop + container.offsetHeight;

        if (elementTop < containerTop) {
          container.scrollTo({ top: elementTop, behavior: 'smooth' });
        } else if (elementBottom > containerBottom) {
          container.scrollTo({ top: elementBottom - container.offsetHeight, behavior: 'smooth' });
        }
      }
    }
  }, [activePeriod]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let dbPeriods = [];
        let allEvents = [];
        let allPersons = [];
        let allLocations = [];
        let allPosts = [];
        try {
          const [response, evtRes, perRes, locRes, posRes] = await Promise.all([
            periodService.filter({ size: 500, status: 'PUBLISHED' }),
            eventService.filter({ size: 500, status: 'PUBLISHED' }),
            personService.filter({ size: 500, status: 'PUBLISHED' }),
            locationService.filter({ size: 500, status: 'PUBLISHED' }),
            postService.filter({ size: 500, status: 'PUBLISHED' })
          ]);
          dbPeriods = response?.items || [];
          allEvents = evtRes?.items || [];
          allPersons = perRes?.items || [];
          allLocations = locRes?.items || [];
          allPosts = posRes?.items || [];
        } catch (apiErr) {
          console.error('Lỗi gọi API:', apiErr);
        }

        setEventsData(allEvents);
        setPersonsData(allPersons);
        setLocationsData(allLocations);
        setPostsData(allPosts);

        const formatYear = (y) => {
          if (y === undefined || y === null || y === '') return '';
          const val = parseInt(y, 10);
          if (isNaN(val)) return y;
          return val < 0 ? `${Math.abs(val)} TCN` : `${val}`;
        };

        const parseArrayString = (str) => {
          if (!str) return [];
          if (Array.isArray(str)) return str;
          if (typeof str === 'string') {
            try {
               const parsed = JSON.parse(str);
               if (Array.isArray(parsed)) return parsed;
            } catch(e) {
               // Ignore
            }
            return str.split(',').map(s => s.trim()).filter(Boolean);
          }
          return [];
        };

        let merged = dbPeriods.map(dbItem => ({
          ...dbItem,
          period_id: dbItem.id,
          category: "Thời Kỳ",
          name: dbItem.name,
          range: (dbItem.startYear !== null && dbItem.startYear !== undefined) || (dbItem.endYear !== null && dbItem.endYear !== undefined)
            ? `${formatYear(dbItem.startYear)} - ${dbItem.endYear ? formatYear(dbItem.endYear) : 'Nay'}`
            : '',
          description: dbItem.description,
          details: [],
          image: dbItem.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/4/48/Ngoc_Lu.jpg',
          emperors: parseArrayString(dbItem.emperors),
          relatedLocations: parseArrayString(dbItem.relatedLocations),
          relatedEvents: parseArrayString(dbItem.relatedEvents),
          relatedArticles: parseArrayString(dbItem.relatedArticles)
        }));

        // Always sort chronologically by default
        merged.sort((a, b) => {
          const startA = a.startYear !== undefined && a.startYear !== null ? Number(a.startYear) : 999999;
          const startB = b.startYear !== undefined && b.startYear !== null ? Number(b.startYear) : 999999;
          return startA - startB;
        });

        setPeriodsData(merged);
        if (merged.length > 0) {
          setActivePeriod(merged[0].period_id);
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

  const displayedPeriods = periodsData.filter(p =>
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="w-full min-h-[60vh] bg-transparent flex items-center justify-center font-body text-[#6b0f0d]">Đang tải triều đại...</div>;

  return (
    <div className="w-full relative font-body selection:bg-[#d99b4a]/20">

      {/* 1. HERO SECTION */}
      <section className="relative h-[450px] flex items-center justify-center overflow-hidden border-b border-[#d99b4a]/30">
        <div className="absolute inset-0 z-0 bg-[#2b0504]">
          <img
            className="w-full h-full object-cover grayscale-[30%] sepia-[40%] brightness-[0.4] animate-ken-burns origin-center"
            src={backgroundUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBAVKTpmIOsVPz71VTF7L-eaHzXN4Oh6ub8EnTMlfUxrO0hDH1qbwKqQtEnBGtuK1LPKBy5AJGrq5evViTFpOavYjCKc58Nv9n6_KOuHFJmbJp9zdQyAwqo25I9dqHTc82z_zNxCvJEdmuN7_Gfjkz4j9mxGG-E-Ip-ns87D3W7Hvs0eWMOiKI9S5Ng0eSOpToLtO9W5MjbkR0iTXZZR8SBLrVLBIAitzFajiYDuc-aFI2C0FXPJgzc0QWAMp4Dl6sTZfmH2AhB54N6"}
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

            <div className="p-4 border-b border-[#d99b4a]/30">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm thời kỳ..."
                  className="w-full bg-white border border-[#d99b4a]/40 pl-10 pr-4 py-2 rounded-full font-body text-sm outline-none focus:border-[#d99b4a] focus:ring-2 focus:ring-[#d99b4a]/20 transition-all text-[#2b1a16] placeholder:text-on-surface-variant/50"
                />
              </div>
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
            {displayedPeriods.length === 0 ? (
              <div className="w-full text-center py-12 font-body text-lg text-[#6b0f0d]">
                Không tìm thấy thời kỳ nào phù hợp với từ khóa "{searchTerm}".
              </div>
            ) : displayedPeriods.map(p => (
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
                      {p.philosophy && (
                        <p className="font-body text-[#d99b4a] italic font-semibold text-lg">"{p.philosophy}"</p>
                      )}

                      <p className="font-body text-[15px] text-[#2b1a16]/80 leading-relaxed pt-2">
                        "{stripHtml(p.description)}"
                      </p>

                      <div className="space-y-3 py-4 border-t border-b border-[#d99b4a]/20">
                        {(() => {
                          let periodEvents = [];
                          if (p.relatedEvents && p.relatedEvents.length > 0) {
                            periodEvents = p.relatedEvents.slice(0, 3).map((eventName, idx) => {
                              const matchedEvent = eventsData.find(e => e.name === eventName);
                              return matchedEvent || { id: `unlinked-${idx}`, name: eventName, isUnlinked: true };
                            });
                          }

                          const sections = [];

                          if (periodEvents.length > 0) {
                            sections.push(
                              <div key="events" className="mt-4 first:mt-0">
                                <span className="font-headline text-[13px] text-[#6b0f0d] font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                  <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                                  Sự kiện tiêu biểu:
                                </span>
                                <div className="flex flex-col gap-2">
                                  {periodEvents.map(evt => (
                                    evt.isUnlinked ? (
                                      <div key={evt.id} className="flex items-start gap-2">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#d99b4a] shrink-0"></div>
                                        <span className="font-body text-[14px] text-[#4a2a22] font-semibold">{evt.name}</span>
                                      </div>
                                    ) : (
                                      <Link key={evt.id} to={`/events/${evt.id}`} className="group/evt flex items-start gap-2">
                                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#d99b4a] group-hover/evt:bg-[#ff4d4d] transition-colors shrink-0"></div>
                                        <span className="font-body text-[14px] text-[#4a2a22] font-semibold group-hover/evt:text-[#ff4d4d] transition-colors">{evt.name}</span>
                                      </Link>
                                    )
                                  ))}
                                </div>
                              </div>
                            );
                          }

                          if (p.emperors && p.emperors.length > 0) {
                            sections.push(
                              <div key="emperors" className="mt-4 first:mt-0">
                                <span className="font-headline text-[13px] text-[#6b0f0d] font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                  <span className="material-symbols-outlined text-[16px]">groups</span>
                                  Nhân vật then chốt:
                                </span>
                                <div className="flex flex-col gap-1">
                                  {p.emperors.slice(0, 3).map((emp, i) => {
                                    const match = personsData.find(p => p.name === emp);
                                    return (
                                      <div key={i} className="flex items-start gap-2">
                                        <div className="mt-2 w-1 h-1 rotate-45 bg-[#d99b4a] shrink-0"></div>
                                        {match ? (
                                          <Link to={`/characters/${match.id}`} className="font-body text-[14px] text-[#4a2a22] font-semibold italic hover:text-[#6b0f0d] hover:underline underline-offset-2 transition-colors">{emp}</Link>
                                        ) : (
                                          <span className="font-body text-[14px] text-[#4a2a22] italic">{emp}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {p.emperors.length > 3 && (
                                    <span className="font-body text-[12px] text-[#4a2a22]/60 italic ml-3">...và nhiều nhân vật khác</span>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          if (p.relatedLocations && p.relatedLocations.length > 0) {
                            sections.push(
                              <div key="locations" className="mt-4 first:mt-0">
                                <span className="font-headline text-[13px] text-[#6b0f0d] font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                  <span className="material-symbols-outlined text-[16px]">location_on</span>
                                  Địa danh:
                                </span>
                                <div className="flex flex-col gap-1">
                                  {p.relatedLocations.slice(0, 3).map((loc, i) => {
                                    const match = locationsData.find(l => l.name === loc);
                                    return (
                                      <div key={i} className="flex items-start gap-2">
                                        <div className="mt-2 w-1 h-1 bg-[#d99b4a] rounded-full shrink-0"></div>
                                        {match ? (
                                          <Link to={`/locations/${match.id}`} className="font-body text-[14px] text-[#4a2a22] font-semibold hover:text-[#6b0f0d] hover:underline underline-offset-2 transition-colors">{loc}</Link>
                                        ) : (
                                          <span className="font-body text-[14px] text-[#4a2a22]">{loc}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {p.relatedLocations.length > 3 && (
                                    <span className="font-body text-[12px] text-[#4a2a22]/60 italic ml-3">...và nhiều địa danh khác</span>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          if (p.relatedArticles && p.relatedArticles.length > 0) {
                            sections.push(
                              <div key="articles" className="mt-4 first:mt-0">
                                <span className="font-headline text-[13px] text-[#6b0f0d] font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                  <span className="material-symbols-outlined text-[16px]">article</span>
                                  Bài viết:
                                </span>
                                <div className="flex flex-col gap-1">
                                  {p.relatedArticles.slice(0, 3).map((art, i) => {
                                    const match = postsData.find(p => p.title === art);
                                    return (
                                      <div key={i} className="flex items-start gap-2">
                                        <div className="mt-2 w-1 h-1 bg-[#d99b4a] rotate-45 shrink-0"></div>
                                        {match ? (
                                          <Link to={`/posts/${match.id}`} className="font-body text-[14px] text-[#4a2a22] font-semibold hover:text-[#6b0f0d] hover:underline underline-offset-2 transition-colors">{art}</Link>
                                        ) : (
                                          <span className="font-body text-[14px] text-[#4a2a22]">{art}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                  {p.relatedArticles.length > 3 && (
                                    <span className="font-body text-[12px] text-[#4a2a22]/60 italic ml-3">...và nhiều bài viết khác</span>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          if (sections.length > 0) {
                            return <div className="space-y-1">{sections}</div>;
                          }

                          return (p.details || []).map(detail => (
                            <div key={detail} className="flex items-center gap-3 text-[#2b1a16]">
                              <div className="w-1 h-1 rotate-45 bg-[#6b0f0d]"></div>
                              <span className="font-body text-[14px] text-[#4a2a22] font-semibold">{detail}</span>
                            </div>
                          ));
                        })()}
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
