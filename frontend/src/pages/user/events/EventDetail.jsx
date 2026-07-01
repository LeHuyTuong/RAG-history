import { API_ENDPOINTS, apiClient, mockClient } from '../../../services';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const EventDetail = () => {
  const { id } = useParams();

  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cuộn lên đầu trang khi vào trang mới
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        let dbEvent = null;
        try {
          const url = typeof API_ENDPOINTS.USER_EVENT_DETAIL === 'function' ? API_ENDPOINTS.USER_EVENT_DETAIL(id) : `${API_ENDPOINTS.USER_EVENT_DETAIL}/${id}`;
          const response = await apiClient.get(url);
          dbEvent = response.data?.data || response.data;
        } catch (apiErr) {
          console.error('Failed to fetch event detail from API:', apiErr);
        }

        let dbParts = [];
        let dbArticles = [];
        try {
          const articlesRes = await apiClient.get(API_ENDPOINTS.USER_ARTICLES, { params: { eventId: id, size: 100 } });
          dbArticles = articlesRes.data?.data?.result || articlesRes.data?.data?.content || articlesRes.data?.data || [];
        } catch (err) {
          console.error('Error fetching event articles:', err);
        }

        if (dbEvent) {
          try {
            const partsRes = await apiClient.get('/api/v1/admin/participations', { params: { eventId: dbEvent.id } });
            const rawParts = partsRes.data?.data?.result || partsRes.data?.data || [];
            dbParts = rawParts.map(item => ({
              person_id: item.person?.id,
              person_name: item.person?.name,
              role: item.role === 'LEADER' ? 'Lãnh đạo' : item.role === 'COMMANDER' ? 'Chỉ huy' : 'Tham chiến',
              color: 'border-l-[#d99b4a]'
            }));
          } catch (err) {
            console.error('Error fetching participations:', err);
          }

          const parseEventYear = (dateStr, fallbackYear) => {
            if (!dateStr) return fallbackYear;
            const isNegative = dateStr.startsWith('-');
            const cleanStr = isNegative ? dateStr.substring(1) : dateStr;
            const match = cleanStr.match(/^(\d{4})/);
            if (match) {
              const y = parseInt(match[1], 10);
              return isNegative ? -y : y;
            }
            return fallbackYear;
          };
          const resolvedStartYear = parseEventYear(dbEvent?.startDate, dbEvent?.startYear);

          setEventData({
            ...dbEvent,
            event_id: dbEvent.id,
            title: dbEvent.name,
            description: dbEvent.description || '',
            time: resolvedStartYear !== undefined
              ? `${Math.abs(resolvedStartYear)} ${resolvedStartYear < 0 ? 'TCN' : ''}`
              : '',
            location: dbEvent?.locationRelations && dbEvent.locationRelations.length > 0
              ? dbEvent.locationRelations.map(l => l.name).join(', ')
              : 'Chưa rõ',
            locationRelations: dbEvent.locationRelations || [],
            heroImg: dbEvent.image || "/images/home.png",
            mapImg: dbEvent.image || "/images/home.png",
            participations: dbParts,
            relatedArticles: dbArticles
          });
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [id]);

  if (loading) return <div className="w-full min-h-[60vh] bg-transparent flex items-center justify-center font-body text-[#6b0f0d]">Đang tải sự kiện...</div>;
  if (!eventData) return <div className="min-h-screen bg-[#fbf6e8] flex items-center justify-center font-body text-[#6b0f0d]">Không tìm thấy sự kiện.</div>;

  return (
    <div className="w-full relative font-body selection:bg-[#d99b4a]/20 pb-20">
      <main className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">

        {/* Breadcrumb */}
        <nav className="mb-10 flex items-center space-x-2 font-body text-[10px] uppercase tracking-widest text-[#2b1a16]/60">
          <Link to="/" className="hover:text-[#6b0f0d] transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-xs opacity-40">chevron_right</span>
          <Link to="/events" className="hover:text-[#6b0f0d] transition-colors">Sự kiện Quân sự</Link>
          <span className="material-symbols-outlined text-xs opacity-40">chevron_right</span>
          <span className="text-[#6b0f0d] font-bold">{eventData.title || eventData.name}</span>
        </nav>

        {/* --- 1. HERO SECTION --- */}
        <section className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <span className="inline-block bg-[#6b0f0d]/5 text-[#6b0f0d] px-4 py-1.5 font-body text-[10px] font-bold uppercase tracking-[0.3em] border border-[#d99b4a]/30 shadow-sm">
              {eventData.period?.name || eventData.category || 'Chiến tích Lịch sử'}
            </span>
            <h1 className="font-headline text-5xl md:text-7xl text-[#6b0f0d] leading-tight font-semibold tracking-tight">
              {eventData.title || eventData.name}
            </h1>
            {/* Tags đã chọn */}
            <div className="flex flex-wrap gap-2 pt-2">
              {(eventData.period?.name || eventData.category) && (
                <span className="bg-[#6b0f0d] text-[#ffe7b0] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[#d99b4a]/30 shadow-sm">
                  Triều đại: {eventData.period?.name || eventData.category}
                </span>
              )}
              {eventData.locationRelations && eventData.locationRelations.map((loc, idx) => (
                <span key={idx} className="bg-[#fffdf8] text-[#6b0f0d] px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-[#d99b4a]/30 flex items-center gap-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-[12px] opacity-70">location_on</span>
                  {loc.name}
                </span>
              ))}
            </div>
            <div
              className="font-body text-[16px] text-[#2b1a16]/90 max-w-2xl border-l-4 border-[#d99b4a] pl-8 py-2 leading-relaxed space-y-4 ql-editor"
              dangerouslySetInnerHTML={{ __html: eventData.subtitle || eventData.description }}
            />
          </div>
          <div className="lg:col-span-5 relative group">
            <div className="absolute -inset-4 border border-[#d99b4a]/40 pointer-events-none dong-son-border"></div>
            <div className="aspect-[4/3] overflow-hidden border border-[#d99b4a]/50 shadow-2xl relative bg-[#fffdf8] p-2">
              <div className="w-full h-full relative border border-[#d99b4a]/30 overflow-hidden">
                <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale-[0.6] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0" src={eventData.heroImg} alt="Hero" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/60 to-transparent opacity-80 mix-blend-overlay"></div>
              </div>
            </div>
            {/* Decorative Corner */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20 pointer-events-none dong-son-pattern mix-blend-multiply"></div>
          </div>
        </section>

        {/* --- 2. BASIC INFO BENTO GRID --- */}
        <section className="mb-20 grid grid-cols-1 md:grid-cols-4 gap-6">
          <InfoCard icon="calendar_today" label="Niên đại" value={eventData.time} />
          <InfoCard icon="location_on" label="Địa điểm" value={eventData.location} />
          <InfoCard icon="groups" label="Lực lượng" value={eventData.forces || 'Chưa rõ'} />
          <InfoCard icon="military_tech" label="Kết quả" value={eventData.result || 'Chưa rõ'} isHighlight />
        </section>

        {/* --- 3. TACTICAL MAP & GALLERY --- */}
        <section className="mb-20 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div className="space-y-8">
            <h2 className="font-headline text-3xl text-[#6b0f0d] border-b border-[#d99b4a]/30 pb-4 font-semibold">Bản đồ Chiến thuật</h2>
            <div className="relative overflow-hidden border border-[#d99b4a]/40 bg-[#fffdf8] aspect-video p-6 shadow-md group">
              <div className="absolute inset-0 bg-[#fcf9ee] opacity-40 dong-son-pattern pointer-events-none"></div>
              <div className="border border-[#d99b4a]/20 w-full h-full p-2 relative z-10 bg-white">
                <img className="w-full h-full object-contain grayscale-[0.8] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-700" src={eventData.mapImg} alt="Tactical Map" />
              </div>
            </div>
            <p className="font-body text-[15px] text-[#2b1a16]/80 leading-relaxed border-l-2 border-[#d99b4a]/60 pl-4">
              Bản đồ phục dựng vị trí bãi cọc và hướng di chuyển của thủy quân hai bên trong trận quyết chiến.
            </p>
          </div>

          <div className="space-y-8">
            <h2 className="font-headline text-3xl text-[#6b0f0d] border-b border-[#d99b4a]/30 pb-4 font-semibold">Phục dựng bối cảnh</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="aspect-square overflow-hidden border border-[#d99b4a]/40 shadow-sm p-1 bg-[#fffdf8] group">
                <img className="w-full h-full object-cover grayscale-[0.6] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500" src={eventData.gallery?.[0] || eventData.image || "/images/home.png"} alt="visual 1" />
              </div>
              <div className="aspect-square overflow-hidden border border-[#d99b4a]/40 shadow-sm p-1 bg-[#fffdf8] group">
                <img className="w-full h-full object-cover grayscale-[0.6] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500" src={eventData.gallery?.[1] || eventData.image || "/images/home.png"} alt="visual 2" />
              </div>
            </div>
          </div>
        </section>

        {/* --- 4. FIGURES --- */}
        <section className="space-y-10">
          <h2 className="font-headline text-3xl text-[#6b0f0d] font-semibold">Nhân vật tham chiến</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(eventData.participations || []).map((fig, i) => (
              <Link to={`/characters/${fig.person_id}`} key={i} className={`flex items-center space-x-6 p-6 bg-[#fffdf8] border border-[#d99b4a]/30 border-l-4 ${fig.color} shadow-sm group hover:shadow-md transition-all`}>
                <div className="w-16 h-16 rounded-full bg-[#fcf9ee] flex-shrink-0 flex items-center justify-center border border-[#d99b4a]/40 group-hover:bg-[#d99b4a]/20 transition-colors">
                  <span className="material-symbols-outlined text-[#6b0f0d]/60 text-3xl group-hover:text-[#6b0f0d]">person</span>
                </div>
                <div>
                  <h4 className="font-headline text-xl text-[#2b0504] font-semibold group-hover:text-[#6b0f0d] transition-colors">{fig.person_name}</h4>
                  <p className="font-body text-[9px] font-bold uppercase text-[#2b1a16]/60 tracking-widest mt-1">{fig.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* --- 5. RELATED ARTICLES --- */}
        {eventData.relatedArticles && eventData.relatedArticles.length > 0 && (
          <section className="space-y-10 border-t border-[#d99b4a]/30 pt-16 mt-20">
            <h2 className="font-headline text-3xl text-[#6b0f0d] font-semibold">Bài viết liên quan</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {eventData.relatedArticles.map((art) => (
                <article key={art.id || art.post_id} className="group bg-[#fffdf8] border border-[#d99b4a]/30 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-500 flex flex-col relative overflow-hidden">
                  <div className="border border-[#d99b4a]/30 relative flex flex-col h-full bg-[#fcf9ee] dong-son-pattern">
                    <div className="h-52 overflow-hidden relative border-b border-[#d99b4a]/30">
                      <Link to={`/articles/${art.slug}`}>
                        <img
                          className="w-full h-full object-cover grayscale-[0.6] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0 group-hover:scale-110 transition-transform duration-700"
                          src={art.thumbnailUrl || "https://upload.wikimedia.org/wikipedia/commons/4/48/Ngoc_Lu.jpg"}
                          alt={art.title}
                        />
                      </Link>
                      <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/60 to-transparent opacity-70 pointer-events-none"></div>
                    </div>
                    <div className="p-6 flex flex-col flex-grow relative z-10">
                      <Link to={`/articles/${art.slug}`}>
                        <h4 className="font-headline text-xl text-[#2b0504] font-semibold group-hover:text-[#6b0f0d] transition-colors mb-3 leading-tight tracking-tight">
                          {art.title}
                        </h4>
                      </Link>
                      <p className="font-body text-xs text-[#2b1a16]/80 line-clamp-3 mb-4 leading-relaxed">
                        {art.summary}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
};

// Component con cho Bento Grid
const InfoCard = ({ icon, label, value, isHighlight }) => (
  <div className={`p-8 border flex flex-col items-center text-center space-y-4 transition-all hover:-translate-y-1 ${isHighlight ? 'bg-[#6b0f0d] text-[#ffe7b0] border-[#d99b4a]/40 shadow-xl relative overflow-hidden' : 'bg-[#fffdf8] border-[#d99b4a]/30 shadow-sm relative'}`}>
    {isHighlight && <div className="absolute inset-0 bg-black/10 mix-blend-overlay dong-son-pattern opacity-10 pointer-events-none"></div>}
    <span className={`material-symbols-outlined text-4xl relative z-10 ${isHighlight ? 'text-[#d99b4a]' : 'text-[#6b0f0d] opacity-60'}`}>{icon}</span>
    <div className="relative z-10">
      <p className={`font-body text-[9px] font-bold uppercase tracking-widest mb-2 ${isHighlight ? 'text-[#fcf9ee]/60' : 'text-[#6b0f0d]/60'}`}>{label}</p>
      <p className={`font-headline text-2xl font-semibold ${isHighlight ? 'text-[#f7d78a]' : 'text-[#2b0504]'}`}>{value}</p>
    </div>
  </div>
);

export default EventDetail;