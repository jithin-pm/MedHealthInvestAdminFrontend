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

const ActiveProjects = () => {
  const [isExclusive, setIsExclusive] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [modalIsExclusive, setModalIsExclusive] = useState(false);
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
    collectedAmount: '',
    minInvestmentAmount: '1000',
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
  const preSettledProofRef = React.useRef(null);
  const navigate = useNavigate();

  // Investment Mode States
  const [investmentMode, setInvestmentMode] = useState('Online Gateway');
  const [preSettledProof, setPreSettledProof] = useState(null);
  const location = useLocation();

  // Handle incoming edit state from Details page
  useEffect(() => {
    if (location.state?.editProject && categories.length > 0) {
      handleEditClick(location.state.editProject);
      // Clear state to avoid reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, categories]);

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
    if (isAddModalOpen) {
      fetchCategories();
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

  const handleFileChange = (e, type, index = 0) => {
    const file = e.target.files[0];
    if (file && type === 'image') {
      const newImages = [...projectImages];
      newImages[index] = file;
      setProjectImages(newImages);
    }
  };

  const togglePlayPreview = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePublishProject = async () => {
    const { projectName, targetAmount, roi, duration } = projectData;

    if (!projectName || !selectedCategory || !targetAmount || !roi || !duration) {
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

    if (parseFloat(projectData.minInvestmentAmount) > parseFloat(projectData.targetAmount)) {
      showAlert('Validation Error', 'Minimum investment cannot be greater than the target amount.', 'error');
      return;
    }

    if (modalIsExclusive && investmentMode === 'Pre-Settled' && !preSettledProof && !isEditMode) {
      showAlert('Required', 'Please upload the payment proof for Pre-Settled project.', 'info');
      return;
    }

    setIsSubmittingProject(true);
    try {
      const formData = new FormData();
      formData.append('projectName', projectName);
      formData.append('projectCategory', selectedCategory.name);
      formData.append('projectType', modalIsExclusive ? 'Exclusive' : 'Standard');
      formData.append('targetAmount', targetAmount);
      formData.append('roi', roi);
      formData.append('duration', duration);
      formData.append('collectedAmount', projectData.collectedAmount || 0);
      formData.append('minInvestmentAmount', projectData.minInvestmentAmount || 1000);
      
      if (modalIsExclusive && selectedUser) {
        formData.append('exclusiveUserId', selectedUser.id);
        formData.append('investmentMode', investmentMode);
        if (investmentMode === 'Pre-Settled' && preSettledProof) {
          formData.append('preSettledProof', preSettledProof);
        }
      }
      
      // Construct image slots to tell the backend which images to keep and which are new
      const imageSlots = [0, 1, 2, 3].map(idx => {
        if (projectImages[idx]) return 'NEW';
        if (existingImages[idx]) return existingImages[idx];
        return 'EMPTY';
      });
      formData.append('imageSlots', JSON.stringify(imageSlots));
      
      // Append only the new files
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
      duration: '',
      collectedAmount: '',
      minInvestmentAmount: '1000',
    });
    setProjectImages([null, null, null, null]);
    setProjectVideo(null);
    setSelectedCategory(null);
    setModalIsExclusive(false);
    setIsEditMode(false);
    setEditProjectId(null);
    setExistingImages([]);
    setSelectedUser(null);
    setUserSearchQuery('');
    setInvestmentMode('Online Gateway');
    setPreSettledProof(null);
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

  const handleAddCategory = async () => {
    const trimmedCategory = newCategory.trim();
    if (!trimmedCategory) {
      showAlert('Error', 'Category name is required', 'error');
      return;
    }

    setIsSubmittingCategory(true);
    try {
      const response = await addCategoryApi({ name: trimmedCategory });
      if (response.status === 201 || response.status === 200) {
        showAlert('Success', 'Category added successfully!', 'success');
        setNewCategory('');
        setIsCategoryModalOpen(false);
        fetchCategories(); // Refresh categories
      }
    } catch (error) {
      console.error("Add category error:", error);
      const message = getErrorMessage(error, 'Failed to add category');
      const isDuplicate = message.toLowerCase().includes('already exists');
      showAlert(isDuplicate ? 'Information' : getErrorTitle(error), message, isDuplicate ? 'info' : 'error');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const status = 'Active';
  const title = `${status} Projects`;
  const description = `View and manage all ${isExclusive ? 'exclusive ' : ''}active investment projects here.`;

  // Filter projects based on type and active status
  const filteredProjects = allProjects.filter(p => 
    (isExclusive ? p.projectType === 'Exclusive' : p.projectType === 'Standard') &&
    p.status === 'ACTIVE'
  );

  const handleViewDetails = (project) => {
    navigate(`/dashboard/projects/details/${project.id}`, { state: { project } });
  };

  const handleDeleteProject = async (projectId) => {
    if (window.confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      try {
        const response = await deleteProjectApi(projectId);
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
      duration: project.duration,
      collectedAmount: project.collectedAmount || 0,
      minInvestmentAmount: project.minInvestmentAmount || 1000,
    });
    setModalIsExclusive(project.projectType === 'Exclusive');
    const cat = categories.find(c => c.name === project.projectCategory);
    setSelectedCategory(cat || { name: project.projectCategory });
    
    // Parse existing images
    try {
      const imgs = project.projectImages ? JSON.parse(project.projectImages) : [];
      setExistingImages(imgs);
    } catch (e) {
      setExistingImages(project.projectImages ? [project.projectImages] : []);
    }
    
    // Set video if exists
    setProjectVideo(project.projectVideo || null);
    
    // Set selected user if project is exclusive
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

  return (
    <div className="min-h-full">
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-400 text-sm md:text-base">{description}</p>
        </div>
        
        {/* Actions Area */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          
          {/* Add Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-sm tracking-wide hover:bg-gray-200 transition-all shadow-[0_0_15px_rgba(204,255,0,0.1)] w-full sm:w-auto"
            >
              <HiOutlinePlus className="text-lg" />
              <span>Add</span>
              <HiOutlineChevronDown className={`text-sm transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-2 w-full sm:w-48 bg-[#0c0c0c] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button
                  onClick={() => {
                    resetForm();
                    setIsAddModalOpen(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors border-b border-white/5"
                >
                  <HiOutlineFolder className="text-lg text-[#ccff00]" />
                  <span>Add Project</span>
                </button>
                <button
                  onClick={() => {
                    setIsCategoryModalOpen(true);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <HiOutlineTag className="text-lg text-[#ccff00]" />
                  <span>Add Category</span>
                </button>
              </div>
            )}
          </div>

          {/* Toggle Switch */}
          <div className="flex bg-[#111] border border-white/10 rounded-xl p-1 w-full sm:w-auto shrink-0">
            <button
              onClick={() => setIsExclusive(false)}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center ${
                !isExclusive 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => setIsExclusive(true)}
              className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                isExclusive 
                  ? 'bg-[#ccff00] text-black shadow-sm' 
                  : 'text-gray-500 hover:text-[#ccff00]'
              }`}
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" className={isExclusive ? 'text-black' : 'text-gray-500'}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              Exclusive
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
              
              {/* Image Header */}
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
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-4 left-4 bg-[#ccff00] text-black text-[0.6rem] font-black px-2.5 py-1 uppercase rounded tracking-[0.15em] shadow-lg">
                  {project.status}
                </div>
              </div>

              {/* Content Body */}
              <div className="flex flex-col flex-1 p-6 lg:p-8">
                <span className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] mb-1.5">{project.projectCategory}</span>
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
                    onClick={() => handleEditClick(project)}
                    className="px-4 py-3.5 rounded-xl bg-[#ccff00]/5 hover:bg-[#ccff00]/10 border border-[#ccff00]/10 transition-all duration-300 flex items-center justify-center group/edit"
                    title="Edit Project"
                  >
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1.2em" width="1.2em" xmlns="http://www.w3.org/2000/svg" className="text-[#ccff00]"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
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
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No {isExclusive ? 'Exclusive ' : ''}Active Projects Found</p>
          </div>
        )}
      </div>

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



              {/* Category Selection (Classy Custom Dropdown) */}
              <div className="flex flex-col gap-2 relative" ref={categoryDropdownRef}>
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Project Classification</label>
                <button
                  type="button"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className={`w-full bg-white/[0.03] border ${isCategoryDropdownOpen ? 'border-[#ccff00]' : 'border-white/10'} rounded-xl px-4 py-3.5 text-sm flex items-center justify-between transition-all duration-300 group`}
                >
                  <span className={selectedCategory ? 'text-white font-medium' : 'text-gray-600'}>
                    {selectedCategory ? selectedCategory.name : 'Select a Category'}
                  </span>
                  <HiOutlineChevronDown className={`text-gray-500 group-hover:text-[#ccff00] transition-transform duration-500 ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryDropdownOpen && (
                  <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-xl">
                    <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-1.5">
                      {categories.length > 0 ? (
                        categories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setSelectedCategory(cat);
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200 group/item mb-1 last:mb-0 ${
                              selectedCategory?.id === cat.id 
                                ? 'bg-[#ccff00] text-black font-bold' 
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            <span className="flex items-center gap-3">
                              <HiOutlineTag className={`text-lg ${selectedCategory?.id === cat.id ? 'text-black' : 'text-gray-500 group-hover/item:text-[#ccff00]'}`} />
                              {cat.name}
                            </span>
                            {selectedCategory?.id === cat.id && (
                              <div className="w-1.5 h-1.5 rounded-full bg-black" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <p className="text-[0.65rem] font-bold text-gray-600 uppercase tracking-widest">No Categories Found</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Project Type Toggle */}
              <div className="flex flex-col gap-3">
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Investment Access Type {isEditMode && '(Locked)'}</label>
                <div className={`flex gap-2 bg-white/[0.02] border border-white/10 rounded-xl p-1 w-full sm:w-fit ${isEditMode ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isEditMode) {
                        setModalIsExclusive(false);
                        setSelectedUser(null);
                        setUserSearchQuery('');
                      }
                    }}
                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                      !modalIsExclusive 
                        ? 'bg-white text-black shadow-lg scale-[1.02]' 
                        : 'text-gray-400 hover:text-gray-300'
                    } ${isEditMode ? 'cursor-not-allowed' : ''}`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => !isEditMode && setModalIsExclusive(true)}
                    className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                      modalIsExclusive 
                        ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)] scale-[1.02]' 
                        : 'text-gray-400 hover:text-[#ccff00]'
                    } ${isEditMode ? 'cursor-not-allowed' : ''}`}
                  >
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" className={modalIsExclusive ? 'text-black' : 'text-gray-500'}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    Exclusive
                  </button>
                </div>
              </div>

              {/* User Selection for Exclusive Project */}
              {modalIsExclusive && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300" ref={userSearchRef}>
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
              )}

              {/* Investment Mode Selector for Exclusive Project */}
              {modalIsExclusive && selectedUser && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Investment Mode</label>
                  <div className="flex gap-2 bg-white/[0.02] border border-white/10 rounded-xl p-1 w-full sm:w-fit">
                    <button
                      type="button"
                      onClick={() => setInvestmentMode('Online Gateway')}
                      className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                        investmentMode === 'Online Gateway' 
                          ? 'bg-white text-black shadow-lg scale-[1.02]' 
                          : 'text-gray-400 hover:text-gray-300'
                      }`}
                    >
                      Online Gateway
                    </button>
                    <button
                      type="button"
                      onClick={() => setInvestmentMode('Pre-Settled')}
                      className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                        investmentMode === 'Pre-Settled' 
                          ? 'bg-[#ccff00] text-black shadow-[0_0_15px_rgba(204,255,0,0.3)] scale-[1.02]' 
                          : 'text-gray-400 hover:text-[#ccff00]'
                      }`}
                    >
                      Pre-Settled
                    </button>
                  </div>

                  {/* Pre-Settled Payment Proof Image Upload */}
                  {investmentMode === 'Pre-Settled' && (
                    <div className="mt-2 flex flex-col gap-2 p-5 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl transition-all">
                      <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Upload Settlement Payment Proof</label>
                      <div className="flex items-center gap-4 mt-2">
                        {preSettledProof ? (
                          <div className="relative w-24 h-24 rounded-xl border border-white/10 overflow-hidden shrink-0">
                            <img 
                              src={URL.createObjectURL(preSettledProof)} 
                              alt="Proof Preview" 
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => setPreSettledProof(null)}
                              className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-black text-gray-400 hover:text-white transition-all"
                            >
                              <HiX size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => preSettledProofRef.current?.click()}
                            className="w-24 h-24 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-dashed border-white/20 hover:border-[#ccff00]/40 flex flex-col items-center justify-center gap-1.5 transition-all text-gray-500 hover:text-[#ccff00] shrink-0"
                          >
                            <HiOutlineCloudUpload className="text-xl" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Proof</span>
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
                            {preSettledProof ? preSettledProof.name : 'No proof file uploaded'}
                          </span>
                          <span className="text-[10px] text-gray-500 mt-1">
                            Accepted formats: JPEG, PNG, WEBP (Max 5MB)
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}



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

                {/* Min Investment Amount */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Min Investment (₹)</label>
                  <input 
                    type="number" 
                    name="minInvestmentAmount"
                    min="0"
                    value={projectData.minInvestmentAmount}
                    onChange={(e) => {
                       const val = e.target.value;
                       if (parseFloat(val) < 0) return;
                       setProjectData(prev => ({ ...prev, minInvestmentAmount: val }));
                    }}
                    placeholder="e.g. 1000" 
                    className={`w-full bg-white/[0.03] border ${parseFloat(projectData.minInvestmentAmount) > parseFloat(projectData.targetAmount) ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] transition-all placeholder:text-gray-600`}
                  />
                  {parseFloat(projectData.minInvestmentAmount) > parseFloat(projectData.targetAmount) && (
                    <span className="text-[10px] text-red-500 font-bold uppercase">Cannot exceed target</span>
                  )}
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

                {/* Duration */}
                <div className="flex flex-col gap-2">
                  <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Duration (Months)</label>
                  <input 
                    type="number" 
                    name="duration"
                    min="0"
                    value={projectData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g. 24" 
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] transition-all placeholder:text-gray-600"
                  />
                </div>

              </div>

              {/* Uploads Grid */}
              <div className="grid grid-cols-1 gap-8">
                
                {/* Images Upload - 4 Slots */}
                <div className="flex flex-col gap-4">
                  <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Project Gallery (Up to 4 Images)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                        <input 
                          type="file" 
                          ref={imageInputRefs[idx]}
                          onChange={(e) => handleFileChange(e, 'image', idx)}
                          className="hidden"
                          accept="image/*"
                        />
                        <button 
                          onClick={() => imageInputRefs[idx].current.click()}
                          className="flex flex-col items-center justify-center gap-3 w-full aspect-square bg-white/[0.02] border-2 border-dashed border-white/10 hover:border-[#ccff00]/50 hover:bg-[#ccff00]/10 rounded-2xl transition-all group relative overflow-hidden"
                        >
                          {projectImages[idx] ? (
                            <div className="absolute inset-0">
                              <img 
                                src={URL.createObjectURL(projectImages[idx])} 
                                alt="New" 
                                className="w-full h-full object-cover" 
                              />
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[0.5rem] text-[#ccff00] font-black uppercase">Change</span>
                              </div>
                            </div>
                          ) : existingImages[idx] ? (
                            <div className="absolute inset-0">
                              <img 
                                src={getImageUrl(existingImages[idx])} 
                                alt="Existing" 
                                className="w-full h-full object-cover opacity-60" 
                              />
                              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center group-hover:bg-black/60 transition-all">
                                <HiOutlineCloudUpload className="text-xl text-white group-hover:text-[#ccff00] transition-colors" />
                                <span className="text-[0.5rem] font-black text-white uppercase tracking-widest mt-1">Replace</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center group-hover:bg-[#ccff00]/20 transition-colors">
                                <HiOutlinePlus className="text-gray-500 group-hover:text-[#ccff00] transition-colors" />
                              </div>
                              <span className="text-[0.5rem] font-bold text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">Slot {idx + 1}</span>
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

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
                disabled={isSubmittingProject || !projectData.projectName || !selectedCategory || !projectData.targetAmount || !projectData.roi || !projectData.duration || (modalIsExclusive && !selectedUser)}
                className="px-6 py-3 rounded-xl bg-[#ccff00] hover:bg-[#b3ff00] text-black font-black text-sm tracking-[0.15em] uppercase shadow-[0_0_15px_rgba(204,255,0,0.2)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isSubmittingProject ? 'Processing...' : (isEditMode ? 'Update Project' : 'Publish Initiative')}
              </button>
            </div>

          </div>
        </div>
      )}
      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h2 className="text-xl font-bold text-white uppercase">New Category</h2>
                <p className="text-[0.65rem] text-gray-500 font-bold uppercase tracking-[0.2em] mt-1">Define project classification</p>
              </div>
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <HiX className="text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-2">
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Category Name</label>
                <input 
                  type="text" 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Healthcare, Technology, etc." 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] transition-all placeholder:text-gray-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-black/20 rounded-b-2xl">
              <button 
                onClick={() => setIsCategoryModalOpen(false)}
                className="px-5 py-2.5 rounded-lg border border-white/10 text-white font-bold text-xs uppercase hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCategory}
                disabled={isSubmittingCategory || !newCategory.trim()}
                className="px-5 py-2.5 rounded-lg bg-[#ccff00] text-black font-black text-xs uppercase shadow-[0_0_15px_rgba(204,255,0,0.2)] hover:bg-[#b3ff00] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {isSubmittingCategory ? 'Saving...' : 'Create Category'}
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

export default ActiveProjects;
