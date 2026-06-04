import React, { useState, useEffect } from 'react';
import { HiOutlineSearch, HiOutlineDownload, HiOutlineCurrencyRupee, HiOutlineCash, HiOutlineClock, HiOutlineChartBar, HiOutlineRefresh } from 'react-icons/hi';
import { getAllTransactionsApi } from '../../services/allApi';
import { TbRefresh } from 'react-icons/tb';
import { FiPaperclip, FiDownload } from 'react-icons/fi';
import { generateInvestmentReceipt } from '../../Utils/generateReceipt';
import { generateTransactionReport } from '../../Utils/generateTransactionReport';
import { BASE_URL } from '../../services/baseUrl';

const PageHeader = ({ title, description }) => (
  <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
    <p className="text-gray-400 text-sm md:text-base">{description}</p>
  </div>
);

const StatCard = ({ title, value, color, icon: Icon }) => (
  <div className="flex-1 bg-[#0c0c0c] border border-white/10 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex items-center justify-between mb-4">
      <span className="text-gray-500 text-[0.65rem] font-bold uppercase tracking-widest">{title}</span>
      <div className={`p-2 rounded-lg bg-white/5 text-${color === 'primary' ? '[#ccff00]' : color === 'success' ? '[#00ffa3]' : 'orange-400'}`}>
        <Icon className="text-xl" />
      </div>
    </div>
    <div className="text-2xl font-bold text-white">
      {value}
    </div>
  </div>
);

const RecentTransactions = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await getAllTransactionsApi();
      if (res.status === 200) {
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(
    (tx) =>
      tx.user?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.project?.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Financial Stats Logic
  const totalVolume = transactions
    .filter(tx => tx.type === 'INVESTMENT')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
  const totalPayouts = transactions
    .filter(tx => tx.type === 'PAYOUT' || tx.type === 'REFUND')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);
    
  const pendingSettlements = totalVolume - totalPayouts;

  // Pagination Logic
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Reset to page 1 when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-full pb-10">
      <PageHeader 
        title="Recent Transactions" 
        description="Monitor investments, yield distributions, and payment history." 
      />

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="Total Transaction Volume" 
          value={`₹${totalVolume.toLocaleString('en-IN')}`} 
          color="primary"
          icon={HiOutlineCurrencyRupee}
        />
        <StatCard 
          title="Total Refunds / Payouts" 
          value={`₹${totalPayouts.toLocaleString('en-IN')}`} 
          color="success"
          icon={HiOutlineCash}
        />
        <StatCard 
          title="Pending Settlements" 
          value={`₹${pendingSettlements.toLocaleString('en-IN')}`} 
          color="warning"
          icon={HiOutlineClock}
        />
      </div>

      {/* Search and Filter Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <div className="relative w-full max-w-md">
          <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
          <input
            type="text"
            placeholder="Search by sender or project"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0c0c0c] border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] transition-all placeholder:text-gray-600"
          />
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowDownloadModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/30 text-[#ccff00] font-bold text-sm hover:bg-[#ccff00]/20 transition-all group"
          >
            <HiOutlineDownload className="text-lg group-hover:scale-110 transition-transform" />
            <span>Download FY Report</span>
          </button>

          <button 
            onClick={fetchTransactions}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white font-bold text-sm hover:bg-white/[0.08] transition-all group"
          >
            <TbRefresh className="text-lg group-hover:text-[#ccff00]" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      {/* Download Report Modal */}
      {showDownloadModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowDownloadModal(false)}
        >
          <div 
            className="bg-[#0c0c0c] border border-white/10 rounded-2xl w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-bold text-lg">Download Transaction Report</h3>
                  <p className="text-gray-500 text-xs mt-1">Last Financial Year (April – March)</p>
                </div>
                <button
                  onClick={() => setShowDownloadModal(false)}
                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-400 text-sm mb-5">Select the payment type to include in the report:</p>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'All Data', value: 'ALL', icon: HiOutlineChartBar, desc: 'All transaction types' },
                  { label: 'Investment', value: 'INVESTMENT', icon: HiOutlineCurrencyRupee, desc: 'Investment records' },
                  { label: 'Payout', value: 'PAYOUT', icon: HiOutlineCash, desc: 'Payout settlements' },
                  { label: 'Refund', value: 'REFUND', icon: HiOutlineRefresh, desc: 'Refund records' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      generateTransactionReport(transactions, option.value);
                      setShowDownloadModal(false);
                    }}
                    className="flex flex-col items-center gap-2 p-5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#ccff00]/40 hover:bg-[#ccff00]/5 transition-all group cursor-pointer"
                  >
                    <option.icon className="text-2xl text-[#ccff00] transition-colors" />
                    <span className="text-white font-bold text-sm group-hover:text-[#ccff00] transition-colors">{option.label}</span>
                    <span className="text-gray-500 text-[0.65rem]">{option.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-sm font-bold hover:bg-white/10 hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="w-full rounded-[1.25rem] bg-[#0c0c0c] border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        
        {/* Table Header Strip */}
        <div className="bg-[#111] p-6 flex items-center justify-between border-b border-white/10">
          <h2 className="text-white font-bold text-sm tracking-[0.2em] uppercase">Transaction History</h2>
          <span className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-[0.2em]">
            {loading ? 'Syncing...' : `Showing ${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredTransactions.length)} of ${filteredTransactions.length}`}
          </span>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/10 bg-[#0a0a0a]/50">
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">User Name</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Transaction ID</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Project Detail</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Project Type</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Payment Type</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Date</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Amount</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Status</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] text-center">Attachment</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-8 h-8 border-2 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin" />
                      <span className="text-gray-500 text-[0.65rem] font-bold uppercase tracking-widest">Accessing Ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : currentItems.length > 0 ? (
                currentItems.map((tx) => (
                  <tr key={tx.id} className={`border-b border-white/5 transition-colors duration-200 ${
                    tx.type !== 'INVESTMENT' ? 'bg-[#ccff00]/[0.02] hover:bg-[#ccff00]/[0.05]' : 'hover:bg-white/[0.02]'
                  }`}>
                    <td className="py-5 px-6">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">{tx.user?.fullName || 'N/A'}</span>
                        <span className="text-gray-500 text-[0.7rem]">{tx.user?.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-gray-500 text-[0.65rem] font-mono whitespace-nowrap">
                        {tx.transactionId || '---'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-gray-300 font-medium text-sm">{tx.project?.projectName || 'N/A'}</span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`text-[0.65rem] font-bold px-2 py-1 rounded tracking-widest uppercase ${
                        tx.project?.projectType === 'Exclusive' 
                          ? 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20' 
                          : 'bg-white/5 text-gray-400 border border-white/10'
                      }`}>
                        {tx.project?.projectType || 'Standard'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`text-[0.65rem] font-bold px-2 py-1 rounded tracking-widest uppercase ${
                        tx.type === 'REFUND' 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : tx.type === 'PAYOUT'
                            ? 'bg-[#00ffa3]/10 text-[#00ffa3] border border-[#00ffa3]/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-gray-400 text-sm whitespace-nowrap">
                        {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className="text-white font-bold text-sm">₹{Number(tx.amount).toLocaleString('en-IN')}</span>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          tx.status === 'SUCCESS' ? 'bg-[#00ffa3]' : 
                          tx.status === 'PENDING' ? 'bg-orange-400' : 'bg-red-500'
                        }`} />
                        <span className="text-gray-300 text-sm font-medium">
                          {tx.status === 'SUCCESS' ? 'Completed' : tx.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="flex items-center justify-center gap-2">
                         <button
                            onClick={() => {
                               const userData = { fullName: tx.user?.fullName, email: tx.user?.email };
                               if (tx.type === 'PAYOUT' || tx.type === 'REFUND') {
                                  generateInvestmentReceipt({
                                     amount: tx.amount,
                                     paymentId: tx.transactionId,
                                     projectTitle: tx.project?.projectName,
                                     duration: tx.project?.duration || 1,
                                     isPayout: tx.type === 'PAYOUT',
                                     isRefund: tx.type === 'REFUND',
                                     paybackProof: tx.paybackProof ? `${BASE_URL}/${tx.paybackProof}` : null
                                  }, userData, 'view');
                               } else {
                                  generateInvestmentReceipt({
                                     amount: tx.amount,
                                     paymentId: tx.transactionId,
                                     projectTitle: tx.project?.projectName,
                                     duration: tx.project?.duration || 1,
                                     paybackProof: tx.paybackProof ? `${BASE_URL}/${tx.paybackProof}` : null
                                  }, userData, 'view');
                               }
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#ccff00] hover:bg-[#ccff00] hover:text-black transition-all"
                            title="View Receipt"
                         >
                            <FiPaperclip size={14} />
                         </button>
                         <button
                            onClick={() => {
                               const userData = { fullName: tx.user?.fullName, email: tx.user?.email };
                               if (tx.type === 'PAYOUT' || tx.type === 'REFUND') {
                                  generateInvestmentReceipt({
                                     amount: tx.amount,
                                     paymentId: tx.transactionId,
                                     projectTitle: tx.project?.projectName,
                                     duration: tx.project?.duration || 1,
                                     isPayout: tx.type === 'PAYOUT',
                                     isRefund: tx.type === 'REFUND',
                                     paybackProof: tx.paybackProof ? `${BASE_URL}/${tx.paybackProof}` : null
                                  }, userData, 'download');
                               } else {
                                  generateInvestmentReceipt({
                                     amount: tx.amount,
                                     paymentId: tx.transactionId,
                                     projectTitle: tx.project?.projectName,
                                     duration: tx.project?.duration || 1,
                                     paybackProof: tx.paybackProof ? `${BASE_URL}/${tx.paybackProof}` : null
                                  }, userData, 'download');
                               }
                            }}
                            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
                            title="Download Receipt"
                         >
                            <FiDownload size={14} />
                         </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500 text-sm">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Strip */}
        {!loading && totalPages > 1 && (
          <div className="bg-[#111] p-6 border-t border-white/10 flex items-center justify-between">
            <button
              onClick={() => paginate(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${
                currentPage === 1 
                  ? 'border-white/5 text-gray-600 cursor-not-allowed' 
                  : 'border-white/10 text-white hover:bg-white/5 hover:border-[#ccff00]/30'
              }`}
            >
              Previous
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </span>
            </div>

            <button
              onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all ${
                currentPage === totalPages 
                  ? 'border-white/5 text-gray-600 cursor-not-allowed' 
                  : 'border-white/10 text-white hover:bg-white/5 hover:border-[#ccff00]/30'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTransactions;
