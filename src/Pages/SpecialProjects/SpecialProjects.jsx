import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HiOutlineEye, 
  HiOutlinePlus, 
  HiX, 
  HiOutlineSearch,
  HiOutlineCloudUpload,
  HiOutlineChevronDown,
  HiOutlineTag,
  HiOutlineFolder,
  HiOutlinePlay,
  HiOutlineRefresh,
  HiOutlineTrash,
  HiOutlineInformationCircle
} from 'react-icons/hi';
import { 
  
  
  addSpecialProjectApi, getAllSpecialProjectsApi, editSpecialProjectApi, deleteSpecialProjectApi,
  getAllUsersApi, getUserFinancialDetailsApi
} from '../../services/allApi';
import { showAlert } from '../../Utils/alert';
import { getErrorMessage, getErrorTitle } from '../../Utils/getErrorMessage';
import { BASE_URL } from '../../services/baseUrl';

const getImageUrl = (img) => {
  if (!img) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop';
  if (img.startsWith('http')) return img;
  return `${BASE_URL}/${img.replace(/\\/g, '/')}`;
};

const SpecialProjects = () => {
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
          
        
  // Project State
  const [allProjects, setAllProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [projectData, setProjectData] = useState({
    projectName: '',
    targetAmount: '',
    roi: '',
    
    collectedAmount: '',  });
  
    const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);
  const [existingImages, setExistingImages] = useState([]);

  // User Info Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);
  const [selectedUserFinancials, setSelectedUserFinancials] = useState(null);

  // User Selection State
  const [allUsers, setAllUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

  
      const userSearchRef = React.useRef(null);
  const preSettledProofRef = React.useRef(null);
  const navigate = useNavigate();

  // Investment Mode States
  const [investmentMode, setInvestmentMode] = useState('Pre-Settled');
  const [preSettledProof, setPreSettledProof] = useState(null);
  const location = useLocation();

  // Handle incoming edit state from Details page
  useEffect(() => {
    if (location.state?.editProject) {
      handleEditClick(location.state.editProject);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  
  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await getAllSpecialProjectsApi();
      if (response.status === 200) {
        setAllProjects(response.data);
      }
    } catch (error) {
      console.error("Fetch projects error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await getAllUsersApi();
      if (response.status === 200) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error("Fetch users error:", error);
    }
  };

  // Fetch data on mount
  useEffect(() => {
        fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (isAddModalOpen) {
          }
  }, [isAddModalOpen]);

  useEffect(() => {
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();
      const filtered = allUsers.filter(u => 
        u.fullName.toLowerCase().includes(query) || 
        u.email.toLowerCase().includes(query) || 
        (u.mobileNumber && u.mobileNumber.includes(query))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [userSearchQuery, allUsers]);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    if (type === 'number' && parseFloat(value) < 0) return;
    setProjectData(prev => ({ ...prev, [name]: value }));
  };





  const handlePublishProject = async () => {
    const { projectName, targetAmount, roi } = projectData;

    if (!projectName || !targetAmount || !roi) {
      showAlert('Required', 'Please fill in all mandatory fields', 'info');
      return;
    }

    // Frontend Duplication Check
    const isDuplicate = allProjects.some(p => 
      p.projectName.toLowerCase().trim() === projectName.toLowerCase().trim() && 
      (!isEditMode || p.id !== editProjectId)
    );

    if (isDuplicate) {
      showAlert('Duplicate Name', 'A project with this name already exists. Please use a unique identifier.', 'warning');
      return;
    }

    if (investmentMode === 'Pre-Settled' && !preSettledProof && !isEditMode) {
      showAlert('Required', 'Please upload the payment proof for Pre-Settled project.', 'info');
      return;
    }

    setIsSubmittingProject(true);
    try {
      const formData = new FormData();
      formData.append('projectName', projectName);
      formData.append('projectCategory', 'Special');
            
      formData.append('targetAmount', targetAmount);
      formData.append('roi', roi);
      
      formData.append('collectedAmount', projectData.collectedAmount || 0);
      if (selectedUser) {
        formData.append('assignedUserId', selectedUser.id);
        formData.append('investmentMode', investmentMode);
      }
      if (preSettledProof && typeof preSettledProof !== 'string') {
        formData.append('paymentProof', preSettledProof);
      }
      
      

      const response = isEditMode 
        ? await editSpecialProjectApi(editProjectId, formData)
        : await addSpecialProjectApi(formData);

      if (response.status === 201 || response.status === 200) {
        showAlert('Success', isEditMode ? 'Project updated successfully!' : 'Project published successfully!', 'success');
        setIsAddModalOpen(false);
        fetchProjects(); // Refresh the list
        resetForm();
      }
    } catch (error) {
      console.error("Publish project error:", error);
      const message = getErrorMessage(error, 'Failed to process project');
      showAlert(getErrorTitle(error), message, 'error');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const resetForm = () => {
    setProjectData({
      projectName: '',
      targetAmount: '',
      roi: '',
      
      collectedAmount: '' });
                
    setIsEditMode(false);
    setEditProjectId(null);
        setSelectedUser(null);
    setUserSearchQuery('');
    setInvestmentMode('Pre-Settled');
    setPreSettledProof(null);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      
      
      if (userSearchRef.current && !userSearchRef.current.contains(event.target)) {
        setIsUserSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const title = 'Special Projects';
  const description = 'View and manage all special projects here.';

  // Filter projects based on search
  const searchedProjects = allProjects.filter(project => 
    project.projectName?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const filteredProjects = searchedProjects.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(searchedProjects.length / itemsPerPage);

  const paginate = (n) => { if (n >= 1 && n <= totalPages) setCurrentPage(n); };

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const handleViewDetails = (project) => {
    navigate(`/dashboard/special-projects/details/${project.id}`, { state: { project } });
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        const response = await deleteSpecialProjectApi(projectId);
        if (response.status === 200) {
          showAlert('Deleted', 'Project has been removed successfully', 'success');
          fetchProjects(); // Refresh list
        }
      } catch (error) {
        console.error("Delete project error:", error);
        showAlert(getErrorTitle(error), getErrorMessage(error, 'Failed to delete project'), 'error');
      }
    }
  };

  const handleEditClick = (project) => {
    setIsEditMode(true);
    setEditProjectId(project.id);
    setProjectData({
      projectName: project.projectName,
      targetAmount: project.targetAmount,
      roi: project.roi,
      
      collectedAmount: project.collectedAmount || 0 });
    
            
    // Set selected user if project is exclusive
    if (project.assignedUserId) {
      const user = allUsers.find(u => String(u.id) === String(project.assignedUserId));
      if (user) {
        setSelectedUser(user);
        setUserSearchQuery(user.email);
      }
    } else {
      setSelectedUser(null);
      setUserSearchQuery('');
    }
    
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-full">
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400 text-sm md:text-base">{description}</p>
        </div>
        
        {/* Actions Area */}
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          
          {/* Search */}
          <div className="relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-[#0a0a0a]/50 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-[#ccff00]/50 transition-all text-sm"
            />
          </div>

          {/* Add Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm tracking-wide hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(204,255,0,0.1)] w-full sm:w-auto"
            >
              <HiOutlinePlus className="text-lg" />
              <span>Add Project</span>
            </button>
          </div>

        </div>
      </div>



      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-700">
        {isLoading ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-[#ccff00]/20 border-t-[#ccff00] rounded-full animate-spin" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Accessing Database...</p>
          </div>
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project, i) => (
            <div key={i} className="flex flex-col rounded-[1.25rem] bg-[#0c0c0c] border border-white/[0.05] overflow-hidden group hover:border-white/[0.1] transition-all duration-500 shadow-[0_8px_30px_rgb(0,0,0,0.4)]">
              
              {/* Content Body */}
              <div className="flex flex-col flex-1 p-6 lg:p-8">
                <h3 className="text-xl font-bold text-white mb-8 truncate">{project.projectName}</h3>
                
                {/* Financials Grid */}
                <div className="grid grid-cols-2 gap-y-6 mb-6 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Est. ROI</span>
                    <span className="text-xl font-bold text-[#ccff00]">{project.roi}%</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Duration</span>
                    <span className="text-lg font-medium text-white">{project.duration} Months</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Raised</span>
                    <span className="text-xl font-bold text-white">₹{Number(project.collectedAmount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[0.6rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1">Target</span>
                    <span className="text-xl font-medium text-gray-400">₹{Number(project.targetAmount).toLocaleString('en-IN')}</span>
                  </div>

                  {project.assignedUserId && (
                    <div className="col-span-2 flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[0.6rem] text-[#ccff00] font-bold uppercase tracking-[0.2em] mb-1.5">Assigned User</span>
                        <span className="text-sm font-bold text-white">
                          {allUsers.find(u => String(u.id) === String(project.assignedUserId))?.fullName || 'N/A'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                          {allUsers.find(u => String(u.id) === String(project.assignedUserId))?.email || 'N/A'}
                        </span>
                      </div>
                      <HiOutlineInformationCircle 
                        onClick={async () => {
                          const user = allUsers.find(u => String(u.id) === String(project.assignedUserId));
                          if (user) {
                            setSelectedUserForModal(user);
                            setSelectedUserFinancials(null); // Reset
                            setIsUserModalOpen(true);
                            try {
                               const res = await getUserFinancialDetailsApi(user.id);
                               if(res.status === 200) {
                                  setSelectedUserFinancials(res.data);
                               }
                            } catch(err) { console.error(err); }
                          }
                        }}
                        className="text-gray-500 text-2xl shrink-0 ml-4 cursor-pointer hover:text-[#ccff00] transition-colors" 
                      />
                    </div>
                  )}
                </div>

                {/* Progress Bar Container */}
                <div className="w-full h-[6px] bg-[#ccff00]/10 rounded-full mb-3 overflow-hidden">
                  <div 
                    className="h-full bg-[#ccff00] rounded-full relative shadow-[0_0_10px_rgba(204,255,0,0.5)]"
                    style={{ width: `${(Number(project.collectedAmount || 0) / Number(project.targetAmount || 1)) * 100}%` }}
                  />
                </div>

                {/* Status Footer */}
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[0.65rem] text-[#ccff00] font-bold tracking-[0.15em] uppercase">
                    {Math.round((Number(project.collectedAmount || 0) / Number(project.targetAmount || 1)) * 100)}% Funded
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="mt-auto flex gap-3">
                  <button 
                    onClick={() => handleViewDetails(project)}
                    className="flex-1 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all duration-300 flex items-center justify-center gap-2.5 group/btn"
                  >
                    <HiOutlineEye className="text-gray-400 group-hover/btn:text-[#ccff00] transition-colors text-lg" />
                    <span className="text-[0.7rem] font-bold text-white uppercase tracking-[0.2em]">View</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteProject(project.id)}
                    className="px-4 py-3.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-all duration-300 flex items-center justify-center group/delete"
                    title="Delete Project"
                  >
                    <HiOutlineTrash className="text-red-500 text-lg group-hover:scale-110 transition-transform" />
                  </button>
                </div>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 bg-white/[0.02] rounded-3xl border border-dashed border-white/10">
            <HiOutlineFolder className="text-4xl text-gray-700" />
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Special Projects Found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {searchedProjects.length > itemsPerPage && (
        <div className="mt-8 flex items-center justify-between border-t border-[#ccff00]/10 pt-6">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
              currentPage === 1 ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            Previous
          </button>
          
          <div className="flex gap-1 hidden sm:flex">
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
      )}

      {/* Add Project Modal Overlay */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="my-auto w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-full">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h2 className="text-xl font-bold text-white uppercase">{isEditMode ? 'Update Project Details' : 'Initiate New Project'}</h2>
                <p className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">{isEditMode ? 'Refine the project parameters below' : 'Enter Comprehensive Details Below'}</p>
              </div>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              {/* Project Name */}
              <div className="flex flex-col gap-2">
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Project Name</label>
                <input 
                  type="text" 
                  name="projectName"
                  value={projectData.projectName}
                  onChange={handleInputChange}
                  placeholder="e.g. Rural Education Empowerment" 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/50 transition-all placeholder:text-gray-600"
                />
              </div>



              {/* Target User */}
              <div className="flex flex-col gap-2 relative">
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Target User Association</label>
                  
                  {selectedUser ? (
                    <div className="flex items-center justify-between p-4 bg-[#ccff00]/5 border border-[#ccff00]/20 rounded-xl group/selected transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-[#ccff00] flex items-center justify-center text-black font-black text-xs uppercase">
                          {(selectedUser.fullName[0] || 'U')}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-white">{selectedUser.fullName}</span>
                          <span className="text-[0.7rem] font-medium text-gray-500">{selectedUser.email}</span>
                        </div>
                      </div>
                      {!isEditMode && (
                        <button 
                          onClick={() => {
                            setSelectedUser(null);
                            setUserSearchQuery('');
                          }}
                          className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                          title="Change User"
                        >
                          <HiX className="text-lg" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="relative">
                        <input 
                          type="text" 
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          onFocus={() => setIsUserSearchOpen(true)}
                          placeholder="Search by Name, Email or Phone..." 
                          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] transition-all placeholder:text-gray-600"
                        />
                      </div>

                      {isUserSearchOpen && userSearchQuery.trim() && (
                        <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1.5">
                            {filteredUsers.length > 0 ? (
                              filteredUsers.map((user) => (
                                <button
                                  key={user.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsUserSearchOpen(false);
                                    setUserSearchQuery(user.email);
                                  }}
                                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition-all group/item text-left mb-1 last:mb-0"
                                >
                                  <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-400 font-bold text-xs uppercase group-hover/item:bg-[#ccff00] group-hover/item:text-black transition-all">
                                    {(user.fullName[0] || 'U')}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[13px] font-bold text-white group-hover/item:text-[#ccff00] transition-colors">{user.fullName}</span>
                                    <span className="text-[10px] font-medium text-gray-500">{user.email}</span>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-8 text-center">
                                <p className="text-[0.65rem] font-bold text-gray-600 uppercase tracking-widest">No User Found</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-[0.6rem] text-zinc-600 font-medium italic">* This project will be visible exclusively to the selected user in their dashboard.</p>
                </div>

              {/* Payment Proof / Project Image */}
              <div className="flex flex-col gap-3">
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Payment Proof / Project Image</label>
                <div className="flex items-center gap-4">
                  {preSettledProof ? (
                    <div className="relative w-32 h-32 rounded-xl border border-white/10 overflow-hidden shrink-0">
                      <img 
                        src={typeof preSettledProof === 'string' ? `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/${preSettledProof}` : URL.createObjectURL(preSettledProof)} 
                        alt="Proof Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPreSettledProof(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-gray-400 hover:text-white transition-all"
                      >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 20 20" aria-hidden="true" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => preSettledProofRef.current?.click()}
                      className="w-32 h-32 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-dashed border-white/20 hover:border-[#ccff00]/40 flex flex-col items-center justify-center gap-2 transition-all text-gray-500 hover:text-[#ccff00] shrink-0"
                    >
                      <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 16 4-4 4 4"></path></svg>
                      <span className="text-[10px] font-black uppercase tracking-wider">Upload Proof</span>
                    </button>
                  )}
                  <input
                    type="file"
                    ref={preSettledProofRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPreSettledProof(e.target.files[0]);
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-300">
                      {preSettledProof ? (typeof preSettledProof === 'string' ? 'Existing Proof Attached' : preSettledProof.name) : 'No proof file uploaded'}
                    </span>
                    <span className="text-[10px] text-gray-500">Supported formats: JPG, PNG, PDF</span>
                  </div>
                </div>
              </div>

              {/* Financials & Timeline Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Target Amount */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Target Amount (₹)</label>
                  <input 
                    type="number" 
                    name="targetAmount"
                    min="0"
                    value={projectData.targetAmount}
                    onChange={handleInputChange}
                    placeholder="e.g. 500000" 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/50 transition-all placeholder:text-gray-600"
                  />
                </div>



                {/* Est. ROI */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Est. ROI (%)</label>
                  <input 
                    type="number" 
                    name="roi"
                    min="0"
                    value={projectData.roi}
                    onChange={handleInputChange}
                    placeholder="e.g. 14.5" 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] focus:ring-1 focus:ring-[#ccff00]/50 transition-all placeholder:text-gray-600"
                  />
                </div>

                

              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-white/5 bg-black/20 rounded-b-2xl">
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  resetForm();
                }}
                className="px-6 py-3 rounded-xl bg-transparent border border-white/10 text-white font-bold text-sm tracking-widest uppercase hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handlePublishProject}
                disabled={isSubmittingProject || !projectData.projectName || !projectData.targetAmount || !projectData.roi || !selectedUser}
                className="px-6 py-3 rounded-xl bg-[#ccff00] hover:bg-[#b3ff00] text-black font-black text-sm tracking-[0.15em] uppercase shadow-[0_0_15px_rgba(204,255,0,0.2)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isSubmittingProject ? 'Processing...' : (isEditMode ? 'Update Project' : 'Publish Initiative')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* User Information Modal */}
      {isUserModalOpen && selectedUserForModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-xs animate-in fade-in duration-300">
           <div className="relative w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
              
              {/* Header */}
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#ccff00] flex items-center justify-center text-black font-black text-lg">
                       {selectedUserForModal.fullName[0].toUpperCase()}
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-white tracking-tight">{selectedUserForModal.fullName}</h3>
                       <p className="text-[#ccff00] text-[10px] font-black uppercase tracking-widest mt-0.5">Investor Protocol Profile</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setIsUserModalOpen(false)}
                   className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                 >
                    <HiX className="text-xl" />
                 </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6">
                 
                 {/* Contact Details */}
                 <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                       <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Email Address</span>
                       <span className="text-sm font-medium text-white break-all">{selectedUserForModal.email}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                       <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Mobile Number</span>
                       <span className="text-sm font-medium text-white">{selectedUserForModal.mobileNumber || '+91 98765 43210'}</span>
                    </div>
                 </div>

                 {/* Dummy PAN Card Section */}
                 <div className="p-6 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                       <svg width="60" height="60" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/></svg>
                    </div>
                    <div className="relative z-10">
                       <span className="text-[9px] font-black text-[#ccff00] uppercase tracking-[0.3em] mb-4 block">Taxation ID (PAN)</span>
                       <div className="flex flex-col gap-1">
                          <p className="text-lg font-black text-white tracking-[0.3em] uppercase">{selectedUserFinancials?.pan?.panNumber || 'NOT AVAILABLE'}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Permanent Account Number</p>
                       </div>
                    </div>
                 </div>

                 {/* Dummy Bank Details */}
                 <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                    <div className="flex items-center gap-2 text-gray-400">
                       <HiOutlineTag className="text-[#ccff00]" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Institutional Settlement Details</span>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4">
                       <div>
                          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Bank Name</p>
                          <p className="text-xs font-bold text-white">{selectedUserFinancials?.bank?.bankName || 'NOT AVAILABLE'}</p>
                       </div>
                       <div>
                          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">IFSC Code</p>
                          <p className="text-xs font-bold text-white tracking-widest">{selectedUserFinancials?.bank?.ifsc || 'NOT AVAILABLE'}</p>
                       </div>
                       <div className="col-span-2 pt-4 border-t border-white/5">
                          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Account Number</p>
                          <p className="text-sm font-black text-white tracking-[0.2em]">{selectedUserFinancials?.bank?.accountNumber || 'NOT AVAILABLE'}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-white/5 bg-black flex justify-center">
                 <button 
                   onClick={() => setIsUserModalOpen(false)}
                   className="px-10 py-3 rounded-xl bg-white text-black font-black text-[10px] uppercase tracking-[0.3em] hover:bg-gray-200 transition-all active:scale-[0.98]"
                 >
                    Close Profile
                 </button>
              </div>

           </div>
        </div>
      )}
    </div>
  );
};

export default SpecialProjects;
