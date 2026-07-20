import { API_ENDPOINTS, apiClient, personService } from '../../../services';
import { useState, useEffect } from 'react';
import { Link, useLocation, useOutletContext } from 'react-router-dom';

import Pagination from '../../../components/common/Pagination';
import { IMAGES, MISC_IMAGES } from '../../../config/constants';
import { resolveImageUrl } from '../../../utils/imageUtils';

const UserCharacters = () => {
  const { backgroundUrl = '' } = useOutletContext() || {};
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearch = queryParams.get('search') || '';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [activePeriod, setActivePeriod] = useState('');
  const [characters, setCharacters] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  useEffect(() => {
    const fetchData = async () => {
      try {
        let dbItems = [];
        let eventPeriodMap = {};
        let personPeriodsMap = {};

        try {
          const [dbRes, partRes, eventRes, rawPeriods] = await Promise.allSettled([
            personService.filter({ size: 500, status: 'PUBLISHED' }),
            apiClient.get('/api/v1/admin/participations', { params: { size: 5000 } }),
            apiClient.get('/api/v1/admin/events', { params: { size: 500 } }),
            apiClient.get('/api/v1/admin/periods', { params: { size: 500, status: 'PUBLISHED' } })
          ]);

          dbItems = dbRes.status === 'fulfilled' ? (dbRes.value.items || []) : [];

          if (rawPeriods.status === 'fulfilled') {
            const periodList = rawPeriods.value.data?.data?.result || rawPeriods.value.data?.data?.content || rawPeriods.value.data?.data || rawPeriods.value.data || [];
            if (Array.isArray(periodList)) setPeriods(periodList.map(p => p.name).filter(Boolean));
          }

          const participationsList = partRes.status === 'fulfilled' ? (partRes.value.data?.data?.result || partRes.value.data?.data || []) : [];
          const eventsList = eventRes.status === 'fulfilled' ? (eventRes.value.data?.data?.result || eventRes.value.data?.data?.content || eventRes.value.data || []) : [];

          eventsList.forEach(e => {
            if (e.id && e.period?.name) {
              eventPeriodMap[e.id] = e.period.name;
            }
          });

          participationsList.forEach(p => {
            const personId = p.person?.id;
            const eventId = p.event?.id;
            if (personId && eventId) {
              const periodName = eventPeriodMap[eventId];
              if (periodName) {
                if (!personPeriodsMap[personId]) {
                  personPeriodsMap[personId] = new Set();
                }
                personPeriodsMap[personId].add(periodName);
              }
            }
          });
        } catch (apiErr) {
          console.error('Lỗi gọi API:', apiErr);
        }

        let merged = [];

        if (dbItems.length > 0) {
          dbItems.forEach(dbItem => {
            const rawDesc = dbItem.biography || dbItem.description || '';
            let cleanDesc = '';
            if (rawDesc) {
              const tmp = document.createElement('div');
              tmp.innerHTML = rawDesc;
              cleanDesc = tmp.textContent || tmp.innerText || '';
            }

            let cachedDynasties = [];
            const liveDyns = personPeriodsMap[dbItem.id];
            if (liveDyns) {
              liveDyns.forEach(d => cachedDynasties.push(d));
            }

            const cached = localStorage.getItem(`local_char_relations_${dbItem.id}`);
            if (cached) {
              try {
                const parsed = JSON.parse(cached);
                if (parsed.dynasties) {
                  parsed.dynasties.forEach(d => {
                    if (!cachedDynasties.includes(d)) cachedDynasties.push(d);
                  });
                }
              } catch (e) { }
            }

            merged.push({
              ...dbItem,
              person_id: dbItem.id,
              realName: dbItem.alias || '',
              desc: cleanDesc,
              dynasties: cachedDynasties.length > 0 ? cachedDynasties : (dbItem.dynasty ? [dbItem.dynasty] : ['Chưa rõ']),
              image: resolveImageUrl(dbItem.imageUrl || dbItem.avatar),
              achievements: [],
              years: dbItem.birthDate || dbItem.deathDate
                ? `${dbItem.birthDate ? dbItem.birthDate : '?'} - ${dbItem.deathDate ? dbItem.deathDate : '?'}`
                : ''
            });
          });
        }

        setCharacters(merged);
      } catch (error) {
        console.error('Error fetching characters:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredCharacters = characters.filter(char => {
    const safeName = String(char.name || '').toLowerCase();
    const safeRealName = String(char.realName || '').toLowerCase();
    const matchesSearch = safeName.includes(searchTerm.toLowerCase()) || safeRealName.includes(searchTerm.toLowerCase());
    const matchesPeriod = activePeriod === '' || activePeriod === 'Tất cả thời kỳ' || activePeriod === 'Tất cả thời đại' || activePeriod === 'Tất cả triều đại' || (char.dynasties || []).some(d => (d || '').includes(activePeriod.replace('Triều ', '')));
    return matchesSearch && matchesPeriod;
  });

  const totalPages = Math.ceil(filteredCharacters.length / ITEMS_PER_PAGE);
  const paginatedCharacters = filteredCharacters.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return <div className="w-full min-h-[60vh] bg-transparent flex items-center justify-center font-body text-[#6b0f0d]">Đang tải nhân vật...</div>;

  return (
    <div className="w-full relative font-body selection:bg-[#d99b4a]/20">
      {/* HERO SECTION */}
      <section className="relative h-[450px] flex items-center justify-center overflow-hidden border-b border-[#d99b4a]/30">
        <div className="absolute inset-0 z-0 bg-[#2b0504]">
          <img
            className="w-full h-full object-cover grayscale-[30%] sepia-[40%] brightness-[0.4] animate-ken-burns origin-center"
            src={backgroundUrl || MISC_IMAGES.CHAR_FALLBACK_BG}
            alt="Characters Hero"
            onError={(e) => { e.target.src = MISC_IMAGES.DEFAULT_ERROR_FALLBACK }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2b0504]/90 via-[#2b0504]/40 to-[#fbf6e8] pointer-events-none"></div>
        </div>
        <div className="relative z-10 text-center space-y-4 max-w-4xl px-12 mt-10">
          <span className="text-[#d9c7a7] font-body text-[11px] font-bold uppercase tracking-[0.4em] mb-4 block drop-shadow-md">Tinh Hoa Đại Việt</span>
          <h1 className="font-headline text-5xl md:text-6xl lg:text-[72px] text-[#f7d78a] font-semibold tracking-tight drop-shadow-lg mb-4">Nhân Vật Lịch Sử</h1>
          <p className="font-body text-sm md:text-base lg:text-lg text-[#f8ead0]/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md italic">
            "Tuy mạnh yếu từng lúc khác nhau, song hào kiệt đời nào cũng có."
            <span className="block mt-2 text-[11px] not-italic uppercase tracking-widest text-[#d9c7a7] font-bold">— Bình Ngô Đại Cáo —</span>
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
              placeholder="Tìm kiếm theo tên nhân vật..."
              value={searchTerm}
              onChange={(e) => {
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
                value={activePeriod}
                onChange={(e) => {
                  setActivePeriod(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-[#fcf9ee]/50 border border-[#d99b4a]/30 text-[#2b1a16] rounded-lg py-3 pl-12 pr-10 appearance-none outline-none focus:border-[#6b0f0d]/60 transition-colors font-body cursor-pointer shadow-inner">
                <option value="">Tất cả triều đại</option>
                {periods.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#6b0f0d]/60 pointer-events-none">expand_more</span>
            </div>

            <div className="w-full md:w-auto flex items-center justify-center px-4 bg-[#fcf9ee]/50 border border-[#d99b4a]/30 rounded-lg py-3 text-[13px] text-[#6b0f0d] font-bold font-body uppercase tracking-wider shadow-inner">
              <span className="material-symbols-outlined text-[16px] mr-2">sort</span>
              {filteredCharacters.length} / {characters.length}
            </div>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-6 md:px-12 mt-8 mb-20 animate-in fade-in duration-700 relative z-10">
          {/* GALLERY GRID */}
          {filteredCharacters.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {paginatedCharacters.map((char) => (
                <div key={char.id} className="bg-[#fffdf8] rounded-xl shadow-[0_4px_20px_rgba(43,5,4,0.06)] border border-[#d99b4a]/30 overflow-hidden flex flex-col group hover:shadow-[0_12px_30px_rgba(107,15,13,0.12)] transition-all duration-500 transform hover:-translate-y-1">

                  {/* Image section */}
                  <div className="relative h-[300px] w-full overflow-hidden shrink-0 border-b-2 border-[#d99b4a]/20">
                    <img
                      src={char.image}
                      alt={char.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 sepia-[0.1]"
                      referrerPolicy="no-referrer"
                    />

                    {/* Gradient overlay for bottom text */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#1a0201] via-[#1a0201]/50 to-transparent pointer-events-none"></div>

                    {/* Name and years */}
                    <div className="absolute top-4 right-4 flex flex-col gap-1 items-end z-10">
                      {(char.dynasties || []).filter(Boolean).map((dynasty, idx) => (
                        <div key={idx} className="bg-[#6b0f0d]/95 backdrop-blur-sm border border-[#d99b4a]/40 text-[#ffe7b0] text-[10px] font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-widest">
                          {dynasty && dynasty.includes('Nhà') ? dynasty.replace('Nhà', 'Triều') : dynasty}
                        </div>
                      ))}
                    </div>

                    <div className="absolute bottom-5 left-5 right-5 text-[#ffe7b0] z-10">
                      <h2 className="font-headline text-[30px] font-bold tracking-wide leading-tight drop-shadow-md">
                        {char.name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        {(char.realName || char.title) && <span className="text-[16px] opacity-90 font-medium font-body text-[#f7d78a]">({char.realName || char.title})</span>}
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d99b4a] opacity-80"></span>
                        <span className="text-[13px] opacity-80 font-medium tracking-widest">{char.years}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content section */}
                  <div className="p-6 flex flex-col flex-grow relative bg-[#fffdf8] dong-son-pattern-subtle">
                    <p className="text-[#2b1a16]/80 text-[14px] leading-relaxed mb-6 line-clamp-4 font-body relative z-10">
                      {char.desc}
                    </p>

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

          {/* PAGINATION */}
          {filteredCharacters.length > 0 && (
            <div className="mt-12">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default UserCharacters;
