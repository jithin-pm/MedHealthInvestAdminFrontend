import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  HiOutlineTrendingUp,
  HiOutlineChevronLeft,
  HiOutlineUser,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCurrencyRupee,
  HiX,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineDownload,
  HiOutlineTag,
  HiOutlineClock,
  HiOutlineInformationCircle,
  HiOutlinePlay
} from 'react-icons/hi';
import { FaImage } from 'react-icons/fa';
import { LuCrown } from 'react-icons/lu';
import { BASE_URL } from '../../services/baseUrl';
import { 
  getProjectByIdApi, 
  getAllUsersApi, 
  getUserFinancialDetailsApi, 
  getProjectInvestorsApi 
} from '../../services/allApi';
import Swal from 'sweetalert2';
import { generateProjectStatement } from '../../Utils/generateStatement';
import { getErrorMessage, getErrorTitle } from '../../Utils/getErrorMessage';

const ExclusiveProjectDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Project & Data State
  const [project, setProject] = React.useState(location.state?.project || null);
  const [loading, setLoading] = React.useState(!location.state?.project);
  const [assignedUser, setAssignedUser] = React.useState(null);
  const [financialDetails, setFinancialDetails] = React.useState(null);
  const [investors, setInvestors] = React.useState([]);

  // Modals State
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = React.useState(false);

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getProjectByIdApi(id);
      if (res.status === 200) {
        setProject(res.data);
      }
    } catch (err) {
      console.error("Error fetching exclusive project details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignedUser = async (userId) => {
    try {
      const response = await getAllUsersApi();
      if (response.status === 200) {
        const user = response.data.find(u => String(u.id) === String(userId));
        if (user) setAssignedUser(user);
      }
      
      const finRes = await getUserFinancialDetailsApi(userId);
      if (finRes.status === 200) {
        setFinancialDetails(finRes.data);
      }
    } catch (error) {
      console.error("Fetch user error:", error);
    }
  };

  const fetchInvestors = async () => {
    if (!id) return;
    try {
      const res = await getProjectInvestorsApi(id);
      if (res.status === 200) {
        setInvestors(res.data.investments || []);
      }
    } catch (err) {
      console.error("Error fetching investors:", err);
    }
  };

  React.useEffect(() => {
    fetchProject();
    fetchInvestors();
  }, [id]);

  React.useEffect(() => {
    const targetUserId = project?.exclusiveUserId || project?.assignedUserId;
    if (targetUserId) {
      fetchAssignedUser(targetUserId);
    } else if (project?.assignedUser) {
      setAssignedUser(project.assignedUser);
      if (project.assignedUser.id) {
        getUserFinancialDetailsApi(project.assignedUser.id).then(res => {
          if (res.status === 200) setFinancialDetails(res.data);
        }).catch(err => console.error(err));
      }
    }
  }, [project]);

  const getImageUrl = (img) => {
    if (!img) return '';
    if (img?.startsWith('http')) return img;
    const cleanPath = String(img).replace(/\\/g, '/').replace(/^\/+/, '');
    return `${BASE_URL}/${cleanPath}`;
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
      const filename = imgPath.split(/[/\\]/).pop() || 'proof-document.png';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed, opening in new tab:', error);
      window.open(fullUrl, '_blank');
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
      const investorList = res.status === 200 ? (res.data.investments || []) : investors;
      generateProjectStatement(project, investorList);
      Swal.fire({
        icon: 'success',
        title: 'Statement Downloaded',
        text: 'The audit report has been generated successfully.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err) {
      console.error("Statement generation error:", err);
      Swal.fire({
        icon: 'error',
        title: getErrorTitle(err),
        text: getErrorMessage(err, 'An error occurred while generating the statement.')
      });
    }
  };

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
        <button onClick={() => navigate('/dashboard/exclusive-projects')} className="text-[#ccff00] underline">Go Back</button>
      </div>
    );
  }

  const formatDisplayDate = (dateVal) => {
    if (!dateVal) return 'N/A';
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const primaryInvestment = (investors && investors.length > 0) ? investors[0] : null;
  const proofAttachment = 
    primaryInvestment?.paybackProof || 
    primaryInvestment?.paymentProof || 
    primaryInvestment?.proof || 
    primaryInvestment?.transactionProof || 
    project.preSettledProof || 
    project.paymentProof || 
    project.proof;

  const capitalInvested = parseFloat(primaryInvestment?.amount || project.collectedAmount || project.targetAmount || 0);
  const targetAmount = parseFloat(project.targetAmount || 0);
  const durationMonths = Number(project.duration || 1);
  const estReturns = Math.round((capitalInvested * Number(project.roi || 0) * durationMonths) / 100);
  const capitalPlusInterest = capitalInvested + estReturns;

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 lg:p-12 font-['Inter']">
      {/* Navigation Header */}
      <div className="flex flex-col gap-6 mb-12">
        <button
          onClick={() => navigate('/dashboard/exclusive-projects')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-all group w-fit"
        >
          <HiOutlineChevronLeft className="text-xl group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Exclusive Projects</span>
        </button>
        
        <div className="flex flex-col gap-1">
          <span className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">Project Name</span>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">{project.projectName}</h1>
          <span className="px-3 py-1 bg-white/10 border border-white/20 text-white/70 text-xs font-black rounded uppercase tracking-widest">
            ID: {project.id}
          </span>
          {project.status === 'EXPIRED' ? (
            <span className="px-3 py-1 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-black rounded uppercase tracking-widest flex items-center gap-1.5 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.3)]">
              Refund Pending
            </span>
          ) : (
            <span className="px-3 py-1 bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] text-xs font-black rounded uppercase tracking-widest">
              {project.status}
            </span>
          )}
          {project.projectCategory && (
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-400 text-xs font-black rounded uppercase tracking-widest">
              {project.projectCategory}
            </span>
          )}
        </div>
      </div>
    </div>

      {/* Top 2-Column Grid: Financial Overview & Assigned Investor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        
        {/* Financial Overview Card */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccff00]/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
          
          <h3 className="text-[0.7rem] font-black text-gray-500 uppercase tracking-[0.2em] mb-8">Financial Overview</h3>
          
          <div className="space-y-8">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <HiOutlineCurrencyRupee className="text-[#ccff00] text-lg" />
                Capital Invested
              </p>
              <p className="text-3xl font-black text-white"><span className="mr-1">₹</span>{capitalInvested.toLocaleString('en-IN')}</p>
            </div>
            
            <div className="w-full h-px bg-gradient-to-r from-white/10 to-transparent" />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <HiOutlineTrendingUp className="text-[#ccff00] text-lg" />
                  Projected ROI
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-[#ccff00]">{project.roi}%</p>
                </div>
              </div>

              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <HiOutlineClock className="text-[#ccff00] text-lg" />
                  Duration
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-white">{project.duration}</p>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1.5">Months</p>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-white/10 to-transparent" />
            
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                <HiOutlineCurrencyRupee className="text-[#ccff00] text-lg" />
                Investment Breakdown
              </p>
              <div className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                  <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-[0.65rem] mb-2">Capital Invested</span>
                    <span className="text-white font-black text-lg"><span className="mr-0.5">₹</span>{capitalInvested.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-[#ccff00]/[0.05] border border-[#ccff00]/20 rounded-2xl p-4 flex flex-col justify-between shadow-[inset_0_0_20px_rgba(204,255,0,0.02)]">
                    <span className="text-[#ccff00]/70 font-bold uppercase tracking-widest text-[0.65rem] mb-2">Total Interest</span>
                    <span className="text-[#ccff00] font-black text-lg">+<span className="mr-0.5">₹</span>{estReturns.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="bg-white/[0.05] border border-[#ccff00]/30 rounded-2xl p-4 flex flex-col justify-between bg-gradient-to-br from-[#ccff00]/10 to-transparent">
                    <span className="text-[#ccff00] font-black uppercase tracking-widest text-[0.65rem] mb-2">Capital + Interest</span>
                    <span className="text-white font-black text-lg"><span className="mr-0.5">₹</span>{capitalPlusInterest.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Investor Card */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-[0.7rem] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <LuCrown className="text-xl text-[#ccff00]" />
                Assigned Investor
              </h3>
              {assignedUser && (
                <button
                  onClick={() => setIsUserModalOpen(true)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-[#ccff00] transition-all flex items-center gap-1.5 text-xs font-bold"
                  title="View Investor Protocol Profile"
                >
                  <HiOutlineInformationCircle className="text-lg" />
                  <span>View Profile</span>
                </button>
              )}
            </div>
            
            {assignedUser ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#ccff00] flex items-center justify-center text-black font-black text-xl">
                    {assignedUser.fullName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-bold text-white">{assignedUser.fullName}</h4>
                      <span className="px-2 py-0.5 rounded text-[0.7rem] font-mono font-bold bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 tracking-wider">
                        {assignedUser.customUserId || `MHI2026${String(assignedUser.id).padStart(2, '0')}`}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 bg-[#ccff00]/10 text-[#ccff00] text-[0.6rem] font-bold rounded uppercase tracking-widest">Active Profile</span>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-400">
                      <HiOutlineMail className="text-lg text-[#ccff00]" />
                      <span className="text-sm font-medium text-white">{assignedUser.email}</span>
                    </div>
                  </div>
                  {assignedUser.mobileNumber && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-gray-400">
                        <HiOutlinePhone className="text-lg text-[#ccff00]" />
                        <span className="text-sm font-medium text-white">
                          {assignedUser.countryCode ? `${assignedUser.countryCode} ` : ''}{assignedUser.mobileNumber}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Investor Details summary preview */}
                {financialDetails && (
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 mt-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Taxation ID (PAN)</span>
                      <span className="text-white font-mono font-bold">{financialDetails?.pan?.panNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Bank Institution</span>
                      <span className="text-white font-medium">{financialDetails?.bank?.bankName || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Account No</span>
                      <span className="text-white font-mono font-bold">{financialDetails?.bank?.accountNumber || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                <HiOutlineUser className="text-4xl text-gray-500 mb-2" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Investor Assigned</p>
              </div>
            )}
          </div>

          {/* Action Buttons in Card */}
          <div className="pt-8 border-t border-white/5 flex flex-wrap gap-3 mt-6">
            {(project.status === 'ONGOING' || project.status === 'EXPIRED') && (
              <button 
                onClick={() => navigate(`/dashboard/exclusive-projects/settlement/${id}`)}
                className="flex-1 py-3.5 rounded-xl bg-white hover:bg-gray-200 text-black font-black text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
              >
                <HiOutlineCheckCircle className="text-lg" />
                {project.status === 'EXPIRED' ? 'Process Refund' : 'Initiate Settlement'}
              </button>
            )}
            <button 
              onClick={handleDownloadStatement}
              className="py-3.5 px-5 rounded-xl bg-[#ccff00] hover:bg-[#b3ff00] text-black font-black text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(204,255,0,0.2)] transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <HiOutlineTag className="text-lg" />
              Download Statement
            </button>
          </div>
        </div>
      </div>

      {/* Initial Investment Data Section */}
      <div className="mb-12">
        <section className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xs font-black text-[#ccff00] uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ccff00] animate-pulse"></span>
              Initial Investment Data
            </h3>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest rounded-tl-xl">Investor</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">Investment Date</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">Amount Invested</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">Percentage (ROI)</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-[#ccff00] uppercase tracking-widest">Capital + Interest</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest text-right rounded-tr-xl">Attachment</th>
                </tr>
              </thead>
              <tbody>
                {investors && investors.length > 0 ? (
                  investors.map((inv, idx) => {
                    const invProof = inv.paybackProof || inv.paymentProof || inv.proof || inv.transactionProof || project.preSettledProof || project.paymentProof || project.proof;
                    const invDateVal = inv.created_at || inv.createdAt || project.ongoingStartDate || project.created_at || project.createdAt;
                    const invInvestorName = inv.investor?.fullName || assignedUser?.fullName || 'N/A';
                    const invAmount = parseFloat(inv.amount || capitalInvested);
                    const invInterest = Math.round((invAmount * Number(project.roi || 0) * durationMonths) / 100);
                    const invTotal = invAmount + invInterest;

                    return (
                      <tr key={inv.id || idx} className="border-b border-white/5 hover:bg-white/[0.04] transition-colors bg-white/[0.01]">
                        <td className="py-6 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#ccff00]/20 text-[#ccff00] border border-[#ccff00]/20 flex items-center justify-center font-black text-sm shrink-0">
                              {invInvestorName?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-white truncate max-w-[200px]">{invInvestorName}</span>
                              <span className="px-1.5 py-0.5 rounded text-[0.65rem] font-mono font-semibold bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 tracking-wider max-w-fit mt-1">
                                {inv.investor?.customUserId || assignedUser?.customUserId || (inv.userId ? `MHI2026${String(inv.userId).padStart(2, '0')}` : '---')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-6 px-6">
                          <span className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs font-medium border border-white/10 shadow-inner">
                            {formatDisplayDate(invDateVal)}
                          </span>
                        </td>
                        <td className="py-6 px-6">
                          <span className="text-lg font-black text-white">
                            <span className="mr-0.5">₹</span>{invAmount.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-6 px-6">
                          <span className="text-lg font-black text-white">
                            {project.roi}%
                          </span>
                        </td>
                        <td className="py-6 px-6">
                          <span className="text-lg font-black text-[#ccff00] drop-shadow-[0_0_10px_rgba(204,255,0,0.3)]">
                            <span className="mr-0.5">₹</span>{invTotal.toLocaleString('en-IN')}
                          </span>
                          <span className="block text-[10px] text-gray-400 font-medium">
                            (+₹{invInterest.toLocaleString('en-IN')})
                          </span>
                        </td>
                        <td className="py-6 px-6 text-right">
                          {invProof ? (
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => setSelectedImage(invProof)}
                                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                                title="View Proof"
                              >
                                <HiOutlineEye className="text-lg" />
                              </button>
                              <button 
                                onClick={(e) => handleDownloadProof(invProof, e)}
                                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                                title="Download Proof"
                              >
                                <HiOutlineDownload className="text-lg" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs font-medium italic bg-white/5 px-3 py-1.5 rounded-lg">No Proof Attached</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="border-b border-white/5 hover:bg-white/[0.04] transition-colors bg-white/[0.01]">
                    <td className="py-6 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#ccff00]/20 text-[#ccff00] border border-[#ccff00]/20 flex items-center justify-center font-black text-sm shrink-0">
                          {assignedUser ? assignedUser.fullName?.[0]?.toUpperCase() : '?'}
                        </div>
                        <span className="text-sm font-bold text-white truncate max-w-[200px]">{assignedUser ? assignedUser.fullName : 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <span className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs font-medium border border-white/10 shadow-inner">
                        {formatDisplayDate(project.ongoingStartDate || project.created_at || project.createdAt)}
                      </span>
                    </td>
                    <td className="py-6 px-6">
                      <span className="text-lg font-black text-white">
                        <span className="mr-0.5">₹</span>{capitalInvested.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-6 px-6">
                      <span className="text-lg font-black text-white">
                        {project.roi}%
                      </span>
                    </td>
                    <td className="py-6 px-6">
                      <span className="text-lg font-black text-[#ccff00] drop-shadow-[0_0_10px_rgba(204,255,0,0.3)]">
                        <span className="mr-0.5">₹</span>{capitalPlusInterest.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-gray-400 font-medium">
                        (+₹{estReturns.toLocaleString('en-IN')})
                      </span>
                    </td>
                    <td className="py-6 px-6 text-right">
                      {proofAttachment ? (
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedImage(proofAttachment)}
                            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                            title="View Proof"
                          >
                            <HiOutlineEye className="text-lg" />
                          </button>
                          <button 
                            onClick={(e) => handleDownloadProof(proofAttachment, e)}
                            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
                            title="Download Proof"
                          >
                            <HiOutlineDownload className="text-lg" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-xs font-medium italic bg-white/5 px-3 py-1.5 rounded-lg">No Proof Attached</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Project Presentation Media (if available) */}
      {(projectImages.length > 0 || project.projectVideo) && (
        <div className="mb-12">
          <section className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 overflow-hidden shadow-2xl">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <FaImage className="text-[#ccff00]" />
              Project Presentation & Media
            </h3>
            <div className="flex items-center gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {projectImages.map((img, idx) => (
                <button
                  key={`img-${idx}`}
                  onClick={() => setSelectedImage(img)}
                  className="relative w-36 md:w-48 aspect-video rounded-2xl overflow-hidden border border-white/10 hover:border-[#ccff00] transition-all shrink-0 group"
                >
                  <img src={getImageUrl(img)} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <HiOutlineEye className="text-white text-xl" />
                  </div>
                </button>
              ))}
              {project.projectVideo && (
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="relative w-36 md:w-48 aspect-video rounded-2xl overflow-hidden border border-white/10 hover:border-[#ccff00] transition-all shrink-0 bg-white/5 flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#ccff00] flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                    <HiOutlinePlay className="text-xl translate-x-0.5" />
                  </div>
                  <span className="text-[9px] font-black uppercase text-white tracking-widest">Presentation</span>
                </button>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center">
            <div className="w-full flex justify-end mb-4">
              <button 
                onClick={() => setSelectedImage(null)}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md"
              >
                <HiX className="text-xl" />
              </button>
            </div>
            <div className="relative w-full rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
              <img 
                src={getImageUrl(selectedImage)} 
                alt="Document Preview" 
                className="w-full h-auto max-h-[80vh] object-contain bg-black/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-5xl aspect-video rounded-[2.5rem] overflow-hidden">
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
              className="w-full h-full object-contain bg-black"
            />
          </div>
        </div>
      )}

      {/* User Information Modal (Investor Protocol Profile) */}
      {isUserModalOpen && assignedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#ccff00] flex items-center justify-center text-black font-black text-lg">
                  {assignedUser.fullName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white tracking-tight">{assignedUser.fullName}</h3>
                    <span className="px-2 py-0.5 rounded text-[0.7rem] font-mono font-bold bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 tracking-wider">
                      {assignedUser.customUserId || `MHI2026${String(assignedUser.id).padStart(2, '0')}`}
                    </span>
                  </div>
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
                  <span className="text-sm font-medium text-white break-all">{assignedUser.email}</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Mobile Number</span>
                  <span className="text-sm font-medium text-white">{assignedUser.mobileNumber || '+91 98765 43210'}</span>
                </div>
              </div>

              {/* Dummy/Actual PAN Card Section */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                </div>
                <div className="relative z-10">
                  <span className="text-[9px] font-black text-[#ccff00] uppercase tracking-[0.3em] mb-4 block">Taxation ID (PAN)</span>
                  <div className="flex flex-col gap-1">
                    <p className="text-lg font-black text-white tracking-[0.3em] uppercase">{financialDetails?.pan?.panNumber || 'ABCDE1234F'}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Permanent Account Number</p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <HiOutlineTag className="text-[#ccff00]" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Institutional Settlement Details</span>
                </div>
                <div className="grid grid-cols-2 gap-y-4">
                  <div>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Bank Name</p>
                    <p className="text-xs font-bold text-white uppercase">{financialDetails?.bank?.bankName || 'HDFC BANK LIMITED'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">IFSC Code</p>
                    <p className="text-xs font-bold text-white tracking-widest uppercase">{financialDetails?.bank?.ifsc || 'HDFC0001234'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Account Number</p>
                    <p className="text-lg font-black text-white tracking-[0.1em]">{financialDetails?.bank?.accountNumber || '50100456789012'}</p>
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

    </div>
  );
};

export default ExclusiveProjectDetails;
