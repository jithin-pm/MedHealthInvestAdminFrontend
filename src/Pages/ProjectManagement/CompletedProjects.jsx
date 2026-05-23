import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HiOutlineEye, 
  HiX, 
  HiOutlineChevronDown,
  HiOutlineFolder,
  HiOutlineTrash,
  HiOutlineClock,
  HiOutlineCheckCircle
} from 'react-icons/hi';
import { 
  getAllProjectsApi, 
  editProjectApi, 
  deleteProjectApi,
  getAllUsersApi 
} from '../../services/allApi';
import { showAlert } from '../../Utils/alert';
import { BASE_URL } from '../../services/baseUrl';

const getImageUrl = (img) => {
  if (!img) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop';
  if (img.startsWith('http')) return img;
  return `${BASE_URL}/${img.replace(/\\/g, '/')}`;
};

const CompletedProjects = () => {
  const [isExclusive, setIsExclusive] = useState(false);
  const [subTab, setSubTab] = useState('unsettled'); // 'unsettled' or 'settled'
  const [allProjects, setAllProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await getAllProjectsApi();
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

  const status = 'Completed';
  const title = `${status} Projects`;
  const description = subTab === 'settled' 
    ? `View finalized ${isExclusive ? 'exclusive ' : ''}initiatives where all investor payouts have been recorded.`
    : `Audit and manage ${isExclusive ? 'exclusive ' : ''}matured projects awaiting final institutional settlement.`;

  const filteredProjects = allProjects.filter(p => {
    const isCorrectType = isExclusive ? p.projectType === 'Exclusive' : p.projectType === 'Standard';
    const isTargetStatus = subTab === 'settled' 
      ? p.status === 'COMPLETED' 
      : (p.status === 'ONGOING' && p.completionDate && new Date(p.completionDate) <= new Date());
    return isCorrectType && isTargetStatus;
  });

  const handleViewDetails = (project) => {
    navigate(`/dashboard/projects/details/${project.id}`, { state: { project } });
  };

  const handleSettlePayouts = (project) => {
    navigate(`/dashboard/projects/settlement/${project.id}`);
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        const response = await deleteProjectApi(projectId);
        if (response.status === 200) {
          showAlert('Deleted', 'Project removed', 'success');
          fetchProjects();
        }
      } catch (error) {
        showAlert('Error', 'Failed to delete project', 'error');
      }
    }
  };

  return (
    <div className="min-h-full">
      {/* Header & Controls */}
      <div className="mb-10 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
            <p className="text-gray-400 text-sm md:text-base max-w-2xl">{description}</p>
          </div>
          
          <div className="flex bg-[#111] border border-white/10 rounded-xl p-1 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setIsExclusive(false)}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                !isExclusive 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setIsExclusive(true)}
              className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                isExclusive 
                  ? 'bg-[#ccff00] text-black shadow-sm' 
                  : 'text-gray-500 hover:text-[#ccff00]'
              }`}
            >
              Exclusive
            </button>
          </div>
        </div>

        {/* Sub-Tabs: Settled vs Unsettled */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-1">
           {[
             { id: 'unsettled', label: 'Pending Settlement', icon: HiOutlineClock, count: allProjects.filter(p => (isExclusive ? p.projectType === 'Exclusive' : p.projectType === 'Standard') && p.status === 'ONGOING' && p.completionDate && new Date(p.completionDate) <= new Date()).length },
             { id: 'settled', label: 'Fully Settled', icon: HiOutlineCheckCircle, count: allProjects.filter(p => (isExclusive ? p.projectType === 'Exclusive' : p.projectType === 'Standard') && p.status === 'COMPLETED').length }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setSubTab(tab.id)}
               className={`relative px-6 py-4 flex items-center gap-3 transition-all duration-300 group ${
                 subTab === tab.id ? 'text-[#ccff00]' : 'text-gray-500 hover:text-white'
               }`}
             >
               <tab.icon className={`text-lg ${subTab === tab.id ? 'animate-pulse' : ''}`} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
               {tab.count > 0 && (
                 <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                   subTab === tab.id ? 'bg-[#ccff00] text-black' : 'bg-white/5 text-gray-500 group-hover:bg-white/10'
                 }`}>
                   {tab.count}
                 </span>
               )}
               {subTab === tab.id && (
                 <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ccff00] shadow-[0_0_15px_rgba(204,255,0,0.5)]" />
               )}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {isLoading ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#ccff00]/10 border-t-[#ccff00] rounded-full animate-spin" />
            <p className="text-gray-600 font-black uppercase tracking-[0.3em] text-[10px]">Syncing Archive...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project, i) => (
            <div key={i} className={`flex flex-col rounded-[2rem] bg-[#0c0c0c] border border-white/[0.05] overflow-hidden group hover:border-white/[0.1] transition-all duration-500 shadow-2xl ${subTab === 'unsettled' ? 'opacity-90 hover:opacity-100' : ''}`}>
              
              <div className="relative h-56 w-full overflow-hidden bg-white/5">
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
                  className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ${subTab === 'unsettled' ? 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100' : ''}`}
                />
                
                {/* Status Badge */}
                <div className="absolute top-6 left-6 flex items-center gap-2">
                   <div className={`px-3 py-1.5 rounded-lg backdrop-blur-md border flex items-center gap-2 ${
                     subTab === 'settled' 
                       ? 'bg-black/60 border-[#ccff00]/20 text-[#ccff00]' 
                       : 'bg-black/60 border-orange-500/20 text-orange-500'
                   }`}>
                      {subTab === 'settled' ? <HiOutlineCheckCircle className="text-sm" /> : <HiOutlineClock className="text-sm animate-pulse" />}
                      <span className="text-[8px] font-black uppercase tracking-[0.2em]">{subTab === 'settled' ? 'Settled' : 'Unsettled'}</span>
                   </div>
                </div>

                <button 
                  onClick={() => handleDeleteProject(project.id)}
                  className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 opacity-0 group-hover:opacity-100"
                >
                  <HiOutlineTrash className="text-lg" />
                </button>
              </div>

              <div className="flex flex-col flex-1 p-8">
                <div className="flex items-center justify-between mb-4">
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{project.projectCategory}</span>
                   <div className="h-4 w-[1px] bg-white/10" />
                   <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">{project.projectType}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-8 group-hover:text-[#ccff00] transition-colors">{project.projectName}</h3>
                
                <div className="grid grid-cols-2 gap-4 mb-8 pt-4 border-t border-white/5">
                   <div className="flex flex-col">
                     <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Maturity ROI</span>
                     <span className="text-2xl font-black text-white tracking-tighter">{project.roi}%</span>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest mb-1">Duration</span>
                     <span className="text-xl font-bold text-white/40">{project.duration}M</span>
                   </div>
                </div>

                <div className="mt-auto">
                   {subTab === 'unsettled' ? (
                     <button 
                       onClick={() => handleSettlePayouts(project)}
                       className="w-full py-4 rounded-2xl bg-[#ccff00] hover:bg-[#b8e600] text-black transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(204,255,0,0.1)] active:scale-[0.98]"
                     >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Initiate Settlement</span>
                        <HiOutlineFolder className="text-lg" />
                     </button>
                   ) : (
                     <button 
                       onClick={() => handleViewDetails(project)}
                       className="w-full py-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.98]"
                     >
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">View History</span>
                        <HiOutlineEye className="text-gray-400 group-hover:text-[#ccff00] transition-colors" />
                     </button>
                   )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center gap-6 bg-white/[0.01] rounded-[2.5rem] border-2 border-dashed border-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
               <HiOutlineFolder className="text-3xl text-gray-600" />
            </div>
            <div className="text-center">
               <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Registry Empty</p>
               <p className="text-gray-600 text-[11px] font-medium">No projects found in the {subTab} category.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedProjects;
