const fs = require('fs');
const path = './src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove projectImages array logic
content = content.split('const [activeMedia, setActiveMedia] = useState({ type: null, url: null, file: null });').join('const [paymentProof, setPaymentProof] = useState(null);');
content = content.replace(/const \[mediaFiles, setMediaFiles\] = useState\(\[\]\);/g, '');
content = content.replace(/const fileInputRef = useRef\(null\);/g, 'const paymentProofRef = useRef(null);');

// Handle Edit Mode population
const populateLogic = `if (project.projectImages) {
        try {
          const images = JSON.parse(project.projectImages);
          const mappedMedia = images.map(img => ({
            type: 'image',
            url: \`\${BASE_URL}/\${img}\`,
            isExisting: true,
            path: img
          }));
          setMediaFiles(mappedMedia);
          if (mappedMedia.length > 0) setActiveMedia(mappedMedia[0]);
        } catch (e) {
          console.error("Error parsing images", e);
        }
      }`;
content = content.split(populateLogic).join(`if (project.paymentProof) {
        setPaymentProof(project.paymentProof);
      }`);

// Form Data appending
const formDataLogic = `mediaFiles.forEach((file) => {
        if (file.isExisting) {
          imageSlots.push(file.path);
        } else {
          imageSlots.push('NEW');
          formData.append('projectImages', file.file);
        }
      });
      formData.append('imageSlots', JSON.stringify(imageSlots));`;
content = content.split(formDataLogic).join(`if (paymentProof && typeof paymentProof !== 'string') {
        formData.append('paymentProof', paymentProof);
      }`);

// Clear state
content = content.split("setMediaFiles([]);").join("");
content = content.split("setActiveMedia({ type: null, url: null, file: null });").join("setPaymentProof(null);");

// Remove handleMediaUpload, handleDragOver, handleDrop, removeMedia, setMainMedia functions
content = content.replace(/const handleMediaUpload =[\s\S]*?setActiveMedia\(newFiles\[0\]\);\s*\}/, '');
content = content.replace(/const handleDragOver =[\s\S]*?e\.preventDefault\(\);\s*\}/, '');
content = content.replace(/const handleDrop =[\s\S]*?handleMediaUpload\(e\);\s*\}/, '');
content = content.replace(/const removeMedia =[\s\S]*?setActiveMedia\(prev\[0\] || \{ type: null, url: null, file: null \}\);\s*\};\s*\}/, '');
content = content.replace(/const setMainMedia =[\s\S]*?setMediaFiles\(newFiles\);\s*\}/, '');

// The UI replacement:
// Replace the entire "Media Gallery" section with a simple Payment Proof upload
const mediaGalleryHtmlRegex = /\{\/\* Media Gallery \*\/\}.*?\{\/\* Project Details \*\/\}/s;
const paymentProofHtml = `{/* Payment Proof */}
              <div className="flex flex-col gap-3">
                <label className="text-[0.65rem] font-bold text-gray-400 uppercase tracking-[0.1em]">Payment Proof</label>
                <div className="flex items-center gap-4">
                  {paymentProof ? (
                    <div className="relative w-32 h-32 rounded-xl border border-white/10 overflow-hidden shrink-0">
                      <img 
                        src={typeof paymentProof === 'string' ? \`\${BASE_URL}/\${paymentProof}\` : URL.createObjectURL(paymentProof)} 
                        alt="Proof Preview" 
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setPaymentProof(null)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-gray-400 hover:text-white transition-all"
                      >
                        <HiX size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => paymentProofRef.current?.click()}
                      className="w-32 h-32 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-dashed border-white/20 hover:border-[#ccff00]/40 flex flex-col items-center justify-center gap-2 transition-all text-gray-500 hover:text-[#ccff00] shrink-0"
                    >
                      <HiOutlineCloudUpload className="text-2xl" />
                      <span className="text-[10px] font-black uppercase tracking-wider">Upload Proof</span>
                    </button>
                  )}
                  <input
                    type="file"
                    ref={paymentProofRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPaymentProof(e.target.files[0]);
                      }
                    }}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-gray-300">
                      {paymentProof ? (typeof paymentProof === 'string' ? 'Existing Proof Attached' : paymentProof.name) : 'No proof file uploaded'}
                    </span>
                    <span className="text-[10px] text-gray-500">Supported formats: JPG, PNG, PDF</span>
                  </div>
                </div>
              </div>

              {/* Project Details */}`;

content = content.replace(mediaGalleryHtmlRegex, paymentProofHtml);

// Card display update: No mainImage logic anymore.
// We just replace the image src with project.paymentProof
content = content.replace(/const images = JSON\.parse\(project\.projectImages \|\| '\[\]'\);/g, '');
content = content.replace(/const mainImage = images\.length > 0 \? `\$\{BASE_URL\}\/\$\{images\[0\]\.replace\(\/\\\\\/g, '\/'\)\}` : '';/g, '');

content = content.replace(/src=\{mainImage\}/g, "src={project.paymentProof ? `${BASE_URL}/${project.paymentProof}` : ''}");

fs.writeFileSync(path, content);
console.log('Admin transform complete.');
