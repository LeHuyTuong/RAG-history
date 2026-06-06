import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const UserPeriods = () => {
  const navigate = useNavigate();

  // Dữ liệu các thời kỳ lịch sử
  const periodsData = [
    {
      id: 'hong-bang',
      name: 'Thời đại Hùng Vương',
      range: '2879 TCN - 258 TCN',
      category: 'Kỷ Hồng Bàng',
      desc: 'Giai đoạn khởi thủy của dân tộc với truyền thuyết Con Rồng Cháu Tiên. Nền văn minh Đông Sơn rực rỡ với kỹ thuật đúc đồng tinh xảo.',
      details: ['18 đời Hùng Vương trị vì', 'Sự tích Lạc Long Quân - Âu Cơ'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBI-gkQtZyuGSYSyPBbC8isN7FdmTSvDiyKXtUbIE8iGpa3xh1hbTc1hMhDQlFDkGbC8PYj9uNmzg9bbN2oW0QqdQjZb5kpaXaEWHHFbDPxR3umN8EF_TdJqWu5tUoa7hPlrCQU7NxMPx5UgJ9JU1gzW3TDiQTr_GY7OOUubFGhljKhAxqaqlVtRaMMqvAe4QXZ9kPf94N7RKIO5QL9AyWPuBg8fUKvfjabWBg5ChA_T2Fh1LkF0BbgkUkV2ZggUIOqQCaY85JNT_Ky'
    },
    {
      id: 'ly',
      name: 'Kỷ Nguyên Thăng Long',
      range: '1009 - 1225',
      category: 'Nhà Lý',
      desc: 'Vua Lý Thái Tổ dời đô về Thăng Long, mở ra thời kỳ hưng thịnh của Phật giáo và văn hóa Đại Việt. Xây dựng Văn Miếu - Quốc Tử Giám.',
      details: ['Chiếu Dời Đô (1010)', 'Phá Tống trên sông Như Nguyệt'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGUI3HT9Jex5a-ZERUyLKKX086wzQHpxtpVeEbPJEpbnTS-rw0ElAg5co6141j6KJDTDCz1ORbq5naaR6yRj54VbXWefWH04BoEsovGxeQp_RFUEbdBmUClcwLmx3guee6Cg-dzz_WWbe_KByIYQUUoJXxlhsKBoU1OVMdNif6YQ-rPbN56YQNjt1Dwqs9vuDdE_LzBbakJz5a2f0D-msrRSxENoyfI4SU6jI0WnQ_Fb5KC5LHNrNpJVLFv-rEYPmp-8J8a9SWgOV2'
    },
    {
      id: 'tran',
      name: 'Hào Khí Đông A',
      range: '1225 - 1400',
      category: 'Nhà Trần',
      desc: 'Ba lần đại thắng quân Nguyên Mông, đế quốc hùng mạnh nhất bấy giờ. Tinh thần đoàn kết quân dân lên cao nhất với Hội nghị Diên Hồng.',
      details: ['Chiến thắng Bạch Đằng (1288)', 'Thiền phái Trúc Lâm Yên Tử'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMX3lFtj-6Z0RXVTnWLTWAah11z-bWRBxGeLq5DhzWb8HSeM3wYIMHw1tgKPGplh-hpC5CsPKjeKt6R42LsERrUQwcXHh3ojTy-i2q4YoYA5TQTR1HlIF514G9Nwu2Ovg-Rd9hz-Vm_kQsHiTASSI4PskklWfdXf6prOGhjrL_z46mwvDI35210tqBwyNdsLgHNkhfnooYr0sIRSbznd2tyz0nRLu2lZAj5ShL-D2B6o3EpZzJgWSnkP92Gg6BIh-L7IbtyWiYQg22'
    },
    {
      id: 'le-so',
      name: 'Phục Hưng Đại Việt',
      range: '1428 - 1527',
      category: 'Nhà Lê Sơ',
      desc: 'Lê Lợi lãnh đạo khởi nghĩa Lam Sơn quét sạch quân Minh. Giai đoạn cực thịnh với bộ luật Hồng Đức và tập bản đồ đầu tiên.',
      details: ['Bình Ngô Đại Cáo', 'Luật Hồng Đức (1483)'],
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC69XjPXwUCv4uiCyg1FXrV8lnKtzig-y9c_2ADvW1KBphb5JrHVrfRO-yFo6F6uZ9rj0tIaQ7BLsMsyWg4XHH8f2y4NKxtBODBBO9yDjMj4rTrua_55fQFUOFcAgiegZRVTCdJXyCxP9z26GVh4xwhFv6ArIlh0axKbja9sJagtfSJjCUH1XFmF8wvrD7GfVZReHja_BXK7vUK6uKWbI17rkpWfSLpNf44-OwjBCL31S2nGukioNSNy1bjxK1W4H2ZnedewEinUH2G'
    }
  ];

  const [activePeriod, setActivePeriod] = useState(periodsData[0].id);
  const sectionRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Chỉ lấy entry đang được nhìn thấy rành mạch nhất (nếu có nhiều entry cùng lúc)
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActivePeriod(entry.target.id);
          }
        });
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToPeriod = (id) => {
    setActivePeriod(id);
    const element = sectionRefs.current[id];
    if (element) {
      // Offset scroll manually or use scrollIntoView
      const yOffset = -100; // Để chừa header nếu có
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-[#fbf6e8] min-h-screen font-body selection:bg-[#d99b4a]/20">

      {/* 1. HERO SECTION */}
      <section className="relative h-[450px] flex items-center justify-center overflow-hidden border-b border-[#d99b4a]/30">
        <div className="absolute inset-0 z-0 bg-[#2b0504]">
          <img
            className="w-full h-full object-cover grayscale-[30%] sepia-[40%] brightness-[0.4] animate-ken-burns origin-center"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBAVKTpmIOsVPz71VTF7L-eaHzXN4Oh6ub8EnTMlfUxrO0hDH1qbwKqQtEnBGtuK1LPKBy5AJGrq5evViTFpOavYjCKc58Nv9n6_KOuHFJmbJp9zdQyAwqo25I9dqHTc82z_zNxCvJEdmuN7_Gfjkz4j9mxGG-E-Ip-ns87D3W7Hvs0eWMOiKI9S5Ng0eSOpToLtO9W5MjbkR0iTXZZR8SBLrVLBIAitzFajiYDuc-aFI2C0FXPJgzc0QWAMp4Dl6sTZfmH2AhB54N6"
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
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16 lg:py-24 flex flex-col lg:flex-row gap-12 relative">
        
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
            
            <ul className="py-2">
              {periodsData.map(p => (
                <li key={p.id}>
                  <button 
                    onClick={() => scrollToPeriod(p.id)}
                    className={`w-full text-left px-6 py-4 font-body text-[15px] transition-all border-l-4 group ${
                      activePeriod === p.id 
                      ? 'bg-[#d99b4a]/10 border-[#6b0f0d] text-[#6b0f0d] font-bold shadow-inner' 
                      : 'border-transparent text-[#2b1a16] hover:bg-[#fcf9ee] hover:text-[#6b0f0d]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{p.name}</span>
                      <span className={`material-symbols-outlined text-[18px] transition-transform ${activePeriod === p.id ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>east</span>
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
            {periodsData.map((p, idx) => (
              <section 
                key={p.id} 
                id={p.id} 
                ref={(el) => (sectionRefs.current[p.id] = el)} 
                className="relative pl-10 lg:pl-16 group"
              >
                {/* Timeline Node */}
                <div className="absolute left-0 lg:left-[12px] top-6 w-6 h-6 rounded-full bg-[#fbf6e8] border-[4px] border-[#6b0f0d] shadow-[0_0_15px_rgba(107,15,13,0.4)] z-10 group-hover:bg-[#6b0f0d] group-hover:scale-125 transition-all duration-300"></div>

                {/* Card */}
                <div className="bg-[#fffdf8] border border-[#d99b4a]/40 p-8 lg:p-12 shadow-xl hover:shadow-[0_20px_50px_rgba(43,5,4,0.08)] transition-all duration-500 relative group/card">
                  {/* Decorative */}
                  <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-[#d99b4a] opacity-50"></div>
                  <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-[#d99b4a] opacity-50"></div>
                  <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-[#d99b4a] opacity-50"></div>
                  <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-[#d99b4a] opacity-50"></div>

                  <div className="flex flex-col xl:flex-row gap-10 items-start">
                    {/* Text content */}
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center gap-4">
                        <span className="bg-[#6b0f0d] text-[#ffe7b0] font-body text-[10px] font-bold px-3 py-1.5 uppercase tracking-widest">{p.category}</span>
                        <span className="font-headline text-[#d99b4a] font-bold text-lg">{p.range}</span>
                      </div>
                      
                      <h3 className="font-headline text-3xl md:text-4xl text-[#2b0504] font-bold tracking-tight group-hover/card:text-[#6b0f0d] transition-colors">{p.name}</h3>
                      
                      <p className="font-body text-[15px] text-[#2b1a16]/80 leading-relaxed pt-2">"{p.desc}"</p>
                      
                      <div className="space-y-3 py-4 border-t border-b border-[#d99b4a]/20">
                        {p.details.map(detail => (
                          <div key={detail} className="flex items-center gap-3 text-[#2b1a16]">
                            <div className="w-1 h-1 rotate-45 bg-[#6b0f0d]"></div>
                            <span className="font-body text-[14px] text-[#4a2a22] font-semibold">{detail}</span>
                          </div>
                        ))}
                      </div>

                      <Link
                        to={`/periods/${p.id}`}
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