import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineStar } from 'react-icons/hi';
import { FiMessageSquare, FiCheck } from 'react-icons/fi';
import { getEnquiriesByTypeApi, getAllUsersApi, updateEnquiryStatusApi } from '../../services/allApi';

const SpecialEnquiries = () => {
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
      const response = await getEnquiriesByTypeApi('Special');
      if (response.status === 200) {
        setEnquiries(response.data);
      }
    } catch (error) {
      console.error('Error fetching special enquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      const response = await updateEnquiryStatusApi(id, { status: 'Read' });
      if (response.status === 200) {
        setEnquiries(enquiries.map(enq => enq.id === id ? { ...enq, status: 'Read' } : enq));
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
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
    (enq) =>
      enq.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.phone?.includes(searchTerm)
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
            <HiOutlineStar className="text-[#ccff00] text-base" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Special Enquiries</h1>
        </div>
        <p className="text-gray-400 text-sm md:text-base pl-11">
          Access requests for special project membership from investors.
        </p>
      </div>


      {/* Search */}
      <div className="relative mb-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
        <input
          type="text"
          placeholder="Search by name, email or phone"
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
            <HiOutlineStar className="text-[#ccff00]" />
            <h2 className="text-white font-bold text-sm tracking-[0.2em] uppercase">
              Special Project Requests
            </h2>
          </div>
          <span className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">
            Showing {Math.min(indexOfFirst + 1, filtered.length)} - {Math.min(indexOfLast, filtered.length)} of {filtered.length} Special Enquiries
          </span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500 text-sm animate-pulse">
            Loading special enquiries...
          </div>
        ) : (
          <>
            <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="border-b border-white/10 bg-[#0a0a0a]/50">
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[200px]">Investor</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[150px]">Contact</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[150px]">Date</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[200px]">Subject</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[300px]">Message</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[120px]">Status</th>
                    <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] min-w-[100px] text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((enquiry) => (
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
                        <span className="inline-flex items-center gap-1.5 text-[#ccff00] font-bold text-xs px-2 py-1 rounded-lg bg-[#ccff00]/10 border border-[#ccff00]/10 max-w-fit">
                           {enquiry.subject}
                        </span>
                      </td>
                      <td className="py-5 px-6 align-top">
                        <p className="text-gray-400 text-sm whitespace-pre-wrap group-hover:text-gray-300 transition-colors leading-relaxed">
                          {enquiry.message}
                        </p>
                      </td>
                      <td className="py-5 px-6 align-top">
                         {enquiry.status === 'Read' && (
                           <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 max-w-fit">
                             <FiCheck /> Read
                           </span>
                         )}
                         {enquiry.status === 'Unread' && (
                           <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 max-w-fit">
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
                  ))}

                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <HiOutlineStar className="text-3xl text-gray-700" />
                          <p className="text-gray-500 text-sm font-medium">No special enquiries found.</p>
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

export default SpecialEnquiries;
