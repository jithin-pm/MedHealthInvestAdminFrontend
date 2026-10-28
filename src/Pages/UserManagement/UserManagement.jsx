import React, { useState, useEffect } from 'react';
import { HiOutlineSearch } from 'react-icons/hi';
import { BsFillPatchCheckFill } from 'react-icons/bs';
import { FiX, FiShield, FiUser, FiInfo, FiCopy, FiPaperclip, FiDownload, FiFileText, FiUnlock, FiUserX, FiUserCheck, FiEdit3, FiActivity, FiMonitor, FiSmartphone, FiTablet, FiGlobe, FiClock } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { getAllUsersApi, getUserVerificationStatusApi, getAllTransactionsApi, unblockUserApi, toggleUserStatusApi, adminUpdateUserApi, getUserActivityLogsApi } from '../../services/allApi';
import { BASE_URL } from '../../services/baseUrl';
import { generateInvestmentReceipt } from '../../Utils/generateReceipt';

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

  // Transaction modal state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Image Modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Edit User Modal state
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    fullName: '',
    email: '',
    countryCode: '+91',
    mobileNumber: '',
    gender: 'Male'
  });
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Activity Log modal state
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityUser, setActivityUser] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivityLogs, setLoadingActivityLogs] = useState(false);

  const [allTransactions, setAllTransactions] = useState([]);

  // Live ticker to update remaining lockout times every 30 seconds
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  // Helper to format remaining lock time dynamically
  const getBlockedTimeLeft = (lockUntil) => {
    if (!lockUntil) return 'Blocked';
    const diffMs = new Date(lockUntil).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';

    const totalMinutes = Math.max(1, Math.ceil(diffMs / (1000 * 60)));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m left`;
    }
    if (hours > 0) {
      return `${hours}h left`;
    }
    return `${minutes}m left`;
  };

  useEffect(() => {
    fetchUsersAndTransactions();
  }, []);

  const fetchUsersAndTransactions = async () => {
    try {
      setLoading(true);
      const [usersResponse, txResponse] = await Promise.all([
        getAllUsersApi(),
        getAllTransactionsApi()
      ]);

      if (usersResponse.status === 200) {
        setUsers(usersResponse.data);
      }

      if (txResponse.status === 200) {
        setAllTransactions(txResponse.data.transactions || txResponse.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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

  const handleOpenTransactionModal = (user) => {
    setSelectedUser(user);
    setIsTransactionModalOpen(true);
    setLoadingTransactions(true);

    // Filter transactions for this specific user
    const userTxs = allTransactions.filter(tx => tx.userId === user.id);
    setTransactionDetails(userTxs);

    // Simulate slight delay for smooth UI transition
    setTimeout(() => {
      setLoadingTransactions(false);
    }, 300);
  };

  const handleOpenActivityLogModal = async (user) => {
    setActivityUser(user);
    setIsActivityModalOpen(true);
    setLoadingActivityLogs(true);
    setActivityLogs([]);
    try {
      const res = await getUserActivityLogsApi(user.id);
      if (res.status === 200 && res.data?.logs) {
        setActivityLogs(res.data.logs);
      }
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setLoadingActivityLogs(false);
    }
  };

  const getDeviceIcon = (device = '', os = '') => {
    const str = `${device} ${os}`.toLowerCase();
    if (str.includes('phone') || str.includes('android') || str.includes('iphone')) {
      return <FiSmartphone className="text-emerald-400" size={16} />;
    }
    if (str.includes('tablet') || str.includes('ipad')) {
      return <FiTablet className="text-purple-400" size={16} />;
    }
    return <FiMonitor className="text-blue-400" size={16} />;
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

  const handleUnblockUser = async (user) => {
    const result = await Swal.fire({
      title: 'Unblock User Account?',
      text: `Are you sure you want to unblock ${user.fullName} (${user.email})? Their failed attempts will be reset to 0 and their account will be immediately restored.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#00c853',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Yes, Unblock User',
      cancelButtonText: 'Cancel',
      background: '#1c1917',
      color: '#fff',
      customClass: {
        popup: 'border border-white/10 rounded-2xl'
      }
    });

    if (result.isConfirmed) {
      try {
        const res = await unblockUserApi(user.id);
        if (res.status === 200) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `${user.fullName} unblocked successfully!`,
            showConfirmButton: false,
            timer: 2500,
            background: '#1c1917',
            color: '#fff',
            customClass: {
              popup: 'border border-[#ccff00]/20 rounded-xl'
            }
          });

          // Update local state without needing full page reload
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, lockUntil: null, loginAttempts: 0 } : u))
          );
          if (selectedUser && selectedUser.id === user.id) {
            setSelectedUser((prev) => ({ ...prev, lockUntil: null, loginAttempts: 0 }));
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Failed',
            text: res.data?.message || 'Failed to unblock user.',
            background: '#1c1917',
            color: '#fff'
          });
        }
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err.response?.data?.message || err.message || 'Something went wrong.',
          background: '#1c1917',
          color: '#fff'
        });
      }
    }
  };

  const handleOpenEditUserModal = (user) => {
    setEditingUser(user);
    setEditFormData({
      fullName: user.fullName || '',
      email: user.email || '',
      countryCode: user.countryCode || '+91',
      mobileNumber: user.mobileNumber || '',
      gender: user.gender || 'Male'
    });
    setIsEditUserModalOpen(true);
  };

  const handleSaveEditUser = async (e) => {
    e.preventDefault();
    if (!editFormData.fullName.trim() || !editFormData.email.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Fields',
        text: 'Full Name and Email are required.',
        background: '#1c1917',
        color: '#fff',
        customClass: {
          popup: 'border border-white/10 rounded-2xl'
        }
      });
      return;
    }

    setIsSavingUser(true);
    try {
      const res = await adminUpdateUserApi(editingUser.id, editFormData);
      if (res.status === 200) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'User profile updated successfully!',
          showConfirmButton: false,
          timer: 2500,
          background: '#1c1917',
          color: '#fff',
          customClass: {
            popup: 'border border-[#ccff00]/20 rounded-xl'
          }
        });

        // Update in state
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editFormData } : u));
        setIsEditUserModalOpen(false);
        setEditingUser(null);
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: res.data?.message || 'Failed to update user profile.',
          background: '#1c1917',
          color: '#fff'
        });
      }
    } catch (err) {
      console.error("Error updating user:", err);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Failed to update user profile.',
        background: '#1c1917',
        color: '#fff'
      });
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    const isCurrentlyActive = user.isActive !== false && user.isActive !== 0;
    const actionText = isCurrentlyActive ? 'Mark as Inactive' : 'Activate User';
    const confirmButtonColor = isCurrentlyActive ? '#ef4444' : '#00c853';

    const result = await Swal.fire({
      title: isCurrentlyActive ? 'Deactivate User Account?' : 'Activate User Account?',
      text: isCurrentlyActive
        ? `Are you sure you want to mark ${user.fullName} (${user.email}) as Inactive? They will be prevented from logging in and restricted from performing any actions.`
        : `Are you sure you want to activate ${user.fullName} (${user.email})? Their login and account access will be immediately restored.`,
      icon: isCurrentlyActive ? 'warning' : 'question',
      showCancelButton: true,
      confirmButtonColor: confirmButtonColor,
      cancelButtonColor: '#374151',
      confirmButtonText: `Yes, ${actionText}`,
      cancelButtonText: 'Cancel',
      background: '#1c1917',
      color: '#fff',
      customClass: {
        popup: 'border border-white/10 rounded-2xl'
      }
    });

    if (result.isConfirmed) {
      try {
        const res = await toggleUserStatusApi(user.id, { isActive: !isCurrentlyActive });
        if (res.status === 200) {
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `${user.fullName} ${isCurrentlyActive ? 'marked as inactive' : 'activated'} successfully!`,
            showConfirmButton: false,
            timer: 2500,
            background: '#1c1917',
            color: '#fff',
            customClass: {
              popup: 'border border-[#ccff00]/20 rounded-xl'
            }
          });

          // Update state locally
          setUsers((prev) =>
            prev.map((u) => (u.id === user.id ? { ...u, isActive: !isCurrentlyActive } : u))
          );
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Failed to update status',
            text: res.data?.message || 'Something went wrong.',
            background: '#1c1917',
            color: '#fff',
          });
        }
      } catch (error) {
        console.error("Error updating user status:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.response?.data?.message || 'Failed to update user status.',
          background: '#1c1917',
          color: '#fff',
        });
      }
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.mobileNumber.includes(searchTerm) ||
      (user.customUserId && user.customUserId.toLowerCase().includes(searchTerm.toLowerCase()))
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
          placeholder="Search by ID, name, email or mobile"
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
          <table className="w-full text-left border-collapse min-w-[1350px]">
            <thead>
              <tr className="border-b border-white/10 bg-[#0a0a0a]/50">
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] whitespace-nowrap">Investor</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] whitespace-nowrap">User ID</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] whitespace-nowrap">Contact</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] whitespace-nowrap">Gender</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] whitespace-nowrap">Date Joined</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] whitespace-nowrap">Account Status</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] whitespace-nowrap">Transactions</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] whitespace-nowrap">Details</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((user) => {
                const isBlocked = user.lockUntil && new Date(user.lockUntil) > new Date();
                return (
                  <tr
                    key={user.id}
                    className={`border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-200 group ${isBlocked ? 'bg-red-500/[0.02]' : ''}`}
                  >
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3 whitespace-nowrap">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs relative shrink-0 ${isBlocked ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#ccff00]/10 text-[#ccff00]'}`}>
                          {user.fullName.charAt(0)}
                          {((user.isPanVerified === 1 || user.isPanVerified === true) && (user.isBankVerified === 1 || user.isBankVerified === true)) && (
                            <BsFillPatchCheckFill className="absolute -top-0.5 -right-0.5 text-[#ccff00] bg-black rounded-full" size={10} />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white font-bold text-sm leading-tight">{user.fullName}</span>
                          <span className="text-gray-500 text-xs font-mono mt-0.5">{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 tracking-wider inline-flex items-center">
                        {user.customUserId || `MHI2026${String(user.id).padStart(2, '0')}`}
                      </span>
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <span className="text-gray-400 text-sm whitespace-nowrap">{user.countryCode} {user.mobileNumber}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm capitalize whitespace-nowrap">
                      {user.gender}
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm whitespace-nowrap">
                      {new Date(user.createdAt || user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {user.isActive === false || user.isActive === 0 ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[0.65rem] font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400 whitespace-nowrap">
                          Inactive
                        </span>
                      ) : isBlocked ? (
                        <span
                          title={`Account locked until ${new Date(user.lockUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${new Date(user.lockUntil).toLocaleDateString()})`}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-[0.65rem] font-black uppercase tracking-wider bg-red-500/10 border border-red-500/20 text-red-400 whitespace-nowrap"
                        >
                          Blocked ({getBlockedTimeLeft(user.lockUntil)})
                        </span>
                      ) : user.loginAttempts > 0 ? (
                        (() => {
                          const lastTime = user.last_failed_attempt || user.lastFailedAttempt || user.updated_at || user.updatedAt;
                          const isExpired = lastTime && (Date.now() - new Date(lastTime).getTime()) >= 24 * 60 * 60 * 1000;
                          if (isExpired) {
                            return (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[0.65rem] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 whitespace-nowrap">
                                Active
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[0.65rem] font-bold uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 whitespace-nowrap">
                              {user.loginAttempts}/3 Today
                            </span>
                          );
                        })()
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[0.65rem] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 whitespace-nowrap">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {allTransactions.filter(tx => tx.userId === user.id).length > 0 ? (
                        <button
                          onClick={() => handleOpenTransactionModal(user)}
                          className="px-4 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white text-[0.65rem] font-black uppercase tracking-widest transition-all active:scale-[0.97] whitespace-nowrap"
                        >
                          History
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-[0.65rem] font-bold uppercase tracking-wider">-</span>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      {((user.isPanVerified === 1 || user.isPanVerified === true) || (user.isBankVerified === 1 || user.isBankVerified === true)) ? (
                        <button
                          onClick={() => handleOpenDetailsModal(user)}
                          className="px-4 py-1.5 rounded-lg bg-[#ccff00]/10 border border-[#ccff00]/20 text-[#ccff00] hover:bg-[#ccff00] hover:text-black hover:border-[#ccff00] text-[0.65rem] font-black uppercase tracking-widest transition-all active:scale-[0.97] whitespace-nowrap"
                        >
                          View Details
                        </button>
                      ) : (
                        <span className="text-zinc-600 text-[0.65rem] font-bold uppercase tracking-wider">Unverified</span>
                      )}
                    </td>
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenActivityLogModal(user)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-black hover:border-amber-500 text-[0.65rem] font-black uppercase tracking-widest transition-all active:scale-95 inline-flex items-center gap-1.5 whitespace-nowrap"
                          title="View login activity & device logs"
                        >
                          <FiActivity size={12} />
                          Activity Log
                        </button>

                        <button
                          onClick={() => handleOpenEditUserModal(user)}
                          className="px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500 hover:text-white text-[0.65rem] font-black uppercase tracking-widest transition-all active:scale-95 inline-flex items-center gap-1.5 whitespace-nowrap"
                          title="Edit user profile"
                        >
                          <FiEdit3 size={12} />
                          Edit
                        </button>

                        {isBlocked && (
                          <button
                            onClick={() => handleUnblockUser(user)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500 hover:text-white text-[0.65rem] font-black uppercase tracking-widest transition-all active:scale-95 inline-flex items-center gap-1.5 whitespace-nowrap"
                            title="Click to unblock this user"
                          >
                            <FiUnlock size={12} />
                            Unblock
                          </button>
                        )}

                        {user.isActive === false || user.isActive === 0 ? (
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 text-[0.65rem] font-black uppercase tracking-widest transition-all active:scale-95 inline-flex items-center gap-1.5 whitespace-nowrap"
                            title="Click to activate this user account"
                          >
                            <FiUserCheck size={12} />
                            Mark as Active
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleUserStatus(user)}
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white hover:border-rose-500 text-[0.65rem] font-black uppercase tracking-widest transition-all active:scale-95 inline-flex items-center gap-1.5 whitespace-nowrap"
                            title="Mark user as inactive"
                          >
                            <FiUserX size={12} />
                            Mark as Inactive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && !loading && (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500 text-sm">
                    {searchTerm ? "No users found matching your search." : "No registered users found."}
                  </td>
                </tr>
              )}

              {loading && (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-500 text-sm animate-pulse">
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
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${currentPage === 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                Previous
              </button>
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${currentPage === totalPages ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/5'
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
                    className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${currentPage === i + 1 ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.2)]' : 'text-gray-500 hover:text-white hover:bg-white/5'
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
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">Verification Details</h3>
                    <span className="px-2 py-0.5 rounded text-[0.7rem] font-mono font-bold bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 tracking-wider">
                      {selectedUser.customUserId || `MHI2026${String(selectedUser.id).padStart(2, '0')}`}
                    </span>
                  </div>
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
              {/* Account Lockout Banner inside Modal */}
              {selectedUser.lockUntil && new Date(selectedUser.lockUntil) > new Date() && (
                <div className="mb-8 p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                      <FiShield size={20} />
                    </div>
                    <div>
                      <p className="text-white text-sm font-bold flex items-center gap-2">
                        Account Temporarily Blocked
                        <span className="px-2 py-0.5 rounded text-[0.65rem] bg-red-500/20 text-red-400 uppercase tracking-widest font-black">
                          {getBlockedTimeLeft(selectedUser.lockUntil)}
                        </span>
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        Exceeded 3 failed login attempts. Automatically unlocks in {getBlockedTimeLeft(selectedUser.lockUntil)} ({new Date(selectedUser.lockUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(selectedUser.lockUntil).toLocaleDateString()}).
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnblockUser(selectedUser)}
                    className="px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
                  >
                    <FiUnlock size={14} />
                    Unblock Account
                  </button>
                </div>
              )}

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

      {/* Transaction History Modal */}
      {isTransactionModalOpen && selectedUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 font-['Outfit']">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between bg-[#0a0a0a]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                  <FiInfo size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">Transaction History</h3>
                    <span className="px-2 py-0.5 rounded text-[0.7rem] font-mono font-bold bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20 tracking-wider">
                      {selectedUser.customUserId || `MHI2026${String(selectedUser.id).padStart(2, '0')}`}
                    </span>
                  </div>
                  <p className="text-gray-500 text-xs mt-0.5">{selectedUser.fullName} • {selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setIsTransactionModalOpen(false)}
                className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:bg-white/10 active:scale-95"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {loadingTransactions ? (
                <div className="py-20 text-center text-gray-500 text-sm animate-pulse flex flex-col items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  Loading transactions...
                </div>
              ) : transactionDetails && transactionDetails.length > 0 ? (
                <div className="space-y-4">
                  <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    <table className="w-full min-w-[1000px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-[#0a0a0a]/50">
                          <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Transaction ID</th>
                          <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Project Detail</th>
                          <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Project Type</th>
                          <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Payment Type</th>
                          <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Date</th>
                          <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Amount</th>
                          <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Status</th>
                          <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] text-center">Receipts / Attachments</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactionDetails.map((tx, index) => (
                          <tr key={tx.id || index} className={`border-b border-white/5 transition-colors duration-200 ${tx.type !== 'INVESTMENT' ? 'bg-[#ccff00]/[0.02] hover:bg-[#ccff00]/[0.05]' : 'hover:bg-white/[0.02]'
                            }`}>
                            <td className="py-5 px-6">
                              <span className="text-gray-500 text-[0.65rem] font-mono whitespace-nowrap">
                                {tx.transactionId || tx.paymentId || '---'}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <span className="text-gray-300 font-medium text-sm">
                                {tx.project?.projectName || tx.Project?.title || tx.projectName || 'Unknown Project'}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <span className={`text-[0.65rem] font-bold px-2 py-1 rounded tracking-widest uppercase ${(tx.project?.projectType || tx.Project?.projectType) === 'Exclusive'
                                ? 'bg-[#ccff00]/10 text-[#ccff00] border border-[#ccff00]/20'
                                : 'bg-white/5 text-gray-400 border border-white/10'
                                }`}>
                                {tx.project?.projectType || tx.Project?.projectType || 'Standard'}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <span className={`text-[0.65rem] font-bold px-2 py-1 rounded tracking-widest uppercase ${tx.type === 'REFUND'
                                ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                                : tx.type === 'PAYOUT'
                                  ? 'bg-[#00ffa3]/10 text-[#00ffa3] border border-[#00ffa3]/20'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}>
                                {tx.type || 'INVESTMENT'}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <span className="text-gray-400 text-sm whitespace-nowrap">
                                {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date(tx.createdAt || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                            </td>
                            <td className="py-5 px-6">
                              <span className="text-white font-bold text-sm"><span className="mr-0.5">₹</span>{Number(tx.amount || tx.investmentAmount || 0).toLocaleString('en-IN')}</span>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${(tx.status === 'SUCCESS' || tx.status === 'Completed' || tx.paymentStatus === 'SUCCESS') ? 'bg-[#00ffa3]' :
                                  (tx.status === 'PENDING' || tx.paymentStatus === 'PENDING') ? 'bg-orange-400' : 'bg-red-500'
                                  }`} />
                                <span className="text-gray-300 text-sm font-medium">
                                  {(tx.status === 'SUCCESS' || tx.status === 'Completed' || tx.paymentStatus === 'SUCCESS') ? 'Completed' : tx.status || tx.paymentStatus}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 px-6">
                              <div className="flex items-center justify-center gap-2">
                                {/* View Attachment Button (Proof) */}
                                {tx.paybackProof && (
                                  <button
                                    onClick={() => {
                                      setSelectedImage(tx.paybackProof.startsWith('http') ? tx.paybackProof : `${BASE_URL}/${tx.paybackProof}`);
                                      setIsImageModalOpen(true);
                                    }}
                                    className="w-8 h-8 rounded-lg bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00] hover:bg-[#ccff00] hover:text-black transition-all"
                                    title="View Payment Attachment"
                                  >
                                    <FiPaperclip size={14} />
                                  </button>
                                )}

                                {/* Download Receipt Button */}
                                <button
                                  onClick={() => {
                                    if (tx.type === 'PAYOUT' || tx.type === 'REFUND') {
                                      generateInvestmentReceipt({
                                        amount: tx.amount,
                                        paymentId: tx.transactionId || tx.paymentId,
                                        projectTitle: tx.project?.projectName || tx.projectName || 'Investment Project',
                                        duration: tx.project?.duration || 1,
                                        isPayout: tx.type === 'PAYOUT',
                                        isRefund: tx.type === 'REFUND',
                                        paybackProof: tx.paybackProof ? `${BASE_URL}/${tx.paybackProof}` : null
                                      }, selectedUser, 'download');
                                    } else {
                                      generateInvestmentReceipt({
                                        amount: tx.amount,
                                        paymentId: tx.transactionId || tx.paymentId,
                                        projectTitle: tx.project?.projectName || tx.projectName || 'Investment Project',
                                        duration: tx.project?.duration || 1
                                      }, selectedUser, 'download');
                                    }
                                  }}
                                  className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 hover:text-white transition-all"
                                  title="Download System Receipt"
                                >
                                  <FiDownload size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-zinc-500 text-sm">
                  No transactions found for this user.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex justify-end bg-[#0a0a0a]">
              <button
                onClick={() => setIsTransactionModalOpen(false)}
                className="px-6 py-2.5 rounded-xl bg-white text-black font-bold text-xs uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all active:scale-[0.98]"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && selectedImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col items-center">
            <div className="w-full flex justify-end mb-4">
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all backdrop-blur-md border border-white/10"
              >
                <FiX className="text-2xl" />
              </button>
            </div>

            <div className="relative w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-2 shadow-2xl">
              {selectedImage.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={selectedImage}
                  className="w-full h-[80vh] rounded-xl"
                  title="Payment Proof PDF"
                />
              ) : (
                <img
                  src={selectedImage}
                  alt="Payment Proof"
                  className="w-full max-h-[80vh] object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit User Profile Modal */}
      {isEditUserModalOpen && editingUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 sm:p-8 animate-in zoom-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <FiEdit3 className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Edit User Profile</h3>
                  <p className="text-xs text-gray-400 font-mono">ID: {editingUser.customUserId || `MHI2026${String(editingUser.id).padStart(2, '0')}`}</p>
                </div>
              </div>
              <button
                onClick={() => setIsEditUserModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all border border-white/5"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEditUser} className="space-y-4 pt-6">
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
                />
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="Enter email address"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
                />
              </div>

              {/* Contact Number */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    Country Code
                  </label>
                  <select
                    value={editFormData.countryCode}
                    onChange={(e) => setEditFormData({ ...editFormData, countryCode: e.target.value })}
                    className="w-full px-3 py-3 rounded-xl bg-[#0c0c0c] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
                  >
                    <option value="+91">+91 (IN)</option>
                    <option value="+971">+971 (AE)</option>
                    <option value="+1">+1 (US)</option>
                    <option value="+44">+44 (UK)</option>
                    <option value="+966">+966 (SA)</option>
                    <option value="+61">+61 (AU)</option>
                    <option value="+65">+65 (SG)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={editFormData.mobileNumber}
                    onChange={(e) => setEditFormData({ ...editFormData, mobileNumber: e.target.value })}
                    placeholder="Enter mobile number"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-blue-500/60 transition-colors"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Male', 'Female', 'Other'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEditFormData({ ...editFormData, gender: g })}
                      className={`py-2.5 rounded-xl border text-xs font-bold transition-all ${editFormData.gender?.toLowerCase() === g.toLowerCase()
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditUserModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="px-6 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingUser ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER ACTIVITY LOG MODAL */}
      {isActivityModalOpen && activityUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl bg-[#0c0c0c] border border-white/10 rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#111]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <FiActivity size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">Login Activity & Device History</h3>
                    <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400">
                      Security Logs
                    </span>
                  </div>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {activityUser.fullName} • <span className="font-mono text-gray-500">{activityUser.email}</span> • ID: <span className="text-[#ccff00] font-mono">{activityUser.customUserId || `MHI2026${String(activityUser.id).padStart(2, '0')}`}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsActivityModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all hover:bg-white/10"
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Summary Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-white/[0.01] border-b border-white/5 text-xs">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Total Recorded Sessions</span>
                <span className="text-white font-bold text-base mt-1">{activityLogs.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Latest IP</span>
                <span className="text-blue-400 font-mono font-bold text-xs mt-1 truncate">
                  {activityLogs[0]?.ipAddress || '---'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Primary Device</span>
                <span className="text-emerald-400 font-bold text-xs mt-1 truncate">
                  {activityLogs[0]?.device || '---'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex flex-col">
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">Account State</span>
                <span className={`font-bold text-xs mt-1 ${
                  activityUser.isActive === false ? 'text-rose-400' : 'text-[#ccff00]'
                }`}>
                  {activityUser.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                </span>
              </div>
            </div>

            {/* Modal Table / Content */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
              {loadingActivityLogs ? (
                <div className="py-20 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-400 rounded-full animate-spin" />
                  <p className="text-xs font-bold tracking-wider uppercase">Loading security logs...</p>
                </div>
              ) : activityLogs.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-white/10 bg-[#0a0a0a]/60">
                        <th className="py-3 px-4 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Login Time</th>
                        <th className="py-3 px-4 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">IP Address</th>
                        <th className="py-3 px-4 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Device & Hardware</th>
                        <th className="py-3 px-4 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Browser / OS</th>
                        <th className="py-3 px-4 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.map((log, index) => {
                        const logDate = new Date(log.loginTime || log.created_at || Date.now());
                        return (
                          <tr key={log.id || index} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
                                  <FiClock size={13} className="text-amber-400" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-white text-xs font-bold">
                                    {logDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                  </span>
                                  <span className="text-gray-500 text-[11px] font-mono">
                                    {logDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <FiGlobe className="text-blue-400 shrink-0" size={13} />
                                <span className="text-gray-300 font-mono text-xs bg-white/5 px-2 py-0.5 rounded border border-white/10">
                                  {log.ipAddress || '---'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center">
                                  {getDeviceIcon(log.device, log.os)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-white text-xs font-bold">{log.device || 'Unknown Device'}</span>
                                  <span className="text-gray-500 text-[10px]">{log.os || 'Unknown OS'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-gray-300 text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 font-medium inline-block w-fit">
                                  {log.browser || 'Web Browser'}
                                </span>
                                <span className="text-gray-600 text-[10px] font-mono mt-0.5">
                                  {log.action || 'LOGIN'}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap text-center">
                              {(() => {
                                const status = (log.status || 'SUCCESS').toUpperCase();
                                if (status === 'SUCCESS') {
                                  return (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                      SUCCESS
                                    </span>
                                  );
                                }
                                if (status === 'FAILED') {
                                  return (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-black uppercase tracking-wider bg-rose-500/10 border border-rose-500/30 text-rose-400">
                                      FAILED
                                    </span>
                                  );
                                }
                                if (status === 'LOCKED' || status === 'DEACTIVATED' || status === 'BLOCKED') {
                                  return (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-black uppercase tracking-wider bg-red-500/20 border border-red-500/30 text-red-400">
                                      {status}
                                    </span>
                                  );
                                }
                                return (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[0.65rem] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
                                    {status}
                                  </span>
                                );
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-16 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 mb-2">
                    <FiActivity size={24} className="text-amber-400/80" />
                  </div>
                  <p className="text-sm font-bold text-gray-300">No Login Activity Recorded Yet</p>
                  <p className="text-xs text-gray-500 max-w-md">
                    Login timestamps, client IP addresses, device types, and browser signatures will be automatically logged and displayed here whenever this user attempts or completes authentication.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-white/10 bg-[#0a0a0a] flex items-center justify-between text-xs text-gray-500">
              <span>Logged IP addresses and device user agents are preserved for security auditing.</span>
              <button
                type="button"
                onClick={() => setIsActivityModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
