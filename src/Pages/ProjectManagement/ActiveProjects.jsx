import React, { useState } from 'react';
import { HiOutlineEye, HiOutlinePlus, HiX, HiOutlineCloudUpload } from 'react-icons/hi';
const ActiveProjects = () => {
  const [isExclusive, setIsExclusive] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const status = 'Active';
  const title = `${status} Projects`;
  const description = `View and manage all ${isExclusive ? 'exclusive ' : ''}active investment projects here.`;

  return (
    <div className="min-h-full">
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400 text-sm md:text-base">{description}</p>
        </div>
        
        {/* Actions Area */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          
          {/* Add Project Button */}
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm tracking-wide hover:bg-gray-200 transition-colors shadow-[0_0_15px_rgba(204,255,0,0.1)]"
          >
            <HiOutlinePlus className="text-lg" />
            <span>Add Project</span>
          </button>

          {/* Toggle Switch */}
          <div className="flex bg-[#111] border border-white/10 rounded-xl p-1 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setIsExclusive(false)}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center ${
                !isExclusive 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setIsExclusive(true)}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-700">
        {[
          {
            title: 'Healthcare Innovation Fund',
            image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop',
            status: 'ACTIVE',
            raised: '₹45,00,000',
            target: '₹1,00,00,000',
            roi: '14.5%',
            term: '5 Years',
            progress: 45,
            daysLeft: 24,
            category: 'INITIATIVE'
          },
          {
            title: 'MedTech Seed Investment',
            image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=800&auto=format&fit=crop',
            status: 'ACTIVE',
            raised: '₹8,50,000',
            target: '₹10,00,000',
            roi: '22.0%',
            term: '2 Years',
            progress: 85,
            daysLeft: 5,
            category: 'SEED FUND'
          },
          {
            title: 'Global Pharma Expansion',
            image: 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?q=80&w=800&auto=format&fit=crop',
            status: 'ACTIVE',
            raised: '₹12,00,000',
            target: '₹50,00,000',
            roi: '18.5%',
            term: '3 Years',
            progress: 24,
            daysLeft: 45,
            category: 'EXPANSION'
          }
        ].map((project, i) => (
          <div key={i} className="flex flex-col rounded-[1.25rem] bg-[#0c0c0c] border border-white/[0.05] overflow-hidden group hover:border-white/[0.1] transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
            
            {/* Image Header */}
            <div className="relative h-48 w-full overflow-hidden">
              <img 
                src={project.image} 
                alt={project.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute top-4 left-4 bg-[#ccff00] text-black text-[0.6rem] font-black px-2.5 py-1 uppercase rounded tracking-[0.15em] shadow-lg">
                {project.status}
              </div>
            </div>

            {/* Content Body */}
            <div className="flex flex-col flex-1 p-6 lg:p-8">
              <span className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1.5">{project.category}</span>
              <h3 className="text-xl font-bold text-white mb-8 tracking-tight">{project.title}</h3>
              
              {/* Financials Grid */}
              <div className="grid grid-cols-2 gap-y-6 mb-6 pt-2">
                <div className="flex flex-col">
                  <span className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Est. ROI</span>
                  <span className="text-xl font-bold text-[#ccff00] tracking-tight">{project.roi}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Duration</span>
                  <span className="text-lg font-medium text-white tracking-tight">{project.term}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Raised</span>
                  <span className="text-xl font-bold text-white tracking-tight">{project.raised}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Target</span>
                  <span className="text-xl font-medium text-gray-400 tracking-tight">{project.target}</span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-[6px] bg-[#ccff00]/10 rounded-full mb-3 overflow-hidden">
                <div 
                  className="h-full bg-[#ccff00] rounded-full relative shadow-[0_0_10px_rgba(204,255,0,0.5)]"
                  style={{ width: `${project.progress}%` }}
                />
              </div>

              {/* Status Footer */}
              <div className="flex justify-between items-center mb-8">
                <span className="text-[0.65rem] text-[#ccff00] font-bold tracking-[0.15em] uppercase">{project.progress}% Funded</span>
                <span className="text-[0.65rem] text-gray-500 font-bold tracking-[0.15em] uppercase italic">{project.daysLeft} Days Left</span>
              </div>

              {/* Action Button */}
              <button className="mt-auto w-full py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all duration-300 flex items-center justify-center gap-2.5 group/btn">
                <HiOutlineEye className="text-gray-400 group-hover/btn:text-[#ccff00] transition-colors text-lg" />
                <span className="text-[0.7rem] font-bold text-white uppercase tracking-[0.2em]">View Details</span>
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* Add Project Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="my-auto w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-full">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight uppercase">Initiate New Project</h2>
                <p className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Enter Comprehensive Details Below</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              {/* Project Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Project Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Rural Education Empowerment" 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/50 transition-all placeholder:text-gray-600"
                />
              </div>

              {/* Concept Summary */}
              <div className="flex flex-col gap-2">
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Concept Summary</label>
                <textarea 
                  rows={2}
                  placeholder="Brief 1-2 sentence overview of the initiative..." 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/50 transition-all placeholder:text-gray-600 resize-none"
                />
              </div>

              {/* Full Description */}
              <div className="flex flex-col gap-2">
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Full Description</label>
                <textarea 
                  rows={4}
                  placeholder="Detailed project requirements, goals, and impact plan..." 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/50 transition-all placeholder:text-gray-600 resize-none"
                />
              </div>

              {/* Financials & Timeline Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Target Amount */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Target Amount (₹)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 500000" 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/50 transition-all placeholder:text-gray-600"
                  />
                </div>

                {/* Est. ROI */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Est. ROI (%)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 14.5" 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/50 transition-all placeholder:text-gray-600"
                  />
                </div>

                {/* Duration */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Duration (Years)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 5" 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/50 transition-all placeholder:text-gray-600"
                  />
                </div>

              </div>

              {/* Uploads Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Images Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Project Images (Max 4)</label>
                  <button className="flex flex-col items-center justify-center gap-3 w-full h-32 bg-white/[0.02] border-2 border-dashed border-white/10 hover:border-[#ccff00]/50 hover:bg-[#ccff00]/5 rounded-xl transition-all group relative overflow-hidden">
                    <HiOutlineCloudUpload className="text-3xl text-gray-500 group-hover:text-[#ccff00] transition-colors" />
                    <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">Add Images</span>
                  </button>
                </div>

                {/* Video Upload */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Intro Video</label>
                  <button className="flex flex-col items-center justify-center gap-3 w-full h-32 bg-white/[0.02] border-2 border-dashed border-white/10 hover:border-[#ccff00]/50 hover:bg-[#ccff00]/5 rounded-xl transition-all group relative overflow-hidden">
                    <HiOutlineCloudUpload className="text-3xl text-gray-500 group-hover:text-[#ccff00] transition-colors" />
                    <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest group-hover:text-white transition-colors">Choose Video</span>
                  </button>
                </div>

              </div>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-white/5 bg-black/20 rounded-b-2xl">
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="px-6 py-3 rounded-xl bg-transparent border border-white/10 text-white font-bold text-sm tracking-widest uppercase hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button className="px-6 py-3 rounded-xl bg-[#ccff00] hover:bg-[#b3ff00] text-black font-black text-sm tracking-[0.15em] uppercase shadow-[0_0_15px_rgba(204,255,0,0.2)] transition-colors">
                Publish Initiative
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveProjects;
