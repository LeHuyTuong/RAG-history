const Footer = () => {
  return (
    <footer className="bg-[#1a0201] border-t border-[#d99b4a]/20 mt-auto relative overflow-hidden">
      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#d99b4a]/50 to-transparent"></div>

      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 lg:px-14 xl:px-20 py-12 max-w-[1440px] mx-auto space-y-6 md:space-y-0 relative z-10">
        <div className="flex flex-col items-center md:items-start text-center md:text-left">
          <span className="font-headline text-3xl md:text-4xl font-bold text-[#f7d78a] tracking-wider drop-shadow-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-[#8b1512]">account_balance</span>
            Sử Việt
          </span>
          <p className="font-body text-xs md:text-sm text-[#d9c7a7]/70 mt-3 tracking-wide">
            © 2024 Sử Việt - Bảo tồn Di sản Văn hóa Việt Nam
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-6 md:gap-10">
          {[
            "Về chúng tôi",
            "Điều khoản",
            "Chính sách bảo mật",
            "Liên hệ"
          ].map((item, index) => (
            <a
              key={index}
              className="text-[#d9c7a7]/80 font-body text-[11px] md:text-xs uppercase tracking-[0.15em] font-bold hover:text-[#f7d78a] transition-colors duration-300 relative after:absolute after:-bottom-1.5 after:left-1/2 after:-translate-x-1/2 after:w-0 after:h-[1px] after:bg-[#d99b4a] hover:after:w-full after:transition-all"
              href="#"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
