import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HiOutlineEye, 
  HiX, 
  HiOutlineFolder,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineCurrencyDollar,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLibrary,
  HiOutlineIdentification,
  HiOutlineCloudUpload,
  HiOutlineCheckCircle,
  HiOutlinePaperClip
} from 'react-icons/hi';
import { 
  getAllProjectsApi, 
  deleteProjectApi,
  getProjectInvestorsApi
} from '../../services/allApi';
import { showAlert } from '../../Utils/alert';
import { BASE_URL } from '../../services/baseUrl';

const getImageUrl = (img) => {
  if (!img) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop';
  if (img.startsWith('http')) return img;
  return `${BASE_URL}/${img.replace(/\\/g, '/')}`;
};

const ExpiredProjects = () => {
  const [isExclusive, setIsExclusive] = useState(false);
  const [allProjects, setAllProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  

  const navigate = useNavigate();

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await getAllProjectsApi(null, true);
      if (response.status === 200) {
        setAllProjects(response.data.projects);
      }
    } catch (error) {
      console.error("Fetch projects error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handlePayBackClick = (project) => {
    navigate(`/dashboard/projects/settlement/${project.id}`);
  };


  const status = 'Expired';
  const title = `${status} Projects`;
  const description = `Projects that failed to reach their target within the 90-day active window. Manage refunds here.`;

  const filteredProjects = allProjects.filter(p => 
    (isExclusive ? p.projectType === 'Exclusive' : p.projectType === 'Standard') &&
    p.status === 'EXPIRED'
  );

  const handleViewDetails = (project) => {
    navigate(`/dashboard/projects/details/${project.id}`, { state: { project } });
  };

  return (
    <div className="min-h-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400 text-sm md:text-base">{description}</p>
        </div>
        
        <div className="flex bg-[#111] border border-white/10 rounded-xl p-1 w-full sm:w-auto shrink-0">
          <button
            onClick={() => setIsExclusive(false)}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
              !isExclusive 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setIsExclusive(true)}
            className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
              isExclusive 
                ? 'bg-[#ccff00] text-black shadow-sm' 
                : 'text-gray-500 hover:text-[#ccff00]'
            }`}
          >
            Exclusive
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-700">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Accessing Database...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project, i) => (
            <div key={i} className="flex flex-col rounded-[1.25rem] bg-[#0c0c0c] border border-white/[0.05] overflow-hidden group hover:border-white/[0.1] transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
              
              <div className="relative h-48 w-full overflow-hidden bg-white/5">
                <img 
                  src={project.projectImages ? (() => {
                    try {
                      const imgs = JSON.parse(project.projectImages);
                      return getImageUrl(imgs[0]);
                    } catch (e) {
                      return getImageUrl(project.projectImages);
                    }
                  })() : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop'} 
                  alt={project.projectName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-red-500 text-white text-[0.6rem] font-black px-2.5 py-1 uppercase rounded tracking-[0.15em] shadow-lg flex items-center gap-1">
                  <HiOutlineClock /> EXPIRED
                </div>
              </div>

              <div className="flex flex-col flex-1 p-6 lg:p-8">
                <span className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1.5">{project.projectCategory}</span>
                <h3 className="text-xl font-bold text-white mb-8 truncate">{project.projectName}</h3>
                
                <div className="grid grid-cols-2 gap-y-6 mb-6 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Final Raised</span>
                    <span className="text-xl font-bold text-zinc-200">₹{Number(project.collectedAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Target</span>
                    <span className="text-lg font-medium text-gray-500">₹{Number(project.targetAmount).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full h-[6px] bg-[#ccff00]/10 rounded-full mb-3 overflow-hidden">
                  <div 
                    className="h-full bg-[#ccff00] rounded-full relative shadow-[0_0_10px_rgba(204,255,0,0.5)] transition-all duration-1000"
                    style={{ 
                      width: `${Math.min(((Number(project.collectedAmount || project.collected || 0) / Number(project.targetAmount || project.target || 1)) * 100), 100)}%` 
                    }}
                  />
                </div>

                <div className="flex justify-between items-center mb-8">
                  <span className="text-[0.65rem] text-[#ccff00] font-bold tracking-[0.15em] uppercase">
                    {Math.round((Number(project.collectedAmount || project.collected || 0) / Number(project.targetAmount || project.target || 1)) * 100)}% Funded
                  </span>
                </div>

                <div className="mt-auto flex gap-3">
                  <button 
                    onClick={() => handleViewDetails(project)}
                    className="flex-1 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all duration-300 flex items-center justify-center gap-2.5 group/btn"
                  >
                    <HiOutlineEye className="text-gray-400 group-hover/btn:text-[#ccff00] transition-colors text-lg" />
                    <span className="text-[0.7rem] font-bold text-white uppercase tracking-[0.2em]">View</span>
                  </button>
                  {project.isSettled ? (
                    <div className="flex-1 py-3.5 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center gap-2.5">
                      <HiOutlineCheckCircle className="text-[#ccff00] text-xl" />
                      <span className="text-[0.7rem] font-black text-[#ccff00] uppercase tracking-[0.2em]">Settled</span>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handlePayBackClick(project)}
                      className="flex-1 py-3.5 rounded-xl bg-[#ccff00] hover:bg-[#b8e600] text-black transition-all duration-300 flex items-center justify-center gap-2.5 group/pay"
                    >
                      <HiOutlineCurrencyDollar className="text-black text-xl group-hover:rotate-12 transition-transform" />
                      <span className="text-[0.7rem] font-black uppercase tracking-[0.2em]">Pay Back</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
            <HiOutlineFolder className="text-4xl text-gray-700" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No {isExclusive ? 'Exclusive ' : ''}Expired Projects Found</p>
          </div>
        )}
      </div>

    </div>
  );
};

export default ExpiredProjects;

