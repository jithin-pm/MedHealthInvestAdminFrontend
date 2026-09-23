const fs = require('fs');
const path = './src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// Remove main page Standard/Exclusive tabs entirely
content = content.replace(/<div className="flex bg-\[\#0c0c0c\] rounded-xl p-1 border border-white\/10 mb-8 sm:w-fit w-full">[\s\S]*?<\/div>\s*<\/div>/, '');

// Remove the Project Tier Selection inside the modal
content = content.replace(/<div className="flex flex-col gap-2 relative">[\s\S]*?<label className="text-\[0\.65rem\] font-bold text-gray-400 uppercase tracking-\[0\.1em\]">Project Tier<\/label>[\s\S]*?<div className="flex bg-white\/\[0\.03\] rounded-xl p-1 border border-white\/10 mb-2">[\s\S]*?<\/div>\s*<\/div>/, '');

// The condition for showing User Selection was modalIsExclusive
content = content.replace(/\{modalIsExclusive && \(/g, '{true && (');
content = content.replace(/\{modalIsExclusive && selectedUser && \(/g, '{selectedUser && (');

// Remove projectType appends
content = content.replace(/formData\.append\('projectType', modalIsExclusive \? 'Exclusive' : 'Standard'\);/g, '');

// Also change exclusiveUserId to assignedUserId which is what the backend expects
content = content.replace(/exclusiveUserId/g, 'assignedUserId');

// Simplify the description text logic
content = content.replace(/const description = `View and manage all \$\{isExclusive \? 'exclusive ' : ''\}active investment projects here\.`;/g, "const description = 'View and manage all Special Projects here. Each project is specifically tailored and assigned to a single user.';");

// Simplify the filter logic - we don't need to filter by isExclusive anymore
content = content.replace(/\(isExclusive \? p\.projectType === 'Exclusive' : p\.projectType === 'Standard'\) &&/g, '');

// In the card display, remove the projectType rendering logic since it's just "Special"
content = content.replace(/\{project\.projectType === 'Exclusive' && \([\s\S]*?\}\)/, `
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

// When clicking "view user", change condition to project.assignedUserId
content = content.replace(/if \(project\.projectType === 'Exclusive' && project\.exclusiveUserId\) \{/g, "if (project.assignedUserId) {");
content = content.replace(/const user = allUsers\.find\(u => u\.id === project\.exclusiveUserId\);/g, "const user = allUsers.find(u => u.id === project.assignedUserId);");

// Empty State message
content = content.replace(/<p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No \{isExclusive \? 'Exclusive ' : ''\}Special Projects Found<\/p>/, '<p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Special Projects Found</p>');

// Remove modalIsExclusive from the disable button logic
content = content.replace(/\(modalIsExclusive && !selectedUser\)/g, '(!selectedUser)');

// In edit mode, when populating selectedUser
content = content.replace(/setModalIsExclusive\(project\.projectType === 'Exclusive'\);/g, '');
content = content.replace(/if \(project\.projectType === 'Exclusive' && project\.assignedUserId\) \{/g, 'if (project.assignedUserId) {');

fs.writeFileSync(path, content);
console.log('Cleaned up SpecialProjects.jsx');
