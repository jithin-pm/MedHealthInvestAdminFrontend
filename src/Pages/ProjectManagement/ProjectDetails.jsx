import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlineTrendingUp,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineChevronLeft,
  HiOutlineStar,
  HiOutlineChartBar,
  HiOutlineTag,
  HiOutlineUser,
  HiOutlinePhone,
  HiX,
  HiOutlineCheckCircle,
  HiOutlineInformationCircle,
  HiOutlineMail,
  HiOutlinePlay
} from 'react-icons/hi';
import { FaImage } from 'react-icons/fa';
import { LuCrown } from 'react-icons/lu';
import { BASE_URL } from '../../services/baseUrl';
import { getProjectByIdApi, getProjectInvestorsApi, editProjectApi } from '../../services/allApi';
import Swal from 'sweetalert2';
import { generateProjectStatement } from '../../Utils/generateStatement';
import { getErrorMessage, getErrorTitle } from '../../Utils/getErrorMessage';

const ProjectDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Use location state or fallback
  const [project, setProject] = React.useState(location.state?.project || null);
  const [loading, setLoading] = React.useState(!location.state?.project);

  // Investor List State
  const [isInvestorModalOpen, setIsInvestorModalOpen] = React.useState(false);
  const [investors, setInvestors] = React.useState([]);
  const [isLoadingInvestors, setIsLoadingInvestors] = React.useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 5;

  // User Info Modal State
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);

  // Video Modal State
  const [isVideoModalOpen, setIsVideoModalOpen] = React.useState(false);

  const fetchInvestors = async () => {
    if (!id) return;
    setIsLoadingInvestors(true);
    setCurrentPage(1); // Reset to first page
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

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedInvestors = investors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(investors.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
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
      // Ensure we have latest investors
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
  }, [id]);


  const getImageUrl = (img) => {
    if (!img) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop';
    if (img?.startsWith('http')) return img;
    return `${BASE_URL}/${img?.replace(/\\/g, '/')}`;
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

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 lg:p-12 font-['Inter']">
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.03] border border-white/10 text-white hover:bg-white/10 transition-all group"
        >
          <HiOutlineChevronLeft className="text-xl group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Projects</span>
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
                {/* Optional: Small preview if we could get a frame, but for now just the icon is clean */}
              </button>
            )}
          </section>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6 mt-12 lg:mt-0">
          {[
            { label: 'Target ROI', value: `${project.roi}%`, icon: HiOutlineTrendingUp, color: 'text-[#ccff00]' },
            { label: 'Duration', value: `${project.duration} Months`, icon: HiOutlineClock, color: 'text-blue-400' },
            { label: 'Target Amount', value: `₹${Number(project.targetAmount).toLocaleString('en-IN')}`, icon: HiOutlineCurrencyRupee, color: 'text-purple-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#0c0c0c] border border-white/5 p-8 rounded-3xl hover:border-white/10 transition-colors group">
              <div className={`p-3 rounded-2xl bg-white/[0.03] w-fit mb-6 group-hover:scale-110 transition-transform`}>
                <stat.icon className={`text-2xl ${stat.color}`} />
              </div>
              <p className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-white">{stat.value}</p>
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

      {/* Funding Analysis Full Row */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3 uppercase">
          <HiOutlineChartBar className="text-[#ccff00]" />
          Funding Progress
        </h2>
        <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-10 md:p-14 relative overflow-hidden group">
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#ccff00]/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-10">
              <div className="space-y-2">
                <p className="text-[0.7rem] text-gray-500 font-bold uppercase tracking-[0.3em]">Capital Secured</p>
                <p className="text-5xl md:text-7xl font-black text-[#ccff00] ">
                  ₹{Number(project.collectedAmount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="text-left md:text-right space-y-2">
                <p className="text-[0.7rem] text-gray-500 font-bold uppercase tracking-[0.3em]">Investment Goal</p>
                <p className="text-2xl md:text-4xl font-bold text-white">₹{Number(project.targetAmount).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="w-full h-5 bg-[#ccff00]/10 rounded-full overflow-hidden mb-6 p-1 border border-[#ccff00]/20">
              <div
                className="h-full bg-[#ccff00] rounded-full shadow-[0_0_30px_rgba(204,255,0,0.3)] transition-all duration-1500 ease-out"
                style={{ width: `${Math.min(100, (Number(project.collectedAmount || 0) / Number(project.targetAmount || 1)) * 100)}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[0.7rem] font-black uppercase tracking-[0.25em]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="text-white">
                  {Math.round((Number(project.collectedAmount || 0) / Number(project.targetAmount || 1)) * 100)}% Complete
                </span>
              </div>
            </div>

            <div className="mt-12 pt-10 border-t border-white/5 flex flex-wrap gap-4">

              {(project.status === 'ONGOING' || project.status === 'EXPIRED') && (
                <button 
                  onClick={() => navigate(`/dashboard/projects/settlement/${id}`)}
                  className="px-8 py-4 rounded-2xl bg-white hover:bg-gray-200 text-black font-black text-[0.7rem] tracking-[0.2em] uppercase transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  <HiOutlineCheckCircle className="text-lg" />
                  Mark as Completed
                </button>
              )}
              <button 
                onClick={handleDownloadStatement}
                className="px-8 py-4 rounded-2xl bg-[#ccff00] hover:bg-[#b3ff00] text-black font-black text-[0.7rem] tracking-[0.2em] uppercase shadow-[0_0_30px_rgba(204,205,0,0.15)] transition-all flex items-center gap-3"
              >
                <HiOutlineTag className="text-lg" />
                Download Statement
              </button>


              <button
                onClick={() => {
                  setIsInvestorModalOpen(true);
                  fetchInvestors();
                }}
                className="px-8 py-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] text-white font-bold text-[0.7rem] tracking-[0.2em] uppercase transition-all flex items-center gap-3"
              >
                <HiOutlineStar className="text-lg text-[#ccff00]" />
                Investor List
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Investor List Modal */}
      {isInvestorModalOpen && (
        <div className="fixed inset-0 lg:left-[280px] z-[40] bg-[#0c0c0c] flex flex-col animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-8 md:p-12 border-b border-white/5 bg-black/20">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 flex items-center justify-center text-[#ccff00]">
                  <HiOutlineStar className="text-2xl" />
                </div>
                <h2 className="text-3xl font-black text-white  uppercase">Project Investors</h2>
              </div>
              <p className="text-gray-500 text-xs font-bold uppercase tracking-[0.2em]">
                {project?.projectName} • Total Capital Secured: <span className="text-white">₹{Number(project?.collectedAmount).toLocaleString()}</span>
              </p>
            </div>
            <button
              onClick={() => setIsInvestorModalOpen(false)}
              className="w-14 h-14 rounded-2xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all border border-white/10"
            >
              <HiX className="text-2xl" />
            </button>
          </div>

          {/* Table Header (Fixed) */}
          <div className="px-8 md:px-12 py-6 bg-black/40 border-b border-white/5">
            <div className="grid grid-cols-5 text-[13px] font-black uppercase text-gray-600">
              <div className="col-span-2">Investor Identity</div>
              <div>Primary Contact</div>
              <div className="text-right">Allocation</div>
              <div className="text-right">Transaction Details</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
            {isLoadingInvestors ? (
              <div className="h-full flex flex-col items-center justify-center gap-6">
                <div className="w-12 h-12 border-4 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin" />
                <p className="text-gray-600 text-xs font-black uppercase tracking-[0.4em] animate-pulse">Syncing Institutional Ledger...</p>
              </div>
            ) : investors.length > 0 ? (
              <div className="space-y-4 max-w-7xl mx-auto">
                {paginatedInvestors.map((inv, idx) => (
                  <div key={idx} className="grid grid-cols-5 items-center p-8 bg-white/[0.02] border border-white/[0.05] rounded-[2rem]  group">
                    <div className="col-span-2 flex items-center gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400 ">
                        <HiOutlineUser className="text-2xl" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-white ">{inv.investor?.fullName || 'Unknown User'}</p>
                        <p className="text-gray-500 text-sm font-medium">{inv.investor?.email}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 text-gray-400 font-medium">
                        <HiOutlinePhone className="text-[#ccff00] text-sm" />
                        <span>{inv.investor?.mobileNumber || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-semibold text-white ">₹{Number(inv.amount).toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-sm font-bold text-white">
                        {new Date(inv.created_at).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-[10px] text-[#ccff00] font-black uppercase tracking-widest">
                        {new Date(inv.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-6 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                  <HiOutlineUser className="text-4xl text-gray-800" />
                </div>
                <p className="text-gray-600 text-xs font-black uppercase tracking-[0.4em]">No institutional records found</p>
              </div>
            )}
          </div>

          <div className="p-8 md:p-12 pb-16 md:pb-20 border-t border-white/5 bg-black/40 flex flex-col items-center justify-center gap-8">
            {/* Pagination Controls */}
            {totalPages > 1 ? (
              <div className="flex flex-col items-center gap-6 w-full">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-10 disabled:cursor-not-allowed hover:bg-white/10 transition-all active:scale-95 flex items-center gap-3 group"
                  >
                    <HiOutlineChevronLeft className="text-lg group-hover:-translate-x-1 transition-transform" />
                    Previous Allocation
                  </button>

                  <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[1.25rem] border border-white/10">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => handlePageChange(i + 1)}
                        className={`w-11 h-11 rounded-xl text-[10px] font-black transition-all duration-300 active:scale-90 ${currentPage === i + 1
                            ? 'bg-[#ccff00] text-black shadow-[0_0_30px_rgba(204,255,0,0.4)]'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                          }`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-10 disabled:cursor-not-allowed hover:bg-white/10 transition-all active:scale-95 flex items-center gap-3 group"
                  >
                    Next Allocation
                    <HiOutlineChevronLeft className="text-lg rotate-180 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
                <div className="flex items-center justify-between w-full mt-4">
                   <div className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-4">
                      <div className="h-[1px] w-12 bg-white/10" />
                      Audit Registry Page {currentPage} of {totalPages}
                   </div>
                </div>
              </div>
            ) : (
              <div className="w-full flex items-center justify-between">
                <div className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">
                  Registry Audit Complete • {investors.length} Record{investors.length !== 1 ? 's' : ''} Verified
                </div>
              </div>
            )}
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
