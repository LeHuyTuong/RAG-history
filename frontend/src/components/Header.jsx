import { NavLink } from "react-router-dom";

const Header = () => {
    const menuItems = [
        "Trang Chủ",
        "Bài Viết",
        "Thời Kỳ",
        "Sự Kiện",
        "Nhân Vật",
        "Di tích",

    ];

    return (
        <header className="sticky top-0 z-50 h-20 bg-[#2b0504]/95 backdrop-blur-md border-b border-[#d99b4a]/30 shadow-md">
            <div className="h-full w-full px-6 lg:px-14 xl:px-20 relative">
                {/* Decorative border line at the bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#d99b4a]/50 to-transparent"></div>
                
                <nav className="h-full flex items-center justify-between gap-8 relative z-10">
                    {/* Logo */}
                    <NavLink
                        to="/"
                        className="shrink-0 font-headline text-4xl lg:text-5xl font-bold text-[#f7d78a] tracking-wider hover:opacity-80 transition drop-shadow-md flex items-center gap-3"
                    >
                        <span className="material-symbols-outlined text-[32px] lg:text-[40px] text-[#8b1512]">account_balance</span>
                        Sử Việt
                    </NavLink>

                    {/* Menu */}
                    <div className="hidden lg:flex flex-1 items-center justify-center gap-8 xl:gap-10">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item}
                                to={
                                    item === "Thời Kỳ" ? "/periods" :
                                    item === "Nhân Vật" ? "/characters" :
                                    item === "Di tích" ? "/locations" :
                                    item === "Bài Viết" ? "/posts" :
                                    item === "Sự Kiện" ? "/events" : "/"
                                }
                                className={({ isActive }) => `
                                    relative font-headline text-sm xl:text-base uppercase tracking-[0.15em] font-bold transition-colors
                                    ${isActive ? 'text-[#f7d78a]' : 'text-[#d9c7a7]/70 hover:text-[#f7d78a]'}
                                    after:absolute after:left-1/2 after:-bottom-3 after:h-[2px] after:bg-[#d99b4a] after:transition-all after:-translate-x-1/2
                                    ${isActive ? 'after:w-full' : 'after:w-0 hover:after:w-1/2'}
                                `}
                            >
                                {item}
                            </NavLink>
                        ))}
                    </div>

                    {/* Auth */}
                    <div className="shrink-0 flex items-center gap-4">
                        <NavLink to="/login" className="h-10 px-6 flex items-center justify-center rounded-sm bg-transparent text-[#f7d78a] font-body font-bold text-[11px] uppercase tracking-widest hover:bg-[#4a0a08]/50 transition border border-transparent hover:border-[#d99b4a]/30">
                            Đăng nhập
                        </NavLink>

                        <NavLink to="/register" className="h-10 px-6 flex items-center justify-center rounded-sm border border-[#d99b4a]/50 bg-[#6b0f0d] text-[#ffe7b0] font-body font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-[#8b1512] transition active:scale-95">
                            Đăng ký
                        </NavLink>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Header;