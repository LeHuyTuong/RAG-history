import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    const role = username.toLowerCase().includes('admin') ? 'admin' : 'user';
    localStorage.setItem('user', JSON.stringify({ username: username || 'Khách', role }));
    
    if (role === 'admin') {
      navigate("/admin");
    } else {
      navigate("/"); // Navigate to user layout/home
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#2b0504] px-4 py-10 flex items-center justify-center">
      {/* Background giống Home */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/home.png"
          alt="Nền lịch sử"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#210302]/90 via-[#2b0504]/65 to-[#f8e2a0]/20" />
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Form */}
      <div className="relative z-10 w-full max-w-[480px]">
        <div className="bg-[#fff7df]/95 backdrop-blur-sm border border-[#d9c7a7] p-8 md:p-12 shadow-2xl rounded-sm">


          <div className="text-center mb-8">
            <h2 className="font-headline text-3xl text-[#2b1a16] font-bold">
              Đăng nhập Hệ thống
            </h2>
            <p className="font-body text-sm text-[#2b1a16]/80 mt-2 px-2">
              Truy cập dữ liệu và không gian nghiên cứu cá nhân
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-wider font-bold">
                Tên đăng nhập
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2b1a16]/40 group-focus-within:text-[#6b0000] transition-colors">
                  person
                </span>
                <input
                  type="text"
                  placeholder="Nhập tên đăng nhập (có chữ 'admin' để test Admin)"
                  className="w-full bg-white/90 border border-[#d9c7a7] focus:border-[#6b0000] py-3.5 pl-12 pr-4 text-sm outline-none font-body transition-colors text-[#2b1a16]"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-wider font-bold">
                Mật khẩu
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2b1a16]/40 group-focus-within:text-[#6b0000] transition-colors">
                  lock
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full bg-white/90 border border-[#d9c7a7] focus:border-[#6b0000] py-3.5 pl-12 pr-12 text-sm outline-none font-body transition-colors text-[#2b1a16]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#2b1a16]/40 hover:text-[#6b0000] transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#6b0000] text-[#fff7df] h-[52px] font-body font-bold uppercase tracking-wide text-sm hover:bg-[#8b1512] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Tiến bước</span>
                <span className="material-symbols-outlined text-[20px]">
                  login
                </span>
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-[#d9c7a7]/60 text-center">
            <p className="text-sm text-[#2b1a16]/80 font-body">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-[#6b0000] font-bold underline decoration-[#6b0000]/30 underline-offset-4 hover:decoration-[#6b0000] transition-colors"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;