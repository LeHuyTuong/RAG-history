import { apiClient } from '../../services';
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState(location.state?.message || "");

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const res = await apiClient.get('/api/v1/auth/me');
          const user = res.data?.data || res.data;
          localStorage.setItem("user", JSON.stringify(user));
          if (user.role === 'ROLE_ADMIN') navigate('/admin');
          else navigate('/');
        } catch (err) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loginRes = await apiClient.post('/api/v1/auth/login', { email, password });
      const { accessToken } = loginRes.data?.data || loginRes.data;

      localStorage.setItem("accessToken", accessToken);

      const meRes = await apiClient.get('/api/v1/auth/me');
      const user = meRes.data?.data || meRes.data;
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === 'ROLE_ADMIN') {
        window.location.href = "/admin";
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Email hoặc mật khẩu không chính xác.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Có lỗi xảy ra, vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#2b0504] px-4 py-10 flex items-center justify-center">
      {/* Nút Back to Home */}
      <Link
        to="/"
        className="absolute top-6 left-6 md:top-10 md:left-10 z-50 flex items-center gap-2 text-[#fff7df]/80 hover:text-[#f7d78a] hover:-translate-x-1 transition-all group"
      >
        <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        <span className="font-body font-bold text-[13px] uppercase tracking-widest hidden md:block">Về trang chủ</span>
      </Link>
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

          {successMessage && (
            <div className="mb-4 text-[#155724] text-sm font-bold font-body bg-[#d4edda] p-3 rounded text-center border border-[#c3e6cb]">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-4 text-[#6b0000] text-sm font-bold font-body bg-[#6b0000]/10 p-3 rounded text-center border border-[#6b0000]/20">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-wider font-bold">
                Email đăng nhập
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2b1a16]/40 group-focus-within:text-[#6b0000] transition-colors">
                  email
                </span>
                <input
                  type="email"
                  placeholder="Nhập email của bạn"
                  className="w-full bg-white/90 border border-[#d9c7a7] focus:border-[#6b0000] py-3.5 pl-12 pr-4 text-sm outline-none font-body transition-colors text-[#2b1a16]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                disabled={loading}
                className="w-full bg-[#6b0000] text-[#fff7df] h-[52px] font-body font-bold uppercase tracking-wide text-sm hover:bg-[#8b1512] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{loading ? "Đang xử lý..." : "Tiến bước"}</span>
                {!loading && (
                  <span className="material-symbols-outlined text-[20px]">
                    login
                  </span>
                )}
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