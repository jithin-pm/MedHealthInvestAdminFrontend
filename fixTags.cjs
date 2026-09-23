const fs = require('fs');
const path = 'src/Pages/SpecialProjects/SpecialProjects.jsx';
let content = fs.readFileSync(path, 'utf8');

// I will just replace the exact end of the modal body to ensure brackets are balanced.
const search = `              </div>

              
            </div>

            <div className="flex items-center justify-between p-6 border-t border-white/5 bg-black/20 rounded-b-2xl">`;

const replace = `              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-white/5 bg-black/20 rounded-b-2xl">`;

content = content.replace(search, replace);

fs.writeFileSync(path, content);
console.log('Fixed tags');
