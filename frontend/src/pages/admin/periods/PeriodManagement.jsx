import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader, AdminLayout, ActionModal } from '../../../components/admin';
import useModalStore from '../../../store/zustand/useModalStore';
import { useSelector, useDispatch } from 'react-redux';
import { fetchMetadataOverview, deletePeriod, reorderPeriodsLocal } from '../../../store/redux/slices/metadataSlice';
import toast from 'react-hot-toast';

const PeriodManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { data, loading } = useSelector((state) => state.metadata);
  const { isOpen, modalType, modalData, openModal, closeModal } = useModalStore();

  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'before' | 'after'

  const [searchTerm, setSearchTerm] = useState('');

  const [activePeriod, setActivePeriod] = useState(null);
  const sectionRefs = useRef({});
  const sidebarListRef = useRef(null);

  useEffect(() => {
    dispatch(fetchMetadataOverview());
  }, [dispatch]);

  // Set active period when data is loaded
  useEffect(() => {
    if (data && data.periods && data.periods.length > 0 && !activePeriod) {
      setActivePeriod(data.periods[0].id);
    }
  }, [data, activePeriod]);

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
    if (!data || !data.periods || data.periods.length === 0) return;

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
  }, [data]);

  const scrollToPeriod = (id) => {
    setActivePeriod(id);
    const element = sectionRefs.current[id];
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const openDelete = (type, item) =>
    openModal('delete_metadata', { type, name: item.name, id: item.id });

  const handleDeleteConfirm = async () => {
    if (!modalData) return;
    const { type, id } = modalData;
    if (id === null || id === undefined) return;

    try {
      if (type === 'thời kỳ') {
        await dispatch(deletePeriod(id)).unwrap();
        dispatch(fetchMetadataOverview());
      }
      closeModal();
    } catch (e) {
      console.error('Lỗi khi xóa thời kỳ:', e);
      toast.error('Có lỗi xảy ra khi xóa thời kỳ!');
    }
  };

  const filteredPeriods = data?.periods?.filter(p => 
    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <AdminLayout>
      <PageHeader
        title="Thời kỳ lịch sử"
        subtitle="Quản lý dòng thời gian và các thời đại lịch sử."
        actionLabel="Thêm thời kỳ mới"
        actionHref="/admin/periods/new"
        actionIcon="add"
      />

      <div className="mt-8 flex flex-col lg:flex-row gap-8 relative">
        {/* Left Sidebar (Sticky) */}
        <aside className="w-full lg:w-[320px] shrink-0 lg:sticky lg:top-24 self-start z-20">
          <div className="bg-[#fffdf8] border border-[#d99b4a]/30 shadow-lg relative overflow-hidden rounded-xl">
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
              {!loading && filteredPeriods.map(p => (
                <li key={p.id} data-period-id={p.id}>
                  <button
                    onClick={() => scrollToPeriod(p.id)}
                    className={`w-full text-left px-6 py-4 font-body text-[15px] transition-all border-l-4 group ${Number(activePeriod) === Number(p.id)
                      ? 'bg-[#d99b4a]/10 border-[#6b0f0d] text-[#6b0f0d] font-bold shadow-inner'
                      : 'border-transparent text-[#2b1a16] hover:bg-[#fcf9ee] hover:text-[#6b0f0d]'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {p.status === 'DRAFT' && (
                          <span className="w-2 h-2 rounded-full bg-[#e02424] shrink-0" title="Bản nháp"></span>
                        )}
                        <span>{p.name}</span>
                      </div>
                      <span className={`material-symbols-outlined text-[18px] transition-transform ${Number(activePeriod) === Number(p.id) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>east</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Right Main Content */}
        <section className="flex-1 bg-surface-low border border-outline-variant p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-headline text-2xl text-primary font-bold flex items-center gap-2">
              <span className="material-symbols-outlined text-2xl">timeline</span> Dòng chảy Thời kỳ (Timeline)
            </h3>
          </div>
          <div className="relative pl-6 lg:pl-16 mt-6">
            {/* Vertical Rail */}
            <div className="absolute left-[11px] lg:left-[23px] top-4 bottom-0 w-[2px] bg-gradient-to-b from-[#6b0f0d] via-[#d99b4a]/60 to-transparent z-0"></div>

            <div className="space-y-20 lg:space-y-32 relative z-10 pb-4 pt-2">
              {loading ? (
                <div className="w-full text-center py-4 font-body text-sm text-on-surface-variant">Đang tải thời kỳ...</div>
              ) : filteredPeriods.length === 0 ? (
                <div className="w-full text-center py-8 font-body text-sm text-on-surface-variant">Không tìm thấy thời kỳ nào phù hợp.</div>
              ) : (
                filteredPeriods.map((p, index) => (
                  <div key={p.id} id={p.id} ref={(el) => (sectionRefs.current[p.id] = el)} className="relative group">
                    {/* Timeline Node */}
                    <div className={`absolute -left-[24px] lg:-left-[52px] top-6 w-6 h-6 rounded-full border-[4px] shadow-[0_0_15px_rgba(107,15,13,0.4)] z-10 transition-all duration-500 ${Number(activePeriod) === Number(p.id)
                      ? 'bg-[#6b0f0d] border-[#d99b4a] scale-125'
                      : 'bg-[#fbf6e8] border-[#6b0f0d] group-hover:bg-[#6b0f0d] group-hover:scale-125'
                      }`}></div>

                    <div
                      className={`shadow-lg hover:shadow-[0_20px_50px_rgba(43,5,4,0.08)] transition-all duration-500 relative group/card border-2 p-8 lg:p-12 flex flex-col xl:flex-row gap-10 items-start ${Number(activePeriod) === Number(p.id)
                          ? 'bg-[#fffcf3] border-[#6b0f0d] shadow-2xl scale-[1.01]'
                          : 'bg-[#fffdf8] border-[#d99b4a]/40 hover:border-[#6b0f0d]/50'
                        }`}
                    >
                      {/* Decorative Corners */}
                      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#d99b4a]/40 pointer-events-none group-hover/card:border-[#6b0f0d]/60 transition-colors"></div>
                      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#d99b4a]/40 pointer-events-none group-hover/card:border-[#6b0f0d]/60 transition-colors"></div>

                      {/* Text Content */}
                      <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-4 flex-wrap">
                          <span className="font-body text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest bg-[#6b0f0d] text-[#ffe7b0]">
                            THỜI KỲ
                          </span>
                          {p.status === 'DRAFT' ? (
                            <span className="font-body text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest bg-[#fff5f5] text-[#e02424] border border-[#e02424]/30 rounded">
                              BẢN NHÁP
                            </span>
                          ) : (
                            <span className="font-body text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest bg-[#f0fdf4] text-[#16a34a] border border-[#16a34a]/30 rounded">
                              CÔNG KHAI
                            </span>
                          )}
                          <span className="font-headline text-[#d99b4a] font-bold text-lg">
                            {p.range}
                          </span>
                        </div>

                        <h3 className="font-headline text-3xl md:text-4xl font-bold tracking-tight text-[#2b0504] group-hover/card:text-[#6b0f0d] transition-colors duration-500">
                          {p.name}
                        </h3>

                        {p.philosophy && (
                          <p className="font-body text-[#d99b4a] italic font-semibold text-lg">"{p.philosophy}"</p>
                        )}

                        <p className="font-body text-[15px] text-[#2b1a16]/80 leading-relaxed pt-2">
                          "{p.desc}"
                        </p>

                        <div className="space-y-3 py-4 border-t border-b border-[#d99b4a]/20">
                          {p.emperors && p.emperors.length > 0 && (
                            <div className="mt-4 first:mt-0">
                              <span className="font-headline text-[13px] text-[#6b0f0d] font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                <span className="material-symbols-outlined text-[16px]">groups</span>
                                Nhân vật then chốt:
                              </span>
                              <div className="flex flex-col gap-1">
                                {p.emperors.slice(0, 3).map((emp, i) => {
                                  const matched = (data.allCharacters || []).find(c => c.name === emp || c.title === emp);
                                  return matched ? (
                                    <Link key={i} to={`/admin/characters/edit/${matched.id}`} className="flex items-center gap-2 group/link hover:bg-[#d99b4a]/10 px-2 py-1 -ml-2 rounded-lg transition-colors w-fit">
                                      <div className="w-1.5 h-1.5 rotate-45 bg-[#d99b4a] group-hover/link:bg-[#6b0f0d] shrink-0 transition-colors"></div>
                                      <span className="font-body text-[14px] text-[#4a2a22] font-semibold italic group-hover/link:text-[#6b0f0d] transition-colors">{emp}</span>
                                      <span className="material-symbols-outlined text-[14px] opacity-0 group-hover/link:opacity-100 text-[#6b0f0d] transition-opacity">edit_square</span>
                                    </Link>
                                  ) : (
                                    <div key={i} className="flex items-center gap-2 px-0 py-1">
                                      <div className="w-1.5 h-1.5 rotate-45 bg-[#d99b4a] shrink-0"></div>
                                      <span className="font-body text-[14px] text-[#4a2a22] italic">{emp}</span>
                                    </div>
                                  );
                                })}
                                {p.emperors.length > 3 && (
                                  <span className="font-body text-[12px] text-[#4a2a22]/60 italic ml-3">...và nhiều nhân vật khác</span>
                                )}
                              </div>
                            </div>
                          )}

                          {p.relatedEvents && p.relatedEvents.length > 0 && (
                            <div className="mt-4 first:mt-0">
                              <span className="font-headline text-[13px] text-[#6b0f0d] font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                                Sự kiện tiêu biểu:
                              </span>
                              <div className="flex flex-col gap-1">
                                {p.relatedEvents.slice(0, 3).map((evt, i) => {
                                  const matched = (data.allEvents || []).find(e => e.name === evt);
                                  return matched ? (
                                    <Link key={i} to={`/admin/events/edit/${matched.id}`} className="flex items-center gap-2 group/link hover:bg-[#d99b4a]/10 px-2 py-1 -ml-2 rounded-lg transition-colors w-fit">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#d99b4a] group-hover/link:bg-[#6b0f0d] shrink-0 transition-colors"></div>
                                      <span className="font-body text-[14px] text-[#4a2a22] font-semibold group-hover/link:text-[#6b0f0d] transition-colors">{evt}</span>
                                      <span className="material-symbols-outlined text-[14px] opacity-0 group-hover/link:opacity-100 text-[#6b0f0d] transition-opacity">edit_square</span>
                                    </Link>
                                  ) : (
                                    <div key={i} className="flex items-center gap-2 px-0 py-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#d99b4a] shrink-0"></div>
                                      <span className="font-body text-[14px] text-[#4a2a22] font-semibold">{evt}</span>
                                    </div>
                                  );
                                })}
                                {p.relatedEvents.length > 3 && (
                                  <span className="font-body text-[12px] text-[#4a2a22]/60 italic ml-3">...và nhiều sự kiện khác</span>
                                )}
                              </div>
                            </div>
                          )}

                          {p.relatedLocations && p.relatedLocations.length > 0 && (
                            <div className="mt-4 first:mt-0">
                              <span className="font-headline text-[13px] text-[#6b0f0d] font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                <span className="material-symbols-outlined text-[16px]">location_on</span>
                                Địa danh:
                              </span>
                              <div className="flex flex-col gap-1">
                                {p.relatedLocations.slice(0, 3).map((loc, i) => {
                                  const matched = (data.allLocations || []).find(l => l.name === loc);
                                  return matched ? (
                                    <Link key={i} to={`/admin/locations/edit/${matched.id}`} className="flex items-center gap-2 group/link hover:bg-[#d99b4a]/10 px-2 py-1 -ml-2 rounded-lg transition-colors w-fit">
                                      <div className="w-1.5 h-1.5 bg-[#d99b4a] rounded-full group-hover/link:bg-[#6b0f0d] shrink-0 transition-colors"></div>
                                      <span className="font-body text-[14px] text-[#4a2a22] font-semibold group-hover/link:text-[#6b0f0d] transition-colors">{loc}</span>
                                      <span className="material-symbols-outlined text-[14px] opacity-0 group-hover/link:opacity-100 text-[#6b0f0d] transition-opacity">edit_square</span>
                                    </Link>
                                  ) : (
                                    <div key={i} className="flex items-center gap-2 px-0 py-1">
                                      <div className="w-1.5 h-1.5 bg-[#d99b4a] rounded-full shrink-0"></div>
                                      <span className="font-body text-[14px] text-[#4a2a22]">{loc}</span>
                                    </div>
                                  );
                                })}
                                {p.relatedLocations.length > 3 && (
                                  <span className="font-body text-[12px] text-[#4a2a22]/60 italic ml-3">...và nhiều địa danh khác</span>
                                )}
                              </div>
                            </div>
                          )}

                          {p.relatedArticles && p.relatedArticles.length > 0 && (
                            <div className="mt-4 first:mt-0">
                              <span className="font-headline text-[13px] text-[#6b0f0d] font-bold uppercase tracking-widest flex items-center gap-1 mb-2">
                                <span className="material-symbols-outlined text-[16px]">article</span>
                                Bài viết:
                              </span>
                              <div className="flex flex-col gap-1">
                                {p.relatedArticles.slice(0, 3).map((art, i) => {
                                  const matched = (data.allPosts || []).find(a => a.title === art || a.name === art);
                                  return matched ? (
                                    <Link key={i} to={`/admin/articles/edit/${matched.id}`} className="flex items-center gap-2 group/link hover:bg-[#d99b4a]/10 px-2 py-1 -ml-2 rounded-lg transition-colors w-fit">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#d99b4a] group-hover/link:bg-[#6b0f0d] shrink-0 transition-colors"></div>
                                      <span className="font-body text-[14px] text-[#4a2a22] font-semibold group-hover/link:text-[#6b0f0d] transition-colors">{art}</span>
                                      <span className="material-symbols-outlined text-[14px] opacity-0 group-hover/link:opacity-100 text-[#6b0f0d] transition-opacity">edit_square</span>
                                    </Link>
                                  ) : (
                                    <div key={i} className="flex items-center gap-2 px-0 py-1">
                                      <div className="w-1.5 h-1.5 rounded-full bg-[#d99b4a] shrink-0"></div>
                                      <span className="font-body text-[14px] text-[#4a2a22]">{art}</span>
                                    </div>
                                  );
                                })}
                                {p.relatedArticles.length > 3 && (
                                  <span className="font-body text-[12px] text-[#4a2a22]/60 italic ml-3">...và nhiều bài viết khác</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Admin Action Buttons */}
                        <div className="flex justify-start gap-3 mt-6 pt-2">
                          <button onClick={() => navigate(`/admin/periods/edit/${p.id}`)} className="h-10 px-6 flex items-center justify-center gap-2 bg-[#fcf9ee] text-[#d99b4a] border border-[#d99b4a]/30 rounded hover:bg-[#d99b4a] hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">edit_note</span>
                            <span className="font-body text-[12px] font-bold uppercase tracking-wider">Chỉnh sửa</span>
                          </button>
                          <button onClick={() => openDelete('thời kỳ', p)} className="h-10 px-6 flex items-center justify-center gap-2 bg-[#fff5f5] text-[#e02424] border border-[#e02424]/30 rounded hover:bg-[#e02424] hover:text-white transition-colors">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                            <span className="font-body text-[12px] font-bold uppercase tracking-wider">Xóa</span>
                          </button>
                        </div>
                      </div>

                      {/* Image Content */}
                      <div className="w-full xl:w-[45%] h-[300px] xl:h-[400px] overflow-hidden relative border border-[#d99b4a]/30 shadow-md">
                        <img
                          src={p.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/4/48/Ngoc_Lu.jpg'}
                          alt={p.name}
                          className="w-full h-full object-cover grayscale-[0.3] sepia-[0.2] group-hover/card:grayscale-0 group-hover/card:sepia-0 group-hover/card:scale-110 transition-all duration-1000"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#2b0504]/50 to-transparent pointer-events-none opacity-60 group-hover/card:opacity-30 transition-opacity"></div>
                      </div>

                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <ActionModal
        isOpen={isOpen && modalType === 'delete_metadata'}
        onClose={closeModal}
        type="delete"
        item={{ name: modalData?.name }}
        onConfirm={handleDeleteConfirm}
      />
    </AdminLayout>
  );
};

export default PeriodManagement;
