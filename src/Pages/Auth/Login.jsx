import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import Logo from '../../Components/Common/Logo';
import AuthFooter from '../../Components/Auth/AuthFooter';
import { adminLoginApi } from '../../services/allApi';
import { showAlert } from '../../Utils/alert';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      showAlert('Required', 'Please fill in all fields', 'info');
      return;
    }

    setLoading(true);
    try {
      const response = await adminLoginApi({ email, password });
      
      if (response.status === 200) {
        const { accessToken, user, role } = response.data;

        // Check if the user has an admin role
        if (role === 'admin') {
          // Save to localStorage
          localStorage.setItem('medhealthinvestadmin', JSON.stringify({
            accessToken,
            user,
            role
          }));

          navigate('/dashboard');
        } else {
          showAlert('Access Denied', 'You do not have administrative privileges.', 'error');
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      showAlert('Error', message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex flex-col items-center h-screen w-full overflow-hidden select-none px-4"
      style={{ backgroundColor: '#080808' }}
    >
      {/* Global Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Background Glows */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom right, rgba(204,255,0,0.07), transparent 60%)' }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(34,197,94,0.06), transparent 55%)' }}
      />

      {/* Top-left Logo Header */}
      <div className="absolute top-0 left-0 w-full flex justify-start items-center h-[90px] px-6 sm:px-10 z-20">
        <Logo size="lg" />
      </div>
  
      <div className="flex-1 flex flex-col items-center justify-center w-full py-8 relative z-[2]">
        {/* Admin Login label above the card */}
        <div className="mb-4 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <span className="text-[0.65rem] font-black text-[#ccff00] tracking-[0.4em] uppercase opacity-60">
            Administrative Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-2">Admin Login</h1>
        </div>

        {/* Login Card */}
        <div
          className="w-full max-w-[420px] mx-auto px-8 sm:px-10 py-10 rounded-3xl"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          <h2 className="text-[1.6rem] sm:text-[1.8rem] font-bold text-white mb-2">Welcome Back</h2>
         

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-[0.65rem] font-bold text-gray-400 tracking-[0.2em] uppercase">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3.5 border-b border-gray-800 text-white text-[0.95rem] outline-none transition-all focus:border-[#ccff00] bg-transparent placeholder:text-gray-700"
                placeholder="admin@gmail.com"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-[0.65rem] font-bold text-gray-400 tracking-[0.2em] uppercase">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3.5 border-b border-gray-800 text-white text-[0.95rem] outline-none transition-all focus:border-[#ccff00] bg-transparent placeholder:text-gray-700"
                placeholder="admin1234"
              />
            </div>

         

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full p-4.5 mt-4 bg-[#ccff00] text-black rounded-xl font-black text-[0.85rem]
                         flex items-center justify-center gap-3 transition-all duration-300
                         ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#b3e600] hover:scale-[1.02] active:scale-[0.98]'}
                         tracking-[0.15em] uppercase group shadow-[0_0_20px_rgba(204,255,0,0.15)]`}
            >
              {loading ? 'Processing...' : 'Continue'}
              {!loading && <HiOutlineArrowNarrowRight className="text-xl transition-transform group-hover:translate-x-1" />}
            </button>

            {/* Contact Support instead of Register */}
            <div className="text-center text-[0.6rem] text-gray-600 tracking-widest pt-4 font-bold uppercase">
              Need assistance?{' '}
              <a href="mailto:support@medhealth.invest" className="text-gray-400 hover:text-[#ccff00] transition-colors">
                Contact Support
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Auth Footer */}
      <AuthFooter />

    </div>
  );
};

export default Login;
