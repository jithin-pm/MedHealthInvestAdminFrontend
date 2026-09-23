const fs = require('fs');
const path = 'src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove handleAddCategory
content = content.replace(/const handleAddCategory = async \(\) => \{[\s\S]*?setIsSubmittingCategory\(false\);\n\s*?\};\n?/g, '');

// 2. Remove Add Category Modal
// It starts with `{/* Add Category Modal */}` or `{isCategoryModalOpen && (`
content = content.replace(/\{\/\* Add Category Modal \*\/\}[\s\S]*?\{\/\* Delete Confirmation Modal \*\/\}/g, '{/* Delete Confirmation Modal */}');

// 3. Remove remaining variables in declarations
content = content.replace(/const \[existingImages, setExistingImages\] = useState\(\[null, null, null, null\]\);\n?/g, '');
content = content.replace(/const \[isCategoryModalOpen, setIsCategoryModalOpen\] = useState\(false\);\n?/g, '');
content = content.replace(/const \[newCategory, setNewCategory\] = useState\(''\);\n?/g, '');
content = content.replace(/const \[isSubmittingCategory, setIsSubmittingCategory\] = useState\(false\);\n?/g, '');

// 4. Remove empty block statements (like the empty catch)
content = content.replace(/const imgs = \[\];\n?/g, '');
content = content.replace(/try\s*\{\s*\}\s*catch\s*\(e\)\s*\{\}\n?/g, '');
content = content.replace(/setProjectVideo\(null\);\n?/g, '');

fs.writeFileSync(path, content);
console.log('Final wipe executed');
