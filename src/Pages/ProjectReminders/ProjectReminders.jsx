import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineBell,
  HiOutlineClock,
  HiOutlineExclamationCircle,
  HiOutlineCheckCircle,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlineEye,
  HiOutlineCalendar,
  HiOutlineCurrencyDollar,
  HiOutlineLightningBolt,
  HiOutlineFolder,
  HiOutlineExternalLink,
  HiOutlineUser
} from 'react-icons/hi';
import { LuCrown } from 'react-icons/lu';
import { getAllProjectsApi, getAllUsersApi } from '../../services/allApi';

const ProjectReminders = () => {
  const navigate = useNavigate();
  const [allProjects, setAllProjects] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'COMPLETING' | 'UNDERFUNDED'
  const [selectedType, setSelectedType] = useState('ALL'); // 'ALL' | 'Standard' | 'Exclusive' | 'Special'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [projRes, usersRes] = await Promise.all([
        getAllProjectsApi(),
        getAllUsersApi().catch(() => ({ status: 200, data: [] }))
      ]);

      if (projRes?.status === 200 && projRes.data?.projects) {
        setAllProjects(projRes.data.projects);
      }
      if (usersRes?.status === 200 && Array.isArray(usersRes.data)) {
        setAllUsers(usersRes.data);
      }
    } catch (error) {
      console.error('Error fetching project reminders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Reminder Items
  const reminders = useMemo(() => {
    const now = new Date();
    const list = [];

    // Only Standard and Exclusive projects have fixed maturity tenures
    const combined = allProjects;

    combined.forEach(p => {
      // 1. Completing Projects: ONGOING and completing within 30 days
      if (p.status === 'ONGOING') {
        let maturityDate = null;
        if (p.completionDate) {
          maturityDate = new Date(p.completionDate);
        } else if (p.ongoingStartDate && p.duration) {
          maturityDate = new Date(new Date(p.ongoingStartDate).getTime() + (parseInt(p.duration) * 30 * 24 * 60 * 60 * 1000));
        } else if (p.duration && (p.created_at || p.createdAt)) {
          const start = new Date(p.created_at || p.createdAt);
          maturityDate = new Date(start.getTime() + (parseInt(p.duration) * 30 * 24 * 60 * 60 * 1000));
        }

        if (maturityDate && !isNaN(maturityDate.getTime())) {
          const diffDays = Math.ceil((maturityDate - now) / (1000 * 60 * 60 * 24));
          // Criteria: Within 30 days (including <= 0 days which are overdue / ready for settlement)
          if (diffDays <= 30) {
            const isCompleted = diffDays <= 0;
            list.push({
              id: `${p.projectType}-${p.id}-completing`,
              project: p,
              reminderType: 'COMPLETING_SOON',
              daysRemaining: diffDays,
              targetDate: maturityDate,
              urgency: diffDays <= 7 ? 'CRITICAL' : diffDays <= 15 ? 'HIGH' : 'WARNING',
              title: isCompleted ? 'Pending Settlement' : 'Tenure Completing Soon',
              isCompleted,
              description: isCompleted
                ? 'Project investment duration has completed. Immediate payout settlement is required.'
                : `Project maturity date is approaching in ${diffDays} day${diffDays === 1 ? '' : 's'}. Review investor returns and prepare payouts.`,
              actionRoute: p.projectType === 'Exclusive'
                ? `/dashboard/exclusive-projects/settlement/${p.id}`
                : p.projectType === 'Special'
                  ? `/dashboard/special-projects/settlement/${p.id}`
                  : `/dashboard/projects/settlement/${p.id}`,
              actionLabel: 'Settle Payouts',
              detailsRoute: p.projectType === 'Exclusive'
                ? `/dashboard/exclusive-projects/details/${p.id}`
                : p.projectType === 'Special'
                  ? `/dashboard/special-projects/details/${p.id}`
                  : `/dashboard/projects/details/${p.id}`
            });
          }
        }
      }

      // 2. Underfunded Active Projects: ACTIVE, collected < target, and activeDeadline within 30 days
      if (p.status === 'ACTIVE') {
        const target = Number(p.targetAmount || 0);
        const collected = Number(p.collectedAmount || 0);
        const isNotFullyFunded = collected < target;

        if (isNotFullyFunded && p.activeDeadline) {
          const deadlineDate = new Date(p.activeDeadline);
          if (!isNaN(deadlineDate.getTime())) {
            const diffDays = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
            if (diffDays <= 30) {
              const needed = Math.max(0, target - collected);
              list.push({
                id: `${p.projectType}-${p.id}-underfunded`,
                project: p,
                reminderType: 'UNDERFUNDED_EXPIRING',
                daysRemaining: diffDays,
                targetDate: deadlineDate,
                urgency: diffDays <= 7 ? 'CRITICAL' : diffDays <= 15 ? 'HIGH' : 'WARNING',
                title: 'Funding Deadline Approaching',
                description: diffDays <= 0
                  ? `Funding deadline has passed with ₹${needed.toLocaleString('en-IN')} still unfunded. Review or extend active deadline.`
                  : `Deadline is in ${diffDays} day${diffDays === 1 ? '' : 's'}. ₹${needed.toLocaleString('en-IN')} is still needed to achieve funding target.`,
                actionRoute: p.projectType === 'Exclusive'
                  ? `/dashboard/exclusive-projects/details/${p.id}`
                  : p.projectType === 'Special'
                    ? `/dashboard/special-projects/details/${p.id}`
                    : `/dashboard/projects/details/${p.id}`,
                actionLabel: 'Review Project',
                detailsRoute: p.projectType === 'Exclusive'
                  ? `/dashboard/exclusive-projects/details/${p.id}`
                  : p.projectType === 'Special'
                    ? `/dashboard/special-projects/details/${p.id}`
                    : `/dashboard/projects/details/${p.id}`
              });
            }
          }
        }
      }
      // 3. Expired Projects: EXPIRED status where refund/settlement is pending (!p.isSettled)
      if (p.status === 'EXPIRED' && !p.isSettled) {
        const target = Number(p.targetAmount || 0);
        const collected = Number(p.collectedAmount || 0);

        list.push({
          id: `${p.projectType}-${p.id}-expired`,
          project: p,
          reminderType: 'REFUND_PENDING',
          daysRemaining: 0,
          targetDate: p.activeDeadline ? new Date(p.activeDeadline) : (p.completionDate ? new Date(p.completionDate) : now),
          urgency: 'CRITICAL',
          title: 'Refund Pending',
          isCompleted: false,
          description: collected > 0
            ? `Campaign deadline has expired with ₹${collected.toLocaleString('en-IN')} collected. Process capital refunds (0% interest).`
            : `Project funding deadline has expired. Review investor contributions and finalize project closure.`,
          actionRoute: p.projectType === 'Exclusive'
            ? `/dashboard/exclusive-projects/settlement/${p.id}`
            : p.projectType === 'Special'
              ? `/dashboard/special-projects/settlement/${p.id}`
              : `/dashboard/projects/settlement/${p.id}`,
          actionLabel: 'Process Refund',
          detailsRoute: p.projectType === 'Exclusive'
            ? `/dashboard/exclusive-projects/details/${p.id}`
            : p.projectType === 'Special'
              ? `/dashboard/special-projects/details/${p.id}`
              : `/dashboard/projects/details/${p.id}`
        });
      }
    });

    // Sample Static Demonstrations requested by user:
    // 1. Sample Exclusive Project nearing maturity (16 days left)
    const sampleExclusiveDays = 16;
    const sampleExclusiveDate = new Date(now.getTime() + (sampleExclusiveDays * 24 * 60 * 60 * 1000));
    list.push({
      id: 'sample-exclusive-preview',
      isSample: true,
      project: {
        id: 'sample-exclusive-01',
        projectName: 'Advanced Cardiology Diagnostics Suite',
        projectType: 'Exclusive',
        projectCategory: 'Medical Devices',
        status: 'ONGOING',
        roi: '8.0',
        duration: '6',
        targetAmount: 5000000,
        collectedAmount: 5000000,
        exclusiveUserId: 'sample-user-exclusive',
      },
      reminderType: 'COMPLETING_SOON',
      daysRemaining: sampleExclusiveDays,
      targetDate: sampleExclusiveDate,
      urgency: 'MODERATE',
      title: 'Tenure Completing Soon',
      isCompleted: false,
      sampleAssignedUser: { fullName: 'Dr. Sarah Jenkins' },
      description: `Project maturity date is approaching in ${sampleExclusiveDays} days. Review investor returns and prepare payouts.`,
      detailsRoute: '/dashboard/exclusive-projects'
    });

    // 2. Sample Completing Project (Standard, 6 days remaining - Critical Priority)
    const sampleCompletingDays = 6;
    const sampleCompletingDate = new Date(now.getTime() + (sampleCompletingDays * 24 * 60 * 60 * 1000));
    list.push({
      id: 'sample-completing-preview',
      isSample: true,
      project: {
        id: 'sample-standard-01',
        projectName: 'Apex Orthopedic Robotic Surgery Center',
        projectType: 'Standard',
        projectCategory: 'Healthcare Infra',
        status: 'ONGOING',
        roi: '6.5',
        duration: '4',
        targetAmount: 2500000,
        collectedAmount: 2500000,
      },
      reminderType: 'COMPLETING_SOON',
      daysRemaining: sampleCompletingDays,
      targetDate: sampleCompletingDate,
      urgency: 'CRITICAL',
      title: 'Tenure Completing Soon',
      isCompleted: false,
      description: `Project maturity date is approaching in ${sampleCompletingDays} days. Review investor returns and prepare payouts.`,
      detailsRoute: '/dashboard/projects/ongoing'
    });

    // 3. Sample Expired Standard Project with Pending Refund (Static Demonstration)
    list.push({
      id: 'sample-standard-expired-preview',
      isSample: true,
      project: {
        id: 'sample-standard-expired-01',
        projectName: 'Biomedical Diagnostic Tech Fund',
        projectType: 'Standard',
        projectCategory: 'Pharma & Biotech',
        status: 'EXPIRED',
        roi: '7.5',
        duration: '6',
        targetAmount: 1500000,
        collectedAmount: 450000,
      },
      reminderType: 'REFUND_PENDING',
      daysRemaining: 0,
      targetDate: now,
      urgency: 'CRITICAL',
      title: 'Refund Pending',
      isCompleted: false,
      description: 'Funding deadline expired with ₹4,50,000 collected. Process investor capital refunds (0% interest).',
      actionRoute: '/dashboard/projects/settlement/sample-standard-expired-01',
      actionLabel: 'Process Refund',
      detailsRoute: '/dashboard/projects/expired'
    });

    return list.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [allProjects]);

  // Counts for tabs & stat cards
  const completingCount = reminders.filter(r => r.reminderType === 'COMPLETING_SOON').length;
  const underfundedCount = reminders.filter(r => r.reminderType === 'UNDERFUNDED_EXPIRING').length;
  const refundPendingCount = reminders.filter(r => r.reminderType === 'REFUND_PENDING').length;
  const criticalCount = reminders.filter(r => r.urgency === 'CRITICAL').length;

  // Filtered Reminders
  const filteredReminders = useMemo(() => {
    return reminders.filter(item => {
      // Tab filter
      if (activeTab === 'COMPLETING' && item.reminderType !== 'COMPLETING_SOON') return false;
      if (activeTab === 'UNDERFUNDED' && item.reminderType !== 'UNDERFUNDED_EXPIRING') return false;
      if (activeTab === 'REFUND_PENDING' && item.reminderType !== 'REFUND_PENDING') return false;

      // Project Type filter
      if (selectedType !== 'ALL' && item.project.projectType !== selectedType) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (item.project.projectName || '').toLowerCase();
        const cat = (item.project.projectCategory || '').toLowerCase();
        const type = (item.project.projectType || '').toLowerCase();
        return name.includes(q) || cat.includes(q) || type.includes(q);
      }

      return true;
    });
  }, [reminders, activeTab, selectedType, searchQuery]);

  return (
    <div className="min-h-full space-y-8 animate-in fade-in duration-500">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <HiOutlineBell className="text-xl" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">Project Reminders</h1>
              <p className="text-gray-400 text-xs md:text-sm mt-0.5">
                Active alerts for projects nearing maturity (within 30 days) and underfunded campaigns nearing deadline.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-medium text-xs tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <HiOutlineRefresh className={`text-base ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Total Reminders */}
        <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/[0.05] hover:border-white/10 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Total Reminders</span>
            <div className="text-3xl font-black text-white">{reminders.length}</div>
            <p className="text-[10px] text-gray-500">Require administrator action</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00]">
            <HiOutlineBell className="text-2xl group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Completing within 30 days */}
        <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/[0.05] hover:border-amber-500/20 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">Completing Soon</span>
            <div className="text-3xl font-black text-amber-400">{completingCount}</div>
            <p className="text-[10px] text-gray-500">Ongoing tenure ≤ 30 days</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <HiOutlineClock className="text-2xl group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Underfunded within 30 days */}
        <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/[0.05] hover:border-orange-500/20 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em]">Underfunded</span>
            <div className="text-3xl font-black text-orange-400">{underfundedCount}</div>
            <p className="text-[10px] text-gray-500">Active deadline ≤ 30 days</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
            <HiOutlineExclamationCircle className="text-2xl group-hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Refund Pending (Expired) */}
        <div className="p-5 rounded-2xl bg-[#0c0c0c] border border-white/[0.05] hover:border-rose-500/20 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.3)] flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-[0.2em]">Refund Pending</span>
            <div className="text-3xl font-black text-rose-400">{refundPendingCount}</div>
            <p className="text-[10px] text-gray-500">Expired standard campaigns</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <HiOutlineRefresh className="text-2xl group-hover:scale-110 transition-transform" />
          </div>
        </div>


      </div>

      {/* Tabs & Search Filter Controls */}
      <div className="space-y-4">
        {/* Main Category Tabs */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-1 overflow-x-auto custom-scrollbar">
          {[
            { id: 'ALL', label: 'All Reminders', count: reminders.length, icon: HiOutlineBell },
            { id: 'COMPLETING', label: 'Completing Soon (≤ 30 Days)', count: completingCount, icon: HiOutlineClock },
            { id: 'UNDERFUNDED', label: 'Funding Expiring (Underfunded)', count: underfundedCount, icon: HiOutlineExclamationCircle },
            { id: 'REFUND_PENDING', label: 'Refund Pending (Expired)', count: refundPendingCount, icon: HiOutlineRefresh },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-5 py-3.5 flex items-center gap-2.5 transition-all duration-300 group whitespace-nowrap ${activeTab === tab.id ? 'text-[#ccff00]' : 'text-gray-500 hover:text-white'
                }`}
            >
              <tab.icon className={`text-base ${activeTab === tab.id ? 'animate-pulse' : ''}`} />
              <span className="text-xs font-bold uppercase tracking-wider">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${activeTab === tab.id ? 'bg-[#ccff00] text-black' : 'bg-white/5 text-gray-500 group-hover:bg-white/10'
                  }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#ccff00] shadow-[0_0_15px_rgba(204,255,0,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* Search & Sub-filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <HiOutlineSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-base" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project name or category..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0c0c0c] border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#ccff00]/40 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2.5">
            {/* Project Type Filter */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2.5 bg-[#0c0c0c] border border-white/10 rounded-xl text-xs font-bold text-gray-300 focus:outline-none focus:border-[#ccff00]/40 transition-colors"
            >
              <option value="ALL">All Project Types</option>
              <option value="Standard">Standard Projects</option>
              <option value="Exclusive">Exclusive Projects</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reminders List (Horizontal Long Cards) */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin" />
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Scanning Project Deadlines...</p>
        </div>
      ) : filteredReminders.length > 0 ? (
        <div className="flex flex-col gap-4 animate-in fade-in duration-500">
          {filteredReminders.map((item) => {
            const project = item.project;
            const target = Number(project.targetAmount || 0);
            const collected = Number(project.collectedAmount || 0);
            const fundedPercent = target > 0 ? Math.round((collected / target) * 100) : 0;
            const isCompleting = item.reminderType === 'COMPLETING_SOON';
            const isRefundPending = item.reminderType === 'REFUND_PENDING';
            const assignedUser = item.sampleAssignedUser || allUsers.find(u => u.id === (project.exclusiveUserId || project.assignedUserId));

            return (
              <div
                key={item.id}
                className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between p-4 sm:p-5 rounded-2xl bg-[#0c0c0c] border border-white/[0.05] hover:border-white/10 transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.3)] gap-5 group"
              >
                {/* Left: Project Identity */}
                <div className="flex flex-col min-w-0 justify-center xl:w-[45%] shrink-0">
                  <div className="flex items-center flex-wrap gap-1.5 mb-1.5">
                    {project.projectType === 'Exclusive' ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400">
                        <LuCrown className="text-[10px]" />
                        <span>Exclusive</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-gray-300">
                        {project.projectType}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${isRefundPending || project.status === 'EXPIRED'
                      ? 'bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.4)]'
                      : item.isCompleted
                        ? 'bg-[#ccff00] text-black'
                        : project.status === 'ONGOING'
                          ? 'bg-[#ccff00] text-black'
                          : 'bg-white text-black'
                      }`}>
                      {isRefundPending || project.status === 'EXPIRED'
                        ? 'EXPIRED'
                        : item.isCompleted
                          ? 'COMPLETED'
                          : project.status}
                    </span>
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest truncate">
                      {project.projectCategory}
                    </span>
                    {item.isSample && (
                      <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest bg-blue-500/10 border border-blue-500/20 text-blue-400">
                        Sample Preview
                      </span>
                    )}
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-white truncate group-hover:text-[#ccff00] transition-colors mb-2.5">
                    {project.projectName}
                  </h3>

                  <div className="flex items-center flex-wrap gap-2.5">
                    {/* Reminder Status Pill */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold w-fit max-w-full ${isRefundPending
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      : item.isCompleted
                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-300'
                        : isCompleting
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                          : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      }`}>
                      {isRefundPending ? (
                        <HiOutlineClock className="text-sm shrink-0 animate-pulse text-rose-400" />
                      ) : item.isCompleted ? (
                        <HiOutlineClock className="text-sm shrink-0 animate-pulse text-orange-400" />
                      ) : isCompleting ? (
                        <HiOutlineClock className="text-sm shrink-0 animate-pulse text-amber-400" />
                      ) : (
                        <HiOutlineExclamationCircle className="text-sm shrink-0 animate-pulse text-rose-400" />
                      )}
                      <span className="truncate text-xs font-bold">
                        {item.title}{item.daysRemaining > 0 ? ` • ${item.daysRemaining}d left` : ''}
                      </span>
                    </div>

                    {/* Assigned User in the bottom, displayed larger */}
                    {assignedUser && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ccff00]/10 border border-[#ccff00]/25 text-white shadow-sm">
                        <HiOutlineUser className="text-sm text-[#ccff00]" />
                        <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Assigned To :</span>
                        <span className="text-xs font-bold text-[#ccff00]">
                          {assignedUser.fullName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Center: Financial Metrics */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-12 py-3 xl:py-0 border-y xl:border-y-0 xl:border-x border-white/5 xl:px-8 flex-1 min-w-0 justify-center">
                  <div className="flex items-center gap-8 sm:gap-12 shrink-0">
                    {!isRefundPending && (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">ROI & Duration</span>
                        <span className="text-sm sm:text-base font-bold text-white">
                          <span className="text-[#ccff00]">{project.roi}%</span> • {project.duration}M
                        </span>
                      </div>
                    )}

                    {isRefundPending ? (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest mb-0.5">
                          Capital to Refund
                        </span>
                        <span className="text-sm sm:text-base font-bold text-white">
                          ₹{Number(collected || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ) : project.projectType === 'Exclusive' ? (
                      <>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                            Capital
                          </span>
                          <span className="text-sm sm:text-base font-bold text-white">
                            ₹{Number(target).toLocaleString('en-IN')}
                          </span>
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-[#ccff00] uppercase tracking-widest mb-0.5">
                            Capital + Interest
                          </span>
                          <span className="text-sm sm:text-base font-black text-[#ccff00]">
                            ₹{(Number(target) + Math.round((Number(target) * Number(project.roi || 0) * Number(project.duration || 1)) / 100)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">
                          {isCompleting ? 'Total Investment' : 'Target Amount'}
                        </span>
                        <span className="text-sm sm:text-base font-bold text-white">
                          ₹{Number(target).toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>

                  {!isCompleting && !isRefundPending && (
                    <div className="flex-1 w-full max-w-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold">
                        <span className="text-gray-400">Funding Deficit</span>
                        <span className="text-rose-400 font-mono">
                          ₹{Math.max(0, target - collected).toLocaleString('en-IN')} remaining
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-orange-500 to-rose-500"
                          style={{ width: `${Math.min(100, fundedPercent)}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-gray-500">
                        <span>Funded: {fundedPercent}%</span>
                        <span>Target: ₹{target.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Action */}
                <div className="flex items-center justify-end shrink-0">
                  <button
                    onClick={() => navigate(item.detailsRoute)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-[#ccff00] hover:text-black border border-white/10 hover:border-[#ccff00] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm active:scale-95 group/btn"
                    title={isRefundPending ? 'View Expired Project & Refunds' : 'View Project Details'}
                  >
                    <HiOutlineEye className="text-base group-hover/btn:text-black transition-colors" />
                    <span>View</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="py-24 flex flex-col items-center justify-center gap-4 bg-[#0c0c0c] rounded-[2rem] border-2 border-dashed border-white/5 text-center px-6">
          <div className="w-16 h-16 rounded-3xl bg-[#ccff00]/10 border border-[#ccff00]/20 flex items-center justify-center text-[#ccff00] shadow-[0_0_30px_rgba(204,255,0,0.1)]">
            <HiOutlineCheckCircle className="text-3xl" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-lg font-bold text-white tracking-wide">All Projects On Track</h3>
            <p className="text-gray-500 text-xs leading-relaxed">
              No projects match the 30-day reminder threshold. There are currently no ongoing projects completing within 30 days and no active projects with pending funding deadlines within 30 days.
            </p>
          </div>
          {(selectedType !== 'ALL' || selectedUrgency !== 'ALL' || searchQuery || activeTab !== 'ALL') && (
            <button
              onClick={() => {
                setActiveTab('ALL');
                setSelectedType('ALL');
                setSelectedUrgency('ALL');
                setSearchQuery('');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-[#ccff00] transition-colors border border-white/10"
            >
              Reset All Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectReminders;
