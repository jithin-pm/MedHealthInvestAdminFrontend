const fs = require('fs');
const path = 'src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the entire "Project Gallery (Up to 4 Images)" section
// The section starts at: {/* Uploads Grid */}
// And ends at the div before {/* Submit Button */} or the end of the modal body
content = content.replace(/\{\/\* Uploads Grid \*\/\}[\s\S]*?\{\/\* Images Upload - 4 Slots \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '');

// 2. We want to move the "Upload Settlement Payment Proof" out of the "Pre-Settled" condition so it's always available,
// but let's just leave it there or move it to where the gallery was?
// Actually, the user wants "instead of that need an image adding input to add the payment proof"
// It's cleaner if we take the payment proof upload and put it where the gallery was, renaming it to "Upload Payment Proof / Project Image"
const paymentProofUI = `              {/* Payment Proof / Project Image */}
              <div className="flex flex-col gap-3">
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Payment Proof / Project Image</label>
                <div className="flex items-center gap-4">
                  {preSettledProof ? (
                    <div className="relative w-32 h-32 rounded-xl border border-white/10 overflow-hidden shrink-0">
                      <img 
                        src={typeof preSettledProof === 'string' ? \`\${BASE_URL}/\${preSettledProof}\` : URL.createObjectURL(preSettledProof)} 
                        alt="Proof Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPreSettledProof(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-gray-400 hover:text-white transition-all"
                      >
                        <HiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => preSettledProofRef.current?.click()}
                      className="w-32 h-32 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-dashed border-white/20 hover:border-[#ccff00]/40 flex flex-col items-center justify-center gap-2 transition-all text-gray-500 hover:text-[#ccff00] shrink-0"
                    >
                      <HiOutlineCloudUpload className="text-2xl" />
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
              </div>`;

// Insert the new UI right before the Financials & Timeline Grid
content = content.replace(/\{\/\* Financials & Timeline Grid \*\/\}/, paymentProofUI + '\n\n              {/* Financials & Timeline Grid */}');

// Remove the old Conditional Pre-Settled Proof
content = content.replace(/\{\/\* Pre-Settled Payment Proof Image Upload \*\/\}.*?\{\/\* Financials & Timeline Grid \*\/\}/s, '{/* Financials & Timeline Grid */}');

// 3. Remove formData stuff for projectImages
content = content.replace(/\/\/ Construct image slots[\s\S]*?formData\.append\('projectVideo', projectVideo\);/, '');

// Fix formData for paymentProof
const oldFormDataPreSettled = `        if (investmentMode === 'Pre-Settled' && preSettledProof) {
          formData.append('preSettledProof', preSettledProof);
        }`;
const newFormDataPreSettled = `      }
      if (preSettledProof && typeof preSettledProof !== 'string') {
        formData.append('paymentProof', preSettledProof);
      }`;
content = content.replace(oldFormDataPreSettled, newFormDataPreSettled);

// Ensure Edit project loads the paymentProof
const oldEditLogic = `setPreSettledProof(null);`;
const newEditLogic = `setPreSettledProof(project.paymentProof || null);`;
content = content.replace(oldEditLogic, newEditLogic);

// State cleaning
content = content.replace(/const \[projectImages, setProjectImages\] = useState\(\[null, null, null, null\]\);/, '');
content = content.replace(/const \[existingImages, setExistingImages\] = useState\(\[null, null, null, null\]\);/, '');
content = content.replace(/const imageInputRefs = \[React\.useRef\(null\), React\.useRef\(null\), React\.useRef\(null\), React\.useRef\(null\)\];/, '');

fs.writeFileSync(path, content);
console.log('Cleanup script executed.');
