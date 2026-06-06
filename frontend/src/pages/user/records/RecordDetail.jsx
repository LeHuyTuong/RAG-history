import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

const RecordDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Dữ liệu mẫu (Thực tế fetch từ API theo id)
  const record = {
    archiveId: "1479-DV",
    title: "Đại Việt Sử Ký Toàn Thư - Bản in Nội các quan bản",
    description: "Bộ chính sử lớn nhất Việt Nam thời trung đại, được biên soạn dựa trên cơ sở kế thừa các bộ sử cũ như Đại Việt Sử ký của Lê Văn Hưu và Phan Phu Tiên, tạo nên một hệ thống biên niên sử hoàn chỉnh và đồ sộ nhất.",
    metadata: [
      { label: "Tác giả chính", value: "Ngô Sĩ Liên" },
      { label: "Hoàn thành", value: "1479 (Hồng Đức)" },
      { label: "Thể loại", value: "Biên niên kỷ" },
      { label: "Bản in nổi bật", value: "Chính Hòa (1697)" }
    ],
    coverImg: "https://lh3.googleusercontent.com/aida-public/AB6AXuDDa-iYa8ONYxLBuvVkq6BoTjrT_IUXe4ow4Lsi6cHfwJXeWV5FWXvPO0Fs_uMBUra6CORueXqhIoWwP_EZgFmmhOjJgylZaENGN4CKrYz-lfMLx5N_qDmHaFCpi2sH3EOsDDxmavVYHh6MRTBmSsNt9CHIpc1H2TgIqYWOkdo7psAIUx9W4-H2h-QIELCJAXibNsCuUhlClnEyENl1is6L8mrtwdNWY2tjY1NNp9CtZdlhYC9JkgO10_w8UwME5kP2Ct3Xz8cnLMV3",
    importance: "Đại Việt Sử Ký Toàn Thư không chỉ là một công trình lịch sử mà còn là văn bản định hình quốc gia. Nó thiết lập một dòng chảy lịch sử liên tục từ thời Hồng Bàng đến thời Lê Sơ, khẳng định chủ quyền văn hóa và độc lập chính trị của Đại Việt.",
    structure: [
      { title: "Ngoại kỷ", desc: "Từ thời Hồng Bàng đến hết thời 12 sứ quân (967).", icon: "history_toggle_off" },
      { title: "Bản kỷ", desc: "Từ triều Đinh (968) đến triều Lê Sơ (năm 1433).", icon: "workspace_premium" },
      { title: "Bản kỷ tục biên", desc: "Các phần được bổ sung sau này về nhà Mạc và Lê Trung Hưng.", icon: "edit_note" }
    ],
    originalText: "大越史記全書",
    translatedText: "Xưa nay, nước nào có sử nước nấy. Nước Đại Việt ta từ khi dựng nước đến nay, đời nào cũng có ghi chép. Song vì binh hỏa của giặc Ngô (nhà Minh) đốt phá, nên sử cũ đã mất mát nhiều..."
  };

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20 pb-20">
      <main className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-1 hover:text-[#6b0f0d] transition-colors border border-[#d99b4a]/30 px-3 py-1.5 rounded-full hover:bg-[#d99b4a]/10 bg-[#fffdf8] shadow-sm text-[#2b1a16]/60 font-body text-[10px] uppercase tracking-widest inline-flex w-fit">
          <span className="material-symbols-outlined text-[14px]">arrow_back</span>
          Quay lại
        </button>
        
        {/* --- 1. HERO & METADATA --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20 items-center">
          <div className="lg:col-span-8 space-y-8">
            <span className="text-[#6b0f0d]/80 font-body text-[10px] font-bold tracking-[0.3em] uppercase block border-l-4 border-[#d99b4a] pl-4">
              Archive Record #{record.archiveId}
            </span>
            <h1 className="font-headline text-5xl md:text-7xl text-[#6b0f0d] font-semibold leading-tight tracking-tight">
              {record.title}
            </h1>
            <p className="font-body text-[16px] text-[#2b1a16]/80 leading-relaxed max-w-3xl">
              {record.description}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {record.metadata.map((item, i) => (
                <div key={i} className="p-5 border border-[#d99b4a]/30 rounded-sm bg-[#fffdf8] shadow-sm group hover:border-[#6b0f0d] hover:shadow-md transition-all">
                  <p className="text-[#6b0f0d]/60 font-body text-[9px] font-bold uppercase tracking-widest mb-2">{item.label}</p>
                  <p className="font-headline text-xl text-[#2b0504] font-semibold">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
               <button className="bg-[#6b0f0d] text-[#ffe7b0] px-8 py-4 rounded-sm font-body font-bold text-[11px] uppercase tracking-widest shadow-xl hover:bg-[#8b1512] transition-all flex items-center gap-3 active:scale-95 border border-[#d99b4a]/40">
                  <span className="material-symbols-outlined text-[16px]">download</span> Tải bản PDF Nghiên cứu
               </button>
               <button className="border border-[#d99b4a]/60 text-[#6b0f0d] px-8 py-4 rounded-sm font-body font-bold text-[11px] uppercase tracking-widest hover:bg-[#d99b4a]/10 bg-[#fffdf8] transition-all flex items-center gap-3">
                  <span className="material-symbols-outlined text-[16px]">search_insights</span> Tra cứu mục lục số
               </button>
            </div>
          </div>

          <div className="lg:col-span-4 relative group">
             <div className="absolute -inset-4 border border-[#d99b4a]/40 pointer-events-none dong-son-border"></div>
             <div className="overflow-hidden border border-[#d99b4a]/50 shadow-2xl relative p-2 bg-[#fffdf8]">
                <div className="relative border border-[#d99b4a]/30 h-full w-full bg-[#fcf9ee] dong-son-pattern">
                   <img src={record.coverImg} className="w-full aspect-[3/4] object-cover transition-transform duration-1000 group-hover:scale-105 grayscale-[0.6] sepia-[0.4] group-hover:grayscale-[0.1] group-hover:sepia-[0.2]" alt="Manuscript" />
                   <div className="absolute bottom-4 left-4 right-4 bg-[#fffdf8]/95 backdrop-blur-md p-4 rounded-sm border border-[#d99b4a]/40 shadow-lg">
                      <p className="text-[10px] text-[#6b0f0d] font-body font-bold uppercase tracking-widest">Hình ảnh: Một trang bản thảo Nội các quan bản</p>
                   </div>
                </div>
             </div>
          </div>
        </section>

        {/* --- 2. BENTO GRID: IMPORTANCE & STRUCTURE --- */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
           <div className="lg:col-span-2 bg-[#fffdf8] border border-[#d99b4a]/40 p-10 shadow-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-[#fcf9ee] opacity-40 dong-son-pattern"></div>
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                 <span className="material-symbols-outlined text-[150px] text-[#6b0f0d]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_stories</span>
              </div>
              <div className="relative z-10">
                 <h3 className="font-headline text-3xl text-[#6b0f0d] font-semibold mb-8 flex items-center gap-4">
                    <span className="w-12 h-[2px] bg-[#d99b4a]"></span> Tầm quan trọng học thuật
                 </h3>
                 <p className="font-body text-[16px] text-[#2b1a16]/80 leading-loose mb-8">
                    {record.importance}
                 </p>
                 <div className="flex flex-wrap gap-3">
                    {["Imperial Decree", "National Sovereignty", "Confucian Ethics"].map(tag => (
                      <span key={tag} className="bg-[#fcf9ee] text-[#6b0f0d] px-4 py-1.5 font-body text-[9px] font-bold uppercase tracking-widest border border-[#d99b4a]/40 shadow-sm">
                        {tag}
                      </span>
                    ))}
                 </div>
              </div>
           </div>

           <div className="bg-[#2b0504] text-[#fcf9ee] p-10 shadow-2xl relative border border-[#d99b4a]/30">
              <div className="absolute inset-0 opacity-10 dong-son-pattern mix-blend-overlay"></div>
              <h3 className="font-headline text-2xl font-semibold text-[#f7d78a] mb-8 border-b border-[#d99b4a]/20 pb-4 relative z-10">Cấu trúc bộ sử</h3>
              <ul className="space-y-8 relative z-10">
                 {record.structure.map((item, i) => (
                   <li key={i} className="flex gap-5 group">
                      <div className="w-12 h-12 rounded-full border border-[#d99b4a]/40 flex items-center justify-center shrink-0 group-hover:bg-[#d99b4a] group-hover:text-[#2b0504] transition-all duration-500 shadow-lg bg-[#1a0201]/40">
                         <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                      </div>
                      <div>
                         <h4 className="font-headline text-lg font-semibold text-[#f7d78a] uppercase tracking-wider">{item.title}</h4>
                         <p className="text-[13px] opacity-80 leading-relaxed mt-1 text-[#fcf9ee]">{item.desc}</p>
                      </div>
                   </li>
                 ))}
              </ul>
           </div>
        </section>

        {/* --- 3. DIGITAL PREVIEW: MANUSCRIPT & TRANSLATION --- */}
        <section className="mb-20">
           <div className="flex justify-between items-end mb-10">
              <div>
                 <h2 className="font-headline text-4xl text-[#6b0f0d] font-semibold tracking-tight">Bản số hóa & Dịch nghĩa</h2>
                 <p className="text-[#6b0f0d]/60 font-body text-[10px] font-bold uppercase tracking-widest mt-2">Đối chiếu Hán-Nôm gốc và Quốc ngữ</p>
              </div>
              <div className="flex gap-4">
                 <button className="w-10 h-10 border border-[#d99b4a]/60 flex items-center justify-center hover:bg-[#d99b4a]/10 bg-[#fffdf8] text-[#6b0f0d] transition-all"><span className="material-symbols-outlined text-[16px]">chevron_left</span></button>
                 <button className="w-10 h-10 border border-[#d99b4a]/60 flex items-center justify-center hover:bg-[#d99b4a]/10 bg-[#fffdf8] text-[#6b0f0d] transition-all"><span className="material-symbols-outlined text-[16px]">chevron_right</span></button>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 border border-[#d99b4a]/40 shadow-2xl overflow-hidden group">
              {/* Cột Hán Nôm */}
              <div className="bg-[#1a0201] p-12 text-[#fcf9ee] flex flex-col items-center justify-center relative min-h-[500px]">
                 <div className="absolute inset-0 bg-black/40 dong-son-pattern mix-blend-overlay opacity-30"></div>
                 <div className="absolute top-6 left-6 text-[9px] font-body font-bold uppercase opacity-50 tracking-[0.3em] text-[#d99b4a]">Digital Scan: Cabinet Edition</div>
                 <p className="font-headline text-6xl md:text-8xl leading-[1.8] text-center text-[#f7d78a] relative z-10 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]" style={{ writingMode: 'vertical-rl' }}>
                    {record.originalText}
                 </p>
                 <div className="mt-12 pt-8 border-t border-[#d99b4a]/20 w-full text-center relative z-10">
                    <p className="font-body text-[13px] opacity-70 text-[#fcf9ee]">Tờ 1a, Quyển Thủ - Tựa của Ngô Sĩ Liên</p>
                 </div>
              </div>
              {/* Cột Dịch nghĩa */}
              <div className="bg-[#fffdf8] p-12 flex flex-col relative border-l border-[#d99b4a]/30">
                 <div className="absolute inset-0 bg-[#fcf9ee] opacity-30 dong-son-pattern pointer-events-none"></div>
                 <div className="mb-10 relative z-10">
                    <span className="inline-block bg-[#6b0f0d]/5 text-[#6b0f0d] px-4 py-1.5 font-body text-[9px] font-bold uppercase tracking-widest mb-6 border border-[#d99b4a]/30">Bản dịch hiện đại</span>
                    <h4 className="font-headline text-3xl font-semibold text-[#2b0504] mb-6">Trích lược lời tựa</h4>
                    <p className="font-body text-[16px] leading-[2] text-[#2b1a16]/80">
                       "{record.translatedText}"
                    </p>
                 </div>
                 <div className="mt-auto pt-8 border-t border-[#d99b4a]/30 flex justify-between items-center relative z-10">
                    <p className="text-[9px] font-body font-bold text-[#6b0f0d]/60 uppercase tracking-widest">Nguồn: Viện Nghiên cứu Hán Nôm</p>
                    <button className="text-[#6b0f0d] font-body text-[10px] font-bold uppercase tracking-[0.2em] border-b border-[#6b0f0d]/30 hover:border-[#6b0f0d] transition-all flex items-center gap-2">
                       XEM TOÀN CHƯƠNG <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </button>
                 </div>
              </div>
           </div>
        </section>

      </main>
    </div>
  );
};

export default RecordDetail;