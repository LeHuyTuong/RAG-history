import { API_ENDPOINTS, apiClient, personService, locationService, postService } from '../../../services';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { stripHtml } from '../../../utils/stringUtils';
import DOMPurify from 'dompurify';

const PeriodDetail = () => {
  const { id } = useParams();

  const [period, setPeriod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [personsData, setPersonsData] = useState([]);
  const [locationsData, setLocationsData] = useState([]);
  const [postsData, setPostsData] = useState([]);

  // Mapping period names to beautiful hero images
  const getHeroImage = (period) => {
    if (period?.imageUrl) return period.imageUrl;
    const periodName = period?.name || '';
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

    const fetchData = async () => {
      setLoading(true);
      try {
        let dbPeriod = null;
        try {
          const res = await apiClient.get(`${API_ENDPOINTS.USER_PERIODS}/${id}`);
          if (res.data?.data) {
            dbPeriod = res.data.data;
          } else if (res.data) {
            dbPeriod = res.data;
          }
        } catch (apiErr) {
          console.error('Failed to fetch period detail from API:', apiErr);
        }

        if (dbPeriod && dbPeriod.status !== 'PUBLISHED') {
           dbPeriod = null;
        }

        if (dbPeriod) {
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

          // Normalize string arrays
          dbPeriod.emperors = parseArrayString(dbPeriod.emperors);
          dbPeriod.relatedLocations = parseArrayString(dbPeriod.relatedLocations);
          dbPeriod.relatedEvents = parseArrayString(dbPeriod.relatedEvents);
          dbPeriod.relatedArticles = parseArrayString(dbPeriod.relatedArticles);

          setPeriod({
            ...dbPeriod,
            period_id: dbPeriod.id,
            start_year: dbPeriod.startYear,
            end_year: dbPeriod.endYear,
            description: dbPeriod.description || '',
          });
          try {
            const [eventRes, perRes, locRes, posRes] = await Promise.all([
              apiClient.get(API_ENDPOINTS.USER_EVENTS, { params: { size: 500, status: 'PUBLISHED' } }).catch(() => ({})),
              personService.filter({ size: 500, status: 'PUBLISHED' }).catch(() => ({ items: [] })),
              locationService.filter({ size: 500, status: 'PUBLISHED' }).catch(() => ({ items: [] })),
              postService.filter({ size: 500, status: 'PUBLISHED' }).catch(() => ({ items: [] }))
            ]);

            const eventList = eventRes.data?.data?.result || eventRes.data?.data?.content || eventRes.data?.data || [];
            setPersonsData(perRes.items || []);
            setLocationsData(locRes.items || []);
            setPostsData(posRes.items || []);

            let filteredEvents = [];
            if (dbPeriod.relatedEvents && dbPeriod.relatedEvents.length > 0) {
              filteredEvents = dbPeriod.relatedEvents.map((eventName, idx) => {
                const matched = eventList.find(e => e.name === eventName);
                return matched || { id: `unlinked-${idx}`, name: eventName, isUnlinked: true, description: '' };
              });
            }

            const mergedRelatedEvents = filteredEvents.map(e => ({
              ...e,
              year: e.startYear !== undefined ? e.startYear : '',
              image: e.image || "/images/home.png"
            }));

            setRelatedEvents(mergedRelatedEvents.slice(0, 3));
          } catch (err) {
            console.error('Lỗi khi fetch events/posts cho PeriodDetail:', err);
          }
        } else {
          setPeriod(null);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="w-full min-h-[60vh] bg-transparent flex items-center justify-center font-body text-[#6b0f0d]">Đang tải thời kỳ...</div>;
  if (!period) return <div className="min-h-screen bg-[#fbf6e8] flex items-center justify-center font-body text-[#6b0f0d]">Không tìm thấy thời kỳ.</div>;

  const pName = period.name || '';

  // 1. Dùng dữ liệu từ Backend (Admin đã nhập)
  const computedEmperors = (period.emperors || []).map(empObj => {
    const name = typeof empObj === 'object' ? empObj.name : empObj;
    const matched = personsData.find(p => p.name === name || p.title === name);
    return matched || { id: null, name };
  });

  // 2. Dùng dữ liệu từ Backend (Admin đã nhập)
  const computedLocations = (period.relatedLocations || []).map(name => {
    const matched = locationsData.find(l => l.name === name);
    return matched || { id: null, name };
  });

  // 3. Dùng dữ liệu từ Backend (Admin đã nhập)
  const computedArticles = (period.relatedArticles || []).map(name => {
    const matched = postsData.find(art => art.title === name || art.name === name);
    return matched || { id: null, title: name };
  });

  return (
    <div className="w-full relative font-body selection:bg-[#d99b4a]/20 pb-20">
      <main className="max-w-[1440px] mx-auto px-6 md:px-12 py-16">



        {/* 1. HERO SECTION & OVERVIEW */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center mb-32 relative">
          <div className="lg:col-span-6 space-y-8 relative z-10">
            <span className="inline-block bg-[#6b0f0d] text-[#ffe7b0] px-4 py-1 font-body text-[10px] font-bold uppercase tracking-[0.3em] shadow-sm border border-[#d99b4a]/40">
              {(() => {
                const formatYear = (y) => {
                  if (y === undefined || y === null || y === '') return '';
                  const val = parseInt(y, 10);
                  if (isNaN(val)) return y;
                  return val < 0 ? `${Math.abs(val)} TCN` : `${val}`;
                };
                const s = formatYear(period.start_year);
                const e = formatYear(period.end_year);
                if (s || e) return `${s} - ${e || 'Nay'}`;
                return 'Thời Kỳ Lịch Sử';
              })()}
            </span>
            <h1 className="font-headline text-5xl md:text-7xl text-[#6b0f0d] font-semibold leading-tight tracking-tight">
              {period.name && period.name.includes('Nhà') ? period.name.replace('Nhà', 'Triều') : period.name}
            </h1>
            <div className="h-1 w-24 bg-[#d99b4a]"></div>

            {period.philosophy && (
              <blockquote className="font-headline text-2xl md:text-3xl italic text-[#8b1512] font-medium leading-relaxed tracking-wide my-4 border-l-4 border-[#d99b4a] pl-6 py-2 bg-gradient-to-r from-[#d99b4a]/10 to-transparent">
                "{period.philosophy}"
              </blockquote>
            )}

            {period.description ? (
              <div
                className="font-body text-[16px] leading-loose text-[#2b1a16]/90 pt-4 drop-cap whitespace-pre-line border-l-4 border-[#d99b4a] pl-6 prose prose-amber max-w-none"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(period.description) }}
              />
            ) : (
              <p className="font-body text-[16px] leading-loose text-[#2b1a16]/90 pt-4 drop-cap whitespace-pre-line border-l-4 border-[#d99b4a] pl-6">
                Nội dung tổng quan đang được cập nhật...
              </p>
            )}
          </div>

          <div className="lg:col-span-6 relative group">
            <div className="aspect-[4/5] overflow-hidden border-2 border-[#d99b4a]/40 shadow-2xl relative bg-[#fcf9ee] p-2 transform rotate-2 group-hover:rotate-0 transition-transform duration-700">
              <div className="w-full h-full border border-[#d99b4a]/30 relative overflow-hidden">
                <img 
                  src={getHeroImage(period)} 
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale-[0.3] sepia-[0.3]" 
                  alt={period.name} 
                  onError={(e) => {
                    e.target.onerror = null;
                    const periodName = period?.name || '';
                    const name = periodName.toLowerCase();
                    if (name.includes('hùng vương') || name.includes('hồng bàng')) e.target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuCVTT2QqvD6K9-wucC1WkR7VZnFnP0rjHn6TrcyVqbMkCLEt-GrSb7RFMcwfuFYl9579qyI-CbhlttwgMYFgZtqaEK6hcj7gIzEvC-x8r1WJkxShSTdvgJAiGZim3mnjYlIdJsvmeUw2bip5ou99uGqVBVApXptp6Lpy5LmjEOMY2yZYFGSQzjZdZ5ZBKHO-vZMXFRcwX7gOF6f0s6dB3ZlO7K3KuUYQcdtVpUeP-fDnTut1_okhKeJqvG2OJTJ0xZCroTJlNoWryp1";
                    else if (name.includes('lý')) e.target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuB-vfyWu8AZJ8zXJcGYqxgtuwF8kgnNnxqHfqVCWu6IexNxd58MLyYryN2Pd4GPPIwQcgir92iGx39PPcocu5YwY0dKB88RM80ItVGkDs80nIlov0g4PRkKkWZqNqeAX2cgwfngoBoFqIt07Pir--2qzfNsUbTW8P_bXbYNjOL9IKt34YPVLuKa93Sk3GhQCaHLTecwGQGCZuSq0bnrOOq6oXKKmx5RiNGxRXHOQb6CiTjXlTeHajpZq_8iG4JClpUY9GWZsiRXvkTh";
                    else if (name.includes('trần')) e.target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuBArlscw3wc_0llom4YXbNv7OUtmTW1u8adGJtB0r_R9ouLWRlOhBtwANhi8h-y-oKCXyjtcMAw-fv_DqJa8j9I0UYbf6VIaYfgHL50aCXOYoKCdQKYmjZdoMl1JYnzrRbkzkf79To66-2d-f1XfB1xrJTtxZoVqJiuNrqbgJSqttpHAF3wZGHnereJFQmlr7zvRv_OYZP3ifnXN8WYT8_1w8_n43OLOx1lJp01FpEjYuFGNSEqolT22CJMX1LelRwU2FVHe3Qq_fbP";
                    else if (name.includes('lê')) e.target.src = "https://lh3.googleusercontent.com/aida-public/AB6AXuDDTXt3tOmQLzCboBJbQ63U5COKxdxaq5GrOn1775TXtXg3zq28AuTTb3mfVjKs6uj5Nkhc7auEFnCrMuCs6G4YIcZmzBgEE4ZdY3awqlP12VklH3BWkRe6Q83fhxNWatx1MbYcLIq7RztTsqI3HQRxPVW7T-TPQdwD7HM2eOSpwVHwup9Hp3K7KuNRjtoiaNSNbwvYXV_yv4pvRx5WIpTl05zH0YYusegbAB7v9qKEqrHI9SzL2DI2Hb0snIW35b9H7yKKrRRXIf79";
                    else e.target.src = "/images/home.png";
                  }}
                />
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
              {relatedEvents.map((evt, idx) => {
                const CardWrapper = evt.isUnlinked ? 'div' : Link;
                const wrapperProps = evt.isUnlinked ? { className: "bg-[#fffdf8] border border-[#d99b4a]/30 rounded-xl overflow-hidden hover:shadow-[0_12px_30px_rgba(107,15,13,0.12)] transition-all duration-500 transform hover:-translate-y-1 group flex flex-col" } : { to: `/events/${evt.id}`, className: "bg-[#fffdf8] border border-[#d99b4a]/30 rounded-xl overflow-hidden hover:shadow-[0_12px_30px_rgba(107,15,13,0.12)] transition-all duration-500 transform hover:-translate-y-1 group flex flex-col" };

                return (
                  <CardWrapper key={idx} {...wrapperProps}>
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
                        {stripHtml(evt.description)}
                      </p>
                      {!evt.isUnlinked && (
                        <div className="mt-auto pt-4 flex items-center justify-end text-[#d99b4a] font-bold text-[12px] uppercase tracking-widest relative z-10">
                          Chi tiết <span className="material-symbols-outlined text-[16px] ml-1 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </div>
                      )}
                    </div>
                  </CardWrapper>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. RELATED ENTITIES */}
        {/* 3. RELATED ENTITIES */}
        {(computedEmperors.length > 0 || computedLocations.length > 0 || computedArticles.length > 0) && (
          <section className="mb-32">
            <h2 className="font-headline text-4xl text-[#6b0f0d] font-semibold mb-12 flex items-center gap-4 border-b border-[#d99b4a]/30 pb-4">
              <span className="material-symbols-outlined text-4xl text-[#d99b4a]">hub</span>
              Các Liên Kết Liên Quan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Emperors */}
              {computedEmperors.length > 0 && (
                <div className="bg-[#fffdf8] border border-[#d99b4a]/30 p-6 rounded-xl">
                  <h3 className="font-headline text-xl text-[#6b0f0d] font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#d99b4a]">groups</span> Nhân vật then chốt
                  </h3>
                  <ul className="space-y-2">
                    {computedEmperors.map((p, i) => (
                      <li key={i} className="flex items-center gap-2 font-body text-[15px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d99b4a]"></span>
                        {p.id ? (
                          <Link to={`/characters/${p.id}`} className="text-[#2b1a16] hover:text-[#6b0f0d] font-semibold transition-colors underline-offset-2 hover:underline">{p.name || p.title}</Link>
                        ) : (
                          <span className="text-[#2b1a16] font-semibold italic">{p.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Locations */}
              {computedLocations.length > 0 && (
                <div className="bg-[#fffdf8] border border-[#d99b4a]/30 p-6 rounded-xl">
                  <h3 className="font-headline text-xl text-[#6b0f0d] font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#d99b4a]">location_on</span> Địa danh
                  </h3>
                  <ul className="space-y-2">
                    {computedLocations.map((l, i) => (
                      <li key={i} className="flex items-center gap-2 font-body text-[15px]">
                        <span className="material-symbols-outlined text-[14px] text-[#d99b4a]">map</span>
                        {l.id ? (
                          <Link to={`/locations/${l.id}`} className="text-[#2b1a16] hover:text-[#6b0f0d] transition-colors hover:underline underline-offset-2">{l.name}</Link>
                        ) : (
                          <span className="text-[#2b1a16]">{l.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Articles */}
              {computedArticles.length > 0 && (
                <div className="bg-[#fffdf8] border border-[#d99b4a]/30 p-6 rounded-xl">
                  <h3 className="font-headline text-xl text-[#6b0f0d] font-bold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#d99b4a]">article</span> Bài viết
                  </h3>
                  <ul className="space-y-2">
                    {computedArticles.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 font-body text-[15px]">
                        <span className="material-symbols-outlined text-[16px] text-[#d99b4a] mt-0.5">menu_book</span>
                        {a.id ? (
                          <Link to={`/posts/${a.id}`} className="text-[#2b1a16] hover:text-[#6b0f0d] transition-colors leading-snug hover:underline underline-offset-2">{a.title}</Link>
                        ) : (
                          <span className="text-[#2b1a16] leading-snug">{a.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

export default PeriodDetail;
