import React from 'react';
import Logo from '../Common/Logo';

const AuthFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto py-8 w-full">
      <div className="max-w-[420px] mx-auto flex flex-col items-center gap-6 px-4">
        {/* Logo Section */}
        <Logo size="sm" className="opacity-50 hover:opacity-100 transition-opacity" />
        
        {/* Links & Copyright */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-6 text-[0.65rem] font-bold text-gray-600 tracking-widest uppercase">
            <a href="#privacy" className="hover:text-[#ccff00] transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-[#ccff00] transition-colors">Terms of Service</a>
            <a href="#support" className="hover:text-[#ccff00] transition-colors">Support</a>
          </div>
          
          <p className="text-[0.6rem] text-gray-700 font-medium tracking-wider uppercase">
            © {currentYear} Med Health Invest. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default AuthFooter;
