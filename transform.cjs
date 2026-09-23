const fs = require('fs');
const path = './src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace API imports
content = content.replace(
  /addProjectApi, \s*getAllProjectsApi, \s*editProjectApi, \s*deleteProjectApi,/g,
  'addSpecialProjectApi, getAllSpecialProjectsApi, editSpecialProjectApi, deleteSpecialProjectApi,'
);

// Replace API calls
content = content.replace(/getAllProjectsApi/g, 'getAllSpecialProjectsApi');
content = content.replace(/addProjectApi/g, 'addSpecialProjectApi');
content = content.replace(/editProjectApi/g, 'editSpecialProjectApi');
content = content.replace(/deleteProjectApi/g, 'deleteSpecialProjectApi');

// Rename component
content = content.replace(/ActiveProjects/g, 'SpecialProjects');

// Change references to Special Projects
content = content.replace(/Active Projects/g, 'Special Projects');
content = content.replace(/Create Project/g, 'Create Special Project');
content = content.replace(/Edit Project/g, 'Edit Special Project');

// In addProject/editProject logic, make sure we assign assignedUserId instead of exclusiveUserId
content = content.replace(/exclusiveUserId:/g, 'assignedUserId:');
content = content.replace(/projectType:/g, '// projectType:'); // Remove projectType field
content = content.replace(/duration:/g, '// duration:'); // Remove duration field

// The special projects require a user, so ensure isExclusive is forced to true
content = content.replace(/const \[isExclusive, setIsExclusive\] = useState\(false\);/g, 'const [isExclusive, setIsExclusive] = useState(true);');
content = content.replace(/setIsExclusive\(true\);/g, ''); // Remove toggles
content = content.replace(/setIsExclusive\(false\);/g, '');

// Also replace the navigation links in the list items to point to special-projects
content = content.replace(/\/dashboard\/projects\/details\//g, '/dashboard/special-projects/details/');
content = content.replace(/\/dashboard\/projects\/settlement\//g, '/dashboard/special-projects/settlement/');

fs.writeFileSync(path, content);
console.log('Transform complete.');
