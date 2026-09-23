const fs = require('fs');
const path = 'src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove category selection UI
const categorySelectionUIRegex = /\{\/\* Category Selection \(Classy Custom Dropdown\) \*\/\}[\s\S]*?Target User Association/g;
content = content.replace(categorySelectionUIRegex, 'Target User Association');

// 2. Remove Add Category Modal
const addCategoryModalRegex = /\{\/\* Add Category Modal \*\/\}[\s\S]*?\{\/\* Delete Confirmation Modal \*\/\}/g;
content = content.replace(addCategoryModalRegex, '{/* Delete Confirmation Modal */}');

// 3. Clean remaining variables in lint output
const varsToClean = [
  "existingImages",
  "setExistingImages",
  "newCategory",
  "setIsSubmittingCategory",
  "addCategoryApi",
  "setNewCategory",
  "setIsCategoryModalOpen",
  "imgs",
  "setProjectVideo",
  "categoryDropdownRef",
  "setIsCategoryDropdownOpen",
  "isCategoryDropdownOpen",
  "selectedCategory",
  "categories",
  "setSelectedCategory",
  "isCategoryModalOpen",
  "isSubmittingCategory"
];

// Instead of global blind replace, let me just replace the specific assignments if they are still there
content = content.replace(/const \[existingImages, setExistingImages\] = useState\(\[null, null, null, null\]\);\n?/g, '');
content = content.replace(/const \[isCategoryModalOpen, setIsCategoryModalOpen\] = useState\(false\);\n?/g, '');
content = content.replace(/const \[newCategory, setNewCategory\] = useState\(''\);\n?/g, '');
content = content.replace(/const \[isSubmittingCategory, setIsSubmittingCategory\] = useState\(false\);\n?/g, '');

content = content.replace(/const imgs = \[\];\n?/g, '');
content = content.replace(/try \{\s*\} catch \(e\) \{\}\n?/g, '');

fs.writeFileSync(path, content);
console.log('Category UI removed');
