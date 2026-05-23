import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  HiOutlineChevronLeft,
  HiOutlineStar,
  HiOutlineUser,
  HiOutlinePhone,
  HiOutlineCheckCircle,
  HiOutlinePaperClip,
  HiOutlineLibrary,
  HiOutlineIdentification,
  HiOutlineCloudUpload,
  HiOutlineInformationCircle,
  HiOutlineTag,
  HiOutlineClock,
  HiX
} from 'react-icons/hi';
import { getProjectByIdApi, getProjectInvestorsApi, editProjectApi, getUserFinancialDetailsApi, recordPaybackApi } from '../../services/allApi';
import { BASE_URL } from '../../services/baseUrl';
import Swal from 'sweetalert2';

const SettlementManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = React.useState(null);
  const [investors, setInvestors] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [isLoadingInvestors, setIsLoadingInvestors] = React.useState(false);

  // Payback Modal State
  const [isPaybackModalOpen, setIsPaybackModalOpen] = React.useState(false);
  const [selectedInvestment, setSelectedInvestment] = React.useState(null);
  const [financialDetails, setFinancialDetails] = React.useState(null);
  const [isFetchingDetails, setIsFetchingDetails] = React.useState(false);
  const [paybackProof, setPaybackProof] = React.useState(null);
  const [isUploadingProof, setIsUploadingProof] = React.useState(false);

  // User Info Modal State
  const [isUserModalOpen, setIsUserModalOpen] = React.useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = React.useState(null);
  const [modalFinancialDetails, setModalFinancialDetails] = React.useState(null);
  const [isLoadingModalDetails, setIsLoadingModalDetails] = React.useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 8;

  const fetchProjectData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getProjectByIdApi(id);
      if (res.status === 200) {
        setProject(res.data);
      }
    } catch (err) {
      console.error("Error fetching project:", err);
    } finally {
      setLoading(false);
    }
  };

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

  React.useEffect(() => {
    fetchProjectData();
    fetchInvestors();
  }, [id]);

  // Auto-prompt for finalization
  const allPaid = investors.length > 0 && investors.every(inv => inv.paybackStatus === 'PAID');
  
  React.useEffect(() => {
    if (allPaid && (project?.status === 'ONGOING' || project?.status === 'EXPIRED')) {
      const timer = setTimeout(() => {
        Swal.fire({
          title: 'All Payouts Verified',
          text: 'Every investor in this registry has been settled. Would you like to finalize project closure now?',
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Finalize Closure',
          cancelButtonText: 'Not Now',
          background: '#0c0c0c',
          color: '#fff',
          confirmButtonColor: '#ccff00',
          cancelButtonColor: '#1a1a1a'
        }).then((result) => {
          if (result.isConfirmed) {
            handleFinalizeCompletion();
          }
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [allPaid, project?.status]);

  const handleInitiatePayBack = async (investment) => {
    setSelectedInvestment(investment);
    setIsPaybackModalOpen(true);
    setIsFetchingDetails(true);
    try {
      const res = await getUserFinancialDetailsApi(investment.userId);
      if (res.status === 200) {
        setFinancialDetails(res.data);
      }
    } catch (error) {
      console.error("Error fetching financial details:", error);
      Swal.fire('Warning', 'Could not fetch bank details.', 'info');
    } finally {
      setIsFetchingDetails(false);
    }
  };

  const handlePaybackSubmit = async (e) => {
    e.preventDefault();
    if (!paybackProof) {
      Swal.fire('Required', 'Please upload payment proof.', 'warning');
      return;
    }

    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('paybackProof', paybackProof);

      const res = await recordPaybackApi(selectedInvestment.id, formData);
      if (res.status === 200) {
        Swal.fire('Success', 'Settlement recorded successfully.', 'success');
        setIsPaybackModalOpen(false);
        setPaybackProof(null);
        fetchInvestors();
      }
    } catch (error) {
      console.error("Error recorded settlement:", error);
      Swal.fire('Error', 'Failed to record settlement.', 'error');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleOpenUserModal = async (investor) => {
    setSelectedUserForModal(investor);
    setIsUserModalOpen(true);
    setIsLoadingModalDetails(true);
    setModalFinancialDetails(null);
    try {
      const res = await getUserFinancialDetailsApi(investor.id);
      if (res.status === 200) {
        setModalFinancialDetails(res.data);
      }
    } catch (error) {
      console.error("Error fetching modal user details:", error);
    } finally {
      setIsLoadingModalDetails(false);
    }
  };

  const handleFinalizeCompletion = async () => {
    try {
      const res = await editProjectApi(id, { status: 'COMPLETED' });
      if (res.status === 200) {
        await Swal.fire({
          title: 'Settlement Finalized!',
          text: 'Project has been officially closed and recorded.',
          icon: 'success',
          background: '#0c0c0c',
          color: '#fff',
          confirmButtonColor: '#ccff00'
        });
        navigate('/dashboard/projects/completed');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'Failed to update project status.', 'error');
    }
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      background: '#0c0c0c',
      color: '#fff',
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
      }
    });
    Toast.fire({
      icon: 'success',
      title: `${label} copied successfully`
    });
  };


  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedInvestors = investors.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(investors.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060606] p-4 md:p-6 lg:p-8 font-['Inter']">
      {/* Header */}
      <div className="max-w-7xl mx-auto space-y-6 mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-5">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-500 hover:text-white transition-all group"
            >
              <HiOutlineChevronLeft className="text-lg group-hover:-translate-x-1 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Back to Project</span>
            </button>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#ccff00]/10 flex items-center justify-center text-[#ccff00]">
                <HiOutlineLibrary className="text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold text-white uppercase tracking-tight">Settlement Management</h1>     
                </div>
                
              </div>
            </div>
          </div>

          {(project?.status === 'ONGOING' || project?.status === 'EXPIRED') && allPaid && (
            <button
              onClick={handleFinalizeCompletion}
              className="px-8 py-4 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.05)] flex items-center gap-3 animate-in zoom-in duration-500"
            >
              <HiOutlineCheckCircle className="text-lg" />
              Finalize Closure
            </button>
          )}
        </div>
      </div>

      {/* Project Summary Details */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Project Name', value: project?.projectName, icon: HiOutlineLibrary },
            { label: 'Classification', value: project?.projectCategory, icon: HiOutlineTag },
            { label: 'Project Type', value: project?.projectType, icon: HiOutlineStar },
            { label: 'Financial ROI', value: project?.status === 'EXPIRED' ? 'Refund Only' : `${project?.roi}%`, icon: HiOutlineLibrary },
            { label: 'Term Duration', value: `${project?.duration} Months`, icon: HiOutlineClock },
            { label: 'Registry Count', value: `${investors.length} Records`, icon: HiOutlineUser }
          ].map((item, i) => (
            <div key={i} className="bg-[#0c0c0c] border border-white/5 p-5 rounded-2xl flex flex-col gap-3 group hover:border-[#ccff00]/20 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">{item.label}</span>
                <item.icon className="text-gray-700 group-hover:text-[#ccff00] transition-colors" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight truncate">{item.value || 'N/A'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Investor Registry */}
      <div className="max-w-7xl mx-auto">
        <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <div className="p-6 space-y-4">
            {/* Scrollable Container */}
            <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-[#ccff00]/20 hover:scrollbar-thumb-[#ccff00]/40 transition-all">
              <div className="min-w-[1000px] space-y-4">
                <div className="grid grid-cols-6 text-[9px] font-black uppercase text-gray-600 px-4 pb-2 tracking-widest border-b border-white/5">
                  <div className="col-span-2">Investor Profile</div>
                  <div className="text-center">Allocation</div>
                  <div className="text-center">Transaction ID</div>
                  <div className="text-center">Payback Status</div>
                  <div className="text-right">Action</div>
                </div>

                <div className="space-y-2">
                  {isLoadingInvestors ? (
                    <div className="py-12 flex flex-col items-center justify-center gap-4">
                      <div className="w-6 h-6 border-2 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin" />
                      <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest animate-pulse">Syncing Registry...</span>
                    </div>
                  ) : paginatedInvestors.length > 0 ? (
                    paginatedInvestors.map((inv, idx) => (
                      <div key={idx} className="grid grid-cols-6 items-center p-4 bg-white/[0.01] border border-white/5 rounded-2xl hover:bg-white/[0.03] transition-all group">
                        <div className="col-span-2 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center text-gray-500 group-hover:text-[#ccff00] transition-colors">
                            <HiOutlineUser className="text-xl" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-base font-bold text-white tracking-tight">{inv.investor?.fullName || 'Anonymous'}</p>
                              <HiOutlineInformationCircle
                                onClick={() => handleOpenUserModal(inv.investor)}
                                className="text-gray-500 hover:text-[#ccff00] cursor-pointer transition-colors text-lg"
                              />
                            </div>
                            <p className="text-gray-500 text-[11px] font-medium">{inv.investor?.email}</p>
                          </div>
                        </div>

                        <div className="text-left flex flex-col space-y-1">
                          <span className="text-[13px] font-semibold text-white">₹ {Number(inv.amount).toLocaleString()}  </span>

                          {project?.status !== 'EXPIRED' && (
                            <>
                              <span className="text-[13px] font-semibold text-[#ccff00]">
                                + ₹ {Math.round((Number(inv.amount) * Number(project?.roi || 0) * Number(project?.duration || 1)) / 100).toLocaleString()}
                              </span>

                              <span className='h-[.1rem] w-full bg-zinc-800 my-1' ></span>

                              <span className="text-base font-semibold text-white">
                                ₹ {Math.round(Number(inv.amount) + (Number(inv.amount) * Number(project?.roi || 0) * Number(project?.duration || 1)) / 100).toLocaleString()}
                              </span>
                            </>
                          )}

                          {project?.status === 'EXPIRED' && (
                            <>
                              <span className='h-[.1rem] w-full bg-zinc-800 my-1' ></span>
                              <span className="text-base font-semibold text-white">
                                ₹ {Number(inv.amount).toLocaleString()}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="text-center">
                          <span className="text-[9px] font-black text-zinc-600 tracking-widest bg-zinc-900 px-2.5 py-1 rounded-md border border-white/5">
                            #{inv.id.toString().padStart(6, '0')}
                          </span>
                        </div>

                        <div className="flex justify-center">
                          {inv.paybackStatus === 'PAID' ? (
                            <span className="px-3 py-1.5 rounded-lg bg-[#ccff00]/10 text-[#ccff00] text-[8px] font-black uppercase tracking-[0.2em] border border-[#ccff00]/20 flex items-center gap-2">
                              <HiOutlineCheckCircle /> SETTLED
                            </span>
                          ) : (
                            <span className="px-3 py-1.5 rounded-lg bg-orange-500/10 text-orange-500 text-[8px] font-black uppercase tracking-[0.2em] border border-orange-500/20 flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-orange-500 animate-pulse" /> PENDING
                            </span>
                          )}
                        </div>

                        <div className="flex justify-end">
                          {inv.paybackStatus === 'PAID' ? (
                            inv.paybackProof && (
                              <a
                                href={`${BASE_URL}/${inv.paybackProof}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/10"
                              >
                                <HiOutlinePaperClip className="text-lg" />
                              </a>
                            )
                          ) : (
                            <button
                              onClick={() => handleInitiatePayBack(inv)}
                              className="px-6 py-3 rounded-lg bg-[#ccff00] hover:bg-[#b8e600] text-black text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(204,255,0,0.1)]"
                            >
                              Payback
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-gray-600 text-[10px] font-black uppercase tracking-widest">
                      No institutional records found for this project
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pt-12 flex justify-center gap-4">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-12 h-12 rounded-xl text-xs font-black transition-all ${currentPage === i + 1
                      ? 'bg-[#ccff00] text-black shadow-[0_0_30px_rgba(204,255,0,0.3)]'
                      : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payback Confirmation Modal (Same as before but integrated here) */}
      {isPaybackModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4  backdrop-blur-xs animate-in fade-in duration-300">
          <div className="relative w-full max-w-xl bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-zinc-800/20 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#ccff00] flex items-center justify-center text-black">
                  <HiOutlineLibrary className="text-2xl" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Financial Settlement</h3>
                  <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Verify Details & Upload Proof</p>
                </div>
              </div>
              <button onClick={() => setIsPaybackModalOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                <HiX className="text-2xl" />
              </button>
            </div>

            <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              {isFetchingDetails ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-2 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin" />
                  <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Accessing Vault...</span>
                </div>
              ) : (
                <div className="space-y-6">
                    {/* Bank Details section */}
                    <div className="flex flex-col">
                      <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 pb-2 border-b border-white/10">
                        Beneficiary Bank Details
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Account Holder</span>
                          <span className="text-white font-medium uppercase">
                            {financialDetails?.bank?.accountHolderName || 'N/A'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono font-bold">
                              {financialDetails?.bank?.accountNumber}
                            </span>
                            {financialDetails?.bank?.accountNumber && (
                              <button
                                onClick={() => handleCopyText(financialDetails.bank.accountNumber, 'Account Number')}
                                className="p-1 text-zinc-400 hover:text-white transition-all active:scale-90"
                                title="Copy"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">IFSC Code</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[#ccff00] font-mono font-bold uppercase tracking-wider">
                              {financialDetails?.bank?.ifsc}
                            </span>
                            {financialDetails?.bank?.ifsc && (
                              <button
                                onClick={() => handleCopyText(financialDetails.bank.ifsc, 'IFSC Code')}
                                className="p-1 text-zinc-400 hover:text-white transition-all active:scale-90"
                                title="Copy"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Bank Name</span>
                          <span className="text-white font-medium uppercase">
                            {financialDetails?.bank?.bankName}
                          </span>
                        </div>

                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Branch & City</span>
                          <span className="text-white font-medium uppercase">
                            {financialDetails?.bank?.branch || 'N/A'} • {financialDetails?.bank?.city || 'N/A'}
                          </span>
                        </div>

                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Payout Phone</span>
                          <span className="text-white font-mono font-medium">
                            {financialDetails?.bank?.payoutPhone || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* PAN details section */}
                    <div className="flex flex-col pt-4">
                      <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 pb-2 border-b border-white/10">
                        Identity Verification (PAN)
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">PAN Holder</span>
                          <span className="text-white font-medium uppercase">
                            {financialDetails?.pan?.fullName || 'N/A'}
                          </span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">PAN Number</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono font-bold tracking-wider uppercase">
                              {financialDetails?.pan?.panNumber}
                            </span>
                            {financialDetails?.pan?.panNumber && (
                              <button
                                onClick={() => handleCopyText(financialDetails.pan.panNumber, 'PAN Number')}
                                className="p-1 text-zinc-400 hover:text-white transition-all active:scale-90"
                                title="Copy"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>

                        {financialDetails?.pan?.dob && (
                          <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                            <span className="text-zinc-500">Date of Birth</span>
                            <span className="text-zinc-400">
                              {new Date(financialDetails.pan.dob).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                  <form onSubmit={handlePaybackSubmit} className="space-y-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Upload Payment Proof</label>
                      <div className="relative group/upload">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setPaybackProof(e.target.files[0])}
                          className="hidden"
                          id="payback-file"
                        />
                        <label
                          htmlFor="payback-file"
                          className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer group-hover/upload:border-[#ccff00]/30 group-hover/upload:bg-[#ccff00]/5 transition-all"
                        >
                          {paybackProof ? (
                            <div className="flex items-center gap-3 text-[#ccff00]">
                              <HiOutlineCheckCircle className="text-2xl" />
                              <span className="text-xs font-bold">{paybackProof.name}</span>
                            </div>
                          ) : (
                            <>
                              <HiOutlineCloudUpload className="text-3xl text-gray-600 mb-2 group-hover/upload:text-[#ccff00] transition-colors" />
                              <span className="text-xs text-gray-500 font-medium">Click to upload proof</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isUploadingProof}
                      className="w-full py-5 bg-[#ccff00] hover:bg-[#b8e600] disabled:bg-gray-800 text-black rounded-2xl text-xs font-black uppercase tracking-[0.3em] shadow-xl shadow-[#ccff00]/10 transition-all flex items-center justify-center gap-3"
                    >
                      {isUploadingProof ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Confirm Settlement <HiOutlineCheckCircle className="text-lg" /></>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Investor Protocol Profile Modal */}
      {isUserModalOpen && selectedUserForModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/20 backdrop-blur-xs animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

            {/* Header */}
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#ccff00] flex items-center justify-center text-black font-black text-lg">
                  {(selectedUserForModal.fullName?.[0] || 'U').toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{selectedUserForModal.fullName}</h3>
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
            <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {isLoadingModalDetails ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-2 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin" />
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Syncing Security Records...</span>
                </div>
              ) : (
                <>
                  {/* Contact Details */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Email Address</span>
                      <span className="text-sm font-medium text-white break-all">{selectedUserForModal.email}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Mobile Number</span>
                      <span className="text-sm font-medium text-white">{selectedUserForModal.mobileNumber || 'N/A'}</span>
                    </div>
                  </div>

                  {/* PAN Card Section */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <svg width="60" height="60" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" /></svg>
                    </div>
                    <div className="relative z-10">
                      <span className="text-[9px] font-black text-[#ccff00] uppercase tracking-[0.3em] mb-4 block">Taxation ID (PAN)</span>
                      <div className="flex flex-col gap-1">
                        <p className="text-lg font-black text-white tracking-[0.3em] uppercase">
                          {modalFinancialDetails?.pan?.panNumber || 'PENDING'}
                        </p>
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
                        <p className="text-xs font-bold text-white uppercase">
                          {modalFinancialDetails?.bank?.bankName || 'PENDING'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">IFSC Code</p>
                        <p className="text-xs font-bold text-white tracking-widest uppercase">
                          {modalFinancialDetails?.bank?.ifsc || 'PENDING'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Account Number</p>
                        <p className="text-lg font-black text-white tracking-[0.1em] uppercase">
                          {modalFinancialDetails?.bank?.accountNumber || 'PENDING'}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
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

export default SettlementManagement;
