import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const ArticleDetail = () => {
  const { slug } = useParams();
  const [likes, setLikes] = useState(1240);
  const [isLiked, setIsLiked] = useState(false);

  const [comments, setComments] = useState([
    { id: 1, author: 'Học giả Ẩn danh', text: 'Bài viết rất sâu sắc, làm rõ được nhiều chi tiết về chiến thuật của nhà Trần.', date: '2 giờ trước' },
    { id: 2, author: 'Người Yêu Sử', text: 'Có tài liệu nào nói thêm về vai trò của Yết Kiêu trong trận này không ạ?', date: '5 giờ trước' }
  ]);
  const [newComment, setNewComment] = useState('');

  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const response = await fetch('/api/user_article_detail.json');
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        setArticle(data);
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [slug]);

  if (loading) return <div className="min-h-screen bg-[#fbf6e8] flex items-center justify-center font-body text-[#6b0f0d]">Đang tải bài viết...</div>;
  if (!article) return <div className="min-h-screen bg-[#fbf6e8] flex items-center justify-center font-body text-[#6b0f0d]">Không tìm thấy bài viết.</div>;

  const handleLike = () => {
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
    setIsLiked(!isLiked);
  };

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20">
      {/* Background Pattern Overlay */}
      <div className="dong-son-pattern pointer-events-none fixed inset-0 z-0 opacity-5 mix-blend-overlay"></div>

      <main className="max-w-[1280px] mx-auto px-6 md:px-16 py-12 flex flex-col lg:flex-row gap-16 relative z-10">

        {/* --- CỘT TRÁI: NỘI DUNG BÀI VIẾT --- */}
        <article className="flex-1 max-w-4xl">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 mb-10 text-[#2b1a16]/60 font-body text-[10px] uppercase tracking-widest">
            <Link to="/" className="hover:text-[#6b0f0d] transition-colors">Trang chủ</Link>
            <span className="material-symbols-outlined text-xs opacity-40">chevron_right</span>
            <Link to="/periods" className="hover:text-[#6b0f0d] transition-colors">Thời kỳ</Link>
            <span className="material-symbols-outlined text-xs opacity-40">chevron_right</span>
            <span className="text-[#6b0f0d] font-bold">Kiến trúc Thăng Long</span>
          </nav>

          {/* Header Section */}
          <header className="mb-12">
            <h1 className="font-headline text-5xl md:text-6xl text-[#6b0f0d] font-semibold leading-tight mb-8 tracking-tight">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-8 py-6 border-y border-[#d99b4a]/40">
              <div className="flex items-center gap-4">
                <img src={article.authorImg} alt="Author" className="w-12 h-12 rounded-full object-cover border border-[#d99b4a]/40 p-0.5 bg-[#fcf9ee] grayscale-[0.4]" />
                <div>
                  <p className="font-headline font-semibold text-[#6b0f0d] text-[15px] leading-none">{article.author}</p>
                  <p className="text-[9px] font-body uppercase tracking-widest text-[#2b1a16]/60 mt-1">{article.authorRole}</p>
                </div>
              </div>
              <div className="hidden md:block h-8 w-px bg-[#d99b4a]/30"></div>
              <div className="flex flex-col">
                <span className="text-[#2b1a16]/60 font-body text-[9px] uppercase tracking-widest">Ngày xuất bản</span>
                <time className="font-bold text-[12px] text-[#2b0504]">{article.publishedAt}</time>
              </div>
              <div className="hidden md:block h-8 w-px bg-[#d99b4a]/30"></div>
              <div className="flex flex-col">
                <span className="text-[#2b1a16]/60 font-body text-[9px] uppercase tracking-widest">Thời lượng</span>
                <span className="font-bold text-[12px] text-[#2b0504]">{article.readingTime}</span>
              </div>
            </div>
          </header>

          {/* Hero Image Section */}
          <figure className="mb-16 group relative">
            <div className="absolute -inset-4 border border-[#d99b4a]/40 pointer-events-none dong-son-border"></div>
            <div className="aspect-[16/9] w-full overflow-hidden border border-[#d99b4a]/50 relative bg-[#fffdf8] p-2 shadow-xl">
              <div className="w-full h-full relative border border-[#d99b4a]/30 overflow-hidden">
                <img src={article.heroImage} alt="Cover" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 grayscale-[0.4] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201]/40 to-transparent opacity-60 mix-blend-overlay"></div>
              </div>
            </div>
            <figcaption className="mt-8 text-center text-[#2b1a16]/80 font-body text-sm leading-relaxed border-l-2 border-[#d99b4a] pl-6 max-w-2xl mx-auto">
              {article.imageCaption}
            </figcaption>
          </figure>

          <div className="prose max-w-none prose-lg prose-p:text-[#2b1a16]/90 prose-headings:text-[#6b0f0d]">
            {article.content.map((block, i) => {
              if (block.type === 'paragraph' && i === 0) {
                return (
                  <p key={i} className="font-body text-[17px] leading-loose text-[#2b1a16]/90 mb-8 drop-cap first-letter:text-7xl first-letter:font-headline first-letter:text-[#6b0f0d] first-letter:mr-4 first-letter:float-left first-letter:leading-none">
                    {block.text}
                  </p>
                );
              }
              if (block.type === 'paragraph') {
                return <p key={i} className="font-body text-[17px] leading-loose text-[#2b1a16]/90 mb-8">{block.text}</p>;
              }
              if (block.type === 'heading') {
                return (
                  <h2 key={i} className="font-headline text-3xl text-[#6b0f0d] font-semibold mt-16 mb-8 flex items-center gap-4">
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
            })}
          </div>

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
                  <span className="font-body text-[11px] font-bold tracking-widest">42 THẢO LUẬN</span>
                </button>
              </div>
              <button className="flex items-center gap-2 bg-[#6b0f0d] text-[#ffe7b0] px-6 py-2 rounded-sm font-body font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-[#8b1512] border border-[#d99b4a]/40 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[14px]">bookmark</span> LƯU TƯ LIỆU
              </button>
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
                          setComments([...comments, { id: Date.now(), author: 'Khách', text: newComment, date: 'Vừa xong' }]);
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
                  <div key={comment.id} className="flex gap-4 p-4 border border-[#d99b4a]/20 bg-[#fcf9ee] rounded-sm">
                    <div className="w-10 h-10 rounded-full bg-[#6b0f0d] text-[#ffe7b0] flex items-center justify-center shrink-0 font-headline font-bold text-lg">
                      {comment.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="font-headline font-bold text-[#6b0f0d]">{comment.author}</span>
                        <span className="text-[11px] text-[#2b1a16]/50 font-body tracking-wider">{comment.date}</span>
                      </div>
                      <p className="font-body text-[14px] text-[#2b1a16]/80 leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </article>

        {/* --- CỘT PHẢI: SIDEBAR --- */}
        <aside className="w-full lg:w-[320px] space-y-12">

          {/* Related Entities Card */}
          <section className="bg-[#fffdf8] p-8 border border-[#d99b4a]/40 shadow-md relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#6b0f0d]/5 rounded-full blur-2xl pointer-events-none"></div>
            <h4 className="font-body text-[10px] text-[#6b0f0d] uppercase font-bold tracking-[0.2em] border-b border-[#d99b4a]/30 pb-4 mb-8">Thực thể liên quan</h4>
            <div className="space-y-6">
              {article.relatedEntities?.map((entity, i) => (
                <EntityLink key={i} icon={entity.icon} title={entity.title} type={entity.type} />
              ))}
            </div>
          </section>

          {/* Citations Section */}
          <section className="p-8 border-l-2 border-[#d99b4a] space-y-8 bg-[#fcf9ee] border-y border-r border-[#d99b4a]/20 shadow-inner">
            <h4 className="font-body text-[10px] text-[#6b0f0d]/80 uppercase font-bold tracking-[0.2em]">Tài liệu trích dẫn</h4>
            <ul className="space-y-6">
              {article.citations?.map((cit, i) => (
                <li key={i} className="group cursor-pointer">
                  <p className="font-headline text-lg text-[#2b0504] font-semibold leading-tight group-hover:text-[#6b0f0d] transition-colors">{cit.title}</p>
                  <p className="font-body text-[11px] text-[#2b1a16]/60 mt-1 uppercase tracking-widest">{cit.author}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* AI Helper Banner */}
          <div className="bg-[#2b0504] p-8 text-[#fcf9ee] space-y-5 shadow-2xl relative overflow-hidden group cursor-pointer border border-[#d99b4a]/30">
            <div className="absolute inset-0 dong-son-pattern opacity-10 mix-blend-overlay group-hover:scale-110 transition-transform duration-[10s]"></div>
            <span className="material-symbols-outlined text-[#f7d78a] text-3xl relative z-10">psychology</span>
            <h5 className="font-headline text-2xl font-semibold relative z-10 text-[#f7d78a]">Hỏi đáp với Sử Quan AI</h5>
            <p className="text-[13px] opacity-80 leading-relaxed relative z-10">Giải mã sâu hơn về kiến trúc Thăng Long thông qua trí tuệ nhân tạo RAG.</p>
            <button className="w-full py-3 bg-[#1a0201]/40 border border-[#d99b4a]/40 text-[#f7d78a] text-[10px] font-bold uppercase tracking-widest hover:bg-[#d99b4a]/20 hover:text-white transition-all relative z-10 mt-4">Bắt đầu thảo luận</button>
          </div>
        </aside>
      </main>
    </div>
  );
};

// Component con cho Sidebar Links
const EntityLink = ({ icon, title, type }) => (
  <Link to="#" className="flex items-center gap-4 group p-2 -mx-2 hover:bg-[#fcf9ee] transition-colors rounded-sm">
    <div className="w-10 h-10 bg-[#fffdf8] flex items-center justify-center rounded-sm border border-[#d99b4a]/40 group-hover:bg-[#6b0f0d] group-hover:text-[#ffe7b0] group-hover:border-[#6b0f0d] transition-all duration-300 shadow-sm">
      <span className="material-symbols-outlined text-[20px] text-[#6b0f0d] group-hover:text-[#ffe7b0]">{icon}</span>
    </div>
    <div>
      <p className="font-headline font-semibold text-[#2b0504] text-sm group-hover:text-[#6b0f0d] transition-colors">{title}</p>
      <p className="font-body text-[9px] uppercase opacity-60 tracking-widest text-[#2b1a16] mt-0.5">{type}</p>
    </div>
  </Link>
);

export default ArticleDetail;