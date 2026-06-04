import React, { useState, useEffect } from 'react';
import { getDashboardStatsApi } from '../../services/allApi';

const DashboardHome = () => {
  const [adminName, setAdminName] = useState('Admin');
  const [stats, setStats] = useState({
    totalUsers: 0,
    newUsersToday: 0,
    enquiriesLast7Days: 0,
    projectStats: {
      active: { standard: 0, exclusive: 0 },
      ongoing: { standard: 0, exclusive: 0 },
      completed: { standard: 0, exclusive: 0 }
    }
  });

  useEffect(() => {
    const authData = localStorage.getItem('medhealthinvestadmin');
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.user && parsed.user.fullName) {
        setAdminName(parsed.user.fullName);
      }
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const result = await getDashboardStatsApi();
      if (result.status === 200) {
        setStats(result.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome, {adminName}</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Monitor incoming data, manage users, and view platform metrics.
          </p>
        </div>
        <div className="text-sm font-medium text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/20 px-4 py-2 rounded-lg backdrop-blur-md">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Grid for User & Enquiry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'Total Users', value: stats.totalUsers.toLocaleString() },
          { title: 'New Users Today', value: stats.newUsersToday.toLocaleString() },
          { title: 'General Enquiries (7D)', value: stats.enquiriesLast7Days.toLocaleString() },
        ].map((card, i) => (
           <div 
             key={i}
             className="flex flex-col p-8 lg:p-10 rounded-[1.5rem] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.02] hover:border-white/[0.08] transition-all duration-700 group"
           >
             <div className="flex justify-between items-center mb-10">
               <h3 className="text-gray-500 text-[0.65rem] font-semibold tracking-[0.25em] uppercase">{card.title}</h3>
             </div>
             <div className="mt-auto">
               <span className="text-5xl lg:text-6xl font-extralight text-white group-hover:text-[#ccff00] transition-colors duration-700">
                 {card.value}
               </span>
             </div>
           </div>
        ))}
      </div>
      
      {/* Full Width Project Statistics Card */}
      <div className="w-full mt-8 rounded-[1.5rem] bg-gradient-to-b from-white/[0.04] to-transparent border border-white/[0.02] p-8 lg:p-12 hover:border-white/[0.06] transition-all duration-700">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-8 h-[1px] bg-[#ccff00]/50" />
          <h2 className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.25em]">Project Statistics Ecosystem</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          
          {/* Active Projects */}
          <div className="flex flex-col">
            <h3 className="text-white font-medium text-lg lg:text-xl tracking-wide mb-8">Active</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/[0.05] pb-4 group">
                <span className="text-gray-500 font-light text-sm tracking-wide uppercase transition-colors group-hover:text-gray-400">Standard</span>
                <span className="text-2xl font-light text-white">{stats.projectStats.active.standard}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/[0.05] pb-4 group">
                <span className="text-[#ccff00]/60 font-light text-sm tracking-wide uppercase transition-colors group-hover:text-[#ccff00]">Exclusive</span>
                <span className="text-2xl font-light text-white">{stats.projectStats.active.exclusive}</span>
              </div>
            </div>
          </div>

          {/* Ongoing Projects */}
          <div className="flex flex-col">
            <h3 className="text-white font-medium text-lg lg:text-xl tracking-wide mb-8">Ongoing</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/[0.05] pb-4 group">
                <span className="text-gray-500 font-light text-sm tracking-wide uppercase transition-colors group-hover:text-gray-400">Standard</span>
                <span className="text-2xl font-light text-white">{stats.projectStats.ongoing.standard}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/[0.05] pb-4 group">
                <span className="text-[#ccff00]/60 font-light text-sm tracking-wide uppercase transition-colors group-hover:text-[#ccff00]">Exclusive</span>
                <span className="text-2xl font-light text-white">{stats.projectStats.ongoing.exclusive}</span>
              </div>
            </div>
          </div>

          {/* Completed Projects */}
          <div className="flex flex-col">
            <h3 className="text-white font-medium text-lg lg:text-xl tracking-wide mb-8">Completed</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-end border-b border-white/[0.05] pb-4 group">
                <span className="text-gray-500 font-light text-sm tracking-wide uppercase transition-colors group-hover:text-gray-400">Standard</span>
                <span className="text-2xl font-light text-white">{stats.projectStats.completed.standard}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/[0.05] pb-4 group">
                <span className="text-[#ccff00]/60 font-light text-sm tracking-wide uppercase transition-colors group-hover:text-[#ccff00]">Exclusive</span>
                <span className="text-2xl font-light text-white">{stats.projectStats.completed.exclusive}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
      
      {/* Chart Placeholder Area */}
      <div className="w-full h-[400px] mt-8 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md flex items-center justify-center">
        <p className="text-gray-600 font-medium tracking-widest text-sm uppercase">Activity Graph Placeholder</p>
      </div>
    </div>
  );
};

export default DashboardHome;
