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
  HiOutlineLibrary,
  HiOutlineClipboardCopy,
  HiOutlineCloudUpload,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineDownload
} from 'react-icons/hi';
import { BASE_URL } from '../../services/baseUrl';
import { getSpecialProjectByIdApi, getAllUsersApi, getUserFinancialDetailsApi, getSpecialInvestorsApi, getLedgerHistoryApi, recordSpecialPaybackApi, getSpecialPayoutScheduleApi } from '../../services/allApi';
import Swal from 'sweetalert2';

const SpecialProjectDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Use location state or fallback
  const [project, setProject] = React.useState(location.state?.project || null);
  const [loading, setLoading] = React.useState(!location.state?.project);
  const [assignedUser, setAssignedUser] = React.useState(null);
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [isPaybackModalOpen, setIsPaybackModalOpen] = React.useState(false);
  const [paybackFile, setPaybackFile] = React.useState(null);
  const [paybackDate, setPaybackDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [paybackAmount, setPaybackAmount] = React.useState('');
  const [paybackType, setPaybackType] = React.useState('INTEREST');
  const [paybackModalMode, setPaybackModalMode] = React.useState('ALL');
  const [financialDetails, setFinancialDetails] = React.useState(null);
  const [investment, setInvestment] = React.useState(null);
  const [ledger, setLedger] = React.useState([]);
  const [payouts, setPayouts] = React.useState([]);

  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getSpecialProjectByIdApi(id);
      if (res.status === 200) {
        setProject(res.data);
      }
      
      const invRes = await getSpecialInvestorsApi(id);
      if (invRes.status === 200 && invRes.data.investments && invRes.data.investments.length > 0) {
        const activeInv = invRes.data.investments[0];
        setInvestment(activeInv);
        const ledRes = await getLedgerHistoryApi(activeInv.id);
        if (ledRes.status === 200) {
            setLedger(ledRes.data.history || []);
        }
        const payRes = await getSpecialPayoutScheduleApi(activeInv.id);
        if (payRes.status === 200) {
            setPayouts(payRes.data.payouts || []);
        }
      }
    } catch (err) {
      console.error("Error fetching project details:", err);
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

  React.useEffect(() => {
    fetchProject();
  }, [id]);

  React.useEffect(() => {
    if (project?.assignedUserId) {
      fetchAssignedUser(project.assignedUserId);
    }
  }, [project]);

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

  const getNextPayoutDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    date.setMonth(date.getMonth() + 2);
    date.setDate(1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getImageUrl = (img) => {
    if (!img) return '';
    if (img?.startsWith('http')) return img;
    return `${BASE_URL}/${img?.replace(/\\/g, '/')}`;
  };

  const filledLedgerData = [];
  
  if (ledger && ledger.length > 0) {
    for (let i = 0; i < ledger.length; i++) {
      const entry = ledger[i];
      const date = new Date(entry.transactionDate);
      
      if (filledLedgerData.length > 0) {
        const lastActual = [...filledLedgerData].reverse().find(row => !row.isSkipped);
        if (lastActual) {
          let currDate = new Date(lastActual.displayDate);
          currDate.setMonth(currDate.getMonth() + 1);
          
          while (
            currDate.getFullYear() < date.getFullYear() || 
            (currDate.getFullYear() === date.getFullYear() && currDate.getMonth() < date.getMonth())
          ) {
            filledLedgerData.push({
              id: `skipped-${currDate.getFullYear()}-${currDate.getMonth()}`,
              monthKey: `${currDate.getFullYear()}-${currDate.getMonth()}`,
              displayDate: new Date(currDate),
              interest: 0,
              paid: 0,
              isInitial: false,
              isSkipped: true,
              proof: null
            });
            currDate.setMonth(currDate.getMonth() + 1);
          }
        }
      }
      
      const row = {
        id: entry.id,
        monthKey: `${date.getFullYear()}-${date.getMonth()}`,
        displayDate: date,
        interest: entry.transactionType === 'INTEREST_ACCRUED' ? parseFloat(entry.amount) : 0,
        paid: entry.transactionType === 'PAYOUT_MADE' ? parseFloat(entry.amount) : 0,
        isInitial: entry.transactionType === 'INITIAL_INVESTMENT',
        isSkipped: false,
        proof: null,
        description: entry.description
      };

      if (entry.transactionType === 'PAYOUT_MADE') {
        const matchedPayout = payouts.find(p => {
          const d = new Date(p.paidAt || p.createdAt || p.created_at);
          return `${d.getFullYear()}-${d.getMonth()}` === row.monthKey;
        });
        if (matchedPayout) {
          row.proof = matchedPayout.paybackProof;
        }
      }

      filledLedgerData.push(row);
    }
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8 lg:p-12 font-['Inter']">
      {/* Navigation Header */}
      <div className="flex flex-col gap-6 mb-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-all group w-fit"
        >
          <HiOutlineChevronLeft className="text-xl group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Back to Special Projects</span>
        </button>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4">
           <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight">{project.projectName}</h1>
           <span className="px-3 py-1 bg-white/10 border border-white/20 text-white/70 text-xs font-black rounded uppercase tracking-widest">
             ID: {project.id}
           </span>
           <span className="px-3 py-1 bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] text-xs font-black rounded uppercase tracking-widest">
             {project.status}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          
          {/* Financial Metrics */}
          <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8 overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ccff00]/5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            
            <h3 className="text-[0.7rem] font-black text-gray-500 uppercase tracking-[0.2em] mb-8">Financial Overview</h3>
            
            <div className="space-y-8">
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <HiOutlineCurrencyRupee className="text-[#ccff00] text-lg" />
                  Capital Invested
                </p>
                <p className="text-3xl font-black text-white">₹{parseFloat(project.targetAmount).toLocaleString()}</p>
              </div>
              
              <div className="w-full h-px bg-gradient-to-r from-white/10 to-transparent" />
              
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                  <HiOutlineTrendingUp className="text-[#ccff00] text-lg" />
                  Projected ROI
                </p>
                <div className="flex items-end gap-2">
                  <p className="text-4xl font-black text-[#ccff00]">{project.roi}%</p>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1.5">Monthly</p>
                </div>
              </div>

              <div className="w-full h-px bg-gradient-to-r from-white/10 to-transparent" />
              
              <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                  <HiOutlineCurrencyRupee className="text-[#ccff00] text-lg" />
                  Current Balance Breakdown
                </p>
                <div className="space-y-3 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {/* Capital Section */}
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
                      <span className="text-gray-500 font-bold uppercase tracking-widest text-[0.65rem] mb-2">Capital Invested</span>
                      <span className="text-white font-black text-lg">₹{parseFloat(investment?.amountInvested || project.collectedAmount || 0).toLocaleString()}</span>
                    </div>
                    
                    <div className="bg-[#ccff00]/[0.05] border border-[#ccff00]/20 rounded-2xl p-4 flex flex-col justify-between shadow-[inset_0_0_20px_rgba(204,255,0,0.02)]">
                      <span className="text-[#ccff00]/70 font-bold uppercase tracking-widest text-[0.65rem] mb-2">Capital to Pay Back</span>
                      <span className="text-[#ccff00] font-black text-lg">₹{parseFloat(investment?.remainingCapital || project.collectedAmount || 0).toLocaleString()}</span>
                    </div>

                    {/* Interest Section */}
                    <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex flex-col justify-between hover:bg-white/[0.05] transition-colors">
                      <span className="text-gray-500 font-bold uppercase tracking-widest text-[0.65rem] mb-2">Total Interest Earned</span>
                      <span className="text-white font-black text-lg">+ ₹{ledger.filter(l => l.transactionType === 'INTEREST_ACCRUED').reduce((sum, l) => sum + parseFloat(l.amount), 0).toLocaleString()}</span>
                    </div>
                    
                    <div className="bg-[#ccff00]/[0.05] border border-[#ccff00]/20 rounded-2xl p-4 flex flex-col justify-between shadow-[inset_0_0_20px_rgba(204,255,0,0.02)]">
                      <span className="text-[#ccff00]/70 font-bold uppercase tracking-widest text-[0.65rem] mb-2">Interest Due</span>
                      <span className="text-[#ccff00] font-black text-lg">₹{(investment ? parseFloat(investment.accumulatedInterest || 0) : 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned User */}
          <div className="bg-[#0c0c0c] border border-white/5 rounded-[2.5rem] p-8">
            <h3 className="text-[0.7rem] font-black text-gray-500 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <HiOutlineUser className="text-xl" />
              Assigned Investor
            </h3>
            
            {assignedUser ? (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white font-black text-xl">
                    {assignedUser.fullName[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">{assignedUser.fullName}</h4>
                    <span className="px-2 py-1 bg-white/10 text-gray-300 text-[0.6rem] font-bold rounded uppercase tracking-widest">Active Profile</span>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3 text-gray-400">
                        <HiOutlineMail className="text-lg" />
                        <span className="text-sm font-medium">{assignedUser.email}</span>
                     </div>
                  </div>
                  {assignedUser.mobileNumber && (
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3 text-gray-400">
                          <HiOutlinePhone className="text-lg" />
                          <span className="text-sm font-medium">{assignedUser.mobileNumber}</span>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-center opacity-50">
                <HiOutlineUser className="text-4xl text-gray-500 mb-2" />
                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">No Investor Assigned</p>
              </div>
            )}
          </div>
      </div>

      {/* Initial Investment Data & Payout Schedule - FULL WIDTH */}
      <div className="mb-20 space-y-8">
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
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">Percentage</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest text-right rounded-tr-xl">Attachment</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/5 hover:bg-white/[0.04] transition-colors bg-white/[0.01]">
                  <td className="py-6 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#ccff00]/20 text-[#ccff00] border border-[#ccff00]/20 flex items-center justify-center font-black text-sm shrink-0">
                        {assignedUser ? assignedUser.fullName[0].toUpperCase() : '?'}
                      </div>
                      <span className="text-sm font-bold text-white truncate max-w-[200px]">{assignedUser ? assignedUser.fullName : 'N/A'}</span>
                    </div>
                  </td>
                  <td className="py-6 px-6">
                    <span className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-300 text-xs font-medium border border-white/10 shadow-inner">
                      {ledger.find(l => l.transactionType === 'INITIAL_INVESTMENT') ? new Date(ledger.find(l => l.transactionType === 'INITIAL_INVESTMENT').transactionDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : (investment ? new Date(investment.created_at || investment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A')}
                    </span>
                  </td>
                  <td className="py-6 px-6">
                    <span className="text-lg font-black text-[#ccff00] drop-shadow-[0_0_10px_rgba(204,255,0,0.3)]">
                      ₹{parseFloat(project.collectedAmount || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="py-6 px-6">
                    <span className="text-lg font-black text-white">
                      {project.roi}%
                    </span>
                  </td>
                  <td className="py-6 px-6 text-right">
                    {project.paymentProof ? (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedImage(project.paymentProof)}
                          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
                          title="View Proof"
                        >
                          <HiOutlineEye className="text-lg" />
                        </button>
                        <a 
                          href={getImageUrl(project.paymentProof)}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg"
                          title="Download Proof"
                        >
                          <HiOutlineDownload className="text-lg" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-500 text-xs font-medium italic bg-white/5 px-3 py-1.5 rounded-lg">No Proof Provided</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-[#0c0c0c] border border-[#ccff00]/20 rounded-[2.5rem] p-8 overflow-hidden shadow-[0_0_40px_rgba(204,255,0,0.05)] relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#ccff00]/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
             <h3 className="text-xs font-black text-[#ccff00] uppercase tracking-[0.2em] flex items-center gap-2">
                <HiOutlineTrendingUp className="text-lg" />
                Investment Ledger History
             </h3>
             {(() => {
               const canPay = investment && (parseFloat(investment.accumulatedInterest || 0) > 0 || parseFloat(investment.remainingCapital || 0) > 0);
               return (
                 <button 
                    onClick={() => {
                      if (canPay) {
                        setPaybackModalMode('ALL');
                        setIsPaybackModalOpen(true);
                      } else {
                        Swal.fire({
                          title: 'No Pending Balance',
                          text: 'There is no pending interest or capital to pay back.',
                          icon: 'info',
                          background: '#1a1a1a',
                          color: '#fff',
                          confirmButtonColor: '#ccff00'
                        });
                      }
                    }}
                    className={`px-6 py-3 rounded-xl font-black text-[0.7rem] uppercase tracking-widest transition-all whitespace-nowrap inline-flex items-center gap-2 ${
                      canPay 
                        ? 'bg-[#ccff00] hover:bg-[#b3ff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] hover:-translate-y-0.5 active:translate-y-0' 
                        : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
                    }`}
                  >
                    Record Payback
                  </button>
               );
             })()}
          </div>
          
          <div className="overflow-x-auto custom-scrollbar relative z-10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-[#ccff00]/[0.02]">
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-[#ccff00]/70 uppercase tracking-widest rounded-tl-xl">Month</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-[#ccff00]/70 uppercase tracking-widest">Date</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-[#ccff00]/70 uppercase tracking-widest text-right">Interest Earned</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-[#ccff00]/70 uppercase tracking-widest text-right">Amount Paid</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-[#ccff00]/70 uppercase tracking-widest text-center">Status</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-[#ccff00]/70 uppercase tracking-widest text-center">Attachment</th>
                  <th className="py-4 px-6 text-[0.65rem] font-bold text-[#ccff00]/70 uppercase tracking-widest text-center rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const visibleLedgerData = filledLedgerData.filter(g => !g.isInitial);
                  return visibleLedgerData.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-8 text-center text-gray-500 font-medium">No ledger entries found.</td>
                    </tr>
                  ) : (
                    visibleLedgerData.map((group, index) => {
                      const isLastRow = index === visibleLedgerData.length - 1;
                      return (
                      <tr key={group.id} className="border-b border-white/5 hover:bg-[#ccff00]/[0.05] transition-colors bg-[#ccff00]/[0.02]">
                        <td className="py-4 px-6">
                            <span className="text-sm font-bold text-white uppercase tracking-widest">{group.displayDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        </td>
                        <td className="py-4 px-6">
                            <span className="text-sm font-bold text-white/70">{group.displayDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                        </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-sm font-black text-[#ccff00]">
                          {group.interest > 0 ? '+ ₹ ' + group.interest.toLocaleString() : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-sm font-black text-red-400">
                          {group.paid > 0 ? `-₹${group.paid.toLocaleString()}` : '-'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        {group.isInitial ? (
                           <span className="px-3 py-1 rounded-full border border-blue-500/50 bg-blue-500/10 text-blue-500 text-[0.65rem] font-bold uppercase tracking-widest whitespace-nowrap">
                             Principal
                           </span>
                        ) : group.isSkipped ? (
                           <span className="px-3 py-1 rounded-full border border-gray-500/50 bg-gray-500/10 text-gray-500 text-[0.65rem] font-bold uppercase tracking-widest whitespace-nowrap">
                             Grace Period
                           </span>
                        ) : group.paid > 0 ? (
                           <span className="px-3 py-1 rounded-full border border-green-500/50 bg-green-500/10 text-green-500 text-[0.65rem] font-bold uppercase tracking-widest whitespace-nowrap">
                             {group.description === 'Capital Payback' ? 'Capital Paid Back' : group.description === 'Interest Payback' ? 'Interest Paid Back' : 'Paid'}
                           </span>
                        ) : (
                           <span className="px-3 py-1 rounded-full border border-yellow-500/50 bg-yellow-500/10 text-yellow-500 text-[0.65rem] font-bold uppercase tracking-widest whitespace-nowrap">
                             Interest Accrued
                           </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {group.proof ? (
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => setSelectedImage(group.proof)}
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all shadow-[0_0_10px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95"
                              title="View Proof"
                            >
                              <HiOutlineEye className="text-sm" />
                            </button>
                            <a 
                              href={getImageUrl(group.proof)}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white flex items-center justify-center transition-all shadow-[0_0_10px_rgba(255,255,255,0.05)] hover:scale-105 active:scale-95"
                              title="Download Proof"
                            >
                              <HiOutlineDownload className="text-sm" />
                            </a>
                          </div>
                        ) : (
                          <div className="flex justify-center"><span className="text-gray-500 font-bold">-</span></div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {!group.isInitial && !group.isSkipped && (
                          group.paid > 0 ? (
                            <button 
                              disabled
                              className="px-4 py-1.5 rounded-lg font-bold text-[0.65rem] uppercase tracking-widest transition-all bg-white/5 text-gray-500 cursor-not-allowed border border-white/10"
                            >
                              Paid
                            </button>
                          ) : group.interest > 0 ? (
                            (investment && parseFloat(investment.accumulatedInterest || 0) > 0 && index === visibleLedgerData.map(g => g.interest > 0).lastIndexOf(true)) ? (
                              <button 
                                onClick={() => {
                                  setPaybackModalMode('INTEREST');
                                  setPaybackType('INTEREST');
                                  setIsPaybackModalOpen(true);
                                }}
                                className="px-4 py-1.5 rounded-lg font-bold text-[0.65rem] uppercase tracking-widest transition-all bg-[#ccff00] hover:bg-[#b3ff00] text-black shadow-[0_0_10px_rgba(204,255,0,0.2)] hover:scale-105 active:scale-95"
                              >
                                Pay
                              </button>
                            ) : (
                              <span className="text-gray-500 font-bold">-</span>
                            )
                          ) : (
                            <span className="text-gray-500 font-bold">-</span>
                          )
                        )}
                        {group.isSkipped && (
                          <span className="text-gray-500 font-bold">-</span>
                        )}
                      </td>
                      </tr>
                      );
                    })
                  );
                })()}
              </tbody>
            </table>
          </div>
        </section>
      </div>

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
                alt="Payment Proof Full" 
                className="w-full h-auto max-h-[80vh] object-contain bg-black/50"
              />
            </div>
          </div>
        </div>
      )}

      {/* Payback Modal */}
      {isPaybackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#191919] border border-white/5 rounded-3xl max-w-lg w-full shadow-2xl relative flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between p-6 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 bg-[#ccff00] rounded-xl flex items-center justify-center shrink-0">
                    <HiOutlineLibrary className="text-2xl text-black" />
                 </div>
                 <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Financial Settlement</h2>
                    <p className="text-gray-500 text-[0.65rem] font-bold uppercase tracking-widest mt-1">Verify Details & Upload Proof</p>
                 </div>
              </div>
              <button 
                onClick={() => setIsPaybackModalOpen(false)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
              
              {/* Settlement Type Selector */}
              {paybackModalMode === 'ALL' && (
                <div>
                   <h3 className="text-gray-400 text-[0.65rem] font-bold uppercase tracking-widest mb-4">Settlement Type</h3>
                   <div className="flex gap-4">
                      <button 
                         onClick={() => { setPaybackType('INTEREST'); setPaybackAmount(''); }}
                         className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${paybackType === 'INTEREST' ? 'bg-[#ccff00]/10 border-[#ccff00] text-[#ccff00]' : 'bg-transparent border-white/10 text-white/50 hover:bg-white/5'}`}
                      >
                         Interest Payback
                      </button>
                      <button 
                         onClick={() => { setPaybackType('CAPITAL'); setPaybackAmount(''); }}
                         className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${paybackType === 'CAPITAL' ? 'bg-[#ccff00]/10 border-[#ccff00] text-[#ccff00]' : 'bg-transparent border-white/10 text-white/50 hover:bg-white/5'}`}
                      >
                         Capital Payback
                      </button>
                   </div>
                </div>
              )}

              {/* Total Due */}
              <div className="flex justify-between items-center bg-[#ccff00]/5 p-5 rounded-2xl border border-[#ccff00]/20 shadow-[inset_0_0_20px_rgba(204,255,0,0.02)] mb-2">
                <span className="text-gray-400 text-[0.65rem] font-bold uppercase tracking-widest">
                  {paybackType === 'INTEREST' ? 'Interest Due' : 'Capital Due'}
                </span>
                <span className="text-2xl font-black text-[#ccff00] tracking-tight">
                  ₹{parseFloat(paybackType === 'INTEREST' ? (investment?.accumulatedInterest || 0) : (investment?.remainingCapital || 0)).toLocaleString()}
                </span>
              </div>

              {/* Settlement Amount */}
              <div>
                 <h3 className="text-gray-400 text-[0.65rem] font-bold uppercase tracking-widest mb-4">Settlement Amount</h3>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                    <input 
                      type="text" 
                      value={paybackAmount} 
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9.]/g, '');
                        const totalDue = parseFloat(paybackType === 'INTEREST' ? (investment?.accumulatedInterest || 0) : (investment?.remainingCapital || 0));
                        if (val && !isNaN(parseFloat(val)) && parseFloat(val) > totalDue) {
                          val = totalDue.toString();
                        }
                        setPaybackAmount(val);
                      }}
                      placeholder="Enter amount to settle"
                      className="w-full bg-black border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-[#ccff00] transition-colors font-bold" 
                    />
                 </div>
              </div>

              {/* Beneficiary Bank Details */}
              <div>
                 <h3 className="text-gray-400 text-[0.65rem] font-bold uppercase tracking-widest mb-4">Beneficiary Bank Details</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                       <span className="text-gray-500 text-sm">Account Holder</span>
                       <span className="text-white text-sm font-bold uppercase">{financialDetails?.bank?.accountHolderName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                       <span className="text-gray-500 text-sm">Account Number</span>
                       <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-bold">{financialDetails?.bank?.accountNumber || 'N/A'}</span>
                          <button onClick={() => navigator.clipboard.writeText(financialDetails?.bank?.accountNumber)} className="text-gray-500 hover:text-white transition-colors"><HiOutlineClipboardCopy /></button>
                       </div>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                       <span className="text-gray-500 text-sm">IFSC Code</span>
                       <div className="flex items-center gap-2">
                          <span className="text-[#ccff00] text-sm font-bold">{financialDetails?.bank?.ifsc || 'N/A'}</span>
                          <button onClick={() => navigator.clipboard.writeText(financialDetails?.bank?.ifsc)} className="text-gray-500 hover:text-white transition-colors"><HiOutlineClipboardCopy /></button>
                       </div>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                       <span className="text-gray-500 text-sm">Bank Name</span>
                       <span className="text-white text-sm font-bold uppercase">{financialDetails?.bank?.bankName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                       <span className="text-gray-500 text-sm">Branch & City</span>
                       <span className="text-white text-sm font-bold uppercase">{financialDetails?.bank?.branch || ''} {financialDetails?.bank?.branch && financialDetails?.bank?.city ? '•' : ''} {financialDetails?.bank?.city || ''}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                       <span className="text-gray-500 text-sm">Payout Phone</span>
                       <span className="text-white text-sm font-bold">{financialDetails?.bank?.payoutPhone || 'N/A'}</span>
                    </div>
                 </div>
              </div>

              {/* Identity Verification (PAN) */}
              <div>
                 <h3 className="text-gray-400 text-[0.65rem] font-bold uppercase tracking-widest mb-4">Identity Verification (PAN)</h3>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                       <span className="text-gray-500 text-sm">PAN Holder</span>
                       <span className="text-white text-sm font-bold uppercase">{financialDetails?.pan?.fullName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2">
                       <span className="text-gray-500 text-sm">PAN Number</span>
                       <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-bold uppercase">{financialDetails?.pan?.panNumber || 'N/A'}</span>
                          <button onClick={() => navigator.clipboard.writeText(financialDetails?.pan?.panNumber)} className="text-gray-500 hover:text-white transition-colors"><HiOutlineClipboardCopy /></button>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Upload Payment Proof */}
              <div>
                 <h3 className="text-gray-400 text-[0.65rem] font-bold uppercase tracking-widest mb-4">Upload Payment Proof</h3>
                 <label className="border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-[#ccff00]/50 transition-colors bg-white/[0.01]">
                    <HiOutlineCloudUpload className="text-2xl text-gray-500" />
                    <span className="text-gray-400 text-sm">Click to upload proof</span>
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={(e) => setPaybackFile(e.target.files[0])} 
                      className="hidden" 
                    />
                 </label>
                 {paybackFile && (
                    <p className="text-[#ccff00] text-xs font-bold mt-2 text-center">{paybackFile.name}</p>
                 )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 shrink-0 border-t border-white/5">
               <button 
                  disabled={!paybackAmount || !paybackFile}
                  onClick={async () => { 
                      if (!investment) return;
                      const formData = new FormData();
                      formData.append('amount', paybackAmount);
                      formData.append('paybackType', paybackType);
                      formData.append('paybackProof', paybackFile);
                      try {
                          const res = await recordSpecialPaybackApi(investment.id, formData);
                          if (res.status === 200) {
                              Swal.fire('Success', 'Payback recorded successfully!', 'success');
                              setIsPaybackModalOpen(false);
                              setPaybackAmount('');
                              setPaybackFile(null);
                              fetchProject(); // refresh data
                          } else {
                              Swal.fire('Error', res.response?.data?.message || 'Failed to record payback', 'error');
                          }
                      } catch (err) {
                          Swal.fire('Error', 'An error occurred', 'error');
                      }
                  }} 
                  className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-3
                    ${(!paybackAmount || !paybackFile) 
                      ? 'bg-white/5 text-white/30 cursor-not-allowed border border-white/5' 
                      : 'bg-[#ccff00] hover:bg-[#b3ff00] text-black shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:shadow-[0_0_30px_rgba(204,255,0,0.5)]'
                    }
                  `}
               >
                  Confirm Settlement <HiOutlineCheckCircle className="text-lg" />
               </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialProjectDetails;
