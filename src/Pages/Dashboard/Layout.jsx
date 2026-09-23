import React, { useState } from 'react';
import Swal from 'sweetalert2';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { HiOutlineHome, HiOutlineUsers, HiOutlineFolder, HiOutlineChatAlt2, HiOutlineLogout, HiOutlineMenuAlt2, HiX, HiOutlineChat, HiOutlineCurrencyDollar, HiOutlineChevronDown, HiOutlineStar } from 'react-icons/hi';
import { LuCrown } from 'react-icons/lu';
import Logo from '../../Components/Common/Logo';

const SidebarLink = ({ to, icon: Icon, label, subLinks, onClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActiveParent = location.pathname.startsWith(to) && to !== '/dashboard';

  React.useEffect(() => {
    if (isActiveParent) setIsOpen(true);
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
            <Icon className="text-xl" />
            <span>{label}</span>
          </div>
          <HiOutlineChevronDown className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
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
                  className={`block px-3 py-1.5 rounded-lg transition-all duration-300 text-[0.8rem] relative ${
                    isSubActive
                      ? 'text-[#ccff00] bg-[#ccff00]/5 font-bold shadow-sm pl-4'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isSubActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-[#ccff00] rounded-full shadow-[0_0_10px_rgba(204,255,0,0.5)]" />}
                  {sub.label}
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
        `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 font-bold text-[0.85rem] relative ${
          isActive
            ? 'text-[#ccff00] bg-[#ccff00]/5 shadow-sm pl-4'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#ccff00] rounded-full shadow-[0_0_10px_rgba(204,255,0,0.5)]" />}
          <Icon className="text-xl" />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
};

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

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
      label: 'Project Management', 
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
      subLinks: [
        { to: '/dashboard/exclusive-projects', label: 'Exclusive Project Management' },
        { to: '/dashboard/enquiries/exclusive', label: 'Exclusive Enquiries' }
      ]
    },
    { 
      to: '/dashboard/special-projects', 
      label: 'Special Projects', 
      icon: HiOutlineStar,
      subLinks: [
        { to: '/dashboard/special-projects', label: 'Special Project Management' },
        { to: '/dashboard/enquiries/special', label: 'Special Projects Enquiries' }
      ]
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

        {/* User / Logout */}
        <div className="p-4 border-t border-white/5 shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium text-[0.85rem]"
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
    </div>
  );
};

export default DashboardLayout;
