import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const CharacterDetail = () => {
  const { id } = useParams();

  // Tự động cuộn lên đầu trang khi vào
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Dữ liệu mẫu cho Lê Thái Tổ (Sau này bạn sẽ fetch từ API theo id)
  const character = {
    name: "Lê Thái Tổ (Lê Lợi)",
    dynastyTitle: "Sáng lập triều Hậu Lê",
    templeName: "Thái Tổ",
    eraName: "Thuận Thiên",
    reign: "1428 — 1433",
    portrait: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-lVrS3LMr6Zms2FT8YRmly_7b25lqxl3RpuoAi2JGXD5zpJ8GJRWjaguZWAkcQAaDNndOV7i6fMX4OjzMo88RvY5r16XHFIC0mZNZ-APzJsPq1bAUOl16PIrJf5SegotiZpv641eq-TmE7n5rfCO8xf0SbCXX8FiWN-tiFv-Vghj05wwH9XabjNnS-otCjl9fmTq_XwJ8DDQBpJ_uZewR-N9lbxMb0Kz3tueWGiPnhatompKkLCiovr5UjFrw_eX9F6CZLhBZrwjQ",
    quote: "Bình Ngô đại cáo – Bản tuyên ngôn độc lập thứ hai của dân tộc được viết dưới thời đại của Ngài, khẳng định chủ quyền lãnh thổ và tư tưởng nhân nghĩa Việt Nam.",
    description: "Lê Thái Tổ, tên húy là Lê Lợi, là vị hoàng đế sáng lập triều đại Hậu Lê – triều đại quân chủ tồn tại lâu nhất trong lịch sử Việt Nam. Xuất thân từ hào trưởng đất Lam Sơn, ông đã dành 10 năm gian khổ lãnh đạo nghĩa quân đánh đuổi giặc Minh, khôi phục nền độc lập cho Đại Việt.",
    milestones: [
      { time: "MÙA XUÂN, 1418", title: "Khởi nghĩa Lam Sơn", desc: "Lê Lợi xưng là Bình Định Vương, truyền hịch kêu gọi nhân dân đánh đuổi giặc Minh tại căn cứ Lam Sơn, Thanh Hóa." },
      { time: "1416", title: "Hội thề Lũng Nhai", desc: "Hợp sức cùng 18 người anh em trung liệt cắt máu ăn thề, nguyện một lòng quyết tử cho tổ quốc quyết sinh." },
      { time: "1427", title: "Chiến thắng Chi Lăng - Xương Giang", desc: "Đập tan 15 vạn quân viện binh của Liễu Thăng, buộc quân Minh phải giảng hòa và rút quân về nước." },
      { time: "1428", title: "Lên ngôi Hoàng đế", desc: "Chính thức đăng quang tại điện Kính Thiên, Thăng Long. Đổi tên nước thành Đại Việt, đặt niên hiệu Thuận Thiên.", isSpecial: true }
    ],
    relatedFigures: [
      { name: "Nguyễn Trãi", role: "Quốc sư, Tác gia", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCdMgquRu3yaUhok0e-zl-0bR4PEYP0Oew3a6GoMSdu5mgrDt8tVvo6dB_WgcYbBOc2zcDyfJCr8XC05LONTKT_gh2DNHXqJEDv0Msk4-yyTIVzH2gk1Qaj45EysDzrB9lLuNhxwUp_uV-PazmnfDYs_DX2d4WPvrIVem_XaQ0la4bE_V19TAOKFHc3FyDQkAKvaLksAqoJFfMU5iVt-s2jSTU3ymOpZUJp1yTggyD76wk9ntNEqJPhurAQlYVYt4g6rYQ03zFR9HOV" },
      { name: "Lê Sát", role: "Đại công thần", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMszKAkrRVdSQy7xB7nNuzV9ES2l0iqbPtr-SHDqj5TKThpPFqNXWjDOxHbaDwCheafYQVJb6xw-FcPOh9TYgZPjqmgTqUUtbVZWxxxS2ovBFgpGCsFW474VYaWwNEEaCih8NEbI81FdQnu_CZGEhwolDdya0h319s6vkLvH0aKdU_RwGPto5KH7-zV9obCybf23ws8bXMznCpa1oFC4zPPyC8EHcKVUkaXMFYe1Hkxs69aYMUz5hlGHy-AEohvvJyV8NI6WWYsU65" },
      { name: "Nguyễn Xí", role: "Tướng tiên phong", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCcycV1ySqPKKuZDbnjU993BULakAMgfCOujdrOjo8SyV0voN4wC0szw65q9-RgdIIvmuuOH5v6-4CNQ5Waajs-mq8gFWBbvmJk1RSwn5-5_wMG4Y04jgjJKn_jpS4sXMiH8U0YT1oGpqax_ntb_P0ywP6Kk1j-LNbMazIEsrwRZqCbhrSqGRSuuxAtGV3OjrKn2cSpCo0Up46ipeMy1uEuzmb33BcldVmKfnC3MIKb_DT83n06RbmqPfsFEFaeGNEsQ7ONzCDTcnn1" }
    ],
    steleImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuCUmvnwzdL20uy5yXpLNGvMOXcjDflpZDV9mE5K7UqNFe9xlxfzbha5En8Rz-Y4jeLEPXLJVpOKztruQmrTzGtRWyzVffac3ez-0lu4W36FgcfTtAOOwqSMWS2sCupDK66ddjM1TA3CuIdKvyhdDREOa5CQl5NuNwEKNdCGCTLpS87hnUfIyDbMUU11RYhFPXpdGLvQqQtXyNaxPZIvbCBL0-EXzaulG9S8fxlau3D_qTO6LJaeNqjorzgpEQGGU0bQHoge4qZtqo3j"
  };

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/30 pb-24 relative overflow-hidden">
      {/* Background Texture for Cinematic feel */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-[#fcf9ee] to-transparent pointer-events-none"></div>

      <main className="max-w-[1440px] mx-auto px-6 md:px-12 py-20 relative z-10 animate-in fade-in duration-1000">

        {/* 1. HERO SECTION: PORTRAIT & IDENTITY */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start mb-32">
          {/* Ảnh chân dung hoàng gia */}
          <div className="lg:col-span-5 relative group perspective-1000">
            <div className="absolute -inset-4 border border-[#d99b4a]/40 pointer-events-none"></div>
            <div className="overflow-hidden bg-[#fffdf8] relative p-2 shadow-2xl transform-style-3d transition-transform duration-700 hover:scale-[1.02] border border-[#d99b4a]/30">
              <div className="relative border border-[#d99b4a]/30 h-full w-full bg-[#fcf9ee] dong-son-pattern">
                <img src={character.portrait} className="w-full aspect-[3/4] object-cover transition-transform duration-1000 group-hover:scale-105 grayscale-[0.3] sepia-[0.2] contrast-100 group-hover:grayscale-0 group-hover:sepia-0 opacity-90 group-hover:opacity-100" alt="Portrait" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201] via-[#6b0f0d]/60 to-transparent opacity-80 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 right-0 p-10 z-10">
                  <span className="inline-block px-4 py-1.5 bg-[#fcf9ee]/20 backdrop-blur-sm border border-[#d99b4a]/60 text-[#ffe7b0] font-body text-[10px] font-bold uppercase tracking-[0.2em] mb-4 shadow-md">{character.dynastyTitle}</span>
                  <h1 className="font-headline text-5xl md:text-6xl text-[#ffe7b0] font-bold tracking-tight leading-tight drop-shadow-md">{character.name}</h1>
                </div>
              </div>
            </div>
          </div>

          {/* Thông định danh */}
          <div className="lg:col-span-7 pt-6">
            <div className="flex flex-wrap gap-12 mb-12">
              <InfoItem label="Miếu hiệu" value={character.templeName} />
              <InfoItem label="Niên hiệu" value={character.eraName} />
              <InfoItem label="Trị vì" value={character.reign} />
            </div>
            <div className="relative pl-8 mb-10 border-l-2 border-[#d99b4a]">
              <span className="material-symbols-outlined absolute -left-4 -top-2 text-[#d99b4a]/60 text-4xl rotate-180">format_quote</span>
              <p className="font-headline text-2xl text-[#6b0f0d] leading-relaxed font-semibold italic">
                {character.quote}
              </p>
            </div>
            <p className="font-body text-lg text-[#2b1a16]/80 leading-loose">
              {character.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
              <ActionCard icon="auto_stories" title="Gia thế & Xuất thân" desc="Chi tiết về dòng tộc Lê ở Lam Sơn và lý do dấy binh." />
              <ActionCard icon="policy" title="Cải cách Hành chính" desc="Các chính sách đặt nền móng cho thái bình thịnh trị." />
            </div>
          </div>
        </section>

        {/* 2. TIMELINE: HÀNH TRẠNG LỊCH SỬ */}
        <section className="mb-32">
          <div className="flex items-center gap-6 mb-20 text-center">
            <div className="h-px bg-gradient-to-r from-transparent to-[#d99b4a]/60 flex-grow"></div>
            <h2 className="font-headline text-4xl text-[#6b0f0d] font-bold tracking-tight uppercase">Hành Trạng Lịch Sử</h2>
            <div className="h-px bg-gradient-to-l from-transparent to-[#d99b4a]/60 flex-grow"></div>
          </div>

          <div className="max-w-4xl mx-auto relative border-l border-[#d99b4a]/40 pl-10 space-y-16">
            {character.milestones.map((m, i) => (
              <div key={i} className="relative group">
                {/* Nút tròn mốc thời gian */}
                <div className={`absolute -left-[44.5px] top-0 w-3 h-3 rounded-full z-10 transition-transform group-hover:scale-150 ${m.isSpecial ? 'bg-[#6b0f0d] shadow-[0_0_15px_rgba(107,15,13,0.4)]' : 'bg-[#fffdf8] border-2 border-[#d99b4a]'}`}></div>

                <div className={`p-8 bg-[#fffdf8]/60 border border-[#d99b4a]/30 backdrop-blur-sm transition-colors group-hover:bg-[#fffdf8] group-hover:border-[#d99b4a]/60 ${m.isSpecial ? 'shadow-lg border-[#d99b4a]/60' : ''}`}>
                  <span className={`inline-block font-body text-[10px] font-bold px-3 py-1.5 uppercase tracking-[0.2em] mb-4 ${m.isSpecial ? 'bg-[#6b0f0d] text-[#ffe7b0]' : 'border border-[#d99b4a]/50 text-[#6b0f0d]'}`}>
                    {m.time}
                  </span>
                  <h4 className="font-headline text-2xl text-[#2b0504] font-semibold mb-3">{m.title}</h4>
                  <p className="font-body text-[#2b1a16]/80 leading-relaxed text-[15px]">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. RELATED FIGURES */}
        <section className="mb-32">
          <h2 className="font-headline text-3xl text-[#6b0f0d] font-semibold mb-12 text-center tracking-tight">Nhân Vật Liên Quan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {character.relatedFigures.map((fig, i) => (
              <Link to="#" key={i} className="group flex items-center gap-6 p-4 border border-[#d99b4a]/30 bg-[#fffdf8]/60 hover:bg-[#fffdf8] hover:border-[#d99b4a]/60 transition-all shadow-sm">
                <img src={fig.img} className="w-20 h-20 rounded-full object-cover grayscale-[0.3] sepia-[0.2] group-hover:grayscale-0 group-hover:sepia-0 border-2 border-[#d99b4a]/40" alt={fig.name} />
                <div>
                  <h5 className="font-headline text-xl text-[#6b0f0d] font-semibold group-hover:text-[#2b0504] transition-colors">{fig.name}</h5>
                  <p className="font-body text-[#6b0f0d]/70 text-sm uppercase tracking-widest">{fig.role}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. HISTORICAL ARTIFACT */}
        <section>
          <div className="bg-[#fffdf8] border border-[#d99b4a]/40 p-8 md:p-12 flex flex-col md:flex-row gap-12 items-center relative overflow-hidden mb-24 shadow-lg">
            <div className="absolute inset-0 dong-son-pattern opacity-10 pointer-events-none mix-blend-overlay"></div>
            <div className="md:w-1/2 space-y-6 relative z-10">
              <span className="text-[#6b0f0d] font-body text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">museum</span> Di sản vĩnh cửu
              </span>
              <h3 className="font-headline text-4xl text-[#2b0504] font-semibold leading-tight">Vĩnh Lăng Bi Ký</h3>
              <p className="font-body text-[#2b1a16]/80 leading-relaxed">
                Bia Vĩnh Lăng do Nguyễn Trãi soạn, khắc trên đá nguyên khối đặt tại Lam Kinh. Đây là bảo vật quốc gia ghi nhận công đức to lớn của Lê Thái Tổ trong sự nghiệp bình Ngô kiến quốc, mang giá trị văn chương và lịch sử vô giá.
              </p>
              <button className="text-[#ffe7b0] bg-[#6b0f0d] px-6 py-2.5 font-body text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#2b0504] transition-colors shadow-md">
                Khám phá thêm
              </button>
            </div>
            <div className="md:w-1/2 relative z-10">
              <img src={character.steleImg} className="w-full aspect-video object-cover rounded-sm border border-[#d99b4a]/30 grayscale-[0.2] sepia-[0.1] shadow-xl" alt="Bia đá Vĩnh Lăng" />
            </div>
          </div>
        </section>

        {/* 5. NEXT NAVIGATION */}
        <section className="border-t border-[#d99b4a]/30 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex gap-4">
            <button className="flex items-center gap-3 px-8 py-3 border border-[#d99b4a]/60 text-[#6b0f0d] font-body text-[10px] font-bold uppercase tracking-widest hover:bg-[#d99b4a]/10 transition-all bg-[#fffdf8]">
              <span className="material-symbols-outlined text-[14px]">arrow_back</span> Nhân vật trước
            </button>
            <button className="flex items-center gap-3 px-8 py-3 bg-[#6b0f0d] text-[#ffe7b0] font-body text-[10px] font-bold uppercase tracking-widest hover:bg-[#2b0504] transition-all shadow-md">
              Nhân vật tiếp theo <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </button>
          </div>
          <div className="text-right">
            <p className="font-body text-[9px] font-bold text-[#6b0f0d]/60 uppercase tracking-[0.3em] mb-2">Khám phá tiếp</p>
            <p className="font-headline text-2xl text-[#2b0504] font-semibold">Lê Thái Tông — Người kế vị</p>
          </div>
        </section>
      </main>
    </div>
  );
};

// Component con hỗ trợ
const InfoItem = ({ label, value }) => (
  <div>
    <p className="font-body text-[10px] text-[#6b0f0d] uppercase font-bold tracking-[0.2em] mb-1">{label}</p>
    <p className="font-body text-xl text-[#2b0504]">{value}</p>
  </div>
);

const ActionCard = ({ icon, title, desc }) => (
  <div className="p-6 border border-[#d99b4a]/30 bg-[#fffdf8] hover:shadow-lg transition-all group cursor-pointer backdrop-blur-sm">
    <span className="material-symbols-outlined text-3xl text-[#d99b4a] mb-4 group-hover:scale-110 transition-transform">{icon}</span>
    <h4 className="font-headline text-xl text-[#6b0f0d] font-semibold mb-2">{title}</h4>
    <p className="font-body text-sm text-[#2b1a16]/70 leading-relaxed">{desc}</p>
  </div>
);

export default CharacterDetail;