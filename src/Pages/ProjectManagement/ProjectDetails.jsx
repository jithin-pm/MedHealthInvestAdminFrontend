import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlineTrendingUp,
  HiOutlineClock,
  HiOutlineCalendar,
  HiOutlineCurrencyRupee,
  HiOutlineChevronLeft,
  HiOutlineStar,
  HiOutlineTag,
  HiOutlineUser,
  HiOutlinePhone,
  HiX,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlinePlay,
  HiOutlineEye,
  HiOutlineDownload
} from 'react-icons/hi';
import { FaImage } from 'react-icons/fa';
import { LuCrown } from 'react-icons/lu';
import { BASE_URL } from '../../services/baseUrl';
import { getProjectByIdApi, getProjectInvestorsApi } from '../../services/allApi';
import Swal from 'sweetalert2';
import { generateProjectStatement } from '../../Utils/generateStatement';
import { getErrorMessage, getErrorTitle } from '../../Utils/getErrorMessage';
import { getDisplayTransactionId } from '../../Utils/transactionUtils';

const ProjectDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Use location state or fallback
  const [project, setProject] = React.useState(location.state?.project || null);
  const [loading, setLoading] = React.useState(!location.state?.project);

  // Auto-redirect to exclusive-projects route if viewing an exclusive project under projects route
  React.useEffect(() => {
    if (project?.projectType === 'Exclusive' && location.pathname.startsWith('/dashboard/projects/details/')) {
      navigate(`/dashboard/exclusive-projects/details/${project.id || id}`, { replace: true, state: location.state });
    }
  }, [project, location.pathname, id, navigate]);

  // Investor List State
  const [investors, setInvestors] = React.useState([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState(null);

  // User Info Modal State
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);

  // Video Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = React.useState(false);

  const fetchInvestors = async () => {
    if (!id) return;
    setIsLoadingInvestors(true);
    try {
      const res = await getProjectInvestorsApi(id);
      if (res.status === 200) {
        setInvestors(res.data.investments || []);
      }
    } catch (err) {
      console.error("Error fetching investors:", err);
    } finally {
      setIsLoadingInvestors(false);
    }
  };

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getProjectByIdApi(id);
      if (res.status === 200) {
        setProject(res.data);
      }
    } catch (err) {
      console.error("Error fetching project details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadStatement = async () => {
    if (!project) return;

    Swal.fire({
      title: 'Preparing Statement',
      text: 'Compiling institutional audit records...',
      allowOutsideClick: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const res = await getProjectInvestorsApi(id);
      if (res.status === 200) {
        const investorList = res.data.investments || [];
        generateProjectStatement(project, investorList);
        Swal.fire({
          icon: 'success',
          title: 'Statement Downloaded',
          text: 'The audit report has been generated successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error("Statement generation error:", err);
      Swal.fire({
        icon: 'error',
        title: getErrorTitle(err),
        text: getErrorMessage(err, 'An error occurred while generating the statement.')
      });
    }
  };

  React.useEffect(() => {
    fetchProject();
    fetchInvestors();
  }, [id]);

  const getImageUrl = (img) => {
    if (!img) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop';
    if (img?.startsWith('http')) return img;
    const cleanPath = String(img).replace(/\\/g, '/').replace(/^\/+/, '');
    return `${BASE_URL}/${cleanPath}`;
  };

  const handleDownloadProof = async (imgPath, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const fullUrl = getImageUrl(imgPath);
    if (!fullUrl) return;

    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `proof-${Date.now()}.${imgPath.split('.').pop() || 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      window.open(fullUrl, '_blank');
    }
  };

  const projectImages = React.useMemo(() => {
    if (!project) return [];
    try {
      const imgs = project.projectImages ? JSON.parse(project.projectImages) : [];
      return Array.isArray(imgs) ? imgs : (project.projectImages ? [project.projectImages] : []);
    } catch (e) {
      return project.projectImages ? [project.projectImages] : [];
    }
  }, [project]);

  const projectImageUrl = projectImages.length > 0
    ? getImageUrl(projectImages[0])
    : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop';

  const [activeMedia, setActiveMedia] = React.useState({ type: 'image', url: projectImageUrl });

  // Update activeMedia once projectImageUrl is calculated
  React.useEffect(() => {
    if (projectImageUrl && activeMedia.url !== projectImageUrl) {
      setActiveMedia({ type: 'image', url: projectImageUrl });
    }
  }, [projectImageUrl]);

  // Project Ending Date & Countdown for Ongoing Projects
  const projectEndingDate = React.useMemo(() => {
    if (!project) return null;
    if (project.completionDate) {
      const d = new Date(project.completionDate);
      if (!isNaN(d.getTime())) return d;
    }
    if (project.ongoingStartDate && project.duration) {
      const d = new Date(new Date(project.ongoingStartDate).getTime() + (parseInt(project.duration) * 30 * 24 * 60 * 60 * 1000));
      if (!isNaN(d.getTime())) return d;
    }
    if (project.activeDeadline) {
      const d = new Date(project.activeDeadline);
      if (!isNaN(d.getTime())) return d;
    }
    if (project.duration && (project.created_at || project.createdAt)) {
      const start = new Date(project.created_at || project.createdAt);
      const d = new Date(start.getTime() + (parseInt(project.duration) * 30 * 24 * 60 * 60 * 1000));
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  }, [project]);

  const [countdown, setCountdown] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isCompleted: false,
    hasDate: false
  });

  React.useEffect(() => {
    if (!projectEndingDate) {
      setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isCompleted: false, hasDate: false });
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const diffMs = projectEndingDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isCompleted: true, hasDate: true });
        return;
      }

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      const seconds = Math.floor((diffMs / 1000) % 60);

      setCountdown({
        days,
        hours,
        minutes,
        seconds,
        isCompleted: false,
        hasDate: true
      });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [projectEndingDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin" />
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Authenticating Data Structure...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
        <p className="text-white font-bold">Project not found</p>
        <button onClick={() => navigate(-1)} className="text-[#ccff00] underline">Go Back</button>
      </div>
    );
  }

  const durationMonths = Number(project.duration || 1);
  const totalInvested = investors.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0) || Number(project.collectedAmount || 0);
  const totalInterest = Math.round((totalInvested * Number(project.roi || 0) * durationMonths) / 100);
  const totalPaidBack = totalInvested + (project.status === 'EXPIRED' ? 0 : totalInterest);
  const isActiveProject = project.status === 'ACTIVE';
  const isOngoingProject = project.status === 'ONGOING';
  const isCompletedProject = project.status === 'COMPLETED';
  const targetAmount = Number(project.targetAmount || 0);
  const fundingPercent = targetAmount > 0
    ? Math.round((totalInvested / targetAmount) * 100)
    : 0;



  const formattedEndingDate = projectEndingDate
    ? projectEndingDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Not Specified';

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 lg:p-12 font-['Inter']">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-12">
        <button
          onClick={() => {
            if (project?.projectType === 'Exclusive') {
              navigate('/dashboard/exclusive-projects');
            } else {
              navigate(-1);
            }
          }}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white hover:bg-white/10 transition-all group"
        >
          <HiOutlineChevronLeft className="text-xl group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">
            {project?.projectType === 'Exclusive' ? 'Back to Exclusive Projects' : 'Back to Projects'}
          </span>
        </button>
      </div>

      <div className="lg:grid lg:grid-cols-3 gap-12 mb-20">
        <div className="lg:col-span-2 space-y-12">
          {/* Main Display Area */}
          <section className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl group">
            <img
              src={activeMedia.url}
              alt="Main Display"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="px-3 py-1 bg-[#ccff00] text-black text-[0.65rem] font-black rounded-lg uppercase tracking-widest shadow-[0_0_20px_rgba(204,255,0,0.3)]">
                  {project.projectCategory}
                </span>
                {project.projectType === 'Exclusive' && (
                  <span className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[0.65rem] font-black rounded-lg uppercase tracking-widest">
                    <HiOutlineStar className="text-[#ccff00]" />
                    Exclusive
                  </span>
                )}
                {project.status === 'EXPIRED' && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[0.65rem] font-black rounded-lg uppercase tracking-widest animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                    <HiOutlineClock className="text-sm text-rose-400" />
                    Refund Pending
                  </span>
                )}
                <span className="text-gray-400 text-[0.65rem] font-bold uppercase tracking-[0.2em] ml-2">Established 2024</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white max-w-5xl leading-[0.9] uppercase">
                {project.projectName}
              </h1>
            </div>
          </section>

          {/* Media Selection Strip */}
          <section className="flex items-center gap-4 overflow-x-auto pb-4 no-scrollbar">
            {projectImages.map((img, idx) => (
              <button
                key={`img-${idx}`}
                onClick={() => setActiveMedia({ type: 'image', url: getImageUrl(img) })}
                className={`relative w-32 md:w-44 aspect-video rounded-2xl overflow-hidden border-2 transition-all duration-300 ${activeMedia.url === getImageUrl(img) ? 'border-[#ccff00] scale-105 shadow-[0_0_15px_rgba(204,255,0,0.3)]' : 'border-white/10 opacity-50 hover:opacity-100'
                  }`}
              >
                <img src={getImageUrl(img)} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <FaImage className="text-white text-xl" />
                </div>
              </button>
            ))}

            {/* Video Thumbnail */}
            {project.projectVideo && (
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="relative w-32 md:w-44 aspect-video rounded-2xl overflow-hidden border-2 border-white/10 opacity-70 hover:opacity-100 hover:border-[#ccff00] transition-all duration-300 bg-white/5"
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#ccff00] flex items-center justify-center shadow-[0_0_15px_rgba(204,255,0,0.5)]">
                    <HiOutlinePlay className="text-black text-xl translate-x-0.5" />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Watch Presentation</span>
                </div>
              </button>
            )}
          </section>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-3 mt-8 lg:mt-0">
          {[
            { label: 'Target Monthly ROI', value: `${project.roi}%`, icon: HiOutlineTrendingUp, color: 'text-[#ccff00]' },
            { label: 'Duration', value: `${project.duration} Months`, icon: HiOutlineClock, color: 'text-blue-400' },
            { label: 'Target Amount', value: `₹\u2009${Number(project.targetAmount).toLocaleString('en-IN')}`, icon: HiOutlineCurrencyRupee, color: 'text-[#ccff00]', isTargetAmount: true },
          ].map((stat, i) => (
            <div key={i} className="bg-[#0c0c0c] border border-white/5 py-4 px-5 rounded-2xl hover:border-white/10 transition-colors group">
              <div className={`p-2 rounded-xl bg-white/[0.03] w-fit mb-2.5 group-hover:scale-105 transition-transform`}>
                <stat.icon className={`text-xl ${stat.color}`} />
              </div>
              <p className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.15em] mb-0.5">{stat.label}</p>
              <p className={`text-xl font-black ${stat.isTargetAmount ? 'text-[#ccff00]' : 'text-white'}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Assigned User Section (Exclusive Projects Only) */}
      {project.projectType === 'Exclusive' && (
        <section className="mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 uppercase">
            <LuCrown className="text-[#ccff00]" />
            Assigned Investor
          </h2>
          <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-10 md:p-12 relative overflow-hidden group">
            <div className="flex flex-col md:flex-row items-center gap-10">
              {/* Avatar Placeholder */}
              <div className="w-24 h-24 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00] text-3xl font-black">
                {project.assignedUser?.fullName?.charAt(0) || 'U'}
              </div>

              <div className="flex-1 flex flex-col gap-8 w-full overflow-hidden">
                {/* Row 1: Full Name */}
                <div className="space-y-1 min-w-0">
                  <p className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Full Name</p>
                  <div className="flex items-center gap-3 min-w-0">
                    <p className="text-2xl font-bold text-white truncate" title={project.assignedUser?.fullName}>
                      {project.assignedUser?.fullName || 'Not Assigned'}
                    </p>
                    {project.assignedUser && (
                      <button
                        onClick={() => setIsUserModalOpen(true)}
                        className="p-1 rounded-lg hover:bg-white/5 text-gray-500 hover:text-[#ccff00] transition-all shrink-0"
                      >
                        <HiOutlineInformationCircle className="text-2xl" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                  <div className="space-y-1 min-w-0">
                    <p className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Email Address</p>
                    <p className="text-lg font-bold text-white break-all" title={project.assignedUser?.email}>
                      {project.assignedUser?.email || 'N/A'}
                    </p>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Phone Number</p>
                    <p className="text-lg font-bold text-white whitespace-nowrap">
                      {project.assignedUser?.countryCode ? `${project.assignedUser.countryCode} ` : ''}
                      {project.assignedUser?.mobileNumber || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Financial Overview & Amount Breakdown */}
      <section className="mb-12">
        <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

          {/* Section Header with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 relative z-10">
            <div>
              <h3 className="text-xs font-black text-[#ccff00] uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></span>
                {isCompletedProject ? 'Financial Overview & Payback Breakdown' : 'Financial Overview'}
              </h3>
              <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mt-1">
                {isActiveProject ? 'Project Capital & Funding Progress' : 'Project Capital & Investment Ledger'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {(project.status === 'ONGOING' || project.status === 'EXPIRED') && (
                <button
                  onClick={() => navigate(project.projectType === 'Exclusive' ? `/dashboard/exclusive-projects/settlement/${id}` : `/dashboard/projects/settlement/${id}`)}
                  className="px-6 py-3 rounded-xl bg-white hover:bg-gray-200 text-black font-black text-xs tracking-wider uppercase transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 cursor-pointer"
                >
                  <HiOutlineCheckCircle className="text-base" />
                  {project.status === 'EXPIRED' ? 'Process Refunds' : 'Mark as Completed'}
                </button>
              )}
              <button
                onClick={handleDownloadStatement}
                className="px-6 py-3 rounded-xl bg-[#ccff00] hover:bg-[#b3ff00] text-black font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(204,255,0,0.15)] transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
              >
                <HiOutlineTag className="text-base" />
                Download Statement
              </button>
            </div>
          </div>

          {/* Financial Breakdown & Funding Progress */}
          {isActiveProject ? (
            <div className="space-y-6 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Amount Collected */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
                  <div>
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">
                      Amount Collected
                    </span>
                    <p className="text-2xl font-black text-white">
                      <span className="mr-0.5">₹</span>{totalInvested.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium mt-3">Total Capital Secured</span>
                </div>

                {/* 2. Target Amount */}
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
                  <div>
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">
                      Target Amount
                    </span>
                    <p className="text-2xl font-black text-white">
                      <span className="text-[#ccff00] mr-0.5">₹</span>{targetAmount.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium mt-3">Project Investment Goal</span>
                </div>

                {/* 3. Funding Progress */}
                <div className="bg-[#ccff00]/[0.05] border border-[#ccff00]/20 rounded-2xl p-5 flex flex-col justify-between shadow-[inset_0_0_20px_rgba(204,255,0,0.02)]">
                  <div>
                    <span className="text-[#ccff00]/80 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">
                      Funding Progress
                    </span>
                    <p className="text-2xl font-black text-[#ccff00]">
                      {fundingPercent}%
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium mt-3">
                    {totalInvested >= targetAmount
                      ? 'Target Goal Reached'
                      : `₹${Math.max(0, targetAmount - totalInvested).toLocaleString('en-IN')} Remaining`}
                  </span>
                </div>
              </div>

              {/* Progress Bar for Active Projects */}
              <div className="pt-2 space-y-2">
                <div className="w-full h-4 bg-[#ccff00]/10 rounded-full overflow-hidden p-1 border border-[#ccff00]/20">
                  <div
                    className="h-full bg-[#ccff00] rounded-full shadow-[0_0_20px_rgba(204,255,0,0.4)] transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, fundingPercent)}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <span>
                    {totalInvested >= targetAmount
                      ? '100% Target Met'
                      : `₹${Math.max(0, targetAmount - totalInvested).toLocaleString('en-IN')} Remaining to Target`}
                  </span>
                  <span className="text-[#ccff00] font-black">{fundingPercent}% Complete</span>
                </div>
              </div>
            </div>
          ) : isOngoingProject ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl relative z-10">
              {/* 1. Amount Invested */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
                <div>
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">
                    Amount Invested
                  </span>
                  <p className="text-2xl font-black text-white">
                    <span className="mr-0.5">₹</span>{totalInvested.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="text-[10px] text-gray-500 font-medium mt-3">Total Capital Secured</span>
              </div>

              {/* 2. Project Ending Date & Countdown */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
                <div>
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">
                    Project Ending Date
                  </span>
                  <p className="text-2xl font-black text-white">
                    {formattedEndingDate}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[10px] font-medium mt-3">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <HiOutlineClock className="text-xs text-[#ccff00]" />
                    Countdown
                  </span>
                  {countdown.hasDate && !countdown.isCompleted ? (
                    <span className="font-mono text-[#ccff00] font-bold tracking-wider">
                      {countdown.days}d : {String(countdown.hours).padStart(2, '0')}h : {String(countdown.minutes).padStart(2, '0')}m : {String(countdown.seconds).padStart(2, '0')}s
                    </span>
                  ) : (
                    <span className="text-[#ccff00] font-bold">
                      {countdown.isCompleted ? 'Pending Settlement' : 'N/A'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
              {/* 1. Amount Invested */}
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
                <div>
                  <span className="text-gray-500 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">
                    Amount Invested
                  </span>
                  <p className="text-2xl font-black text-white">
                    <span className="mr-0.5">₹</span>{totalInvested.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="text-[10px] text-gray-500 font-medium mt-3">Total Capital Secured</span>
              </div>

              {/* 2. Interest Paid Back */}
              <div className="bg-[#ccff00]/[0.05] border border-[#ccff00]/20 rounded-2xl p-5 flex flex-col justify-between shadow-[inset_0_0_20px_rgba(204,255,0,0.02)]">
                <div>
                  <span className="text-[#ccff00]/80 font-bold uppercase tracking-widest text-[0.65rem] block mb-1">
                    Interest Paid Back
                  </span>
                  <p className="text-2xl font-black text-[#ccff00]">
                    +<span className="mr-0.5">₹</span>{totalInterest.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="text-[10px] text-gray-400 font-medium mt-3">
                  {project.roi}% Monthly ROI × {durationMonths} Months
                </span>
              </div>

              {/* 3. Total Amount Paid Back */}
              <div className="bg-gradient-to-br from-[#ccff00]/15 to-transparent border border-[#ccff00]/30 rounded-2xl p-5 flex flex-col justify-between shadow-[0_0_25px_rgba(204,255,0,0.08)]">
                <div>
                  <span className="text-[#ccff00] font-black uppercase tracking-widest text-[0.65rem] block mb-1">
                    Total Amount Paid Back
                  </span>
                  <p className="text-3xl font-black text-white">
                    <span className="text-[#ccff00] mr-0.5">₹</span>{totalPaidBack.toLocaleString('en-IN')}
                  </p>
                </div>
                <span className="text-[10px] text-[#ccff00]/80 font-bold mt-3">
                  Capital + Interest Splitting
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Investors List Section */}
      <section className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl mb-12">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-xs font-black text-[#ccff00] uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></span>
            {isCompletedProject ? 'Investors List & Payback Details' : 'Investors List'}
          </h3>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 font-mono text-xs font-bold">
            {investors.length} {investors.length === 1 ? 'Investor' : 'Investors'}
          </span>
        </div>

        {isLoadingInvestors ? (
          <div className="py-16 flex flex-col items-center justify-center gap-4">
            <div className="w-10 h-10 border-4 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin" />
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Loading Investor Ledger...</p>
          </div>
        ) : investors.length > 0 ? (
          <div className="w-full overflow-x-auto custom-scrollbar pb-3">
            <table className="w-full text-left border-collapse min-w-[1150px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest rounded-tl-xl whitespace-nowrap min-w-[240px]">Investor</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[200px]">Transaction ID</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[180px]">Investment Date & Time</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap min-w-[150px]">Amount Invested</th>
                  {isCompletedProject && (
                    <th className="py-4 px-6 text-[0.65rem] font-bold text-[#ccff00] uppercase tracking-widest whitespace-nowrap min-w-[160px]">Total Paid Back</th>
                  )}
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest text-center whitespace-nowrap min-w-[130px]">Status</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest text-right rounded-tr-xl whitespace-nowrap min-w-[130px]">Proof</th>
                </tr>
              </thead>
              <tbody>
                {investors.map((inv, idx) => {
                  const invCapital = parseFloat(inv.amount || 0);
                  const invInterest = Math.round((invCapital * Number(project.roi || 0) * durationMonths) / 100);
                  const invTotal = invCapital + (project.status === 'EXPIRED' ? 0 : invInterest);
                  const dateObj = new Date(inv.created_at || inv.createdAt);
                  const formattedDate = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : 'N/A';
                  const formattedTime = !isNaN(dateObj.getTime())
                    ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                    : '';
                  const paybackDateObj = (inv.paybackStatus === 'PAID' && (inv.updated_at || inv.updatedAt))
                    ? new Date(inv.updated_at || inv.updatedAt)
                    : null;
                  const formattedPaybackDate = (paybackDateObj && !isNaN(paybackDateObj.getTime()))
                    ? paybackDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                    : null;
                  const formattedPaybackTime = (paybackDateObj && !isNaN(paybackDateObj.getTime()))
                    ? paybackDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                    : null;
                  const proofImg = inv.paybackProof || inv.paymentProof || inv.proof;
                  const rawTxId = inv.transactionId || inv.paymentId;
                  const displayTxId = (rawTxId && rawTxId !== '---')
                    ? rawTxId
                    : getDisplayTransactionId({ ...inv, transactionId: rawTxId, project });

                  return (
                    <tr key={inv.id || idx} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors bg-white/[0.01]">
                      {/* Investor */}
                      <td className="py-6 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#ccff00]/20 text-[#ccff00] border border-[#ccff00]/20 flex items-center justify-center font-black text-sm shrink-0">
                            {inv.investor?.fullName?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white truncate max-w-[200px]">
                              {inv.investor?.fullName || 'Unknown User'}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-mono font-semibold bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 tracking-wider">
                                {inv.investor?.customUserId || `MHI2026${String(inv.investor?.id || inv.userId || idx).padStart(2, '0')}`}
                              </span>
                              {inv.investor?.mobileNumber && (
                                <span className="text-[11px] text-gray-500 font-medium">
                                  {inv.investor.mobileNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Transaction ID */}
                      <td className="py-6 px-6 whitespace-nowrap">
                        <span className="text-zinc-300 text-xs font-mono font-medium tracking-wider whitespace-nowrap bg-white/[0.03] border border-white/5 px-2.5 py-1.5 rounded-lg inline-block">
                          {displayTxId}
                        </span>
                      </td>

                      {/* Date & Time */}
                      <td className="py-6 px-6 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs font-medium border border-white/10 shadow-inner w-fit">
                            {formattedDate}
                          </span>
                          {formattedTime && (
                            <span className="text-[10px] font-mono text-gray-400 pl-1">
                              {formattedTime}
                            </span>
                          )}
                          {formattedPaybackDate && (
                            <span className="text-[10px] text-[#ccff00] font-semibold pl-1">
                              Paid: {formattedPaybackDate} {formattedPaybackTime}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount Invested */}
                      <td className="py-6 px-6 whitespace-nowrap">
                        <span className="text-lg font-black text-white">
                          <span className="mr-0.5">₹</span>{invCapital.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Paid Back & Interest Breakdown (Only for Completed projects) */}
                      {isCompletedProject && (
                        <td className="py-6 px-6 whitespace-nowrap">
                          <span className="text-lg font-black text-[#ccff00] drop-shadow-[0_0_10px_rgba(204,255,0,0.3)]">
                            <span className="mr-0.5">₹</span>{invTotal.toLocaleString('en-IN')}
                          </span>
                          <span className="block text-[10px] text-gray-400 font-medium">
                            (+₹{invInterest.toLocaleString('en-IN')} Interest)
                          </span>
                        </td>
                      )}

                      {/* Status */}
                      <td className="py-6 px-6 text-center whitespace-nowrap">
                        {inv.paybackStatus === 'PAID' ? (
                          <span className="px-3 py-1 rounded-full border border-green-500/50 bg-green-500/10 text-green-400 text-[0.65rem] font-bold uppercase tracking-widest whitespace-nowrap inline-flex items-center gap-1.5">
                            <HiOutlineCheckCircle className="text-xs" />
                            Paid Back
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 text-[0.65rem] font-bold uppercase tracking-widest whitespace-nowrap inline-flex items-center gap-1.5">
                            <HiOutlineClock className="text-xs" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Proof */}
                      <td className="py-6 px-6 text-right whitespace-nowrap">
                        {proofImg ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedImage(proofImg)}
                              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                              title="View Proof"
                            >
                              <HiOutlineEye className="text-lg" />
                            </button>
                            <button
                              onClick={(e) => handleDownloadProof(proofImg, e)}
                              className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                              title="Download Proof"
                            >
                              <HiOutlineDownload className="text-lg" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs font-medium italic bg-white/5 px-3 py-1.5 rounded-lg">
                            No Proof Attached
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
              <HiOutlineUser className="text-3xl" />
            </div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">No Investor Records Found</p>
          </div>
        )}
      </section>

      {/* Proof Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-[#0c0c0c] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl p-4 flex flex-col items-center"
          >
            <div className="w-full flex items-center justify-between pb-4 border-b border-white/5 mb-4 px-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#ccff00]">Proof Verification Document</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <HiX className="text-lg" />
              </button>
            </div>
            <img
              src={getImageUrl(selectedImage)}
              alt="Proof Document"
              className="max-h-[75vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* User Information Modal */}
      {isUserModalOpen && project.assignedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-xs animate-in fade-in duration-300 font-['Inter']">
          <div className="relative w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">

            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#ccff00] flex items-center justify-center text-black font-black text-lg">
                  {project.assignedUser.fullName[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{project.assignedUser.fullName}</h3>
                  <p className="text-[#ccff00] text-[10px] font-black uppercase tracking-widest mt-0.5">Investor Protocol Profile</p>
                </div>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">

              {/* Contact Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Email Address</span>
                  <span className="text-sm font-medium text-white break-all">{project.assignedUser.email}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Mobile Number</span>
                  <span className="text-sm font-medium text-white">{project.assignedUser.mobileNumber || '+91 98765 43210'}</span>
                </div>
              </div>

              {/* Dummy PAN Card Section */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
                </div>
                <div className="relative z-10">
                  <span className="text-[9px] font-black text-[#ccff00] uppercase tracking-[0.3em] mb-4 block">Taxation ID (PAN)</span>
                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-black text-white tracking-[0.3em] uppercase">ABCDE1234F</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Permanent Account Number</p>
                  </div>
                </div>
              </div>

              {/* Dummy Bank Details */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <HiOutlineTag className="text-[#ccff00]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Institutional Settlement Details</span>
                </div>
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Bank Name</p>
                    <p className="text-xs font-bold text-white">HDFC BANK LIMITED</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">IFSC Code</p>
                    <p className="text-xs font-bold text-white tracking-widest">HDFC0001234</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Account Number</p>
                    <p className="text-lg font-black text-white tracking-[0.1em]">50100456789012</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-white/5 bg-black flex justify-center">
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="px-10 py-3 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] hover:bg-gray-200 transition-all active:scale-[0.98]"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Video Modal - Clean Design without overlay/blur */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
          <div className="relative w-full max-w-5xl aspect-video rounded-[2.5rem] overflow-hidden pointer-events-auto animate-in zoom-in duration-300">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all z-10 backdrop-blur-md border border-white/10"
            >
              <HiX className="text-2xl" />
            </button>
            <video
              src={getImageUrl(project.projectVideo)}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
