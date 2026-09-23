const fs = require('fs');
const path = './src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// The multi_replace removed '{selectedUser && (' which means there's an unmatched ')}' down below.
// Let's just restore the selectedUser condition and remove the unmatched bracket
content = content.replace(/\{\/\* Investment Mode Selector for Exclusive Project \*\/\}/g, '{/* Investment Mode Selector for Exclusive Project */} {selectedUser && (');
content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/form>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/g, '</div></div></form></div></div></div></div>'); // ensure no trailing syntax errors

fs.writeFileSync(path, content);
console.log('Fixed unmatched bracket.');
