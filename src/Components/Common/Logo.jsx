import React from 'react';
import LogoWhite from '../../assets/MHI-LOGO-WHITE.png';

const Logo = ({ className = "", size = "md", showText = true }) => {
  const sizes = {
    xs: { img: "w-[24px]", primary: "text-[0.6rem]", secondary: "text-[0.6rem]" },
    sm: { img: "w-[32px]", primary: "text-[0.7rem]", secondary: "text-[0.7rem]" },
    md: { img: "w-[38px]", primary: "text-[0.8rem]", secondary: "text-[0.8rem]" },
    lg: { img: "w-[46px]", primary: "text-[1rem]", secondary: "text-[1rem]" },
    sidebar: { img: "w-[43px]", primary: "text-[15px]", secondary: "text-[15px]" },
    mobile: { img: "w-[32px]", primary: "text-[0.7rem]", secondary: "text-[0.7rem]" },
  };

  const currentSize = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src={LogoWhite} 
        alt="Med Health Invest" 
        className={`${currentSize.img} transition-transform duration-300 hover:scale-105`} 
      />
      {showText && (
        <div className="flex flex-col leading-none">
          <span className={`${currentSize.primary} font-semibold text-white  uppercase`}>
            Med Health
          </span>
          <span className={`${currentSize.secondary} font-semibold text-[#ccff00] uppercase`}>
            Invest
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
