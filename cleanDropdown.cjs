const fs = require('fs');
const path = 'src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// Remove isDropdownOpen
content = content.replace(/const \[isDropdownOpen, setIsDropdownOpen\] = useState\(false\);\n?/g, '');
// Remove dropdownRef
content = content.replace(/const dropdownRef = React\.useRef\(null\);\n?/g, '');
// Remove dropdownRef from the div wrapper
content = content.replace(/<div className="relative" ref=\{dropdownRef\}>/g, '<div className="relative">');

// There is an effect that closes dropdown on click outside
const handleClickOutsideRegex = /if \(dropdownRef\.current && !dropdownRef\.current\.contains\(event\.target\)\) \{\s*setIsDropdownOpen\(false\);\s*\}/g;
content = content.replace(handleClickOutsideRegex, '');

fs.writeFileSync(path, content);
console.log('Cleaned up dropdown variables');
