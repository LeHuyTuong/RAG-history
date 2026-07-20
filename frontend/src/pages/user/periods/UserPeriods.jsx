import { API_ENDPOINTS, apiClient, eventService, periodService, personService, locationService, postService } from '../../../services';
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { stripHtml } from '../../../utils/stringUtils';

const getFallbackImage = (periodName) => {
  if (!periodName) return "/images/dong_son_drum.png";
  const name = periodName.toLowerCase();
  if (name.includes('hùng vương') || name.includes('hồng bàng') || name.includes('âu lạc') || name.includes('văn lang')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuCVTT2QqvD6K9-wucC1WkR7VZnFnP0rjHn6TrcyVqbMkCLEt-GrSb7RFMcwfuFYl9579qyI-CbhlttwgMYFgZtqaEK6hcj7gIzEvC-x8r1WJkxShSTdvgJAiGZim3mnjYlIdJsvmeUw2bip5ou99uGqVBVApXptp6Lpy5LmjEOMY2yZYFGSQzjZdZ5ZBKHO-vZMXFRcwX7gOF6f0s6dB3ZlO7K3KuUYQcdtVpUeP-fDnTut1_okhKeJqvG2OJTJ0xZCroTJlNoWryp1";
  if (name.includes('lý') || name.includes('ngô') || name.includes('đinh') || name.includes('tiền lê')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuB-vfyWu8AZJ8zXJcGYqxgtuwF8kgnNnxqHfqVCWu6IexNxd58MLyYryN2Pd4GPPIwQcgir92iGx39PPcocu5YwY0dKB88RM80ItVGkDs80nIlov0g4PRkKkWZqNqeAX2cgwfngoBoFqIt07Pir--2qzfNsUbTW8P_bXbYNjOL9IKt34YPVLuKa93Sk3GhQCaHLTecwGQGCZuSq0bnrOOq6oXKKmx5RiNGxRXHOQb6CiTjXlTeHajpZq_8iG4JClpUY9GWZsiRXvkTh";
  if (name.includes('trần') || name.includes('hồ') || name.includes('khúc') || name.includes('dương')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuBArlscw3wc_0llom4YXbNv7OUtmTW1u8adGJtB0r_R9ouLWRlOhBtwANhi8h-y-oKCXyjtcMAw-fv_DqJa8j9I0UYbf6VIaYfgHL50aCXOYoKCdQKYmjZdoMl1JYnzrRbkzkf79To66-2d-f1XfB1xrJTtxZoVqJiuNrqbgJSqttpHAF3wZGHnereJFQmlr7zvRv_OYZP3ifnXN8WYT8_1w8_n43OLOx1lJp01FpEjYuFGNSEqolT22CJMX1LelRwU2FVHe3Qq_fbP";
  if (name.includes('lê') || name.includes('mạc') || name.includes('trịnh') || name.includes('nguyễn') || name.includes('tây sơn')) return "https://lh3.googleusercontent.com/aida-public/AB6AXuDDTXt3tOmQLzCboBJbQ63U5COKxdxaq5GrOn1775TXtXg3zq28AuTTb3mfVjKs6uj5Nkhc7auEFnCrMuCs6G4YIcZmzBgEE4ZdY3awqlP12VklH3BWkRe6Q83fhxNWatx1MbYcLIq7RztTsqI3HQRxPVW7T-TPQdwD7HM2eOSpwVHwup9Hp3K7KuNRjtoiaNSNbwvYXV_yv4pvRx5WIpTl05zH0YYusegbAB7v9qKEqrHI9SzL2DI2Hb0snIW35b9H7yKKrRRXIf79";
  return "/images/dong_son_drum.png";
};

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

  if (loading) return <div className="w-full min-h-[60vh] bg-transparent flex items-center justify-center font-body text-primary">Đang tải triều đại...</div>;

  return (
    <div className="w-full relative font-body selection:bg-accent/20">

      {/* 1. HERO SECTION */}
      <section className="relative h-[450px] flex items-center justify-center overflow-hidden border-b border-accent/30">
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
          <div className="bg-[#fffdf8] border border-accent/30 shadow-lg relative overflow-hidden">
            {/* Decorative corners */}
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-accent opacity-70 pointer-events-none"></div>
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-accent opacity-70 pointer-events-none"></div>
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-accent opacity-70 pointer-events-none"></div>
            <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-accent opacity-70 pointer-events-none"></div>

            <div className="bg-primary p-5 text-center">
              <h2 className="text-[#ffe7b0] font-headline text-2xl font-bold uppercase tracking-widest">Các Thời Kỳ</h2>
            </div>

            <div className="p-4 border-b border-accent/30">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm thời kỳ..."
                  className="w-full bg-white border border-accent/40 pl-10 pr-4 py-2 rounded-full font-body text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all text-[#2b1a16] placeholder:text-on-surface-variant/50"
                />
              </div>
            </div>

            <ul ref={sidebarListRef} className="py-2 overflow-y-auto max-h-[60vh] lg:max-h-[calc(100vh-12rem)] scrollbar-thin scrollbar-thumb-accent/50 scrollbar-track-transparent">
              {displayedPeriods.map(p => (
                <li key={p.period_id} data-period-id={p.period_id}>
                  <button
                    onClick={() => scrollToPeriod(p.period_id)}
                    className={`w-full text-left px-6 py-4 font-body text-[15px] transition-all border-l-4 group ${activePeriod === p.period_id
                      ? 'bg-accent/10 border-primary text-primary font-bold shadow-inner'
                      : 'border-transparent text-[#2b1a16] hover:bg-[#fcf9ee] hover:text-primary'
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
          <div className="absolute left-[11px] lg:left-[23px] top-4 bottom-0 w-[2px] bg-gradient-to-b from-primary via-accent/60 to-transparent"></div>

          <div className="space-y-20 lg:space-y-32">
            {displayedPeriods.length === 0 ? (
              <div className="w-full text-center py-12 font-body text-lg text-primary">
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
                  ? 'bg-primary border-accent scale-125'
                  : 'bg-[#fbf6e8] border-primary group-hover:bg-primary group-hover:scale-125'
                  }`}></div>

                {/* Card */}
                <div className={`shadow-xl hover:shadow-[0_20px_50px_rgba(43,5,4,0.08)] transition-all duration-500 relative group/card border-2 p-8 lg:p-12 ${activePeriod === p.period_id
                  ? 'bg-[#fffcf3] border-primary shadow-2xl scale-[1.01]'
                  : 'bg-[#fffdf8] border-accent/40'
                  }`}>
                  {/* Decorative */}
                  <div className={`absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 opacity-50 transition-colors ${activePeriod === p.period_id ? 'border-primary' : 'border-accent'}`}></div>
                  <div className={`absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 opacity-50 transition-colors ${activePeriod === p.period_id ? 'border-primary' : 'border-accent'}`}></div>
                  <div className={`absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 opacity-50 transition-colors ${activePeriod === p.period_id ? 'border-primary' : 'border-accent'}`}></div>
                  <div className={`absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 opacity-50 transition-colors ${activePeriod === p.period_id ? 'border-primary' : 'border-accent'}`}></div>

                  <div className="flex flex-col xl:flex-row gap-10 items-start">
                    {/* Text content */}
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                        <span className={`font-body text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest transition-colors duration-500 ${activePeriod === p.period_id ? 'bg-[#ffe7b0] text-primary' : 'bg-primary text-[#ffe7b0]'}`}>{p.category && p.category.includes('Nhà') ? p.category.replace('Nhà', 'Triều') : p.category}</span>
                        <span className="font-headline text-accent font-bold text-lg">{p.range}</span>
                      </div>

                      <h3 className={`font-headline text-3xl md:text-4xl font-bold tracking-tight transition-colors duration-500 ${activePeriod === p.period_id ? 'text-primary' : 'text-[#2b0504] group-hover/card:text-primary'}`}>{p.name}</h3>
                      {p.philosophy && (
                        <p className="font-body text-accent italic font-semibold text-lg">"{p.philosophy}"</p>
                      )}

                      <p className="font-body text-[15px] text-[#2b1a16]/80 leading-relaxed pt-2">
                        "{stripHtml(p.description)}"
                      </p>

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
                              <span className="font-headline text-[13px] text-primary font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                                Sự kiện tiêu biểu:
                              </span>
                              <div className="flex flex-col gap-2">
                                {periodEvents.map(evt => (
                                  evt.isUnlinked ? (
                                    <div key={evt.id} className="flex items-start gap-2">
                                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0"></div>
                                      <span className="font-body text-[14px] text-on-surface-variant font-semibold">{evt.name}</span>
                                    </div>
                                  ) : (
                                    <Link key={evt.id} to={`/events/${evt.id}`} className="group/evt flex items-start gap-2">
                                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent group-hover/evt:bg-[#ff4d4d] transition-colors shrink-0"></div>
                                      <span className="font-body text-[14px] text-on-surface-variant font-semibold group-hover/evt:text-[#ff4d4d] transition-colors">{evt.name}</span>
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
                              <span className="font-headline text-[13px] text-primary font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                <span className="material-symbols-outlined text-[16px]">groups</span>
                                Nhân vật then chốt:
                              </span>
                              <div className="flex flex-col gap-1">
                                {p.emperors.slice(0, 3).map((empObj, i) => {
                                  const empName = typeof empObj === 'object' ? empObj.name : empObj;
                                  const match = personsData.find(p => p.name === empName || p.title === empName);
                                  return (
                                    <div key={i} className="flex items-start gap-2">
                                      <div className="mt-2 w-1 h-1 rotate-45 bg-accent shrink-0"></div>
                                      {match ? (
                                        <Link to={`/characters/${match.id}`} className="font-body text-[14px] text-on-surface-variant font-semibold italic hover:text-primary hover:underline underline-offset-2 transition-colors">{empName}</Link>
                                      ) : (
                                        <span className="font-body text-[14px] text-on-surface-variant italic">{empName}</span>
                                      )}
                                    </div>
                                  );
                                })}
                                {p.emperors.length > 3 && (
                                  <span className="font-body text-[12px] text-on-surface-variant/60 italic ml-3">...và nhiều nhân vật khác</span>
                                )}
                              </div>
                            </div>
                          );
                        }

                        if (p.relatedLocations && p.relatedLocations.length > 0) {
                          sections.push(
                            <div key="locations" className="mt-4 first:mt-0">
                              <span className="font-headline text-[13px] text-primary font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                Địa danh:
                              </span>
                              <div className="flex flex-col gap-1">
                                {p.relatedLocations.slice(0, 3).map((loc, i) => {
                                  const match = locationsData.find(l => l.name === loc);
                                  return (
                                    <div key={i} className="flex items-start gap-2">
                                      <div className="mt-2 w-1 h-1 bg-accent rounded-full shrink-0"></div>
                                      {match ? (
                                        <Link to={`/locations/${match.id}`} className="font-body text-[14px] text-on-surface-variant font-semibold hover:text-primary hover:underline underline-offset-2 transition-colors">{loc}</Link>
                                      ) : (
                                        <span className="font-body text-[14px] text-on-surface-variant">{loc}</span>
                                      )}
                                    </div>
                                  );
                                })}
                                {p.relatedLocations.length > 3 && (
                                  <span className="font-body text-[12px] text-on-surface-variant/60 italic ml-3">...và nhiều địa danh khác</span>
                                )}
                              </div>
                            </div>
                          );
                        }

                        if (p.relatedArticles && p.relatedArticles.length > 0) {
                          sections.push(
                            <div key="articles" className="mt-4 first:mt-0">
                              <span className="font-headline text-[13px] text-primary font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                <span className="material-symbols-outlined text-[16px]">article</span>
                                Bài viết:
                              </span>
                              <div className="flex flex-col gap-1">
                                {p.relatedArticles.slice(0, 3).map((art, i) => {
                                  const match = postsData.find(p => p.title === art);
                                  return (
                                    <div key={i} className="flex items-start gap-2">
                                      <div className="mt-2 w-1 h-1 bg-accent rotate-45 shrink-0"></div>
                                      {match ? (
                                        <Link to={`/posts/${match.id}`} className="font-body text-[14px] text-on-surface-variant font-semibold hover:text-primary hover:underline underline-offset-2 transition-colors">{art}</Link>
                                      ) : (
                                        <span className="font-body text-[14px] text-on-surface-variant">{art}</span>
                                      )}
                                    </div>
                                  );
                                })}
                                {p.relatedArticles.length > 3 && (
                                  <span className="font-body text-[12px] text-on-surface-variant/60 italic ml-3">...và nhiều bài viết khác</span>
                                )}
                              </div>
                            </div>
                          );
                        }

                        const hasDetails = p.details && p.details.length > 0;
                        if (sections.length === 0 && !hasDetails) {
                          return null;
                        }

                        return (
                          <div className="space-y-3 py-4 border-t border-b border-accent/20">
                            {sections.length > 0 ? (
                              <div className="space-y-1">{sections}</div>
                            ) : (
                              (p.details || []).map(detail => (
                                <div key={detail} className="flex items-center gap-3 text-[#2b1a16]">
                                  <div className="w-1 h-1 rotate-45 bg-primary"></div>
                                  <span className="font-body text-[14px] text-on-surface-variant font-semibold">{detail}</span>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })()}

                      <Link
                        to={`/periods/${p.period_id}`}
                        className="inline-flex items-center gap-2 font-body text-[11px] font-bold uppercase tracking-[0.2em] text-primary border border-accent px-6 py-3 hover:bg-primary hover:text-[#ffe7b0] transition-colors group/btn"
                      >
                        Khám phá thời kỳ <span className="material-symbols-outlined text-[16px] group-hover/btn:translate-x-1 transition-transform">east</span>
                      </Link>
                    </div>

                    {/* Image */}
                    <div className="w-full xl:w-[45%] h-[300px] xl:h-[400px] overflow-hidden relative border border-accent/30 shadow-md">
                      <img
                        src={p.image}
                        className="w-full h-full object-cover grayscale-[0.3] sepia-[0.2] group-hover/card:grayscale-0 group-hover/card:sepia-0 group-hover/card:scale-110 transition-all duration-1000"
                        alt={p.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = getFallbackImage(p.name);
                        }}
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
