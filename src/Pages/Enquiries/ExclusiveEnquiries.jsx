import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { HiOutlineSearch } from 'react-icons/hi';
import { LuCrown } from 'react-icons/lu';
import { FiMessageSquare, FiCheck } from 'react-icons/fi';
import { getEnquiriesByTypeApi, getAllUsersApi, updateEnquiryStatusApi } from '../../services/allApi';

const ExclusiveEnquiries = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [enquiries, setEnquiries] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchEnquiries();
    fetchUsers();
  }, []);

  const fetchEnquiries = async () => {
    try {
      const response = await getEnquiriesByTypeApi('Exclusive');
      if (response.status === 200) {
        setEnquiries(response.data);
      }
    } catch (error) {
      console.error('Error fetching exclusive enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = (id) => {
    Swal.fire({
      title: 'Mark as Read?',
      text: 'Are you sure you want to mark this exclusive enquiry as read?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#ccff00',
      cancelButtonColor: '#1a1a1a',
      confirmButtonText: 'Yes, Mark as Read',
      cancelButtonText: 'Cancel',
      background: '#0c0c0c',
      color: '#ffffff',
      customClass: {
        popup: 'border border-white/10 rounded-2xl',
        confirmButton: 'text-black font-bold px-6 py-2.5 rounded-xl',
        cancelButton: 'text-white font-bold px-6 py-2.5 rounded-xl border border-white/10'
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await updateEnquiryStatusApi(id, { status: 'Read' });
          if (response.status === 200) {
            setEnquiries(enquiries.map(enq => enq.id === id ? { ...enq, status: 'Read' } : enq));
            window.dispatchEvent(new Event('enquiriesUpdated'));
            Swal.fire({
              toast: true,
              position: 'top-end',
              icon: 'success',
              title: 'Marked as read',
              showConfirmButton: false,
              timer: 1800,
              background: '#0c0c0c',
              color: '#fff',
              customClass: {
                popup: 'border border-[#ccff00]/20 rounded-xl'
              }
            });
          }
        } catch (error) {
          console.error('Error updating status:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to update enquiry status.',
            background: '#0c0c0c',
            color: '#fff',
            confirmButtonColor: '#ccff00'
          });
        }
      }
    });
  };

  const fetchUsers = async () => {
    try {
      const response = await getAllUsersApi();
      if (response.status === 200) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleMessageClick = (email) => {
    const user = allUsers.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    if (user) {
      navigate('/dashboard/chat', { state: { selectedUser: user } });
    } else {
      alert('This sender is not a registered user. You can only message registered users.');
    }
  };

  const filtered = enquiries.filter(
    (enq) => {
      const matchedUser = allUsers.find(u => u.email?.toLowerCase() === enq.email?.toLowerCase());
      return (
        enq.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enq.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enq.phone?.includes(searchTerm) ||
        (matchedUser?.customUserId && matchedUser.customUserId.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
  );

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const paginate = (n) => { if (n >= 1 && n <= totalPages) setCurrentPage(n); };

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  return (
    <div className="min-h-full pb-10">

      {/* Page Header */}
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center">
            <LuCrown className="text-[#ccff00] text-base" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Exclusive Enquiries</h1>
        </div>
        <p className="text-gray-400 text-sm md:text-base pl-11">
          Access requests for exclusive project membership from investors.
        </p>
      </div>


      {/* Search */}
      <div className="relative mb-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
        <input
          type="text"
          placeholder="Search by User ID, name, email or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0c0c0c] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/50 transition-all placeholder:text-gray-600"
        />
      </div>

      {/* Table */}
      <div className="w-full rounded-[1.25rem] bg-[#0c0c0c] border border-[#ccff00]/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">

        {/* Table Header */}
        <div className="bg-[#111] p-6 flex items-center justify-between border-b border-[#ccff00]/10">
          <div className="flex items-center gap-3">
            <LuCrown className="text-[#ccff00]" />
            <h2 className="text-white font-bold text-sm tracking-[0.2em] uppercase">
              Exclusive Project Requests
            </h2>
          </div>
          <span className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">
            Showing {Math.min(indexOfFirst + 1, filtered.length)} - {Math.min(indexOfLast, filtered.length)} of {filtered.length} Exclusive Enquiries
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500 text-sm animate-pulse">
            Loading exclusive enquiries...
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              <table className="w-full text-left border-collapse min-w-[1250px]">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0a0a0a]/50">
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[200px]">Investor</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[120px]">User ID</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[150px]">Contact</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[150px]">Date</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[200px]">Subject</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[300px]">Message</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[120px] text-center">Status</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[120px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((enquiry) => {
                    const matchedUser = allUsers.find(u => u.email?.toLowerCase() === enquiry.email?.toLowerCase());
                    return (
                    <tr
                      key={enquiry.id}
                      className="border-b border-white/5 hover:bg-[#ccff00]/[0.02] transition-colors duration-200 group"
                    >
                      <td className="py-5 px-6 align-top">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00] text-[10px] font-black uppercase shrink-0">
                            {enquiry.fullname?.charAt(0) || 'U'}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-white font-bold text-sm">{enquiry.fullname}</span>
                            <span className="text-gray-500 text-[0.72rem]">{enquiry.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-6 align-top whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 tracking-wider inline-flex items-center">
                          {matchedUser ? (matchedUser.customUserId || `MHI2026${String(matchedUser.id).padStart(2, '0')}`) : '---'}
                        </span>
                      </td>
                      <td className="py-5 px-6 align-top">
                        <span className="text-gray-400 text-sm">{enquiry.countryCode} {enquiry.phone}</span>
                      </td>
                      <td className="py-5 px-6 align-top">
                        <span className="text-gray-400 text-sm">
                          {new Date(enquiry.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric', year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="py-5 px-6 align-top">
                        <span className="inline-flex items-center gap-1.5 text-[#ccff00] font-bold text-xs px-2 py-1 rounded-lg bg-[#ccff00]/10 border border-[#ccff00]/10">
                           {enquiry.subject}
                        </span>
                      </td>
                      <td className="py-5 px-6 align-top">
                        <p className="text-gray-400 text-sm whitespace-pre-wrap group-hover:text-gray-300 transition-colors leading-relaxed">
                          {enquiry.message}
                        </p>
                      </td>
                      <td className="py-5 px-6 align-top text-center">
                        {enquiry.status === 'Read' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            Read
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            Unread
                          </span>
                        )}
                      </td>
                      <td className="py-5 px-6 align-top text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleMessageClick(enquiry.email)}
                            className="p-2.5 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] hover:bg-[#ccff00] hover:text-black transition-all duration-300 group/btn"
                            title="Message User"
                          >
                            <FiMessageSquare className="text-lg group-hover/btn:scale-110 transition-transform" />
                          </button>
                          {enquiry.status !== 'Read' && (
                            <button
                              onClick={() => handleMarkAsRead(enquiry.id)}
                              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white hover:text-black transition-all duration-300 group/btn"
                              title="Mark as Read"
                            >
                              <FiCheck className="text-lg group-hover/btn:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="8" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <LuCrown className="text-3xl text-gray-700" />
                          <p className="text-gray-500 text-sm font-medium">No exclusive enquiries found.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filtered.length > itemsPerPage && (
              <div className="p-6 bg-[#0a0a0a]/50 border-t border-[#ccff00]/10 flex items-center justify-between">
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
                          currentPage === i + 1
                            ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.2)]'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ExclusiveEnquiries;
