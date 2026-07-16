import { API_ENDPOINTS, apiClient } from '../../../services';
import { mapPost } from '../../../services/responseMappers';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { stripHtml } from '../../../utils/stringUtils';
import { usePeriodColors } from '../../../hooks/usePeriodColors';
import DOMPurify from 'dompurify';
import { IMAGES } from '../../../config/constants';

const ArticleDetail = () => {
  const { getPeriodStyle } = usePeriodColors();
  const { slug } = useParams();
  const [likes, setLikes] = useState(() => {
    const savedLikes = localStorage.getItem(`likes_${slug}`);
    return savedLikes ? parseInt(savedLikes) : 0;
  });
  const [isLiked, setIsLiked] = useState(() => {
    return localStorage.getItem(`isLiked_${slug}`) === 'true';
  });
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setArticle(null); // Clear previous article state
      try {
        let dbPost = null;
        const isNumeric = /^\d+$/.test(slug);

        if (isNumeric) {
          try {
            const url = typeof API_ENDPOINTS.USER_ARTICLE_DETAIL === 'function' ? API_ENDPOINTS.USER_ARTICLE_DETAIL(slug) : `${API_ENDPOINTS.USER_ARTICLE_DETAIL}/${slug}`;
            const res = await apiClient.get(url);
            dbPost = res.data?.data || res.data;
          } catch (err) {
            console.error('Failed to fetch article by ID, falling back to search', err);
          }
        }

        if (!dbPost) {
          try {
            const response = await apiClient.get(`${API_ENDPOINTS.USER_ARTICLES}?size=100&status=PUBLISHED`);
            const posts = response.data?.data?.result || response.data?.data?.content || response.data?.data || [];
            dbPost = posts.find(a => (a.id && a.id.toString() === slug) || a.slug === slug);
          } catch (err) {
            console.error('Failed to fetch user articles from api:', err);
          }
        }

        if (dbPost) {
          // Normalize/mapping helper: provide fallbacks for fields frontend expects
          try {
            dbPost = mapPost(dbPost);
          } catch (e) {
            console.warn('mapPost failed, using raw dbPost', e);
          }
          const validThumbnail = dbPost?.thumbnailUrl && dbPost.thumbnailUrl.trim() !== '' && dbPost.thumbnailUrl !== 'null';
          const relatedEntities = [];
          if (dbPost?.events && dbPost.events.length > 0) {
            dbPost.events.forEach(ev => {
              relatedEntities.push({
                icon: "event",
                title: ev.name || ev.title,
                type: "Sự kiện",
                link: `/events/${ev.slug || ev.id}`
              });
            });
          } else if (dbPost?.event) {
            relatedEntities.push({
              icon: "event",
              title: dbPost.event.name || dbPost.event.title,
              type: "Sự kiện",
              link: `/events/${dbPost.event.slug || dbPost.event.id}`
            });
          }
          if (dbPost?.tags && dbPost.tags.length > 0) {
            dbPost.tags.forEach(tag => {
              relatedEntities.push({
                icon: "label",
                title: tag.name,
                type: "Từ khóa",
                link: `/tags/${tag.slug || tag.id}`
              });
            });
          }

          // Load from cache since these are not in DB schema yet
          const cached = localStorage.getItem(`local_post_relations_${dbPost?.id || slug}`) || localStorage.getItem(`local_post_relations_${dbPost?.slug || slug}`);
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              const makeSlug = (str) => typeof str === 'string' ? str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") : str;

              if (parsed.relatedLocations && parsed.relatedLocations.length > 0) {
                parsed.relatedLocations.forEach(loc => {
                  const locSlug = loc.slug || loc.id || makeSlug(loc);
                  relatedEntities.push({
                    icon: "explore",
                    title: loc.name || loc,
                    type: "Địa danh",
                    link: `/locations/${locSlug}`
                  });
                });
              }
              if (parsed.relatedCharacters && parsed.relatedCharacters.length > 0) {
                parsed.relatedCharacters.forEach(char => {
                  const charSlug = char.slug || char.id || makeSlug(char);
                  relatedEntities.push({
                    icon: "person",
                    title: char.name || char,
                    type: "Nhân vật",
                    link: `/characters/${charSlug}`
                  });
                });
              }
              if (parsed.sources && parsed.sources.length > 0) {
                parsed.sources.forEach(source => {
                  relatedEntities.push({
                    icon: "menu_book",
                    title: source.title || source.name || source,
                    type: "Nguồn tham khảo",
                    link: source.link || "#"
                  });
                });
              }
            } catch (e) {
              console.error("Failed to parse cached relations for ArticleDetail:", e);
            }
          }
          const merged = {
            ...dbPost,
            article_id: dbPost.id,
            title: dbPost?.title || '',
            thumbnail_url: dbPost.imageUrl || dbPost.thumbnailUrl || IMAGES.DEFAULT_COVER,
            dynasty: dbPost?.tags?.[0]?.name || 'Lịch sử',
            dynasties: dbPost?.tags && dbPost.tags.length > 0
              ? dbPost.tags.map(t => typeof t === 'object' ? t.name : t)
              : ['Lịch sử'],
            content: dbPost?.content || '',
            summary: dbPost?.summary || '',
            author: dbPost?.author?.fullName || 'Tác giả',
            published_at: dbPost?.publishedAt ? new Date(dbPost.publishedAt).toLocaleDateString('vi-VN') : '',
            likes: 0,
            relatedEntities: relatedEntities
          };

          setArticle(merged);

          // Nạp lại likes từ localStorage cho bài viết này
          const savedLikes = localStorage.getItem(`likesCount_${merged.slug || slug}`);
          if (savedLikes !== null) {
            setLikes(parseInt(savedLikes, 10));
          } else {
            setLikes(merged.likes || 0);
          }
          setIsLiked(localStorage.getItem(`liked_${merged.slug || slug}`) === 'true');

          // Gọi API thật lấy comment
          if (dbPost.id) {
            try {
              const commRes = await apiClient.get(`${API_ENDPOINTS.PUBLIC_ENGAGEMENTS}?postId=${dbPost.id}`);
              let fetchedComments = commRes.data?.data || [];

              // Merge local comments that haven't been synced
              const savedComments = localStorage.getItem(`comments_${merged.slug || slug}`);
              if (savedComments) {
                try {
                  const localC = JSON.parse(savedComments);
                  const combined = [...localC, ...fetchedComments];
                  const unique = Array.from(new Map(combined.map(c => [c.id || c.engagement_id || c.commentContent, c])).values());
                  fetchedComments = unique;
                } catch(e) {}
              }

              setComments(fetchedComments);
            } catch (err) {
              console.error('Failed to fetch comments', err);
              // Fallback to local storage if API fails
              const savedComments = localStorage.getItem(`comments_${merged.slug || slug}`);
              if (savedComments) {
                try {
                  setComments(JSON.parse(savedComments));
                } catch (e) {
                  setComments([]);
                }
              } else {
                setComments([]);
              }
            }
          } else {
            // Nạp lại comments từ localStorage cho bài viết này nếu ko có id
            const savedComments = localStorage.getItem(`comments_${merged.slug || slug}`);
            if (savedComments) {
              try {
                setComments(JSON.parse(savedComments));
              } catch (e) {
                setComments([]);
              }
            } else {
              setComments([]);
            }
          }

          // Fetch event details to get locations and characters
          const eventId = dbPost?.events?.[0]?.id || dbPost?.event?.id || mockItem?.event?.id || mockItem?.eventId;
          if (eventId) {
            try {
              const eventRes = await apiClient.get(`${API_ENDPOINTS.USER_EVENT_DETAIL}/${eventId}`);
              const fullEvent = eventRes.data?.data || eventRes.data;

              const partsRes = await apiClient.get('/api/v1/admin/participations', { params: { eventId } });
              const rawParts = partsRes.data?.data?.result || partsRes.data?.data || [];

              const dynamicEntities = [];

              if (fullEvent.locationRelations) {
                fullEvent.locationRelations.forEach(loc => {
                  dynamicEntities.push({
                    title: loc.name,
                    type: 'Địa danh',
                    icon: 'location_on',
                    link: `/locations/${loc.locationId}`
                  });
                });
              }

              rawParts.forEach(p => {
                if (p.person) {
                  dynamicEntities.push({
                    title: p.person.name,
                    type: 'Nhân vật',
                    icon: 'person',
                    link: `/characters/${p.person.id}`
                  });
                }
              });

              setArticle(prev => {
                const mergedEntities = [...(prev.relatedEntities || [])];
                dynamicEntities.forEach(dyn => {
                  if (!mergedEntities.some(e => e.title === dyn.title && e.type === dyn.type)) {
                    mergedEntities.push(dyn);
                  }
                });
                return {
                  ...prev,
                  relatedEntities: mergedEntities,
                  eventStartYear: fullEvent.startYear || (fullEvent.startDate ? new Date(fullEvent.startDate).getFullYear() : null),
                  eventEndYear: fullEvent.endYear || (fullEvent.endDate ? new Date(fullEvent.endDate).getFullYear() : null)
                };
              });
            } catch (err) {
              console.error('Lỗi khi tải thông tin liên kết của bài viết:', err);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  if (loading) return <div className="w-full min-h-[60vh] bg-transparent flex items-center justify-center font-body text-[#6b0f0d]">Đang tải bài viết...</div>;
  if (!article) return <div className="min-h-screen bg-[#fbf6e8] flex items-center justify-center font-body text-[#6b0f0d]">Không tìm thấy bài viết.</div>;

  const handleLike = () => {
    const newIsLiked = !isLiked;
    const newLikes = newIsLiked ? likes + 1 : likes - 1;

    setLikes(newLikes);
    setIsLiked(newIsLiked);

    localStorage.setItem(`liked_${slug}`, String(newIsLiked));
    localStorage.setItem(`likesCount_${slug}`, String(newLikes));

    // Thêm vào lịch sử tương tác local
    let history = [];
    try {
       history = JSON.parse(localStorage.getItem('user_local_history') || '[]');
    } catch(e) {}

    if (newIsLiked) {
       history = [{
         id: slug,
         link: `/articles/${slug}`,
         img: article.thumbnail_url || article.heroImage,
         title: article.title,
         interaction: 'Đã thích',
         type: 'Sử liệu',
         date: new Date().toLocaleDateString('vi-VN')
       }, ...history.filter(h => h.id !== slug || h.interaction !== 'Đã thích')];
    } else {
       history = history.filter(h => h.id !== slug || h.interaction !== 'Đã thích');
    }
    localStorage.setItem('user_local_history', JSON.stringify(history));
  };

  return (
    <div className="w-full relative font-body selection:bg-[#d99b4a]/20">
      {/* Background Pattern Overlay */}
      <div className="dong-son-pattern pointer-events-none fixed inset-0 z-0 opacity-5 mix-blend-overlay"></div>

      <main className="max-w-[1280px] w-full mx-auto px-6 md:px-12 lg:px-16 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 relative z-10">

        {/* --- CỘT TRÁI: NỘI DUNG BÀI VIẾT --- */}
        <article className="lg:col-span-8 min-w-0">


          {/* Header Section */}
          <header className="mb-12">
            {/* Dynasty Tags */}
            {(article.dynasties || [article.dynasty]).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {(article.dynasties || [article.dynasty]).map((dyn, idx) => (
                  <span
                    key={idx}
                    className={`px-3 py-1 font-body text-[10px] font-bold uppercase tracking-widest rounded-full border shadow-sm ${getPeriodStyle(dyn)}`}
                  >
                    {dyn}
                  </span>
                ))}
              </div>
            )}

            <h1 className="font-headline text-5xl md:text-6xl text-[#6b0f0d] font-semibold leading-tight mb-8 tracking-tight break-words">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-8 py-6 border-y border-[#d99b4a]/40">
              <div className="flex flex-col">
                <span className="text-[#2b1a16]/60 font-body text-[9px] uppercase tracking-widest">Ngày xuất bản</span>
                <time className="font-bold text-[12px] text-[#2b0504]">{article.published_at || article.publishedAt}</time>
              </div>

              {(() => {
                const start = article.startYear ?? article.start_year ?? article.eventStartYear;
                const end = article.endYear ?? article.end_year ?? article.eventEndYear;
                if (!start && !end) return null;
                return (
                  <>
                    <div className="hidden md:block h-8 w-px bg-[#d99b4a]/30"></div>
                    <div className="flex flex-col">
                      <span className="text-[#2b1a16]/60 font-body text-[9px] uppercase tracking-widest">Năm diễn ra</span>
                      <span className="font-bold text-[12px] text-[#2b0504]">
                        {start === end || !end
                          ? start
                          : !start ? end : `${start} - ${end}`}
                      </span>
                    </div>
                  </>
                );
              })()}

            </div>
          </header>
          {/* Summary Lead section with Gold Border */}
          {article.summary && (
            <p className="max-w-[720px] mx-auto font-body text-[18px] text-[#2b1a16]/90 border-l-4 border-[#d99b4a] pl-6 py-2 leading-relaxed mb-12 italic break-words whitespace-pre-wrap overflow-hidden">
              {stripHtml(article.summary)}
            </p>
          )}

          {/* Hero Image Section */}
          <figure className="mb-16 group relative">
            <div className="absolute -inset-4 border border-[#d99b4a]/40 pointer-events-none dong-son-border"></div>
            <div className="aspect-[16/9] w-full overflow-hidden border border-[#d99b4a]/50 relative bg-[#fffdf8] p-2 shadow-xl">
              <div className="w-full h-full relative border border-[#d99b4a]/30 overflow-hidden">
                <img src={article.thumbnail_url || article.heroImage} alt="Cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale-[0.4] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/40 to-transparent opacity-60 mix-blend-overlay"></div>
              </div>
            </div>
            {article.imageCaption && (
              <figcaption className="mt-6 text-center text-[#2b1a16]/70 font-body text-xs leading-relaxed max-w-2xl mx-auto break-words">
                {article.imageCaption}
              </figcaption>
            )}
          </figure>

          <div className="prose max-w-[720px] mx-auto prose-lg prose-p:text-[#2b1a16]/90 prose-headings:text-[#6b0f0d] user-content-container overflow-hidden break-words">
            {Array.isArray(article.content) ? (
              article.content.map((block, i) => {
                if (block.type === 'paragraph' && i === 0) {
                  return (
                    <p key={i} className="font-body text-[17px] leading-loose text-[#2b1a16]/90 mb-8 drop-cap first-letter:text-7xl first-letter:font-headline first-letter:text-[#6b0f0d] first-letter:mr-4 first-letter:float-left first-letter:leading-none break-words">
                      {block.text}
                    </p>
                  );
                }
                if (block.type === 'paragraph') {
                  return <p key={i} className="font-body text-[17px] leading-loose text-[#2b1a16]/90 mb-8 break-words">{block.text}</p>;
                }
                if (block.type === 'heading') {
                  return (
                    <h2 key={i} className="font-headline text-3xl text-[#6b0f0d] font-semibold mt-16 mb-8 flex items-center gap-4 break-words">
                      <span className="w-8 h-px bg-[#d99b4a]"></span>
                      {block.text}
                    </h2>
                  );
                }
                if (block.type === 'blockquote') {
                  return (
                    <blockquote key={i} className="my-16 p-12 bg-[#fffdf8] border border-[#d99b4a]/40 relative overflow-hidden shadow-sm">
                      <div className="absolute inset-0 bg-[#fcf9ee] opacity-40 dong-son-pattern pointer-events-none"></div>
                      <div className="absolute top-0 right-0 p-6 opacity-10"><span className="material-symbols-outlined text-8xl text-[#6b0f0d]">format_quote</span></div>
                      <p className="font-headline text-2xl text-[#2b0504] font-medium leading-loose relative z-10">
                        "{block.text}"
                      </p>
                    </blockquote>
                  );
                }
                return null;
              })
            ) : typeof article.content === 'string' ? (
              <div className="font-body text-[17px] leading-loose text-[#2b1a16]/90 space-y-6 break-words whitespace-pre-wrap overflow-hidden w-full max-w-full" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content)}} />
            ) : null}
          </div>

          {/* --- NGUỒN THAM KHẢO / SỬ LIỆU CHỨNG MINH --- */}
          {article.sources && article.sources.length > 0 && (
            <section className="mt-16 bg-[#fffdf8] border border-[#d99b4a]/40 shadow-md relative overflow-hidden transition-all duration-300">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#6b0f0d] via-[#d99b4a] to-[#6b0f0d]"></div>

              <button
                onClick={() => setSourcesOpen(!sourcesOpen)}
                className="w-full text-left p-6 flex items-center justify-between hover:bg-[#fcf9ee] transition-colors group cursor-pointer border-none outline-none focus:outline-none"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#6b0f0d] text-2xl group-hover:scale-110 transition-transform">menu_book</span>
                  <div>
                    <h3 className="font-headline text-xl text-[#6b0f0d] font-bold">Nguồn tham khảo ({article.sources.length})</h3>
                    <p className="text-[10px] uppercase tracking-widest text-[#2b1a16]/60 mt-0.5">Các tư liệu lịch sử được sử dụng làm bằng chứng</p>
                  </div>
                </div>
                <span className={`material-symbols-outlined text-[#6b0f0d] text-2xl transition-transform duration-300 ${sourcesOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {sourcesOpen && (
                <div className="border-t border-[#d99b4a]/20 p-6 space-y-4 bg-[#fcf9ee]/30 animate-in fade-in duration-300">
                  {(article.sources || []).filter(Boolean).map((src, idx) => {
                    const isExcerptOpen = expandedSourceId === src.id;
                    return (
                      <div
                        key={src.id || idx}
                        className={`border border-[#d99b4a]/20 bg-[#fffdf8] rounded p-4 hover:shadow-sm transition-all duration-300 ${isExcerptOpen ? 'border-l-4 border-l-[#d99b4a] pl-3' : ''
                          }`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#6b0f0d]/10 text-[#6b0f0d] border border-[#6b0f0d]/20">
                                {src.sourceType || src.type || 'Tư liệu'}
                              </span>
                            </div>
                            <h4 className="font-headline font-bold text-[#2b0504] text-base leading-snug">{src.title}</h4>
                            <p className="font-body text-xs text-[#2b1a16]/75">
                              {src.author && <span>Tác giả: <strong className="text-[#6b0f0d]">{src.author}</strong></span>}
                              {src.publicationYear && <span> — Năm khởi soạn/xuất bản: <strong>{src.publicationYear}</strong></span>}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 shrink-0">
                            {src.content && (
                              <button
                                onClick={() => setExpandedSourceId(isExcerptOpen ? null : src.id)}
                                className="flex items-center gap-1 bg-[#fffdf8] text-[#2b1a16]/80 hover:text-[#6b0f0d] hover:bg-[#fcf9ee] border border-[#d99b4a]/40 px-3 py-1.5 rounded-sm font-body text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-sm">{isExcerptOpen ? 'visibility_off' : 'visibility'}</span>
                                {isExcerptOpen ? 'Ẩn trích dẫn' : 'Xem trích dẫn'}
                              </button>
                            )}

                            {src.sourceUrl && (
                              <a
                                href={src.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 bg-[#6b0f0d] text-[#ffe7b0] hover:bg-[#2b0504] px-3 py-1.5 rounded-sm font-body text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm"
                              >
                                <span className="material-symbols-outlined text-sm">open_in_new</span>
                                Xem liên kết
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Source Content/Excerpt Excerpt */}
                        {isExcerptOpen && src.content && (
                          <div
                            className="mt-4 p-4 bg-[#fcf9ee] border-l-2 border-[#6b0f0d] font-body text-sm text-[#2b1a16]/90 leading-relaxed italic animate-in slide-in-from-top-2 duration-300 prose prose-amber max-w-none"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(src.content)}}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Engagement Section */}
          <section className="py-12 border-t border-[#d99b4a]/40 mt-20">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex items-center gap-8">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-2 group transition-all ${isLiked ? 'text-[#6b0f0d]' : 'text-[#2b1a16]/60 hover:text-[#6b0f0d]'}`}
                >
                  <span className={`material-symbols-outlined transition-all ${isLiked ? 'fill-1' : ''}`} style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "" }}>favorite</span>
                  <span className="font-body text-[11px] font-bold tracking-widest">{likes.toLocaleString()}</span>
                </button>
                <button className="flex items-center gap-2 text-[#2b1a16]/60 hover:text-[#6b0f0d] group transition-all">
                  <span className="material-symbols-outlined">chat_bubble</span>
                  <span className="font-body text-[11px] font-bold tracking-widest">{comments.length} THẢO LUẬN</span>
                </button>
              </div>

            </div>

            {/* Comment Section */}
            <div className="mt-16 space-y-10">
              <h3 className="font-headline text-2xl text-[#6b0f0d] font-semibold flex items-center gap-2">
                <span className="material-symbols-outlined">forum</span> Đàm đạo học thuật ({comments.length})
              </h3>

              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-[#fffdf8] flex items-center justify-center text-[#6b0f0d] border border-[#d99b4a]/40 shrink-0 shadow-sm">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="flex-1 bg-[#fffdf8] border border-[#d99b4a]/30 p-4 shadow-inner">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full bg-transparent outline-none font-body text-sm text-[#2b1a16] transition-all resize-none h-24 placeholder-[#2b1a16]/40"
                    placeholder="Gửi ý kiến phản biện hoặc bổ sung..."
                  ></textarea>
                  <div className="flex justify-end mt-4 pt-4 border-t border-[#d99b4a]/20">
                    <button
                      onClick={() => {
                        if (newComment.trim()) {
                          let currentUser = null;
                          try {
                            const userStr = localStorage.getItem('user');
                            if (userStr) currentUser = JSON.parse(userStr);
                          } catch (e) { }

                          const newCommentObj = {
                            id: Date.now(),
                            memberId: currentUser?.id || 999,
                            postId: parseInt(slug) || 1,
                            parentEngagementId: null,
                            engagementType: 'COMMENT',
                            commentContent: newComment,
                            commentStatus: 'VISIBLE',
                            ratingValue: null,
                            createdAt: new Date().toISOString(),
                            memberName: currentUser?.fullName || currentUser?.name || 'Khách'
                          };

                          const updatedComments = [newCommentObj, ...comments];
                          setComments(updatedComments);
                          localStorage.setItem(`comments_${slug}`, JSON.stringify(updatedComments));

                          // Thêm vào lịch sử tương tác local
                          let history = [];
                          try {
                            history = JSON.parse(localStorage.getItem('user_local_history') || '[]');
                          } catch(e) {}

                          history = [{
                            id: slug + '_' + Date.now(),
                            link: `/articles/${slug}`,
                            img: article.thumbnail_url || article.heroImage,
                            title: article.title,
                            interaction: 'Bình luận',
                            type: 'Sử liệu',
                            date: new Date().toLocaleDateString('vi-VN')
                          }, ...history];
                          localStorage.setItem('user_local_history', JSON.stringify(history));

                          setNewComment('');
                        }
                      }}
                      className="bg-[#fcf9ee] text-[#6b0f0d] px-6 py-2 border border-[#d99b4a]/40 hover:bg-[#d99b4a]/10 font-body text-[9px] font-bold uppercase tracking-widest transition-all"
                    >
                      Gửi luận điểm
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-6 mt-8">
                {comments.map((comment) => (
                  <div key={comment.id || comment.engagement_id} className="flex gap-4 p-4 border border-[#d99b4a]/20 bg-[#fcf9ee] rounded-sm">
                    <div className="w-10 h-10 rounded-full bg-[#6b0f0d] text-[#ffe7b0] flex items-center justify-center shrink-0 font-headline font-bold text-lg">
                      {comment.memberName || comment.member_name ? (comment.memberName || comment.member_name).charAt(0) : 'U'}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="font-headline font-bold text-[#6b0f0d]">{comment.memberName || comment.member_name}</span>
                        <span className="text-[11px] text-[#2b1a16]/50 font-body tracking-wider">
                          {new Date(comment.createdAt || comment.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <p className="font-body text-[14px] text-[#2b1a16]/80 leading-relaxed">
                        {comment.commentContent || comment.comment_content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </article>

        {/* --- CỘT PHẢI: SIDEBAR --- */}
        <aside className="w-full lg:col-span-4 space-y-12 lg:sticky lg:top-24 h-fit">

          {/* Related Entities Card */}
          <section className="bg-[#fffdf8] p-8 border border-[#d99b4a]/40 shadow-md relative overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#6b0f0d]/5 rounded-full blur-2xl pointer-events-none"></div>
            <h4 className="font-body text-[10px] text-[#6b0f0d] uppercase font-bold tracking-[0.2em] border-b border-[#d99b4a]/30 pb-4 mb-8 shrink-0">Thực thể liên quan</h4>
            <div className="space-y-6 overflow-y-auto pr-2 flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d99b4a transparent' }}>
              {(article.relatedEntities || []).map((entity, i) => (
                <EntityLink key={i} icon={entity.icon} title={entity.title} type={entity.type} link={entity.link} />
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};

// Component con cho Sidebar Links
const EntityLink = ({ icon, title, type, link }) => (
  <Link to={link || "#"} className="flex items-center gap-4 group p-2 -mx-2 hover:bg-[#fcf9ee] transition-colors rounded-sm">
    <div className="w-10 h-10 shrink-0 bg-[#fffdf8] flex items-center justify-center rounded-sm border border-[#d99b4a]/40 group-hover:bg-[#6b0f0d] group-hover:text-[#ffe7b0] group-hover:border-[#6b0f0d] transition-all duration-300 shadow-sm">
      <span className="material-symbols-outlined text-[20px] text-[#6b0f0d] group-hover:text-[#ffe7b0]">{icon}</span>
    </div>
    <div className="min-w-0 flex-1">
      <p className="font-headline font-semibold text-[#2b0504] text-sm group-hover:text-[#6b0f0d] transition-colors break-words">{title}</p>
      <p className="font-body text-[9px] uppercase opacity-60 tracking-widest text-[#2b1a16] mt-0.5">{type}</p>
    </div>
  </Link>
);

export default ArticleDetail;
