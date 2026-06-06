import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
    const navigate = useNavigate();

    // Mock data
    const featuredCharacters = [
        {
            id: 1,
            name: 'Lê Thái Tổ',
            realName: 'Lê Lợi',
            years: '1385 - 1433',
            dynasty: 'Nhà Lê Sơ',
            desc: 'Người khởi xướng khởi nghĩa Lam Sơn, đánh đuổi quân Minh và thành lập nhà Hậu Lê, mở ra thời kỳ độc lập tự chủ lâu dài cho dân tộc.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkXCL0ZlfPvy43z13A0y1bG_eAez20SasQjlbmMYN0ksU6u2mv7H7wD2kxlQgr5TVFjQXQIMB18PYpL0LebO68DVPdFgMGK1agh4KI4EyQ4Me3ooBfg3K1JiZq7cmSnu-1GzPq8ZGlH-VSmNdibOhBNI1pOIAdA-TqjbomhMxBCsnmpa0JmnR7PFbba9_7Bb2hR96-_FaIwMv6EGVpO58GxtObun-s6BQINyccTPHf67jr-DfzH_Qpx755igURlGi5zCpsjNp-WJmX'
        },
        {
            id: 3,
            name: 'Trần Hưng Đạo',
            realName: 'Trần Quốc Tuấn',
            years: '1228 - 1300',
            dynasty: 'Nhà Trần',
            desc: 'Vị tướng thiên tài ba lần lãnh đạo quân dân nhà Trần đánh bại quân xâm lược Nguyên Mông hùng mạnh nhất thế giới lúc bấy giờ.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKuKKuKjwQFwNQohxy16nvgPodBX9xYlr_xfJyAOLcN1j3ReQY_2BJIBSqRQtNXYZyclOHFwkPeYLBnlikMDpNgGR6cMx-daUsK6HcblyL3JgmceKk24uLN64Cfwy0NVVPHqpaRNc2ly-EJQCL2iinxOqCCI4hauJSNHNDnEmU16YR5iLpog0SXF2T9R7VNsaXlSQwNrxQLlQhE8SG5hIpLchfYvsEBVJJeX4Ez0p4Lm6E2u-PzMPRPc8CC7_NspWPQZhmSiLo2qBr_9H'
        },
        {
            id: 5,
            name: 'Hồ Xuân Hương',
            realName: 'Bà chúa thơ Nôm',
            years: '1772 - 1822',
            dynasty: 'Tây Sơn / Nguyễn',
            desc: '"Bà chúa thơ Nôm" với những tác phẩm độc đáo, táo bạo, mang đậm tinh thần nhân văn và đấu tranh cho nữ quyền.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEqU9ughoF8Lb1OyIIdd3TMKkvgBGcLAxEbaSsQ0yk_XWi3GKPZwQQ1zlkZb73LawSDjLW9iQCar6TFU7XAZE-nA1ykBJhawTohOTraQtXMRjqvh7xfJF7dyIjyId4Xvg8wean3yJ3KpLUg9SP2NqYS-FK9CLXTW5YCS8Ib9Dcgs2UXn25GQNlY8Ssp5rr255X5-r0tZDrr2Gli3VAHxvLjE3qFIR8xoiIsQsTLTto-9iYz9aMrVq4eOgy_XJ_n5qxBrHfX-3TZ8wa'
        }
    ];

    const recentPosts = [
        {
            id: 1,
            title: 'Bí ẩn kiến trúc tháp Chăm',
            category: 'Nghiên cứu',
            date: '12/10/2024',
            desc: 'Khám phá kỹ thuật xây dựng độc đáo không cần mạch vữa của người Champa xưa.',
        },
        {
            id: 2,
            title: 'Hào khí Đông A',
            category: 'Phân tích',
            date: '05/09/2024',
            desc: 'Tìm hiểu về tinh thần thượng võ và sức mạnh đoàn kết thời Trần.',
        }
    ];

    return (
        <div className="animate-in fade-in duration-1000 font-body bg-[#fbf6e8] parchment-texture">
            {/* 1. HERO SECTION */}
            <section className="relative h-[calc(100dvh-80px)] max-h-[750px] min-h-[640px] overflow-hidden bg-[#2b0504]">
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/home.png"
                        alt="Nền lịch sử"
                        className="h-full w-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#210302]/90 via-[#2b0504]/55 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-[25%] bg-gradient-to-t from-[#1b0202]/90 to-transparent" />
                </div>

                <div className="relative z-10 mx-auto h-full max-w-[1440px] px-6 md:px-12 lg:px-20">
                    <div className="flex h-full flex-col justify-center pb-24 pt-8">
                        <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                            <div className="max-w-[800px] -translate-y-12">
                                <img
                                    src="/images/nnvh.png"
                                    alt="Nghìn Năm Văn Hiến"
                                    className="w-[280px] md:w-[380px] lg:w-[480px] drop-shadow-[0_18px_45px_rgba(0,0,0,0.65)] -translate-y-8 md:-translate-y-16 lg:-translate-y-20"
                                />

                                <div className="-mt-[120px] relative z-10">
                                    <h1 className="font-headline text-3xl lg:text-4xl xl:text-[42px] font-semibold leading-[1.1] text-[#f7d78a] drop-shadow-lg tracking-tight">
                                        Chạm vào dòng chảy lịch sử nghìn năm văn hiến
                                    </h1>
                                    <p className="mt-5 max-w-[700px] font-body text-sm lg:text-[16px] leading-relaxed text-[#f8ead0]/90 drop-shadow-md">
                                        Tìm hiểu về những bài viết nghiên cứu sâu sắc, các triều đại, sự kiện, anh hùng dân tộc và di tích lịch sử Đại Việt.
                                    </p>
                                </div>
                            </div>

                            <div className="hidden lg:flex flex-col items-center text-center gap-4 max-w-[240px] absolute right-12 md:right-20 lg:right-32 top-1/2 -translate-y-1/2 z-10">
                                <div className="space-y-4">
                                    <p className="font-headline text-[18px] leading-relaxed italic text-[#f8ead0] drop-shadow-md">
                                        Dựng nước<br />và giữ nước<br />là mệnh trời,<br />phải nuôi dân,<br />thật tốt,<br />rồi mới đánh giặc.
                                    </p>
                                    <div className="w-8 h-[1px] bg-[#d99b4a]/50 mx-auto"></div>
                                    <p className="font-headline text-[15px] italic text-[#d9c7a7]/80">
                                        – Lý Thường Kiệt
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Core Navigation Bar */}
                        <div className="absolute bottom-12 left-0 right-0 px-6 md:px-12 lg:px-20 z-20">
                            <div className="flex w-full rounded-lg border border-[#d99b4a]/30 bg-[#2b0504]/70 backdrop-blur-md shadow-2xl divide-x divide-[#d99b4a]/20 overflow-x-auto custom-scrollbar">
                                {[
                                    { name: "Bài viết", sub: "Nghiên cứu", path: "/posts", icon: "menu_book" },
                                    { name: "Thời gian", sub: "Các triều đại", path: "/periods", icon: "hourglass_empty" },
                                    { name: "Sự kiện", sub: "Niên biểu", path: "/events", icon: "history" },
                                    { name: "Nhân vật", sub: "Hào kiệt", path: "/characters", icon: "person" },
                                    { name: "Di tích", sub: "Dấu ấn", path: "/locations", icon: "account_balance" }
                                ].map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => navigate(item.path)}
                                        className="relative flex flex-1 min-w-[180px] items-center gap-4 p-5 transition-colors hover:bg-[#4a0a08]/50 group"
                                    >
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#d99b4a]/30 bg-[#4a0a08]/40 group-hover:bg-[#5c1310]/60 transition-colors shadow-inner relative">
                                            <div className="absolute inset-0 rounded-full bg-[#8b1512]/20 blur-md group-hover:bg-[#8b1512]/40"></div>
                                            <span className="material-symbols-outlined text-[22px] text-[#f7d78a]/90 relative z-10">{item.icon}</span>
                                        </div>
                                        <div className="flex flex-col items-start text-left">
                                            <span className="font-headline text-[15px] font-bold text-[#f7d78a] tracking-wide group-hover:text-[#fff7df] transition-colors">{item.name}</span>
                                            <span className="font-body text-[10.5px] text-[#d9c7a7]/70 mt-0.5 uppercase tracking-widest">{item.sub}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. BÀI VIẾT - RESEARCH POSTS */}
            <section className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto relative z-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16">
                    <div>
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-[1px] bg-[#d99b4a]"></div>
                            <span className="font-body text-[11px] font-bold text-[#6b0f0d] uppercase tracking-[0.2em]">
                                Tàng thư
                            </span>
                        </div>
                        <h2 className="font-headline text-3xl md:text-4xl text-[#6b0f0d] font-bold tracking-tight">
                            Bài Viết Lịch Sử
                        </h2>
                    </div>

                    <button
                        onClick={() => navigate('/posts')}
                        className="bg-transparent border border-[#6b0f0d]/30 text-[#6b0f0d] px-8 py-2.5 rounded-full font-body font-bold text-[12px] uppercase tracking-widest hover:bg-[#6b0f0d] hover:text-[#ffe7b0] transition-colors"
                    >
                        Xem tất cả bài viết
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {recentPosts.map((post) => (
                        <div 
                            key={post.id} 
                            onClick={() => navigate('/posts')}
                            className="flex flex-col sm:flex-row gap-6 p-6 bg-[#fffdf8] border border-[#d99b4a]/20 rounded-xl hover:shadow-md hover:border-[#d99b4a]/60 transition-all cursor-pointer group"
                        >
                            <div className="w-full sm:w-1/3 h-[180px] sm:h-auto rounded-lg bg-[#2b0504] relative overflow-hidden shrink-0">
                                <div className="absolute inset-0 dong-son-pattern opacity-30 mix-blend-overlay"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-5xl text-[#d99b4a]/50 group-hover:text-[#f7d78a]/80 group-hover:scale-110 transition-all duration-500">
                                        auto_stories
                                    </span>
                                </div>
                                <div className="absolute top-3 left-3 bg-[#6b0f0d] text-[#ffe7b0] text-[9px] font-bold px-3 py-1 rounded-sm uppercase tracking-widest z-10">
                                    {post.category}
                                </div>
                            </div>
                            
                            <div className="flex flex-col justify-center flex-1">
                                <span className="font-body text-[11px] font-semibold text-[#d99b4a] uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                    {post.date}
                                </span>
                                <h3 className="font-headline text-2xl font-bold text-[#6b0f0d] group-hover:text-[#8b1512] mb-3 leading-tight transition-colors">
                                    {post.title}
                                </h3>
                                <p className="font-body text-[14px] text-[#2b1a16]/70 leading-relaxed italic line-clamp-2 border-l-2 border-[#d99b4a]/30 pl-3">
                                    {post.desc}
                                </p>
                                <div className="mt-5 text-[#d99b4a] font-bold text-[12px] uppercase tracking-widest flex items-center gap-1 group-hover:translate-x-2 transition-transform w-fit">
                                    Đọc tiếp <span className="material-symbols-outlined text-[16px]">trending_flat</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. THỜI KỲ - DYNASTY SHORTCUTS */}
            <section className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto text-center relative z-10 border-t border-[#d99b4a]/20">
                <div className="max-w-2xl mx-auto space-y-6 mb-16">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="w-16 h-[1px] bg-[#d99b4a]"></div>
                        <span className="font-body text-[11px] font-bold text-[#6b0f0d] uppercase tracking-[0.2em]">
                            Khởi nguyên & Dòng chảy
                        </span>
                        <div className="w-16 h-[1px] bg-[#d99b4a]"></div>
                    </div>
                    <h2 className="font-headline text-4xl md:text-5xl text-[#6b0f0d] font-bold tracking-tight">
                        Thời Kỳ Lịch Sử
                    </h2>
                    <p className="font-body text-[16px] text-[#2b1a16]/70 leading-relaxed italic max-w-[600px] mx-auto">
                        Bước qua các triều đại lịch sử để hiểu rõ hơn về tiến trình dựng nước và giữ nước oai hùng của dân tộc.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 relative">
                    {/* Decorative line connecting periods */}
                    <div className="hidden lg:block absolute top-1/2 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-[#d99b4a]/30 to-transparent -translate-y-1/2 z-0"></div>

                    {[
                        { name: 'Đinh', years: '968 - 980', icon: 'shield' },
                        { name: 'Tiền Lê', years: '980 - 1009', icon: 'swords' },
                        { name: 'Lý', years: '1009 - 1225', icon: 'temple_buddhist' },
                        { name: 'Trần', years: '1225 - 1400', icon: 'military_tech' },
                        { name: 'Hậu Lê', years: '1428 - 1789', icon: 'menu_book' },
                        { name: 'Nguyễn', years: '1802 - 1945', icon: 'account_balance' }
                    ].map((d, index) => (
                        <div
                            key={index}
                            onClick={() => navigate('/periods')}
                            className="p-8 bg-[#fffdf8] border border-[#d99b4a]/30 rounded-xl hover:-translate-y-2 transition-all cursor-pointer group shadow-sm flex flex-col items-center justify-center relative overflow-hidden z-10"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-[#8b1512] to-[#6b0f0d] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="absolute inset-0 dong-son-pattern mix-blend-overlay opacity-0 group-hover:opacity-20 transition-opacity duration-500"></div>
                            
                            <span className="material-symbols-outlined text-3xl text-[#d99b4a] mb-4 group-hover:text-[#f7d78a] transition-colors relative z-10 group-hover:scale-110 duration-500">
                                {d.icon}
                            </span>
                            
                            <div className="font-headline text-2xl font-bold text-[#6b0f0d] group-hover:text-[#f7d78a] transition-colors relative z-10">
                                Nhà {d.name}
                            </div>
                            <div className="font-body text-[11px] font-bold text-[#2b1a16]/50 group-hover:text-[#f7d78a]/80 mt-2 tracking-widest transition-colors relative z-10 bg-[#d99b4a]/10 group-hover:bg-[#8b1512]/50 px-3 py-1 rounded-full border border-[#d99b4a]/20 group-hover:border-[#f7d78a]/30">
                                {d.years}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. SỰ KIỆN - NIÊN BIỂU SỰ KIỆN */}
            <section className="py-24 relative bg-[#fcf9ee]">
                <div className="absolute inset-0 dong-son-pattern opacity-[0.03] pointer-events-none mix-blend-overlay border-y border-[#d99b4a]/20"></div>
                <div className="px-6 md:px-12 max-w-[1440px] mx-auto relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-16">
                        <div className="flex items-center gap-4">
                            <h2 className="font-headline text-3xl md:text-4xl text-[#6b0f0d] font-bold tracking-tight uppercase">
                                Sự Kiện Nổi Bật
                            </h2>
                            <div className="hidden md:block h-[1px] w-32 bg-[#d99b4a]/50"></div>
                        </div>

                        <span
                            onClick={() => navigate('/events')}
                            className="font-body text-[10.5px] font-bold text-[#6b0f0d] hover:text-[#a51d18] cursor-pointer uppercase tracking-[0.2em] flex items-center gap-2 group border border-[#6b0f0d]/20 px-6 py-2 rounded-full hover:bg-[#6b0f0d]/5 transition-colors"
                        >
                            Xem toàn bộ niên biểu <span className="material-symbols-outlined text-[14px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </span>
                    </div>

                    <div className="flex gap-8 overflow-x-auto pb-12 custom-scrollbar">
                        {[
                            {
                                date: 'Năm 938',
                                title: 'Chiến thắng Bạch Đằng',
                                desc: 'Ngô Quyền đánh bại quân Nam Hán, chấm dứt 1000 năm Bắc thuộc.',
                            },
                            {
                                date: 'Năm 1010',
                                title: 'Dời đô về Thăng Long',
                                desc: 'Lý Thái Tổ ban Chiếu dời đô, chuyển kinh thành từ Hoa Lư về Đại La.',
                            },
                            {
                                date: 'Năm 1288',
                                title: 'Chiến thắng Bạch Đằng (lần 3)',
                                desc: 'Hưng Đạo Vương Trần Quốc Tuấn đại phá quân Nguyên Mông.',
                            },
                            {
                                date: 'Năm 1427',
                                title: 'Hội thề Đông Quan',
                                desc: 'Kết thúc thắng lợi cuộc khởi nghĩa Lam Sơn chống quân Minh.',
                            }
                        ].map((event, i) => (
                            <div
                                key={i}
                                className="min-w-[320px] md:min-w-[380px] bg-[#fffdf8] border-l-4 border-l-[#d99b4a] border-y border-r border-[#d99b4a]/20 p-8 rounded-r-xl hover:translate-x-2 hover:shadow-lg transition-all duration-300 relative group cursor-pointer"
                                onClick={() => navigate('/events')}
                            >
                                <div className="absolute top-8 -left-2 w-4 h-4 rounded-full bg-[#fbf6e8] border-4 border-[#d99b4a] group-hover:scale-125 transition-transform z-10"></div>
                                
                                <div className="mb-4">
                                    <span className="font-body text-[12px] font-bold text-[#6b0f0d] uppercase tracking-widest bg-[#d99b4a]/10 px-3 py-1.5 rounded-sm">
                                        {event.date}
                                    </span>
                                </div>

                                <h4 className="font-headline text-2xl text-[#6b0f0d] font-bold mb-3 mt-4">
                                    {event.title}
                                </h4>

                                <p className="font-body text-[14px] text-[#2b1a16]/70 leading-relaxed italic border-l-2 border-[#d99b4a]/30 pl-4 mt-4">
                                    {event.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. DANH NHÂN - FEATURED CHARACTERS */}
            <section className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto relative z-10">
                <div className="flex flex-col items-center text-center mb-16">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-[1px] bg-[#d99b4a]"></div>
                        <span className="font-body text-[11px] font-bold text-[#6b0f0d] uppercase tracking-[0.2em]">
                            Tiêu biểu
                        </span>
                        <div className="w-16 h-[1px] bg-[#d99b4a]"></div>
                    </div>
                    <h2 className="font-headline text-4xl md:text-5xl text-[#6b0f0d] font-bold tracking-tight mb-6">
                        Nhân Vật Lịch Sử
                    </h2>
                    <p className="font-body text-[16px] text-[#2b1a16]/70 leading-relaxed max-w-2xl">
                        Khám phá cuộc đời và những chiến công hiển hách của các anh hùng, nhân vật đã làm rạng danh non sông Đại Việt.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {featuredCharacters.map((char) => (
                        <div key={char.id} className="bg-[#fffdf8] rounded-xl shadow-md border border-[#d99b4a]/30 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 cursor-pointer" onClick={() => navigate(`/characters/${char.id}`)}>
                            <div className="relative h-[300px] w-full overflow-hidden shrink-0 border-b-2 border-[#d99b4a]/20">
                                <img 
                                    src={char.image} 
                                    alt={char.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 sepia-[0.1]" 
                                />
                                <div className="absolute top-4 right-4 bg-[#6b0f0d]/95 backdrop-blur-sm border border-[#d99b4a]/40 text-[#ffe7b0] text-[10px] font-bold px-4 py-1.5 rounded-full z-10 shadow-lg uppercase tracking-widest">
                                    {char.dynasty}
                                </div>
                                <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[#1a0201] via-[#1a0201]/50 to-transparent pointer-events-none"></div>
                                <div className="absolute bottom-5 left-5 right-5 text-[#ffe7b0] z-10">
                                    <h3 className="font-headline text-[30px] font-bold tracking-wide leading-tight drop-shadow-md">
                                        {char.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[16px] opacity-90 font-medium font-body text-[#f7d78a]">({char.realName})</span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#d99b4a] opacity-80"></span>
                                        <span className="text-[13px] opacity-80 font-medium tracking-widest">{char.years}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 flex flex-col flex-grow relative bg-[#fffdf8] dong-son-pattern-subtle">
                                <p className="text-[#2b1a16]/80 text-[14px] leading-relaxed line-clamp-3 font-body relative z-10">
                                    {char.desc}
                                </p>
                                <div className="mt-8 pt-4 flex border-t border-[#d99b4a]/20 relative z-10">
                                    <span className="text-[#6b0f0d] font-bold text-[13px] uppercase tracking-widest flex items-center gap-1 group-hover:text-[#d99b4a] transition-colors">
                                        Xem chi tiết 
                                        <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">chevron_right</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => navigate('/characters')}
                        className="bg-transparent border-2 border-[#6b0f0d] text-[#6b0f0d] px-10 py-3 rounded-full font-body font-bold text-[13px] uppercase tracking-widest hover:bg-[#6b0f0d] hover:text-[#ffe7b0] transition-colors shadow-sm"
                    >
                        Xem toàn bộ Nhân vật
                    </button>
                </div>
            </section>

            {/* 6. DI TÍCH - LOCATIONS & MAP CTA */}
            <section className="py-24 px-6 md:px-12 max-w-[1440px] mx-auto text-center space-y-16 border-t border-[#d99b4a]/20">
                <div className="bg-[#2b0504] border border-[#d99b4a]/40 rounded-xl p-10 md:p-20 flex flex-col items-center relative overflow-hidden group shadow-2xl">
                    <img
                        className="absolute inset-0 w-full h-full object-cover opacity-[0.2] mix-blend-luminosity grayscale-[30%] sepia-[50%] group-hover:scale-105 transition-transform duration-[20s]"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFP8chLPXP9CFXQ9SWX7y1oh1bbGSfFCnXG0FkWzHIhsKyn_elKHpxt_a66FO7iKc5Ixrf0cZwLguOY5sIYf920OubLX3TpHpuIXc3EOOwjToUQkjHqMjFysh3Gv_inAM7hwmG55ONut6T3mWBwvOXAek4fqGnOGoYFlhB6JMN-CoxjCW2CZDy-rNIkjpReJG3oKbFknSZaa8NObGutb82o07nPH-RQLWi9N76OL-rE9tUnnn37hswsSZvNmXzVXJ2fGdMvBzVcjnI"
                        alt="Bản đồ Di tích"
                    />

                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2b0504]/60 to-[#2b0504] pointer-events-none"></div>

                    <div className="relative z-10 max-w-2xl space-y-8 flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full border border-[#d99b4a]/50 flex items-center justify-center bg-[#4a0a08]/50 backdrop-blur-sm shadow-inner">
                            <span className="material-symbols-outlined text-[#f7d78a] text-[40px]">
                                map
                            </span>
                        </div>

                        <h3 className="font-headline text-4xl md:text-5xl text-[#f7d78a] font-bold tracking-tight drop-shadow-md">
                            Di Tích Lịch Sử
                        </h3>

                        <p className="font-body text-[18px] text-[#f8ead0]/80 italic max-w-xl text-center leading-relaxed drop-shadow-sm">
                            Khám phá vị trí các di tích, đền đài, lăng tẩm và những dấu ấn còn sót lại của các vương triều trên bản đồ thiêng liêng của Tổ quốc.
                        </p>

                        <button
                            onClick={() => navigate('/locations')}
                            className="mt-6 bg-[#6b0f0d] border border-[#d99b4a]/50 text-[#ffe7b0] px-12 py-4 rounded-full font-body font-bold text-[14px] uppercase tracking-widest shadow-[0_8px_20px_rgba(107,15,13,0.4)] hover:bg-[#8b1512] hover:-translate-y-1 transition-all flex items-center gap-3"
                        >
                            Khám phá Bản Đồ
                            <span className="material-symbols-outlined text-[20px]">explore</span>
                        </button>
                    </div>
                </div>
            </section>

        </div>
    );
};

export default Home;