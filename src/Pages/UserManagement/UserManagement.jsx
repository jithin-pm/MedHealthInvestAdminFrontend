import React from 'react';

const PageHeader = ({ title, description }) => (
  <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
    <p className="text-gray-400 text-sm md:text-base">{description}</p>
  </div>
);

const UserManagement = () => {
  return (
    <div className="min-h-full">
      <PageHeader 
        title="User Management" 
        description="View and manage investors, change roles, and oversee accounts." 
      />
      <div className="w-full rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md p-6 h-[500px] flex items-center justify-center animate-in fade-in duration-700">
        <p className="text-gray-600 font-medium tracking-widest text-sm uppercase">User Table Coming Soon</p>
      </div>
    </div>
  );
};

export default UserManagement;
