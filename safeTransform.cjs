const fs = require('fs');
const path = './src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace API imports and calls
content = content.replace(
  /addProjectApi, \s*getAllProjectsApi, \s*editProjectApi, \s*deleteProjectApi,/g,
  'addSpecialProjectApi, getAllSpecialProjectsApi, editSpecialProjectApi, deleteSpecialProjectApi,'
);
content = content.replace(/getAllProjectsApi/g, 'getAllSpecialProjectsApi');
content = content.replace(/addProjectApi/g, 'addSpecialProjectApi');
content = content.replace(/editProjectApi/g, 'editSpecialProjectApi');
content = content.replace(/deleteProjectApi/g, 'deleteSpecialProjectApi');

// Component name replacements
content = content.replace(/ActiveProjects/g, 'SpecialProjects');
content = content.replace(/Active Projects/g, 'Special Projects');
content = content.replace(/Create Project/g, 'Create Special Project');
content = content.replace(/Edit Project/g, 'Edit Special Project');

// Route updates
content = content.replace(/\/dashboard\/projects\/details\//g, '/dashboard/special-projects/details/');
content = content.replace(/\/dashboard\/projects\/settlement\//g, '/dashboard/special-projects/settlement/');

// Remove duration validations and input fields
content = content.split('const { projectName, targetAmount, roi, duration } = projectData;').join('const { projectName, targetAmount, roi } = projectData;');
content = content.split('!projectName || !selectedCategory || !targetAmount || !roi || !duration').join('!projectName || !selectedCategory || !targetAmount || !roi');
content = content.split("formData.append('duration', duration);").join("");

// State modifications
content = content.split("duration: '',").join("");
content = content.split("duration: project.duration,").join("");

// Remove duration display on card
const durationCardHtml = `<div className="w-[1px] h-10 bg-white/[0.05]" />
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Duration</span>
                    <span className="text-lg font-medium text-white">{project.duration} Months</span>
                  </div>`;
content = content.split(durationCardHtml).join("");

// Remove duration input HTML
const durationInputHtml = `{/* Duration */}
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
                </div>`;
content = content.split(durationInputHtml).join("");

// Exclusive logic cleanup:
// Change description
content = content.split("const description = `View and manage all ${isExclusive ? 'exclusive ' : ''}active investment projects here.`;").join("const description = 'View and manage all Special Projects here. Each project is specifically tailored and assigned to a single user.';");

// 1. Force isExclusive to true in logic (without the toggles)
content = content.split("const [isExclusive, setIsExclusive] = useState(false);").join("");
// Just remove the filter check for isExclusive entirely
content = content.split("(isExclusive ? p.projectType === 'Exclusive' : p.projectType === 'Standard') &&").join("");

// 2. Remove standard/exclusive tabs on the page
const pageTabsHtml = `<div className="flex bg-[#0c0c0c] rounded-xl p-1 border border-white/10 mb-8 sm:w-fit w-full">
            <button
              onClick={() => setIsExclusive(false)}
              className={\`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center \${
                !isExclusive 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }\`}
            >
              Standard
            </button>
            <button
              onClick={() => setIsExclusive(true)}
              className={\`flex-1 sm:flex-none px-5 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 \${
                isExclusive 
                  ? 'bg-[#ccff00]/10 text-[#ccff00] shadow-sm border border-[#ccff00]/20' 
                  : 'text-gray-500 hover:text-[#ccff00] hover:bg-white/5'
              }\`}
            >
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" className={isExclusive ? 'text-black' : 'text-gray-500'}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              Exclusive
            </button>
          </div>`;
content = content.split(pageTabsHtml).join("");

// Remove the exclusive check for projectType in card
const exclusiveCardDisplayHtml = `{project.projectType === 'Exclusive' && (
                    <div className="mt-4 pt-4 border-t border-white/[0.05]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Assigned Investor</span>
                        <span className="px-2 py-0.5 rounded bg-[#ccff00]/10 text-[#ccff00] text-[10px] font-bold uppercase tracking-wider border border-[#ccff00]/20">
                          Private
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white truncate max-w-[150px]">
                          {allUsers.find(u => u.id === project.exclusiveUserId)?.fullName || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {allUsers.find(u => u.id === project.exclusiveUserId)?.email || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}`;
content = content.split(exclusiveCardDisplayHtml).join(`
                    <div className="mt-4 pt-4 border-t border-white/[0.05]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Assigned Investor</span>
                        <span className="px-2 py-0.5 rounded bg-[#ccff00]/10 text-[#ccff00] text-[10px] font-bold uppercase tracking-wider border border-[#ccff00]/20">
                          Private
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-white truncate max-w-[150px]">
                          {allUsers.find(u => u.id === project.assignedUserId)?.fullName || 'N/A'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {allUsers.find(u => u.id === project.assignedUserId)?.email || 'N/A'}
                        </span>
                      </div>
                    </div>
`);

// When clicking "view user"
content = content.split("if (project.projectType === 'Exclusive' && project.exclusiveUserId) {").join("if (project.assignedUserId) {");
content = content.split("const user = allUsers.find(u => u.id === project.exclusiveUserId);").join("const user = allUsers.find(u => u.id === project.assignedUserId);");

// Empty message
content = content.split("<p className=\"text-gray-500 font-bold uppercase tracking-widest text-xs\">No {isExclusive ? 'Exclusive ' : ''}Special Projects Found</p>").join("<p className=\"text-gray-500 font-bold uppercase tracking-widest text-xs\">No Special Projects Found</p>");

// 3. Clean up modal project tier
content = content.split("const [modalIsExclusive, setModalIsExclusive] = useState(false);").join("");
content = content.split("setModalIsExclusive(false);").join("");
content = content.split("setModalIsExclusive(project.projectType === 'Exclusive');").join("");
content = content.split("if (project.projectType === 'Exclusive' && project.exclusiveUserId) {").join("if (project.assignedUserId) {");
content = content.split("const user = allUsers.find(u => u.id === project.exclusiveUserId);").join("const user = allUsers.find(u => u.id === project.assignedUserId);");

// Remove standard/exclusive tab in modal
const modalTabsHtml = `{/* Project Tier Selection */}
              <div className="flex flex-col gap-2 relative">
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Project Tier</label>
                <div className="flex bg-white/[0.03] rounded-xl p-1 border border-white/10 mb-2">
                  <button
                    type="button"
                    onClick={() => !isEditMode && setModalIsExclusive(false)}
                    className={\`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 \${
                      !modalIsExclusive 
                        ? 'bg-white/10 text-white shadow-sm' 
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                    } \${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}\`}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => !isEditMode && setModalIsExclusive(true)}
                    className={\`flex-1 sm:flex-none px-6 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 \${
                      modalIsExclusive 
                        ? 'bg-[#ccff00]/10 text-[#ccff00] shadow-sm border border-[#ccff00]/20' 
                        : 'text-gray-500 hover:text-[#ccff00] hover:bg-white/5'
                    } \${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}\`}
                  >
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" className={modalIsExclusive ? 'text-black' : 'text-gray-500'}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    Exclusive
                  </button>
                </div>
              </div>`;
content = content.split(modalTabsHtml).join("");

// In the modal, User Selection logic
content = content.split("{modalIsExclusive && (").join("{true && (");
content = content.split("{modalIsExclusive && selectedUser && (").join("{selectedUser && (");

// Remove formData append for projectType
content = content.split("formData.append('projectType', modalIsExclusive ? 'Exclusive' : 'Standard');").join("");

// Replace exclusiveUserId with assignedUserId in form logic
content = content.split("if (modalIsExclusive && selectedUser) {").join("if (selectedUser) {");
content = content.split("formData.append('exclusiveUserId', selectedUser.id);").join("formData.append('assignedUserId', selectedUser.id);");

// Validation
content = content.split("disabled={isSubmittingProject || !projectData.projectName || !selectedCategory || !projectData.targetAmount || !projectData.roi || !projectData.duration || (modalIsExclusive && !selectedUser)}").join("disabled={isSubmittingProject || !projectData.projectName || !selectedCategory || !projectData.targetAmount || !projectData.roi || !selectedUser}");

fs.writeFileSync(path, content);
console.log('Safe transform complete.');
