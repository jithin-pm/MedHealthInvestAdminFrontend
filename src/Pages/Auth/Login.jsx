import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowNarrowRight } from 'react-icons/hi';
import LogoWhite from '../../assets/MHI-LOGO-WHITE.png';

const Login = () => {
  const navigate = useNavigate();
  
  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden select-none px-4 py-10"
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

      {/* Lime accent glow — bottom right */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom right, rgba(204,255,0,0.07), transparent 60%)' }}
      />

      {/* Green accent glow — top left */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top left, rgba(34,197,94,0.06), transparent 55%)' }}
      />

      {/* Top-left Logo */}
      <div className="absolute top-6 left-6 sm:top-8 sm:left-8 z-[10] flex items-center gap-3">
        <img src={LogoWhite} alt="Med Health Invest" className="w-[40px] sm:w-[46px]" />
        <div className="flex flex-col leading-none">
          <span className="text-[0.9rem] sm:text-[1rem] font-semibold text-white">MED HEALTH</span>
          <span className="text-[0.9rem] sm:text-[1rem] font-medium text-[#ccff00] -mt-0.5">INVEST</span>
        </div>
      </div>
  
      {/* Admin Login label above the card */}
      <div className="relative z-[2] flex flex-col items-center justify-center mb-4">
{/*         <span className="text-[0.65rem] font-bold text-[#ccff00] tracking-[0.25em]">Med Health Invest</span> */}
        <h1 className="text-[1.8rem] sm:text-[2rem] font-bold text-white">Admin Login</h1>
      </div>

      {/* Login Card */}
      <div
        className="relative z-[2] w-full max-w-[420px] mx-auto px-8 sm:px-10 py-10 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <h2 className="text-[1.8rem] sm:text-[2.2rem] font-bold text-white mb-2">Welcome.</h2>
        <p className="text-gray-500 text-sm sm:text-base mb-8 leading-relaxed font-light">
          Sign in to monitor your yields and manage your institutional-grade portfolio.
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-[0.65rem] font-bold text-gray-500 tracking-[0.15em]">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              id="email"
              className="w-full py-3 border-b border-gray-700 text-white text-[0.95rem] outline-none transition-all focus:border-[#ccff00] bg-transparent placeholder:text-gray-600"
              placeholder="Enter your email"
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label htmlFor="password" className="block text-[0.65rem] font-bold text-gray-500 tracking-[0.15em]">
              PASSWORD
            </label>
            <input
              type="password"
              id="password"
              className="w-full py-3 border-b border-gray-700 text-white text-[0.95rem] outline-none transition-all focus:border-[#ccff00] bg-transparent placeholder:text-gray-600"
              placeholder="••••••••"
            />
          </div>

          {/* Forgot */}
          <div className="flex justify-end !mt-1">
            <a href="#forgot" className="text-[0.65rem] font-bold text-gray-500 hover:text-[#ccff00] transition-colors tracking-wider">
              FORGOT PASSWORD?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full p-4 mt-2 bg-[#ccff00] text-black rounded font-bold text-[0.85rem]
                       flex items-center justify-center gap-3 transition-all
                       hover:bg-[#d4ff33] hover:-translate-y-1 active:translate-y-0 tracking-[0.1em] group"
          >
            CONTINUE <HiOutlineArrowNarrowRight className="transition-transform group-hover:translate-x-1" />
          </button>

          {/* Create Account */}
          <div className="text-center text-[0.75rem] text-gray-600 tracking-wider pt-1">
            NEW INVESTOR?{' '}
            <a href="#create" className="text-[#ccff00] font-extrabold ml-1 hover:underline">
              CREATE ACCOUNT
            </a>
          </div>
        </form>
      </div>

    </div>
  );
};

export default Login;
