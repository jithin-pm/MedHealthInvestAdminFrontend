import React, { useState, useEffect } from 'react';
import { HiOutlineSearch } from 'react-icons/hi';
import { BsFillPatchCheckFill } from 'react-icons/bs';
import { FiX, FiShield, FiUser, FiInfo, FiCopy } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { getAllUsersApi, getUserVerificationStatusApi } from '../../services/allApi';

const PageHeader = ({ title, description }) => (
  <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
    <p className="text-gray-400 text-sm md:text-base">{description}</p>
  </div>
);

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Verification details state variables
  const [selectedUser, setSelectedUser] = useState(null);
  const [verificationDetails, setVerificationDetails] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await getAllUsersApi();
      if (response.status === 200) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetailsModal = async (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setLoadingDetails(true);
    setVerificationDetails(null);
    try {
      const res = await getUserVerificationStatusApi(user.id);
      if (res.status === 200) {
        setVerificationDetails(res.data);
      }
    } catch (error) {
      console.error("Error fetching verification details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCopyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `${label} copied!`,
      showConfirmButton: false,
      timer: 1500,
      background: '#1c1917',
      color: '#fff',
      customClass: {
        popup: 'border border-[#ccff00]/20 rounded-xl'
      }
    });
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobileNumber.includes(searchTerm)
  );

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Reset pagination when searching
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-full pb-10">
      <PageHeader 
        title="User Management" 
        description="View and manage investors, change roles, and oversee accounts." 
      />

      {/* Search Bar */}
      <div className="relative mb-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
        <input
          type="text"
          placeholder="Search by name, email or mobile"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0c0c0c] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/50 transition-all placeholder:text-gray-600"
        />
      </div>

      {/* Table Container */}
      <div className="w-full rounded-[1.25rem] bg-[#0c0c0c] border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        
        {/* Table Header Strip */}
        <div className="bg-[#111] p-6 flex items-center justify-between border-b border-white/10">
          <h2 className="text-white font-bold text-sm tracking-[0.2em] uppercase">Registered Users</h2>
          <span className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">
            Showing {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} Users
          </span>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="border-b border-white/10 bg-[#0a0a0a]/50">
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Investor</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Contact</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Gender</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Date Joined</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Status</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Details</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((user) => (
                <tr 
                  key={user.id} 
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-200 group"
                >
                  <td className="py-5 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#ccff00]/10 flex items-center justify-center text-[#ccff00] font-bold text-xs relative">
                        {user.fullName.charAt(0)}
                        {((user.isPanVerified === 1 || user.isPanVerified === true) && (user.isBankVerified === 1 || user.isBankVerified === true)) && (
                          <BsFillPatchCheckFill className="absolute -top-0.5 -right-0.5 text-[#ccff00] bg-black rounded-full" size={10} />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white font-bold text-sm">{user.fullName}</span>
                        <span className="text-gray-500 text-[0.75rem]">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className="text-gray-400 text-sm">{user.countryCode} {user.mobileNumber}</span>
                  </td>
                  <td className="py-5 px-6 text-gray-400 text-sm capitalize">
                    {user.gender}
                  </td>
                  <td className="py-5 px-6 text-gray-400 text-sm">
                    {new Date(user.createdAt || user.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="py-5 px-6">
                    <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-[0.65rem] font-bold uppercase tracking-wider">
                      Active
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    {((user.isPanVerified === 1 || user.isPanVerified === true) || (user.isBankVerified === 1 || user.isBankVerified === true)) ? (
                      <button
                        onClick={() => handleOpenDetailsModal(user)}
                        className="px-4 py-1.5 rounded-lg bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] hover:bg-[#ccff00] hover:text-black hover:border-[#ccff00] text-[0.65rem] font-black uppercase tracking-widest transition-all active:scale-[0.97]"
                      >
                        View Details
                      </button>
                    ) : (
                      <span className="text-zinc-600 text-[0.65rem] font-bold uppercase tracking-wider">Unverified</span>
                    )}
                  </td>
                </tr>
              ))}
              
              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500 text-sm">
                    {searchTerm ? "No users found matching your search." : "No registered users found."}
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-gray-500 text-sm animate-pulse">
                    Loading users...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredUsers.length > itemsPerPage && (
          <div className="p-6 bg-[#0a0a0a]/50 border-t border-white/10 flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  currentPage === 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Previous
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                  currentPage === totalPages ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Next
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mr-4">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                      currentPage === i + 1 ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.2)]' : 'text-gray-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Verification Details Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 font-['Outfit']">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between bg-[#0a0a0a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ccff00]/10 flex items-center justify-center text-[#ccff00] border border-[#ccff00]/20">
                  <FiShield size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Verification Details</h3>
                  <p className="text-gray-500 text-xs mt-0.5">{selectedUser.fullName} • {selectedUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:bg-white/10 active:scale-95"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {loadingDetails ? (
                <div className="py-20 text-center text-gray-500 text-sm animate-pulse flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-t-[#ccff00] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  Loading verification status...
                </div>
              ) : verificationDetails ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Minimal PAN Details */}
                  <div className="flex flex-col">
                    <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 pb-2 border-b border-white/10">
                      Identity Details (PAN)
                    </h4>
                    {verificationDetails.isPanVerified ? (
                      <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Status</span>
                          <span className="text-[#ccff00] font-bold">Verified ✓</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">PAN Number</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono font-bold uppercase tracking-wider">
                              {verificationDetails.panDetails?.panNumber || 'N/A'}
                            </span>
                            {verificationDetails.panDetails?.panNumber && (
                              <button
                                onClick={() => handleCopyToClipboard(verificationDetails.panDetails.panNumber, 'PAN Card Number')}
                                className="p-1 text-zinc-400 hover:text-white transition-all active:scale-90"
                                title="Copy"
                              >
                                <FiCopy size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Holder Name</span>
                          <span className="text-white font-medium uppercase">
                            {verificationDetails.panDetails?.fullName || selectedUser.fullName || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Verified On</span>
                          <span className="text-zinc-400">
                            {verificationDetails.panDetails?.verifiedAt ? new Date(verificationDetails.panDetails.verifiedAt).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-zinc-600 text-sm">
                        PAN verification is pending.
                      </div>
                    )}
                  </div>

                  {/* Minimal Bank Account Details */}
                  <div className="flex flex-col">
                    <h4 className="text-xs font-bold text-white tracking-wider uppercase mb-4 pb-2 border-b border-white/10">
                      Bank Details (Payouts)
                    </h4>
                    {verificationDetails.isBankVerified ? (
                      <div className="space-y-4">
                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Status</span>
                          <span className="text-[#ccff00] font-bold">Verified ✓</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Account Holder</span>
                          <span className="text-white font-medium uppercase">
                            {verificationDetails.bankDetails?.accountHolderName || verificationDetails.accountHolderName || selectedUser.fullName || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Account Number</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono font-bold">
                              {verificationDetails.bankDetails?.bankAccount || verificationDetails.accountNumber || 'N/A'}
                            </span>
                            {(verificationDetails.bankDetails?.bankAccount || verificationDetails.accountNumber) && (
                              <button
                                onClick={() => handleCopyToClipboard(verificationDetails.bankDetails?.bankAccount || verificationDetails.accountNumber, 'Bank Account Number')}
                                className="p-1 text-zinc-400 hover:text-white transition-all active:scale-90"
                                title="Copy"
                              >
                                <FiCopy size={12} />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Bank Name</span>
                          <span className="text-white font-medium">
                            {verificationDetails.bankDetails?.bankName || verificationDetails.bankName || 'N/A'}
                          </span>
                        </div>
                        {verificationDetails.bankDetails?.branch && (
                          <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                            <span className="text-zinc-500">Branch</span>
                            <span className="text-white font-medium">{verificationDetails.bankDetails.branch}</span>
                          </div>
                        )}
                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">IFSC Code</span>
                          <span className="text-[#ccff00] font-mono font-bold uppercase tracking-wider">
                            {verificationDetails.bankDetails?.ifsc || verificationDetails.ifscCode || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-white/5 text-sm">
                          <span className="text-zinc-500">Verified On</span>
                          <span className="text-zinc-400">
                            {verificationDetails.bankDetails?.verifiedAt ? new Date(verificationDetails.bankDetails.verifiedAt).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-12 text-center text-zinc-600 text-sm">
                        Bank verification is pending.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  Failed to load verification status.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex justify-end bg-[#0a0a0a]">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-[#ccff00] transition-all active:scale-[0.98]"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
