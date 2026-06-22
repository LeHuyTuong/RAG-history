import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp!");
      return;
    }
    setError("");
    setLoading(true);

    try {
      await apiClient.post('/api/v1/auth/register', { name, email, password });
      
      // Auto login after register
      const loginRes = await apiClient.post('/api/v1/auth/login', { email, password });
      const { accessToken } = loginRes.data?.data || loginRes.data;
      localStorage.setItem("accessToken", accessToken);

      const meRes = await apiClient.get('/api/v1/auth/me');
      const user = meRes.data?.data || meRes.data;
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === 'ROLE_ADMIN') {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      if (err.response?.data?.details) {
        setError(err.response.data.details.join(", "));
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.");
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
      <div className="relative z-10 w-full max-w-[500px]">
        <div className="bg-[#fff7df]/95 backdrop-blur-sm border border-[#d9c7a7] p-8 md:p-10 shadow-2xl rounded-sm">


          <div className="text-center mb-6">
            <h2 className="font-headline text-2xl text-[#2b1a16] font-bold">
              Tạo tài khoản Sử Việt
            </h2>
            <p className="font-body text-sm text-[#2b1a16]/80 mt-2 px-4">
              Tham gia không gian lưu trữ và khám phá di sản Việt Nam
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleRegister}>
            <div className="space-y-1.5">
              <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-wider font-bold">
                Họ và tên
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2b1a16]/40 group-focus-within:text-[#6b0000] transition-colors text-[20px]">
                  person
                </span>
                <input
                  type="text"
                  placeholder="Nhập họ và tên"
                  className="w-full bg-white/90 border border-[#d9c7a7] focus:border-[#6b0000] py-3 pl-12 pr-4 text-sm outline-none font-body transition-colors text-[#2b1a16]"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-wider font-bold">
                Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2b1a16]/40 group-focus-within:text-[#6b0000] transition-colors text-[20px]">
                  email
                </span>
                <input
                  type="email"
                  placeholder="Nhập địa chỉ email"
                  className="w-full bg-white/90 border border-[#d9c7a7] focus:border-[#6b0000] py-3 pl-12 pr-4 text-sm outline-none font-body transition-colors text-[#2b1a16]"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>





            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-wider font-bold">
                  Mật khẩu
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2b1a16]/40 group-focus-within:text-[#6b0000] transition-colors text-[20px]">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/90 border border-[#d9c7a7] focus:border-[#6b0000] py-3 pl-12 pr-10 text-sm outline-none font-body transition-colors text-[#2b1a16]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2b1a16]/40 hover:text-[#6b0000] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-body text-[11px] text-[#2b1a16] uppercase tracking-wider font-bold">
                  Xác nhận mật khẩu
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#2b1a16]/40 group-focus-within:text-[#6b0000] transition-colors text-[20px]">
                    lock
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/90 border border-[#d9c7a7] focus:border-[#6b0000] py-3 pl-12 pr-10 text-sm outline-none font-body transition-colors text-[#2b1a16]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2b1a16]/40 hover:text-[#6b0000] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showConfirmPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-[#6b0000] text-sm font-bold font-body bg-[#6b0000]/10 p-2 rounded text-center border border-[#6b0000]/20">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#6b0000] text-[#fff7df] h-[52px] font-body font-bold uppercase tracking-wide text-sm hover:bg-[#8b1512] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <span>{loading ? "Đang xử lý..." : "Tạo tài khoản"}</span>
                {!loading && (
                  <span className="material-symbols-outlined text-[20px]">
                    person_add
                  </span>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-[#d9c7a7]/60 text-center">
            <p className="text-sm text-[#2b1a16]/80 font-body">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="text-[#6b0000] font-bold underline decoration-[#6b0000]/30 underline-offset-4 hover:decoration-[#6b0000] transition-colors"
              >
                Đăng nhập tại đây
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;