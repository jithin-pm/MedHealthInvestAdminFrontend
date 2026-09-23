const fs = require('fs');
const path = 'src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove initial state
content = content.replace(/\s*minInvestmentAmount: '1000',?\n?/g, '');

// 2. Remove edit state override
content = content.replace(/\s*minInvestmentAmount: project\.minInvestmentAmount \|\| 1000,?\n?/g, '');

// 3. Remove validation block
const validationBlockRegex = /\s*if \(parseFloat\(projectData\.minInvestmentAmount\) > parseFloat\(projectData\.targetAmount\)\) \{\s*showAlert\('Validation Error', 'Minimum investment cannot be greater than the target amount\.', 'error'\);\s*return;\s*\}/g;
content = content.replace(validationBlockRegex, '');

// 4. Remove form data append
content = content.replace(/\s*formData\.append\('minInvestmentAmount', projectData\.minInvestmentAmount \|\| 1000\);\n?/g, '');

// 5. Remove UI block
const minInvestmentUIRegex = /\s*\{\/\* Min Investment Amount \*\/\}[\s\S]*?\{\/\* ROI \*\/}/g;
content = content.replace(minInvestmentUIRegex, '\n              {/* ROI */}');

fs.writeFileSync(path, content);
console.log('Removed minInvestmentAmount');
