const fs = require('fs');
const path = 'src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove APIs
content = content.replace(/getAllCategoriesApi, /g, '');
content = content.replace(/addCategoryApi, /g, '');

// 2. Remove states and refs
content = content.replace(/const \[categories, setCategories\] = useState\(\[\]\);\n?/g, '');
content = content.replace(/const \[selectedCategory, setSelectedCategory\] = useState\(null\);\n?/g, '');
content = content.replace(/const \[isCategoryDropdownOpen, setIsCategoryDropdownOpen\] = useState\(false\);\n?/g, '');
content = content.replace(/const \[isCategoryModalOpen, setIsCategoryModalOpen\] = useState\(false\);\n?/g, '');
content = content.replace(/const \[newCategory, setNewCategory\] = useState\(''\);\n?/g, '');
content = content.replace(/const \[isSubmittingCategory, setIsSubmittingCategory\] = useState\(false\);\n?/g, '');
content = content.replace(/const categoryDropdownRef = React\.useRef\(null\);\n?/g, '');

// 3. Remove fetchCategories
const fetchCategoriesRegex = /const fetchCategories = async \(\) => \{[\s\S]*?\};\n?/g;
content = content.replace(fetchCategoriesRegex, '');
content = content.replace(/fetchCategories\(\);\n?/g, '');

// 4. Remove location.state && categories check
const locationEffectRegex = /useEffect\(\(\) => \{[\s\S]*?if \(location\.state\?\.editProject && categories\.length > 0\) \{[\s\S]*?handleEditClick\(location\.state\.editProject\);[\s\S]*?\/\/ Clear state[\s\S]*?window\.history\.replaceState\(\{\}, document\.title\);[\s\S]*?\}[\s\S]*?\}, \[location\.state, categories\]\);\n?/g;
content = content.replace(locationEffectRegex, `useEffect(() => {
    if (location.state?.editProject) {
      handleEditClick(location.state.editProject);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);\n`);

const isAddModalEffectRegex = /useEffect\(\(\) => \{\s*if \(isAddModalOpen\) \{\s*fetchCategories\(\);\s*\}\s*\}, \[isAddModalOpen\]\);\n?/g;
content = content.replace(isAddModalEffectRegex, '');

// 5. Remove from handlePublishProject
content = content.replace(/!selectedCategory \|\| /g, '');
content = content.replace(/formData\.append\('projectCategory', selectedCategory\.name\);\n?/g, '');

// 6. Remove from resetForm
content = content.replace(/setSelectedCategory\(null\);\n?/g, '');

// 7. Remove from handleClickOutside
content = content.replace(/if \(categoryDropdownRef\.current && !categoryDropdownRef\.current\.contains\(event\.target\)\) \{[\s\S]*?setIsCategoryDropdownOpen\(false\);[\s\S]*?\}/g, '');

// 8. Remove handleAddCategory
const handleAddCategoryRegex = /const handleAddCategory = async \(\) => \{[\s\S]*?setIsSubmittingCategory\(false\);\n\s*\};\n?/g;
content = content.replace(handleAddCategoryRegex, '');

// 9. Remove from handleEditClick
content = content.replace(/const cat = categories\.find\(c => c\.name === editProject\.projectCategory\);\n?/g, '');
content = content.replace(/setSelectedCategory\(cat \|\| \{ name: editProject\.projectCategory \}\);\n?/g, '');
content = content.replace(/const cat = categories\.find\(c => c\.name === project\.projectCategory\);\n?/g, '');
content = content.replace(/setSelectedCategory\(cat \|\| \{ name: project\.projectCategory \}\);\n?/g, '');

// 10. Remove UI parts
const categorySelectionUIRegex = /\{\/\* Category Selection \(Classy Custom Dropdown\) \*\/\}[\s\S]*?\{\/\* Target User \*\/}/;
content = content.replace(categorySelectionUIRegex, '{/* Target User */}');

const addCategoryModalRegex = /\{\/\* Add Category Modal \*\/\}[\s\S]*?\{\/\* Delete Confirmation Modal \*\/}/;
content = content.replace(addCategoryModalRegex, '{/* Delete Confirmation Modal */}');

// 11. Remove from submit button disabled prop
// Wait, !selectedCategory is already replaced by step 5 above globally!
// But just in case, I will verify the disabled prop for Submit Button
content = content.replace(/!selectedCategory \|\| /g, '');

fs.writeFileSync(path, content);
console.log('Categories removed.');
