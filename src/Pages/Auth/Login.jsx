import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineArrowNarrowRight, HiOutlineArrowNarrowLeft, HiOutlineShieldCheck, HiOutlineKey, HiOutlineLockClosed } from 'react-icons/hi';
import { FiEye, FiEyeOff, FiLoader } from 'react-icons/fi';
import Logo from '../../Components/Common/Logo';
import AuthFooter from '../../Components/Auth/AuthFooter';
import { 
  adminLoginApi, 
  verifyAdminLoginOtpApi, 
  resendAdminOtpApi,
  adminForgotPasswordApi,
  adminResetPasswordApi
} from '../../services/allApi';
import { showAlert } from '../../Utils/alert';
import { getErrorMessage, getErrorTitle } from '../../Utils/getErrorMessage';

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp' | 'forgot-password' | 'reset-password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Forgot / Reset Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingForgotCode, setIsSendingForgotCode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // OTP State
  const [tempToken, setTempToken] = useState('');
  const [mobileEnding, setMobileEnding] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(0);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const otpRefs = useRef([]);

  // Countdown timer effect
  useEffect(() => {
    let timer;
    if ((step === 'otp' || step === 'reset-password') && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, otpTimer]);

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
        if (response.data.requiresOtp) {
          setTempToken(response.data.tempToken);
          setMobileEnding(response.data.mobileEnding || '****');
          setOtp(['', '', '', '']);
          setOtpTimer(60);
          setStep('otp');
          setTimeout(() => otpRefs.current[0]?.focus(), 150);
          return;
        }

        // Fallback for direct login (if requiresOtp is false)
        const { accessToken, user, role } = response.data;
        if (role === 'admin') {
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
      const message = getErrorMessage(error, 'Login failed. Please check your credentials.');
      showAlert(getErrorTitle(error), message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    if (!cleanVal && value !== '') return;
    const newOtp = [...otp];
    newOtp[index] = cleanVal.substring(cleanVal.length - 1);
    setOtp(newOtp);

    if (cleanVal && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim().replace(/\D/g, '').slice(0, 4);
    if (!pastedData) return;
    const newOtp = ['', '', '', ''];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    const focusIndex = Math.min(pastedData.length, 3);
    otpRefs.current[focusIndex]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 4) {
      showAlert('Required', 'Please enter the complete 4-digit verification code.', 'info');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const response = await verifyAdminLoginOtpApi({
        tempToken,
        otp: fullOtp
      });

      if (response.status === 200) {
        const { accessToken, user, role } = response.data;
        if (role === 'admin') {
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
      console.error("OTP Verification error:", error);
      const message = getErrorMessage(error, 'Verification failed. Please check the code.');
      showAlert(getErrorTitle(error), message, 'error');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResendingOtp || !tempToken) return;
    setIsResendingOtp(true);
    try {
      const response = await resendAdminOtpApi({ tempToken });
      if (response.status === 200) {
        setTempToken(response.data.tempToken);
        setOtp(['', '', '', '']);
        setOtpTimer(60);
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
        showAlert('Code Sent', 'A new verification code has been dispatched to your mobile number.', 'success');
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      const message = getErrorMessage(error, 'Could not resend OTP. Please try again.');
      showAlert(getErrorTitle(error), message, 'error');
    } finally {
      setIsResendingOtp(false);
    }
  };

  // ── Forgot Password Request Handler ──────────────────────────────────
  const handleSendForgotCode = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      showAlert('Required', 'Please enter your administrative email address.', 'info');
      return;
    }

    setIsSendingForgotCode(true);
    try {
      const res = await adminForgotPasswordApi({ email: forgotEmail });
      if (res.status === 200) {
        setTempToken(res.data.tempToken);
        setMobileEnding(res.data.mobileEnding || '****');
        setOtp(['', '', '', '']);
        setOtpTimer(60);
        setNewPassword('');
        setConfirmPassword('');
        setStep('reset-password');
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
        showAlert('Code Dispatched', 'A 4-digit verification code has been dispatched to your email and mobile.', 'success');
      }
    } catch (error) {
      console.error("Forgot password request error:", error);
      const message = getErrorMessage(error, 'Could not initiate password reset. Please check your email.');
      showAlert(getErrorTitle(error), message, 'error');
    } finally {
      setIsSendingForgotCode(false);
    }
  };

  // ── Reset Password Submission Handler ────────────────────────────────
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otp.join('');
    if (fullOtp.length < 4) {
      showAlert('Required', 'Please enter the 4-digit verification code.', 'info');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      showAlert('Password Length', 'Your new password must be at least 6 characters long.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showAlert('Mismatch', 'New password and confirmation password do not match.', 'warning');
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await adminResetPasswordApi({
        tempToken,
        otp: fullOtp,
        newPassword
      });

      if (res.status === 200) {
        showAlert('Password Reset', 'Your admin password has been reset successfully. Please log in with your new credentials.', 'success');
        setEmail(forgotEmail);
        setPassword('');
        setStep('credentials');
        setOtp(['', '', '', '']);
        setTempToken('');
      }
    } catch (error) {
      console.error("Reset password error:", error);
      const message = getErrorMessage(error, 'Failed to reset password. Please check the code.');
      showAlert(getErrorTitle(error), message, 'error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleBackToCredentials = () => {
    setStep('credentials');
    setOtp(['', '', '', '']);
    setTempToken('');
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
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
          <span className="text-[0.65rem] font-black text-[#ccff00] tracking-[0.4em] uppercase opacity-70 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ccff00] animate-pulse"></span>
            Administrative Portal
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white mt-2 tracking-tight">
            {step === 'credentials' || step === 'otp' ? 'Admin Login' : 'Password Recovery'}
          </h1>
        </div>

        {/* Card Container */}
        <div
          className="w-full max-w-[440px] mx-auto px-8 sm:px-10 py-10 rounded-3xl transition-all duration-300"
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 20px 80px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >
          {/* ── STEP 1: CREDENTIALS ──────────────────────────────────── */}
          {step === 'credentials' && (
            <div className="animate-in fade-in duration-300">
              <h2 className="text-[1.6rem] sm:text-[1.8rem] font-bold text-white mb-1">Welcome Back</h2>
              <p className="text-gray-400 text-xs mb-6 font-medium">Sign in to manage projects, allocations, and compliance.</p>

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
                    placeholder="Enter your email"
                    autoComplete="username"
                    required
                  />
                </div>

                {/* Password with Eye Toggle */}
                <div className="space-y-2 relative">
                  <label htmlFor="password" className="block text-[0.65rem] font-bold text-gray-400 tracking-[0.2em] uppercase">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full py-3.5 pr-10 border-b border-gray-800 text-white text-[0.95rem] outline-none transition-all focus:border-[#ccff00] bg-transparent placeholder:text-gray-700"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-2 focus:outline-none"
                    >
                      {showPassword ? <FiEyeOff className="text-lg" /> : <FiEye className="text-lg" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email || '');
                      setStep('forgot-password');
                    }}
                    className="text-[0.7rem] font-bold text-gray-400 hover:text-[#ccff00] transition-colors focus:outline-none tracking-wider uppercase cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full p-4.5 mt-2 bg-[#ccff00] text-black rounded-xl font-black text-[0.85rem]
                         flex items-center justify-center gap-3 transition-all duration-300
                         ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#b3e600] hover:scale-[1.02] active:scale-[0.98] cursor-pointer'}
                         tracking-[0.15em] uppercase group shadow-[0_0_20px_rgba(204,255,0,0.15)]`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <FiLoader className="animate-spin text-base" />
                      <span>Verifying Credentials...</span>
                    </div>
                  ) : (
                    <>
                      <span>Continue</span>
                      <HiOutlineArrowNarrowRight className="text-xl transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                {/* Footer note */}
                <div className="text-center text-[0.6rem] text-gray-600 tracking-widest pt-2 font-bold uppercase">
                  Need assistance?{' '}
                  <a href="mailto:support@medhealth.invest" className="text-gray-400 hover:text-[#ccff00] transition-colors">
                    Contact Support
                  </a>
                </div>
              </form>
            </div>
          )}

          {/* ── STEP 2: 2FA LOGIN OTP ─────────────────────────────────── */}
          {step === 'otp' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold font-mono uppercase tracking-widest bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] flex items-center gap-1">
                  <HiOutlineShieldCheck className="text-sm" /> 2FA Security
                </span>
              </div>
              <h2 className="text-[1.6rem] sm:text-[1.8rem] font-bold text-white mb-1 tracking-tight">Verify Identity</h2>
              <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                Enter the 4-digit verification code sent to your registered mobile ending in{' '}
                <strong className="text-white font-mono font-bold tracking-wider">**{mobileEnding}</strong>.
              </p>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* 4-Digit OTP Boxes */}
                <div className="flex items-center justify-center gap-3 my-4">
                  {otp.map((digit, idx) => (
                    <div key={idx} className="relative">
                      <input
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className={`w-14 h-16 sm:w-16 sm:h-18 text-center text-2xl sm:text-3xl font-black rounded-2xl border transition-all duration-200 outline-none select-none ${digit
                            ? 'border-[#ccff00] bg-[#ccff00]/10 text-white shadow-[0_0_20px_rgba(204,255,0,0.15)] ring-1 ring-[#ccff00]'
                            : 'border-white/10 bg-white/[0.03] text-white hover:border-white/20 focus:border-[#ccff00] focus:ring-4 focus:ring-[#ccff00]/10'
                          }`}
                        required
                      />
                      {!digit && (
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-700 text-base font-light select-none">
                          —
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Countdown Timer / Resend */}
                <div className="text-center pt-1">
                  {otpTimer > 0 ? (
                    <span className="text-[12px] text-gray-400 font-medium">
                      Code expires in{' '}
                      <span className="font-mono text-[#ccff00] font-bold tabular-nums ml-1">
                        {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                      </span>
                    </span>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-[12px]">
                      <span className="text-gray-500">Code expired.</span>
                      <button
                        type="button"
                        disabled={isResendingOtp}
                        onClick={handleResendOtp}
                        className="text-[#ccff00] font-bold hover:underline transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isResendingOtp ? 'Sending new code...' : 'Request a new code'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className={`w-full p-4.5 mt-6 bg-[#ccff00] text-black rounded-xl font-black text-[0.85rem]
                           flex items-center justify-center gap-3 transition-all duration-300
                           ${isVerifyingOtp ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#b3e600] hover:scale-[1.02] active:scale-[0.98] cursor-pointer'}
                           tracking-[0.15em] uppercase group shadow-[0_0_20px_rgba(204,255,0,0.15)]`}
                >
                  {isVerifyingOtp ? (
                    <div className="flex items-center gap-2">
                      <FiLoader className="animate-spin text-base" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <>
                      <span>Authenticate & Enter</span>
                      <HiOutlineArrowNarrowRight className="text-xl transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                {/* Back to credentials */}
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="text-gray-500 hover:text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                  >
                    <HiOutlineArrowNarrowLeft className="text-base" />
                    <span>Back to credentials</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── STEP 3: FORGOT PASSWORD (REQUEST CODE) ───────────────── */}
          {step === 'forgot-password' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold font-mono uppercase tracking-widest bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] flex items-center gap-1">
                  <HiOutlineKey className="text-sm" /> Password Reset
                </span>
              </div>
              <h2 className="text-[1.6rem] sm:text-[1.8rem] font-bold text-white mb-1 tracking-tight">Reset Password</h2>
              <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                Enter your administrative email to receive a 4-digit verification code to reset your password.
              </p>

              <form onSubmit={handleSendForgotCode} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="forgotEmail" className="block text-[0.65rem] font-bold text-gray-400 tracking-[0.2em] uppercase">
                    Admin Email Address
                  </label>
                  <input
                    type="email"
                    id="forgotEmail"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full py-3.5 border-b border-gray-800 text-white text-[0.95rem] outline-none transition-all focus:border-[#ccff00] bg-transparent placeholder:text-gray-700"
                    placeholder="Enter your email"
                    autoFocus
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingForgotCode}
                  className={`w-full p-4.5 mt-4 bg-[#ccff00] text-black rounded-xl font-black text-[0.85rem]
                           flex items-center justify-center gap-3 transition-all duration-300
                           ${isSendingForgotCode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#b3e600] hover:scale-[1.02] active:scale-[0.98] cursor-pointer'}
                           tracking-[0.15em] uppercase group shadow-[0_0_20px_rgba(204,255,0,0.15)]`}
                >
                  {isSendingForgotCode ? (
                    <div className="flex items-center gap-2">
                      <FiLoader className="animate-spin text-base" />
                      <span>Sending Code...</span>
                    </div>
                  ) : (
                    <>
                      <span>Send Verification Code</span>
                      <HiOutlineArrowNarrowRight className="text-xl transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="text-gray-500 hover:text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                  >
                    <HiOutlineArrowNarrowLeft className="text-base" />
                    <span>Back to Login</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ── STEP 4: RESET PASSWORD (ENTER OTP & NEW PASSWORD) ──────── */}
          {step === 'reset-password' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded text-[0.65rem] font-bold font-mono uppercase tracking-widest bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] flex items-center gap-1">
                  <HiOutlineLockClosed className="text-sm" /> Set New Password
                </span>
              </div>
              <h2 className="text-[1.6rem] sm:text-[1.8rem] font-bold text-white mb-1 tracking-tight">Update Credentials</h2>
              <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                Enter the code sent to <strong className="text-white">{forgotEmail}</strong> and your phone (**{mobileEnding}).
              </p>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {/* 4-Digit OTP Boxes */}
                <div className="flex items-center justify-center gap-2.5 my-2">
                  {otp.map((digit, idx) => (
                    <div key={idx} className="relative">
                      <input
                        ref={(el) => (otpRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-xl sm:text-2xl font-black rounded-xl border transition-all duration-200 outline-none select-none ${digit
                            ? 'border-[#ccff00] bg-[#ccff00]/10 text-white ring-1 ring-[#ccff00]'
                            : 'border-white/10 bg-white/[0.03] text-white hover:border-white/20 focus:border-[#ccff00]'
                          }`}
                        required
                      />
                      {!digit && (
                        <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-gray-700 text-sm select-none">
                          —
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Resend Timer */}
                <div className="text-center text-[11px] text-gray-500 pb-1">
                  {otpTimer > 0 ? (
                    <span>Resend code in <span className="text-[#ccff00] font-mono font-bold">{otpTimer}s</span></span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendForgotCode}
                      className="text-[#ccff00] font-bold hover:underline cursor-pointer"
                    >
                      Resend Code
                    </button>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-1.5 relative">
                  <label className="block text-[0.65rem] font-bold text-gray-400 tracking-[0.2em] uppercase">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full py-2.5 pr-10 border-b border-gray-800 text-white text-[0.9rem] outline-none transition-all focus:border-[#ccff00] bg-transparent placeholder:text-gray-700"
                      placeholder="Minimum 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-2"
                    >
                      {showNewPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 relative">
                  <label className="block text-[0.65rem] font-bold text-gray-400 tracking-[0.2em] uppercase">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full py-2.5 pr-10 border-b border-gray-800 text-white text-[0.9rem] outline-none transition-all focus:border-[#ccff00] bg-transparent placeholder:text-gray-700"
                      placeholder="Repeat new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-2"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className={`w-full p-4 mt-4 bg-[#ccff00] text-black rounded-xl font-black text-[0.85rem]
                           flex items-center justify-center gap-3 transition-all duration-300
                           ${isResettingPassword ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#b3e600] hover:scale-[1.02] active:scale-[0.98] cursor-pointer'}
                           tracking-[0.15em] uppercase group shadow-[0_0_20px_rgba(204,255,0,0.15)]`}
                >
                  {isResettingPassword ? (
                    <div className="flex items-center gap-2">
                      <FiLoader className="animate-spin text-base" />
                      <span>Updating Password...</span>
                    </div>
                  ) : (
                    <>
                      <span>Reset Password</span>
                      <HiOutlineArrowNarrowRight className="text-xl transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleBackToCredentials}
                    className="text-gray-500 hover:text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                  >
                    <HiOutlineArrowNarrowLeft className="text-base" />
                    <span>Back to Login</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Auth Footer */}
      <AuthFooter />
    </div>
  );
};

export default Login;
