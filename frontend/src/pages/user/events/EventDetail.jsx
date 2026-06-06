import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const EventDetail = () => {
  const { id } = useParams();

  // Cuộn lên đầu trang khi vào trang mới
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Giả lập dữ liệu fetch từ API dựa trên ID
  // Hiện tại đang hiển thị mặc định Trận Bạch Đằng 1288
  const eventData = {
    title: "Đại Thắng Bạch Đằng Giang (1288)",
    subtitle: "Trận chiến vĩ đại nhất trong lịch sử chống ngoại xâm, nơi trí tuệ Đại Việt đánh bại gót ngựa bạo tàn của đế quốc Nguyên Mông trên dòng sông lịch sử.",
    time: "09/04/1288",
    location: "Sông Bạch Đằng",
    forces: "Trần vs Nguyên",
    result: "Toàn thắng",
    heroImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4fTrgf9I1tIhiNA3vcLwZ3WIECExoznhUuCKpoMB8ZyryoQDGgp9vepvx-c5mlCPKPN67vQKnu6WrqSTtkr7y4TGimCJ52wClGnEoVbOMJ8fQ9vlGlsTSMsaJTJDuUdvdjZSHPCfGhPz9xXcZCzCvNbWzxsEb4la90GnDBwyJ9YWo41G3q_j_EoZ1MkRMPa5RQxPGFzHfdEk0-dFR3iNY2nPcjqY5i1pccRq2bhQbra830cd4PUZQRIT_hzxNcEtJNyCRzJwPqudP",
    mapImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuB7BdxYtdPrztVU_5iGWrtkm73OzIP1jvJ2yQ3EcraekuneY8I26x67sBev0SG95y45jIbG4xrKbtg8qhn6k7ZEJmRLDxLfUGRJuy5yrENr4_C9iR0aZlNxzqQV26U3chMs5fR1CnhzmNBd735FbdLyIXcPATyBpze7WiFn3ayZlA24DIgI3TIWrpo7dZmcnhXhEXKPU_ELD2O9bHUvPIdtTvCQyesXYe6ExZHPBRH0Ph2ewFWWCFOIEvDgqR7r2HHMCe6fxLk0eblN",
    figures: [
      { name: "Trần Hưng Đạo", role: "Tổng tư lệnh", color: "border-[#6b0f0d]" },
      { name: "Phạm Ngũ Lão", role: "Thống lĩnh cánh quân", color: "border-[#d99b4a]" },
      { name: "Ô Mã Nhi", role: "Tướng quân Nguyên", color: "border-[#2b0504]/30" }
    ]
  };

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20 pb-20">
      <main className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">

        {/* Breadcrumb */}
        <nav className="mb-10 flex items-center space-x-2 font-body text-[10px] uppercase tracking-widest text-[#2b1a16]/60">
          <Link to="/" className="hover:text-[#6b0f0d] transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-xs opacity-40">chevron_right</span>
          <Link to="/events" className="hover:text-[#6b0f0d] transition-colors">Sự kiện Quân sự</Link>
          <span className="material-symbols-outlined text-xs opacity-40">chevron_right</span>
          <span className="text-[#6b0f0d] font-bold">{eventData.title}</span>
        </nav>

        {/* --- 1. HERO SECTION --- */}
        <section className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <span className="inline-block bg-[#6b0f0d]/5 text-[#6b0f0d] px-4 py-1.5 font-body text-[10px] font-bold uppercase tracking-[0.3em] border border-[#d99b4a]/30 shadow-sm">
              Imperial Victory
            </span>
            <h1 className="font-headline text-5xl md:text-7xl text-[#6b0f0d] leading-tight font-semibold tracking-tight">
              {eventData.title}
            </h1>
            <p className="font-body text-[16px] text-[#2b1a16]/80 max-w-2xl border-l-4 border-[#6b0f0d] pl-8 py-2 leading-relaxed">
              "{eventData.subtitle}"
            </p>
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
          <InfoCard icon="calendar_today" label="Thời gian" value={eventData.time} />
          <InfoCard icon="location_on" label="Địa điểm" value={eventData.location} />
          <InfoCard icon="groups" label="Lực lượng" value={eventData.forces} />
          <InfoCard icon="military_tech" label="Kết quả" value={eventData.result} isHighlight />
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
                <img className="w-full h-full object-cover grayscale-[0.6] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUQlOELDr7vSKNHv6m5TicXO7_V6o-EaflMl3MRoVmoT-RFVT6fBwM7GXM3Ew2TdxDKy4qIeaPg7ibKQ_T1O5YrjPwU3LZMwgTlwRtlfEKFTeV5---VXwVs-9E0BscqNHtPpy6VLVsIhL7CaDcnxxw-d9y7LZNrtKyd7gm8sO3SnyK-YNxPk-zHVmY7yjUhjHg1uckgiFlDsAJ742RzLBc9RsPSRLxMKH2x3e7Wp-x8EBSZp0i8_ONHh-TADtYRof7Ftdc7f7d2ixq" alt="visual 1" />
              </div>
              <div className="aspect-square overflow-hidden border border-[#d99b4a]/40 shadow-sm p-1 bg-[#fffdf8] group">
                <img className="w-full h-full object-cover grayscale-[0.6] sepia-[0.3] group-hover:grayscale-0 group-hover:sepia-0 transition-all duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjpTjLt1c13xJWZUaqui7KtxppQO_wgFyALo0Csb3tZFrR17PevceMl6WfjzYAMPkSZvkZJZJOUp4m6CmSsA4euFfB7HqQ20QAbkbZIUYedFhujtpIxrZJ6CfEadvHPHsJWZmfrV7WUi-mUlMFXYTIboMu9FjxPt56yvw_WfEQ3iZSdKaB2fgHR2YsGalnyZSr_E7CkP03pUkeRFVtWV-OalghRu033epfcsJtT32qvXAEZnyQLU71rVbQSHhMlYVSW5b78vz2i5Nq" alt="visual 2" />
              </div>
            </div>
            <button className="w-full py-4 border border-[#d99b4a]/60 bg-[#fffdf8] text-[#6b0f0d] font-body text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-[#d99b4a]/10 transition-all shadow-sm">
              Mở rộng Thư viện ảnh
            </button>
          </div>
        </section>

        {/* --- 4. FIGURES & EVIDENCE --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-10">
            <h2 className="font-headline text-3xl text-[#6b0f0d] font-semibold">Nhân vật tham chiến</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {eventData.figures.map((fig, i) => (
                <div key={i} className={`flex items-center space-x-6 p-6 bg-[#fffdf8] border border-[#d99b4a]/30 border-l-4 ${fig.color} shadow-sm group hover:shadow-md transition-all`}>
                  <div className="w-16 h-16 rounded-full bg-[#fcf9ee] flex-shrink-0 flex items-center justify-center border border-[#d99b4a]/40 group-hover:bg-[#d99b4a]/20 transition-colors">
                    <span className="material-symbols-outlined text-[#6b0f0d]/60 text-3xl group-hover:text-[#6b0f0d]">person</span>
                  </div>
                  <div>
                    <h4 className="font-headline text-xl text-[#2b0504] font-semibold">{fig.name}</h4>
                    <p className="font-body text-[9px] font-bold uppercase text-[#2b1a16]/60 tracking-widest mt-1">{fig.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h2 className="font-headline text-3xl text-[#6b0f0d] font-semibold">Sử liệu gốc</h2>
            <div className="p-10 bg-[#fffdf8] border border-[#d99b4a]/40 relative shadow-md overflow-hidden group">
              <div className="absolute inset-0 bg-[#fcf9ee] opacity-40 dong-son-pattern pointer-events-none"></div>
              <span className="material-symbols-outlined text-[#d99b4a] opacity-20 text-7xl absolute top-4 right-4">format_quote</span>
              <p className="font-body text-[16px] text-[#2b1a16]/90 leading-loose relative z-10 font-medium">
                "Giặc tan, xác phơi đầy sông, bắt được tướng giặc Ô Mã Nhi cùng hơn 400 chiến thuyền... non sông từ đây thái bình."
              </p>
              <div className="mt-8 pt-6 border-t border-[#d99b4a]/30 font-body text-[10px] font-bold text-[#6b0f0d] uppercase tracking-widest relative z-10">
                — Đại Việt Sử Ký Toàn Thư
              </div>
            </div>
          </div>
        </section>

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