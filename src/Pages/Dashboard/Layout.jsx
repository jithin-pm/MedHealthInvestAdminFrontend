import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineHome, HiOutlineUsers, HiOutlineFolder, HiOutlineChatAlt2, HiOutlineLogout, HiOutlineMenuAlt2, HiX, HiOutlineChat, HiOutlineCurrencyDollar, HiOutlineChevronDown, HiOutlineStar, HiOutlineBell, HiOutlineKey } from 'react-icons/hi';
import { LuCrown } from 'react-icons/lu';
import Logo from '../../Components/Common/Logo';
import { FiEye, FiEyeOff, FiLoader } from 'react-icons/fi';
import { getEnquiriesByTypeApi, getAllProjectsApi, adminChangePasswordApi } from '../../services/allApi';
import { showAlert } from '../../Utils/alert';
import { getErrorMessage, getErrorTitle } from '../../Utils/getErrorMessage';

const SidebarLink = ({ to, icon: Icon, label, subLinks, onClick, badge }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActiveParent = (
    (location.pathname.startsWith(to) && to !== '/dashboard') ||
    (subLinks && subLinks.some(sub => location.pathname.startsWith(sub.to)))
  );

  React.useEffect(() => {
    if (isActiveParent) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [isActiveParent]);

  if (subLinks) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 font-bold text-[0.85rem] ${
            isActiveParent 
               ? 'text-[#ccff00] bg-[#ccff00]/5'
               : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center shrink-0">
              <Icon className="text-xl" />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#ccff00] text-black text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border border-[#0c0c0c] leading-none animate-in zoom-in-50 duration-200">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span>{label}</span>
          </div>
          <div className="flex items-center gap-2">
            <HiOutlineChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {isOpen && (
          <div className="pl-11 space-y-1 mt-1 animate-in slide-in-from-top-2 duration-300 fade-in">
            {subLinks.map(sub => {
              const isSubActive = location.pathname.startsWith(sub.to);
              return (
                <NavLink
                  key={sub.to}
                  to={sub.to}
                  onClick={onClick}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-all duration-300 text-[0.8rem] relative ${
                    isSubActive
                      ? 'text-[#ccff00] bg-[#ccff00]/5 font-bold shadow-sm pl-4'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {isSubActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#ccff00] rounded-full" />}
                    <span className="truncate">{sub.label}</span>
                  </div>
                  {sub.badge > 0 && (
                    <span className="ml-2 bg-[#ccff00] text-black text-[9px] font-black rounded-full min-w-[16px] h-4 px-1.5 flex items-center justify-center shrink-0 leading-none">
                      {sub.badge > 99 ? '99+' : sub.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={to}
      onClick={onClick}
      end={to === '/dashboard' || to === '/dashboard/enquiries'}
      className={({ isActive }) =>
        `flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-300 font-bold text-[0.85rem] relative ${
          isActive
            ? 'text-[#ccff00] bg-[#ccff00]/5 shadow-sm pl-4'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3">
            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#ccff00] rounded-full" />}
            <div className="relative flex items-center justify-center shrink-0">
              <Icon className="text-xl" />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#ccff00] text-black text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border border-[#0c0c0c] leading-none animate-in zoom-in-50 duration-200">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
            <span>{label}</span>
          </div>
          {badge > 0 && (
            <span className="bg-[#ccff00] text-black text-[9px] font-black rounded-full min-w-[16px] h-4 px-1.5 flex items-center justify-center leading-none">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
};

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [specialUnreadCount, setSpecialUnreadCount] = useState(0);
  const [exclusiveUnreadCount, setExclusiveUnreadCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // Change Password Modal State
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newAdminPassword || !confirmAdminPassword) {
      showAlert('Required', 'Please fill in all password fields.', 'info');
      return;
    }
    if (newAdminPassword.length < 6) {
      showAlert('Weak Password', 'New password must be at least 6 characters long.', 'warning');
      return;
    }
    if (newAdminPassword !== confirmAdminPassword) {
      showAlert('Mismatch', 'New password and confirmation password do not match.', 'warning');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await adminChangePasswordApi({
        currentPassword,
        newPassword: newAdminPassword
      });
      if (res.status === 200) {
        showAlert('Success', 'Your administrator password has been updated successfully.', 'success');
        setIsChangePasswordOpen(false);
        setCurrentPassword('');
        setNewAdminPassword('');
        setConfirmAdminPassword('');
      }
    } catch (err) {
      console.error("Change password error:", err);
      const message = getErrorMessage(err, 'Could not update password. Please verify your current password.');
      showAlert(getErrorTitle(err), message, 'error');
    } finally {
      setIsChangingPass(false);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const [specialRes, exclusiveRes, projectsRes] = await Promise.all([
        getEnquiriesByTypeApi('Special'),
        getEnquiriesByTypeApi('Exclusive'),
        getAllProjectsApi().catch(() => null)
      ]);

      if (specialRes && specialRes.status === 200 && Array.isArray(specialRes.data)) {
        const count = specialRes.data.filter(enq => enq.status?.toLowerCase() === 'unread').length;
        setSpecialUnreadCount(count);
      }

      if (exclusiveRes && exclusiveRes.status === 200 && Array.isArray(exclusiveRes.data)) {
        const count = exclusiveRes.data.filter(enq => enq.status?.toLowerCase() === 'unread').length;
        setExclusiveUnreadCount(count);
      }

      if (projectsRes?.status === 200 && Array.isArray(projectsRes.data?.projects)) {
        const now = new Date();
        let remCount = 0;
        projectsRes.data.projects.forEach(p => {
          if (p.status === 'ONGOING') {
            let maturityDate = null;
            if (p.completionDate) maturityDate = new Date(p.completionDate);
            else if (p.ongoingStartDate && p.duration) maturityDate = new Date(new Date(p.ongoingStartDate).getTime() + (parseInt(p.duration) * 30 * 24 * 60 * 60 * 1000));
            else if (p.duration && (p.created_at || p.createdAt)) maturityDate = new Date(new Date(p.created_at || p.createdAt).getTime() + (parseInt(p.duration) * 30 * 24 * 60 * 60 * 1000));

            if (maturityDate && !isNaN(maturityDate.getTime())) {
              const diffDays = Math.ceil((maturityDate - now) / (1000 * 60 * 60 * 24));
              if (diffDays <= 30) remCount++;
            }
          } else if (p.status === 'ACTIVE') {
            const target = Number(p.targetAmount || 0);
            const collected = Number(p.collectedAmount || 0);
            if (collected < target && p.activeDeadline) {
              const deadlineDate = new Date(p.activeDeadline);
              if (!isNaN(deadlineDate.getTime())) {
                const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
                if (diffDays <= 30) remCount++;
              }
            }
          } else if (p.status === 'EXPIRED' && !p.isSettled) {
            remCount++;
          }
        });
        setReminderCount(remCount);
      }
    } catch (error) {
      console.error('Error fetching unread counts / reminders:', error);
    }
  };

  React.useEffect(() => {
    fetchUnreadCounts();

    const handleUpdate = () => {
      fetchUnreadCounts();
    };
    window.addEventListener('enquiriesUpdated', handleUpdate);

    // Poll every 2 minutes instead of 15 seconds to stay well below Hostinger's 500 connections/hr limit
    const interval = setInterval(fetchUnreadCounts, 120000);

    return () => {
      window.removeEventListener('enquiriesUpdated', handleUpdate);
      clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    fetchUnreadCounts();
  }, [location.pathname]);

  const handleLogout = () => {
    Swal.fire({
      title: 'Sign Out?',
      text: 'Are you sure you want to end your administrative session?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ccff00',
      cancelButtonColor: '#1a1a1a',
      confirmButtonText: 'Yes, Sign Out',
      cancelButtonText: 'Cancel',
      background: '#0c0c0c',
      color: '#ffffff',
      customClass: {
        confirmButton: 'text-black font-bold px-6 py-2.5 rounded-xl',
        cancelButton: 'text-white font-bold px-6 py-2.5 rounded-xl'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('medhealthinvestadmin');
        navigate('/login');
      }
    });
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: HiOutlineHome },
    { to: '/dashboard/users', label: 'User Management', icon: HiOutlineUsers },
    { 
      to: '/dashboard/projects', 
      label: 'Standard Projects', 
      icon: HiOutlineFolder,
      subLinks: [
        { to: '/dashboard/projects/active', label: 'Active Projects' },
        { to: '/dashboard/projects/ongoing', label: 'Ongoing Projects' },
        { to: '/dashboard/projects/completed', label: 'Completed Projects' },
        { to: '/dashboard/projects/expired', label: 'Expired Projects' },
      ]
    },
    { 
      to: '/dashboard/exclusive-projects', 
      label: 'Exclusive Projects', 
      icon: LuCrown,
      badge: exclusiveUnreadCount,
      subLinks: [
        { to: '/dashboard/exclusive-projects', label: 'Exclusive Project Management' },
        { to: '/dashboard/enquiries/exclusive', label: 'Exclusive Enquiries', badge: exclusiveUnreadCount }
      ]
    },
    { 
      to: '/dashboard/special-projects', 
      label: 'Special Projects', 
      icon: HiOutlineStar,
      badge: specialUnreadCount,
      subLinks: [
        { to: '/dashboard/special-projects', label: 'Special Project Management' },
        { to: '/dashboard/enquiries/special', label: 'Special Projects Enquiries', badge: specialUnreadCount }
      ]
    },
    { 
      to: '/dashboard/project-reminders', 
      label: 'Project Reminders', 
      icon: HiOutlineBell,
      badge: reminderCount > 0 ? reminderCount : null
    },
    { to: '/dashboard/transactions', label: 'Recent Transactions', icon: HiOutlineCurrencyDollar },
    { to: '/dashboard/enquiries', label: 'Enquiries', icon: HiOutlineChatAlt2 },
    { to: '/dashboard/chat', label: 'Chat', icon: HiOutlineChat },
  ];

  return (
    <div className="flex h-screen bg-[#080808] text-white overflow-hidden selection:bg-[#ccff00] selection:text-black">
      {/* Background Glows */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Mobile Header / Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-[70px] bg-[#0c0c0c]/80 backdrop-blur-md border-b border-white/5 z-40 flex items-center justify-between px-4">
        <Logo size="mobile" />
        <button onClick={() => setIsSidebarOpen(true)} className="text-2xl text-gray-300 hover:text-white">
          <HiOutlineMenuAlt2 />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-full w-[280px] bg-[#0c0c0c] border-r border-white/5 flex flex-col z-50 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Area */}
        <div className="h-[90px] flex items-center justify-between px-6 border-b border-white/5 shrink-0">
          <Logo size="sidebar" />
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <HiX className="text-2xl" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
          <div className="text-[0.65rem] font-bold text-gray-600 tracking-[0.15em] mb-4 px-2 uppercase">
            Menu
          </div>
          {navLinks.map((link) => (
            <SidebarLink 
              key={link.to} 
              {...link} 
              onClick={() => setIsSidebarOpen(false)}
            />
          ))}
        </div>

        {/* User / Logout & Reset Password */}
        <div className="p-4 border-t border-white/5 shrink-0 space-y-1.5">
          <button
            onClick={() => setIsChangePasswordOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-gray-400 hover:text-[#ccff00] hover:bg-white/5 transition-colors font-medium text-[0.85rem] cursor-pointer"
          >
            <HiOutlineKey className="text-xl" />
            <span>Reset Password</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-white/5 transition-colors font-medium text-[0.85rem] cursor-pointer"
          >
            <HiOutlineLogout className="text-xl" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-y-auto pt-[70px] lg:pt-0">
        <div className="absolute inset-0 pointer-events-none"
             style={{ background: 'radial-gradient(ellipse at top left, rgba(204,255,0,0.03), transparent 50%)' }} />
        
        <div className="p-6 md:p-8 lg:p-10 relative z-10 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>

      {/* Change Password Modal */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0c0c0c] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00]">
                  <HiOutlineKey className="text-xl" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Reset Password</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Administrative Access</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsChangePasswordOpen(false);
                  setCurrentPassword('');
                  setNewAdminPassword('');
                  setConfirmAdminPassword('');
                }}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
              >
                <HiX className="text-lg" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleChangePasswordSubmit} className="mt-6 space-y-5">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ccff00] transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showCurrentPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ccff00] transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="block text-[0.65rem] font-bold text-gray-400 uppercase tracking-widest">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmAdminPassword}
                    onChange={(e) => setConfirmAdminPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#ccff00] transition-colors pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPass ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangePasswordOpen(false);
                    setCurrentPassword('');
                    setNewAdminPassword('');
                    setConfirmAdminPassword('');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-6 py-2.5 rounded-xl bg-[#ccff00] text-black font-black text-xs uppercase tracking-widest hover:bg-[#b3e600] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.2)]"
                >
                  {isChangingPass ? (
                    <>
                      <FiLoader className="animate-spin text-sm" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;
