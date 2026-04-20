import React, { useState } from 'react';

const CompletedProjects = () => {
  const [isExclusive, setIsExclusive] = useState(false);

  const status = 'Completed';
  const title = `${status} Projects`;
  const description = `View and manage all ${isExclusive ? 'exclusive ' : ''}completed investment projects here.`;

  return (
    <div className="min-h-full">
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400 text-sm md:text-base">{description}</p>
        </div>
        
        {/* Toggle Switch */}
        <div className="flex items-center bg-[#111] border border-white/10 rounded-xl p-1 shrink-0">
          <button
            onClick={() => setIsExclusive(false)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              !isExclusive 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setIsExclusive(true)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
              isExclusive 
                ? 'bg-[#ccff00] text-black shadow-sm' 
                : 'text-gray-500 hover:text-[#ccff00]'
            }`}
          >
            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" className={isExclusive ? 'text-black' : 'text-gray-500'}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            Exclusive
          </button>
        </div>
      </div>

      <div className="w-full rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md p-6 h-[500px] flex items-center justify-center animate-in fade-in duration-700">
        <p className="text-gray-600 font-medium tracking-widest text-sm uppercase">
          {isExclusive ? 'Exclusive ' : ''}Completed Projects Grid
        </p>
      </div>
    </div>
  );
};

export default CompletedProjects;
