const fs = require('fs');
const path = 'src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove unused states and functions
content = content.replace(/const \[projectVideo, setProjectVideo\] = useState\(null\);\n?/g, '');
content = content.replace(/const \[existingImages, setExistingImages\] = useState\(\[null, null, null, null\]\);\n?/g, '');

const handleFileChangeStr = `  const handleFileChange = (e, type, index = 0) => {
    const file = e.target.files[0];
    if (file && type === 'image') {
      const newImages = [...projectImages];
      newImages[index] = file;
      setProjectImages(newImages);
    }
  };`;
content = content.replace(handleFileChangeStr, '');

const togglePlayPreviewStr = `  const togglePlayPreview = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };`;
content = content.replace(togglePlayPreviewStr, '');

content = content.replace(/setProjectImages\(\[null, null, null, null\]\);\n?/g, '');
content = content.replace(/setExistingImages\(\[null, null, null, null\]\);\n?/g, '');
content = content.replace(/setProjectVideo\(null\);\n?/g, '');

// 2. Fix 'project is not defined' at 266
content = content.replace(/setPreSettledProof\(project\.paymentProof \|\| null\);/, 'setPreSettledProof(editProject.paymentProof || null);');

// 3. Re-insert the Payment Proof UI right before Financials & Timeline Grid
const paymentProofUI = `              {/* Payment Proof / Project Image */}
              <div className="flex flex-col gap-3">
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Payment Proof / Project Image</label>
                <div className="flex items-center gap-4">
                  {preSettledProof ? (
                    <div className="relative w-32 h-32 rounded-xl border border-white/10 overflow-hidden shrink-0">
                      <img 
                        src={typeof preSettledProof === 'string' ? \`\${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/\${preSettledProof}\` : URL.createObjectURL(preSettledProof)} 
                        alt="Proof Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPreSettledProof(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-gray-400 hover:text-white transition-all"
                      >
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 20 20" aria-hidden="true" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => preSettledProofRef.current?.click()}
                      className="w-32 h-32 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-dashed border-white/20 hover:border-[#ccff00]/40 flex flex-col items-center justify-center gap-2 transition-all text-gray-500 hover:text-[#ccff00] shrink-0"
                    >
                      <svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m8 16 4-4 4 4"></path></svg>
                      <span className="text-[10px] font-black uppercase tracking-wider">Upload Proof</span>
                    </button>
                  )}
                  <input
                    type="file"
                    ref={preSettledProofRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPreSettledProof(e.target.files[0]);
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-300">
                      {preSettledProof ? (typeof preSettledProof === 'string' ? 'Existing Proof Attached' : preSettledProof.name) : 'No proof file uploaded'}
                    </span>
                    <span className="text-[10px] text-gray-500">Supported formats: JPG, PNG, PDF</span>
                  </div>
                </div>
              </div>\n\n              {/* Financials & Timeline Grid */}`;

content = content.replace(/\{\/\* Financials & Timeline Grid \*\/\}/, paymentProofUI);

fs.writeFileSync(path, content);
console.log('Done!');
