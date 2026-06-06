import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import VietnamMap from '../../../components/VietnamMap';

const LocationDetail = () => {
  const { id } = useParams();

  // Hiệu ứng cuộn lên đầu trang khi vào
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-[#fbf6e8] parchment-texture min-h-screen font-body selection:bg-[#d99b4a]/20 pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative h-[70vh] w-full overflow-hidden border-b-[6px] border-[#d99b4a]/40">
        <img
          className="w-full h-full object-cover grayscale-[0.3] sepia-[0.2]"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCKLHWeWj3vTsKv2mconxq0gMjej8NpLLxS7ULSYKb17LLtEilBkjNNXRpGgmXsa5cit6jAVKY4R2EamuEXXjxJffT5d4La1xt3teUTz0dKXgG-ooZwoGtUMQ4jqEV8UM5eVRcELZb6IoF7-WzB4Sbt4xt-lKU3DzW8pL1xFrwxl-bYoN0KeNvHkFX2NdMQZ3m2wqs6-HuhE1MePvHSq-F62T1hwexNusRgGgJL0zwRXASpQmfrZACwD8jgyH-5N1MN8mLhT2T1TGhR"
          alt="Cố đô Huế"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a0201] via-[#2b0504]/60 to-transparent flex flex-col justify-end p-12 md:p-24">
          <div className="absolute inset-0 bg-[#fcf9ee]/5 mix-blend-overlay dong-son-pattern opacity-30 pointer-events-none"></div>
          <div className="max-w-[1440px] mx-auto w-full relative z-10">
            <span className="inline-block bg-[#6b0f0d] text-[#ffe7b0] px-6 py-1.5 font-body text-[10px] font-bold uppercase tracking-widest mb-6 shadow-lg border border-[#d99b4a]/40">
              DI SẢN VĂN HÓA THẾ GIỚI
            </span>
            <h1 className="font-headline text-6xl md:text-8xl text-[#f7d78a] font-semibold tracking-tight mb-6">
              Cố đô Huế
            </h1>
            <p className="text-[#fcf9ee]/90 font-body text-[16px] max-w-2xl leading-relaxed">
              Kinh đô của triều đại nhà Nguyễn, biểu tượng cho quyền lực và sự hưng thịnh của một quốc gia thống nhất qua hơn một thế kỷ.
            </p>
          </div>
        </div>
      </section>

      {/* 2. BENTO CONTENT GRID */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16 grid grid-cols-1 lg:grid-cols-12 gap-12">

        {/* CỘT TRÁI: NỘI DUNG CHÍNH (8 COLS) */}
        <div className="lg:col-span-8 space-y-12">
          <article className="bg-[#fffdf8] border border-[#d99b4a]/40 p-12 relative overflow-hidden shadow-md">
            <div className="absolute inset-0 bg-[#fcf9ee] opacity-30 pointer-events-none dong-son-pattern"></div>
            <div className="relative z-10">
              <h2 className="font-headline text-4xl text-[#6b0f0d] font-semibold mb-8 border-b border-[#d99b4a]/30 pb-4">
                Tầm quan trọng Lịch sử
              </h2>
              <div className="space-y-6 text-[#2b1a16]/80 text-[16px] leading-loose">
                <p>
                  Quần thể di tích Cố đô Huế là trung tâm chính trị, văn hóa, và tôn giáo của Việt Nam dưới sự trị vì của mười ba đời vua nhà Nguyễn (1802-1945). Được xây dựng dọc theo bờ sông Hương thơ mộng, kinh thành Huế không chỉ là một pháo đài quân sự kiên cố mà còn là một tác phẩm nghệ thuật kiến trúc kết hợp hài hòa giữa triết lý phương Đông và kỹ thuật phương Tây.
                </p>
                <p>
                  Với hệ thống thành quách gồm ba vòng thành: Kinh Thành, Hoàng Thành và Tử Cấm Thành, Huế đại diện cho đỉnh cao của quy hoạch đô thị phong kiến Việt Nam.
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 pt-8 border-t border-[#d99b4a]/20">
                <StatBox label="Khởi công" value="1804" />
                <StatBox label="Diện tích" value="520 ha" />
                <StatBox label="UNESCO" value="1993" />
              </div>
            </div>
          </article>

          {/* Niên biểu sự kiện tại địa danh */}
          <section className="pt-8">
            <h3 className="font-headline text-4xl text-[#6b0f0d] font-semibold mb-16 text-center flex items-center justify-center gap-4">
              <span className="w-12 h-px bg-[#d99b4a]/50"></span>
              Dòng thời gian Cố đô
              <span className="w-12 h-px bg-[#d99b4a]/50"></span>
            </h3>
            <div className="relative border-l-2 border-[#d99b4a]/40 ml-4 md:ml-0 md:border-l-0 md:flex md:flex-col items-center">
              {/* Đường kẻ dọc giữa desktop */}
              <div className="hidden md:block absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-[#d99b4a]/30"></div>

              <TimelineItem
                year="1802" title="Định đô Phú Xuân"
                desc="Vua Gia Long thống nhất đất nước, chọn Huế làm thủ đô."
                align="left"
              />
              <TimelineItem
                year="1833" title="Hoàn thiện Kinh thành"
                desc="Vua Minh Mạng hoàn tất hệ thống cung điện tráng lệ nhất."
                align="right"
              />
              <TimelineItem
                year="1945" title="Lễ thoái vị"
                desc="Vua Bảo Đại trao ấn kiếm, kết thúc chế độ quân chủ tại Ngọ Môn."
                align="left"
              />
            </div>
          </section>
        </div>

        {/* CỘT PHẢI: WIDGETS (4 COLS) */}
        <aside className="lg:col-span-4 space-y-10">
          {/* Map Widget */}
          <div className="bg-[#fffdf8] border border-[#d99b4a]/40 p-8 shadow-md">
            <h4 className="font-headline text-2xl text-[#6b0f0d] font-semibold mb-6">Vị trí Địa lý</h4>
            <div className="aspect-square bg-[#fcf9ee] relative overflow-hidden mb-6 border-2 border-[#d99b4a]/30 group p-1 shadow-inner">
              <div className="absolute inset-0 dong-son-pattern opacity-20 pointer-events-none"></div>
              <div className="w-full h-full flex items-center justify-center bg-[#fbf6e8] relative overflow-hidden py-4">
                {/* Bản đồ Việt Nam chuẩn xác (React Component) */}
                <div className="relative w-full max-w-[250px] aspect-square mx-auto flex items-center justify-center z-10 transition-transform duration-700 group-hover:scale-110">
                  <VietnamMap
                    className="absolute inset-0 w-full h-full drop-shadow-[0_15px_30px_rgba(107,15,13,0.4)]"
                  />
                  {/* Marker Cố Đô Huế: x=63%, y=50% */}
                  <div className="absolute z-20" style={{ left: '63%', top: '50%' }}>
                    <div className="relative flex items-center justify-center">
                      <div className="absolute w-8 h-8 bg-[#d99b4a]/40 rounded-full animate-ping"></div>
                      <div className="relative w-6 h-6 flex items-center justify-center rounded-full bg-[#6b0f0d] border-2 border-[#f7d78a] shadow-lg">
                        <span className="material-symbols-outlined text-[12px] text-[#ffe7b0]">account_balance</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 bg-[#6b0f0d] text-[#ffe7b0] px-3 py-1 font-body text-[10px] font-bold shadow-2xl border border-[#d99b4a]/40">
                16.4637° N, 107.5908° E
              </div>
            </div>
            <p className="text-[#2b1a16]/80 text-[14px] leading-relaxed border-l-2 border-[#d99b4a] pl-4">
              "Phía Bắc giáp dãy núi Bạch Mã, phía Nam nhìn ra biển Đông, Huế nằm tại yết hầu của dải đất miền Trung."
            </p>
          </div>

          {/* Associated Figures */}
          <div className="bg-[#2b0504] p-8 text-[#fcf9ee] shadow-2xl relative overflow-hidden group border border-[#d99b4a]/30">
            <div className="absolute inset-0 dong-son-pattern opacity-10 mix-blend-overlay"></div>
            <h4 className="font-headline text-2xl font-semibold mb-8 relative z-10 border-b border-[#d99b4a]/20 pb-4 text-[#f7d78a]">Nhân vật liên quan</h4>
            <div className="space-y-6 relative z-10">
              <FigureItem
                name="Vua Gia Long"
                role="Người đặt nền móng"
                img="https://lh3.googleusercontent.com/aida-public/AB6AXuBdlOxLklt8X1pglTEyM8Xyd_dikhvxAq1Bw6V45ZAuWnuYFJOOO-ZjZ05Ir_z-0a8yw4FikeCEeo5uz89-tbOHTyxtaixkVHjS-BoDoqER1gZOBffoH-fuA53uqBIzWoy3wm4b2n2sHZR7ueI7kjLcZbYtCPqKW9qxKVEHEvxzOrUQ9Nfbmq0xNi58_mr9alOOjuVYc0i2-B5UTE1M32kZBXR7YyWxXyQCTn7e2g__-Sg_nU3eEmS4G22DINL7iJYYb-wzm4gRT8-b"
              />
              <FigureItem
                name="Vua Minh Mạng"
                role="Người hoàn thiện kiến trúc"
                img="https://lh3.googleusercontent.com/aida-public/AB6AXuAYeNIgZu43O0hKS5jOprrToZEm7xJWgegZLzp66vU8YXp2CdJFNofZdjPViWKkXhRHcy7gRYqN1ZgdZl_GYKNc7ncBFwJTeT1mk9CjJIoX4O7pylN7FCqVkG-Czc5T_fLi3i6XwH5Cw9sxSx2A9Ylfiay8hnXOOki3dDn37RBWUXahbI_4DlTjYY0zfdpJbH2ffb9hWbnqKTBXBmkCHk6Vm4doolMcmMtai6SJ-KYu6SZj5bYWFlPhw1JEHtTVwgYbvk5Yta2P8DDJ"
              />
            </div>
            <button className="w-full mt-10 py-3 border border-[#d99b4a]/40 text-[#f7d78a] text-[10px] font-bold uppercase tracking-widest hover:bg-[#d99b4a]/10 hover:text-white transition-all relative z-10 bg-[#1a0201]/40">
              Xem phả hệ nhà Nguyễn
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

// Component con hỗ trợ
const StatBox = ({ label, value }) => (
  <div className="p-6 bg-[#fcf9ee] border border-[#d99b4a]/20 shadow-inner group hover:bg-[#fffdf8] transition-all text-center">
    <p className="font-body text-[9px] font-bold text-[#6b0f0d]/60 uppercase tracking-widest mb-2">{label}</p>
    <p className="font-headline text-4xl text-[#6b0f0d] font-bold">{value}</p>
  </div>
);

const TimelineItem = ({ year, title, desc, align }) => (
  <div className={`relative w-full mb-12 flex items-center justify-between ${align === 'right' ? 'md:flex-row-reverse' : ''} group`}>
    <div className={`hidden md:block w-5/12 ${align === 'left' ? 'text-right pr-16' : 'text-left pl-16'}`}>
      <span className="bg-[#6b0f0d] text-[#ffe7b0] px-4 py-1.5 font-body text-[11px] font-bold mb-4 inline-block shadow-md uppercase tracking-widest border border-[#d99b4a]/40">{year}</span>
      <h4 className="font-headline text-2xl text-[#2b0504] font-semibold mb-3">{title}</h4>
      <p className="text-[#2b1a16]/80 text-[15px] leading-relaxed">{desc}</p>
    </div>

    {/* Center dot */}
    <div className="absolute left-0 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#6b0f0d] border-4 border-[#fbf6e8] z-10 shadow-[0_0_0_2px_rgba(217,155,74,0.4)] group-hover:scale-125 transition-transform"></div>

    <div className="md:hidden ml-8 bg-[#fffdf8] p-6 border border-[#d99b4a]/30 shadow-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-[#fcf9ee] opacity-30 dong-son-pattern"></div>
      <div className="relative z-10">
        <span className="text-[#6b0f0d] font-bold font-body text-[10px] uppercase tracking-widest border-b border-[#d99b4a]/30 pb-1 mb-2 block">{year}</span>
        <h4 className="font-headline text-xl font-semibold text-[#2b0504] mb-2 mt-2">{title}</h4>
        <p className="text-[#2b1a16]/80 text-[14px] leading-relaxed">{desc}</p>
      </div>
    </div>

    <div className="hidden md:block w-5/12"></div>
  </div>
);

const FigureItem = ({ name, role, img }) => (
  <Link to="#" className="flex items-center gap-4 p-3 hover:bg-[#1a0201]/40 transition-all border border-transparent hover:border-[#d99b4a]/30 rounded-sm">
    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#d99b4a]/60 shadow-xl p-0.5 bg-[#1a0201]">
      <img src={img} className="w-full h-full object-cover rounded-full grayscale-[0.5] group-hover:grayscale-0 transition-all" alt={name} />
    </div>
    <div>
      <p className="font-headline text-xl font-semibold text-[#fcf9ee]">{name}</p>
      <p className="text-[10px] text-[#d99b4a] uppercase tracking-widest mt-1">{role}</p>
    </div>
    <span className="material-symbols-outlined ml-auto text-[#d99b4a] opacity-0 group-hover:opacity-100 transition-opacity text-sm">east</span>
  </Link>
);

export default LocationDetail;