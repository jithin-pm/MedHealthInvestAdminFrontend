import React, { useState } from 'react';
import { HiOutlineSearch } from 'react-icons/hi';

const PageHeader = ({ title, description }) => (
  <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
    <p className="text-gray-400 text-sm md:text-base">{description}</p>
  </div>
);

const dummyEnquiries = [
  { id: 1, name: 'Kalyani', email: 'kalyani123@gmail.com', date: 'Mar 17, 2026', subject: 'Investment Query', message: 'Enquiry about minimum investments.' },
  { id: 2, name: 'PP Singh', email: 'ppsingh123@gmail.com', date: 'Mar 17, 2026', subject: 'Partnership', message: 'Interested in becoming a core partner.' },
  { id: 3, name: 'Leo Das', email: 'leodas123@gmail.com', date: 'Mar 17, 2026', subject: 'Fund Details', message: 'Can you provide the project brochures?' },
  { id: 4, name: 'Jithin pm', email: 'jithinpm.in.office@gmail.com', date: 'Mar 2, 2026', subject: 'General Information', message: 'This is Jithin from Kerala, requesting info.' },
  { id: 5, name: 'Jithin pm', email: 'jithinpm.in.office@gmail.com', date: 'Feb 24, 2026', subject: 'Ongoing Projects', message: 'Need to know about your latest project.' },
  { id: 6, name: 'Jithin pm', email: 'jithinpm.in.office@gmail.com', date: 'Feb 20, 2026', subject: 'Greetings', message: 'Hi Sir.' },
];

const Enquiries = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEnquiries = dummyEnquiries.filter(
    (enq) =>
      enq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      enq.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-full pb-10">
      <PageHeader 
        title="Enquiries" 
        description="Review messages and incoming leads from potential investors." 
      />

      {/* Search Bar */}
      <div className="relative mb-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
        <input
          type="text"
          placeholder="Search by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#0c0c0c] border border-white/10 rounded-xl pl-11 pr-4 py-3.5 text-white text-sm focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/50 transition-all placeholder:text-gray-600"
        />
      </div>

      {/* Table Container */}
      <div className="w-full rounded-[1.25rem] bg-[#0c0c0c] border border-white/10 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        
        {/* Table Header Strip */}
        <div className="bg-[#111] p-6 flex items-center justify-between border-b border-white/10">
          <h2 className="text-white font-bold text-sm tracking-[0.2em] uppercase">Enquiries</h2>
          <span className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">
            {filteredEnquiries.length} Enquiries on this page
          </span>
        </div>

        {/* Responsive Table Wrapper */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10 bg-[#0a0a0a]/50">
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Sender</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Date</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Subject</th>
                <th className="py-4 px-6 text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em]">Message</th>
              </tr>
            </thead>
            <tbody>
              {filteredEnquiries.map((enquiry) => (
                <tr 
                  key={enquiry.id} 
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors duration-200 group object-cover"
                >
                  <td className="py-5 px-6 align-top">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white font-bold text-sm">{enquiry.name}</span>
                      <span className="text-gray-500 text-[0.75rem]">{enquiry.email}</span>
                    </div>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <span className="text-gray-400 text-sm">{enquiry.date}</span>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <span className="text-white font-medium text-sm">{enquiry.subject}</span>
                  </td>
                  <td className="py-5 px-6 align-top">
                    <p className="text-gray-400 text-sm max-w-sm truncate group-hover:text-gray-300 transition-colors">
                      {enquiry.message}
                    </p>
                  </td>
                </tr>
              ))}
              
              {filteredEnquiries.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-12 text-center text-gray-500 text-sm">
                    No enquiries found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Enquiries;
