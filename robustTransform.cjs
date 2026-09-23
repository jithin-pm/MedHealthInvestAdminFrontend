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

// Rename component
content = content.replace(/ActiveProjects/g, 'SpecialProjects');
content = content.replace(/Active Projects/g, 'Special Projects');
content = content.replace(/Create Project/g, 'Create Special Project');
content = content.replace(/Edit Project/g, 'Edit Special Project');

// 1. Remove duration field and logic
content = content.replace(/const \{ projectName, targetAmount, roi, duration \} = projectData;/g, 'const { projectName, targetAmount, roi } = projectData;');
content = content.replace(/!projectName || !selectedCategory || !targetAmount || !roi || !duration/g, '!projectName || !selectedCategory || !targetAmount || !roi');
content = content.replace(/formData\.append\('duration', duration\);/g, '');
content = content.replace(/duration: '',/g, '');
content = content.replace(/duration: project\.duration,/g, '');
// Remove duration from card display
content = content.replace(/<div className="w-\[1px\] h-10 bg-white\/\[0\.05\]" \/>\s*<div className="flex flex-col gap-1">\s*<span className="text-\[10px\] uppercase tracking-wider text-gray-500 font-bold">Duration<\/span>\s*<span className="text-lg font-medium text-white">\{project\.duration\} Months<\/span>\s*<\/div>/g, '');
// Remove duration input field
content = content.replace(/<div className="flex flex-col gap-3">\s*<label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">\s*Duration \(Months\) <span className="text-red-500">\*<\/span>\s*<\/label>\s*<div className="relative group\/input">\s*<input\s*type="number"\s*name="duration"\s*placeholder="Enter project duration"\s*value=\{projectData\.duration\}\s*onChange=\{handleInputChange\}\s*className="w-full bg-\[\#080808\] border border-white\/5 rounded-xl px-4 py-3\.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-\[\#ccff00\]\/50 focus:bg-\[\#ccff00\]\/5 transition-all duration-300"\s*\/>\s*<\/div>\s*<\/div>/g, '');
content = content.replace(/<div className="flex flex-col gap-2">\s*<label className="text-\[0\.65rem\] font-bold text-gray-400 uppercase tracking-\[0\.1em\]">Duration \(Months\)<\/label>\s*<input \s*type="number" \s*name="duration"\s*min="0"\s*value=\{projectData\.duration\}\s*onChange=\{handleInputChange\}\s*placeholder="e.g. 24" \s*className="w-full bg-white\/\[0\.03\] border border-white\/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-\[\#ccff00\] transition-all placeholder:text-gray-600"\s*\/>\s*<\/div>/g, '');

// 2. Navigation routes
content = content.replace(/\/dashboard\/projects\/details\//g, '/dashboard/special-projects/details/');
content = content.replace(/\/dashboard\/projects\/settlement\//g, '/dashboard/special-projects/settlement/');

// 3. Clean up UI elements for "Exclusive" / "Standard"
// Remove main page Standard/Exclusive tabs entirely
content = content.replace(/<div className="flex bg-\[\#0c0c0c\] rounded-xl p-1 border border-white\/10 mb-8 sm:w-fit w-full">[\s\S]*?<\/div>\s*<\/div>/, '');

// The condition for showing User Selection was modalIsExclusive
content = content.replace(/\{modalIsExclusive && \(/g, '{true && (');
content = content.replace(/\{modalIsExclusive && selectedUser && \(/g, '{selectedUser && (');

// Remove projectType appends
content = content.replace(/formData\.append\('projectType', modalIsExclusive \? 'Exclusive' : 'Standard'\);/g, '');

// Change exclusiveUserId to assignedUserId which is what the backend expects
content = content.replace(/exclusiveUserId/g, 'assignedUserId');

// Simplify the description text logic
content = content.replace(/const description = `View and manage all \$\{isExclusive \? 'exclusive ' : ''\}active investment projects here\.`;/g, "const description = 'View and manage all Special Projects here. Each project is specifically tailored and assigned to a single user.';");

// Simplify the filter logic - we don't need to filter by isExclusive anymore
content = content.replace(/\(isExclusive \? p\.projectType === 'Exclusive' : p\.projectType === 'Standard'\) &&/g, '');

// Empty State message
content = content.replace(/<p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No \{isExclusive \? 'Exclusive ' : ''\}Special Projects Found<\/p>/g, '<p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Special Projects Found</p>');

// Remove modalIsExclusive from the disable button logic
content = content.replace(/\(modalIsExclusive && !selectedUser\)/g, '(!selectedUser)');

// In edit mode, when populating selectedUser
content = content.replace(/setModalIsExclusive\(project\.projectType === 'Exclusive'\);/g, '');
content = content.replace(/if \(project\.projectType === 'Exclusive' && project\.assignedUserId\) \{/g, 'if (project.assignedUserId) {');

// When clicking "view user", change condition to project.assignedUserId
content = content.replace(/if \(project\.projectType === 'Exclusive' && project\.assignedUserId\) \{/g, "if (project.assignedUserId) {");

fs.writeFileSync(path, content);
console.log('Transform complete.');
