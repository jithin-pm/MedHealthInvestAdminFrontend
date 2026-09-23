const fs = require('fs');
const path = 'src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove existingImages and setExistingImages completely
content = content.replace(/const \[existingImages, setExistingImages\] = useState\(\[null, null, null, null\]\);\n?/g, '');

// 2. Fix 'project is not defined' at 252
// It was `setPreSettledProof(project.paymentProof || null);` which I added! Oh! The parameter is `editProject`!
// Let's replace it.
content = content.replace(/setPreSettledProof\(project\.paymentProof \|\| null\);/g, 'setPreSettledProof(editProject.paymentProof || null);');

// 3. Remove 'imgs' and empty block at 345 and setProjectVideo at 349
// This is probably in `resetForm`:
/*
    const imgs = [];
    try {
    } catch (e) {}
    setProjectVideo(null);
*/
content = content.replace(/const imgs = \[\];\n?/g, '');
content = content.replace(/try {\n\s*} catch \(e\) {}\n?/g, '');
content = content.replace(/setProjectVideo\(null\);\n?/g, '');

fs.writeFileSync(path, content);
console.log('Final final cleanup!');
