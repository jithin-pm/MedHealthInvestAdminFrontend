import React, { useState } from 'react';
import { HiOutlineSearch, HiOutlineDownload } from 'react-icons/hi';

const PageHeader = ({ title, description }) => (
  <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
    <p className="text-gray-400 text-sm md:text-base">{description}</p>
  </div>
);

const dummyTransactions = [
  { id: 1, name: 'Kalyani', email: 'kalyani123@gmail.com', projectName: 'Healthcare Innovation Fund', projectType: 'Exclusive', date: 'Mar 17, 2026', amount: '₹12,45,000', status: 'Completed' },
  { id: 2, name: 'PP Singh', email: 'ppsingh123@gmail.com', projectName: 'Global Pharma Expansion', projectType: 'Standard', date: 'Mar 15, 2026', amount: '₹5,00,000', status: 'Completed' },
  { id: 3, name: 'Leo Das', email: 'leodas123@gmail.com', projectName: 'MedTech Seed Investment', projectType: 'Standard', date: 'Mar 14, 2026', amount: '₹2,50,000', status: 'Pending' },
  { id: 4, name: 'Jithin pm', email: 'jithinpm.in.office@gmail.com', projectName: 'Healthcare Innovation Fund', projectType: 'Exclusive', date: 'Mar 10, 2026', amount: '₹25,00,000', status: 'Completed' },
  { id: 5, name: 'Rahul Nair', email: 'rahul.nair@example.com', projectName: 'Smart Clinic Network', projectType: 'Standard', date: 'Mar 08, 2026', amount: '₹1,20,000', status: 'Failed' },
];

const RecentTransactions = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTransactions = dummyTransactions.filter(
    (tx) =>
      tx.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.projectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-full pb-10">
      <PageHeader 
        title="Recent Transactions" 
        description="Monitor investments, yield distributions, and payment history." 
      />

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
        
        <button className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white font-bold text-sm hover:bg-white/[0.08] transition-all group">
          <HiOutlineDownload className="text-lg group-hover:text-[#ccff00]" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="w-full rounded-[1.25rem] bg-[#0c0c0c] border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        
        {/* Table Header Strip */}
        <div className="bg-[#111] p-6 flex items-center justify-between border-b border-white/10">
          <h2 className="text-white font-bold text-sm tracking-[0.2em] uppercase">Transaction History</h2>
          <span className="text-[0.65rem] text-gray-400 font-bold uppercase tracking-[0.2em]">Latest {filteredTransactions.length} entries</span>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/10 bg-[#0a0a0a]/50">
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Sender</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Project Detail</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Type</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Date</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Amount</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-200">
                  <td className="py-5 px-6">
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-sm">{tx.name}</span>
                      <span className="text-gray-500 text-[0.7rem]">{tx.email}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-gray-300 font-medium text-sm">{tx.projectName}</span>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`text-[0.65rem] font-bold px-2 py-1 rounded tracking-widest uppercase ${
                      tx.projectType === 'Exclusive' 
                        ? 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20' 
                        : 'bg-white/5 text-gray-400 border border-white/10'
                    }`}>
                      {tx.projectType}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-gray-400 text-sm whitespace-nowrap">{tx.date}</span>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-white font-bold text-sm">{tx.amount}</span>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        tx.status === 'Completed' ? 'bg-[#00ffa3]' : 
                        tx.status === 'Pending' ? 'bg-orange-400' : 'bg-red-500'
                      }`} />
                      <span className="text-gray-300 text-sm font-medium">{tx.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500 text-sm">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecentTransactions;
