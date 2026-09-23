import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  HiOutlineEye, 
  HiOutlinePlus, 
  HiX, 
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
  addCategoryApi, 
  getAllCategoriesApi, 
  addProjectApi, 
  getAllProjectsApi, 
  editProjectApi, 
  deleteProjectApi,
  getAllUsersApi 
} from '../../services/allApi';
import { showAlert } from '../../Utils/alert';
import { getErrorMessage, getErrorTitle } from '../../Utils/getErrorMessage';
import { BASE_URL } from '../../services/baseUrl';

const getImageUrl = (img) => {
  if (!img) return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop';
  if (img.startsWith('http')) return img;
  return `${BASE_URL}/${img.replace(/\\/g, '/')}`;
};

const OngoingProjects = () => {
  const [filterProjectType, setFilterProjectType] = useState('Standard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);
  
  // Project State
  const [allProjects, setAllProjects] = useState([]);
  const [projectData, setProjectData] = useState({
    projectName: '',
    targetAmount: '',
    roi: '',
    duration: '',
  });
  const [projectImages, setProjectImages] = useState([null, null, null, null]);
  const [projectVideo, setProjectVideo] = useState(null);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editProjectId, setEditProjectId] = useState(null);
  const [existingImages, setExistingImages] = useState([]);

  // User Info Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState(null);

  // User Selection State
  const [allUsers, setAllUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isUserSearchOpen, setIsUserSearchOpen] = useState(false);

  const imageInputRefs = [React.useRef(null), React.useRef(null), React.useRef(null), React.useRef(null)];
  const dropdownRef = React.useRef(null);
  const categoryDropdownRef = React.useRef(null);
  const userSearchRef = React.useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchCategories = async () => {
    try {
      const response = await getAllCategoriesApi();
      if (response.status === 200) {
        setCategories(response.data.categories);
      }
    } catch (error) {
      console.error("Fetch categories error:", error);
    }
  };

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await getAllProjectsApi();
      if (response.status === 200) {
        setAllProjects(response.data.projects);
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
    fetchCategories();
    fetchProjects();
    fetchUsers();
  }, []);

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

  const handleFileChange = (e, type, index = 0) => {
    const file = e.target.files[0];
    if (file && type === 'image') {
      const newImages = [...projectImages];
      newImages[index] = file;
      setProjectImages(newImages);
    }
  };

  const handlePublishProject = async () => {
    const { projectName, targetAmount, roi, duration } = projectData;

    if (!projectName || !selectedCategory || !targetAmount || !roi || !duration) {
      showAlert('Required', 'Please fill in all mandatory fields', 'info');
      return;
    }

    setIsSubmittingProject(true);
    try {
      const formData = new FormData();
      formData.append('projectName', projectName);
      formData.append('projectCategory', selectedCategory.name);
      formData.append('projectType', 'Standard');
      formData.append('targetAmount', targetAmount);
      formData.append('roi', roi);
      formData.append('duration', duration);
      
      const imageSlots = [0, 1, 2, 3].map(idx => {
        if (projectImages[idx]) return 'NEW';
        if (existingImages[idx]) return existingImages[idx];
        return 'EMPTY';
      });
      formData.append('imageSlots', JSON.stringify(imageSlots));
      
      projectImages.forEach((img) => {
        if (img) formData.append('projectImages', img);
      });

      if (projectVideo) formData.append('projectVideo', projectVideo);

      const response = isEditMode 
        ? await editProjectApi(editProjectId, formData)
        : await addProjectApi(formData);

      if (response.status === 201 || response.status === 200) {
        showAlert('Success', isEditMode ? 'Project updated successfully!' : 'Project published successfully!', 'success');
        setIsAddModalOpen(false);
        fetchProjects();
        resetForm();
      }
    } catch (error) {
      console.error("Publish project error:", error);
      showAlert(getErrorTitle(error), getErrorMessage(error, 'Failed to process project'), 'error');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const resetForm = () => {
    setProjectData({
      projectName: '',
      targetAmount: '',
      roi: '',
      duration: '',
    });
    setProjectImages([null, null, null, null]);
    setProjectVideo(null);
    setSelectedCategory(null);
    setIsEditMode(false);
    setEditProjectId(null);
    setExistingImages([]);
    setSelectedUser(null);
    setUserSearchQuery('');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
        setIsCategoryDropdownOpen(false);
      }
      if (userSearchRef.current && !userSearchRef.current.contains(event.target)) {
        setIsUserSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const status = 'Ongoing';
  const title = `${status} Projects`;
  const description = `View and manage all ongoing investment projects here.`;

  const filteredProjects = allProjects.filter(p => 
    p.projectType === 'Standard' &&
    p.status === 'ONGOING'
  );

  const handleViewDetails = (project) => {
    navigate(`/dashboard/projects/details/${project.id}`, { state: { project } });
  };

  const handleEditClick = (project) => {
    setIsEditMode(true);
    setEditProjectId(project.id);
    setProjectData({
      projectName: project.projectName,
      targetAmount: project.targetAmount,
      roi: project.roi,
      duration: project.duration,
    });
    const cat = categories.find(c => c.name === project.projectCategory);
    setSelectedCategory(cat || { name: project.projectCategory });
    
    try {
      const imgs = project.projectImages ? JSON.parse(project.projectImages) : [];
      setExistingImages(imgs);
    } catch (e) {
      setExistingImages(project.projectImages ? [project.projectImages] : []);
    }
    
    setProjectVideo(project.projectVideo || null);
    
    if (project.projectType === 'Exclusive' && project.exclusiveUserId) {
      const user = allUsers.find(u => u.id === project.exclusiveUserId);
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

  const handleDeleteProject = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        const response = await deleteProjectApi(projectId);
        if (response.status === 200) {
          showAlert('Deleted', 'Project removed', 'success');
          fetchProjects();
        }
      } catch (error) {
        showAlert(getErrorTitle(error), getErrorMessage(error, 'Failed to delete project'), 'error');
      }
    }
  };

  return (
    <div className="min-h-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400 text-sm md:text-base">{description}</p>
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
              
              <div className="relative h-48 w-full overflow-hidden bg-white/5">
                <img 
                  src={project.projectImages ? (() => {
                    try {
                      const imgs = JSON.parse(project.projectImages);
                      return getImageUrl(imgs[0]);
                    } catch (e) {
                      return getImageUrl(project.projectImages);
                    }
                  })() : 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop'} 
                  alt={project.projectName} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-[#ccff00] text-black text-[0.6rem] font-black px-2.5 py-1 uppercase rounded tracking-[0.15em] shadow-lg">
                  {project.status}
                </div>
              </div>

              <div className="flex flex-col flex-1 p-6 lg:p-8">
                <span className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1.5">{project.projectCategory}</span>
                <h3 className="text-xl font-bold text-white mb-8 truncate">{project.projectName}</h3>
                
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

                  {project.projectType === 'Exclusive' && (
                    <div className="col-span-2 flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex flex-col">
                        <span className="text-[0.6rem] text-[#ccff00] font-bold uppercase tracking-[0.2em] mb-1.5">Assigned User</span>
                        <span className="text-sm font-bold text-white">
                          {allUsers.find(u => u.id === project.exclusiveUserId)?.fullName || 'N/A'}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium truncate mt-0.5">
                          {allUsers.find(u => u.id === project.exclusiveUserId)?.email || 'N/A'}
                        </span>
                      </div>
                      <HiOutlineInformationCircle 
                        onClick={() => {
                          const user = allUsers.find(u => u.id === project.exclusiveUserId);
                          if (user) {
                            setSelectedUserForModal(user);
                            setIsUserModalOpen(true);
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

                <div className="mt-auto flex gap-3">
                  <button 
                    onClick={() => handleViewDetails(project)}
                    className="flex-1 py-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] transition-all duration-300 flex items-center justify-center gap-2.5 group/btn"
                  >
                    <HiOutlineEye className="text-gray-400 group-hover/btn:text-[#ccff00] transition-colors text-lg" />
                    <span className="text-[0.7rem] font-bold text-white uppercase tracking-[0.2em]">View</span>
                  </button>
                  <button 
                    onClick={() => handleEditClick(project)}
                    className="px-4 py-3.5 rounded-xl bg-[#ccff00]/5 hover:bg-[#ccff00]/10 border border-[#ccff00]/10 transition-all duration-300 flex items-center justify-center group/edit"
                  >
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1.2em" width="1.2em" xmlns="http://www.w3.org/2000/svg" className="text-[#ccff00]"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button 
                    onClick={() => handleDeleteProject(project.id)}
                    className="px-4 py-3.5 rounded-xl bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 transition-all duration-300 flex items-center justify-center group/delete"
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
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No {filterProjectType} Ongoing Projects Found</p>
          </div>
        )}
      </div>

      {/* Edit Modal (reusing the logic but simplified for brevity in this scratch, but we keep it full for functionality) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="my-auto w-full max-w-3xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-full">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h2 className="text-xl font-bold text-white uppercase">Update Project Parameters</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-white"><HiX className="text-xl" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
               <div className="flex flex-col gap-2">
                 <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Project Name</label>
                 <input type="text" name="projectName" value={projectData.projectName} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ccff00] outline-none" />
               </div>
               <div className="grid grid-cols-3 gap-4">
                 <div className="flex flex-col gap-2">
                   <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Target (₹)</label>
                   <input type="number" name="targetAmount" min="0" value={projectData.targetAmount} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ccff00] outline-none" />
                 </div>
                 <div className="flex flex-col gap-2">
                   <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">ROI (%)</label>
                   <input type="number" name="roi" min="0" value={projectData.roi} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ccff00] outline-none" />
                 </div>
                 <div className="flex flex-col gap-2">
                   <label className="text-xs text-gray-400 font-bold uppercase tracking-wider">Duration (M)</label>
                   <input type="number" name="duration" min="0" value={projectData.duration} onChange={handleInputChange} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-[#ccff00] outline-none" />
                 </div>
               </div>
            </div>
            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end gap-4">
               <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2 rounded-xl border border-white/10 text-white uppercase text-xs font-bold">Cancel</button>
               <button 
                 onClick={handlePublishProject} 
                 disabled={isSubmittingProject || !projectData.projectName || !selectedCategory || !projectData.targetAmount || !projectData.roi || !projectData.duration}
                 className="px-6 py-2 rounded-xl bg-[#ccff00] text-black uppercase text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
               >
                 {isSubmittingProject ? 'Saving...' : 'Save Changes'}
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
                          <p className="text-lg font-black text-white tracking-[0.3em] uppercase">ABCDE1234F</p>
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
                          <p className="text-xs font-bold text-white">HDFC BANK LIMITED</p>
                       </div>
                       <div>
                          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">IFSC Code</p>
                          <p className="text-xs font-bold text-white tracking-widest">HDFC0001234</p>
                       </div>
                       <div className="col-span-2">
                          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-1">Account Number</p>
                          <p className="text-lg font-black text-white tracking-[0.1em]">50100456789012</p>
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

export default OngoingProjects;
