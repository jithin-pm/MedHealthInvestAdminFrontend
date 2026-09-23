const fs = require('fs');
const path = './src/Pages/SpecialProjects/SpecialSettlementManagement.jsx';
let content = fs.readFileSync(path, 'utf8');

// Replace API imports
content = content.replace(
  /getProjectByIdApi, \s*getInvestorsByProjectApi, \s*recordPaybackApi/g,
  'getSpecialProjectByIdApi, getSpecialInvestorsApi, recordSpecialPaybackApi, getSpecialPayoutScheduleApi'
);

// Replace component name
content = content.replace(/SettlementManagement/g, 'SpecialSettlementManagement');

// Replace API calls
content = content.replace(/getProjectByIdApi/g, 'getSpecialProjectByIdApi');
content = content.replace(/getInvestorsByProjectApi/g, 'getSpecialInvestorsApi');
content = content.replace(/recordPaybackApi/g, 'recordSpecialPaybackApi');

// Remove original calculateReturns completely and replace with Special logic
content = content.replace(/const calculateReturns = \([\s\S]*?};\n/g, '');

// The Payback modal logic needs to change from a simple proof upload to entering the capital to return
content = content.replace(/const handlePaybackSubmit = async \(e\) => {[\s\S]*?}\n\n/g, `
  const [capitalReturnAmount, setCapitalReturnAmount] = useState('');
  const [payoutSchedule, setPayoutSchedule] = useState([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

  const fetchSchedule = async (invId) => {
    try {
      const res = await getSpecialPayoutScheduleApi(invId);
      if(res.status === 200) setPayoutSchedule(res.data.payouts);
      setIsScheduleModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePaybackSubmit = async (e) => {
    e.preventDefault();
    if (!paybackProof) {
      showAlert('error', 'Required', 'Please upload a payment proof');
      return;
    }
    if (!capitalReturnAmount || parseFloat(capitalReturnAmount) <= 0) {
      showAlert('error', 'Required', 'Please enter a valid capital return amount');
      return;
    }
    
    setIsSubmittingPayback(true);
    try {
      const formData = new FormData();
      formData.append('capitalPaid', capitalReturnAmount);
      formData.append('paybackProof', paybackProof);
      
      const response = await recordSpecialPaybackApi(selectedInvestment.id, formData);
      if (response.status === 200) {
        showAlert('success', 'Success', 'Monthly payback recorded successfully');
        setIsPaybackModalOpen(false);
        setPaybackProof(null);
        setCapitalReturnAmount('');
        fetchInvestors();
      }
    } catch (error) {
      console.error("Error recording payback:", error);
      showAlert('error', 'Error', error.response?.data?.message || 'Failed to record payback');
    } finally {
      setIsSubmittingPayback(false);
    }
  };
`);

// The "Payback" button should be modified to also show remaining capital
content = content.replace(/className="px-4 py-2 rounded-lg bg-white\/\[0\.05\] hover:bg-white\/\[0\.1\] text-white text-sm font-medium transition-colors border border-white\/10 flex items-center gap-2"/g, `
className="px-4 py-2 rounded-lg bg-[#ccff00]/10 hover:bg-[#ccff00]/20 text-[#ccff00] text-sm font-medium transition-colors border border-[#ccff00]/20 flex items-center gap-2 mr-2"
`);

// Modify Payback button HTML to add View Schedule
content = content.replace(/<button\s*onClick={\(\) => {\s*setSelectedInvestment\(inv\);\s*setIsPaybackModalOpen\(true\);\s*}}[\s\S]*?Payback\s*<\/button>/g, `
<button onClick={() => fetchSchedule(inv.id)} className="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white text-sm font-medium transition-colors border border-white/10 flex items-center gap-2 mr-2">Schedule</button>
<button onClick={() => { setSelectedInvestment(inv); setIsPaybackModalOpen(true); }} className="px-4 py-2 rounded-lg bg-[#ccff00]/10 hover:bg-[#ccff00]/20 text-[#ccff00] text-sm font-medium transition-colors border border-[#ccff00]/20 flex items-center gap-2">Payback</button>
`);

// Inside the Payback Modal, replace the content to include capital input
content = content.replace(/<div className="bg-\[\#080808\] p-4 rounded-xl border border-white\/5 mb-6">[\s\S]*?<\/div>/g, `
<div className="bg-[#080808] p-4 rounded-xl border border-white/5 mb-6">
  <div className="flex justify-between items-center mb-4">
    <span className="text-gray-400 text-sm">Remaining Capital:</span>
    <span className="text-white font-bold text-lg">₹{parseFloat(selectedInvestment?.remainingCapital || 0).toLocaleString()}</span>
  </div>
  <div className="flex justify-between items-center mb-4">
    <span className="text-gray-400 text-sm">ROI (Monthly on Remaining):</span>
    <span className="text-[#ccff00] font-bold text-lg">{project?.roi}%</span>
  </div>
  
  <div className="space-y-4">
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Capital Return Amount (₹)</label>
      <input 
        type="number" 
        value={capitalReturnAmount}
        onChange={(e) => setCapitalReturnAmount(e.target.value)}
        placeholder="Enter amount to return this month"
        className="w-full bg-[#0c0c0c] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#ccff00] transition-all"
      />
    </div>
    
    <div className="pt-4 border-t border-white/5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400 text-sm">Calculated ROI Payout:</span>
        <span className="text-white">₹{((parseFloat(selectedInvestment?.remainingCapital || 0) * parseFloat(project?.roi || 0)) / 100).toLocaleString()}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[#ccff00] font-bold">Total Final Payout:</span>
        <span className="text-[#ccff00] font-bold text-xl">
          ₹{((parseFloat(capitalReturnAmount || 0)) + ((parseFloat(selectedInvestment?.remainingCapital || 0) * parseFloat(project?.roi || 0)) / 100)).toLocaleString()}
        </span>
      </div>
    </div>
  </div>
</div>
`);

// Add Schedule modal to the end before the closing tag of dashboard layout
content = content.replace(/<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*$/g, `
</div></div></div></div></div>

{isScheduleModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
    <div className="bg-[#121212] w-full max-w-2xl rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl">
      <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Payout Schedule</h2>
        <button onClick={() => setIsScheduleModalOpen(false)} className="text-gray-400 hover:text-white"><HiX size={24} /></button>
      </div>
      <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {payoutSchedule.length === 0 ? (
          <p className="text-gray-400 text-center">No payouts recorded yet.</p>
        ) : (
          <div className="space-y-4">
            {payoutSchedule.map((payout, i) => (
              <div key={payout.id} className="bg-[#080808] border border-white/5 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-white font-bold mb-1">Payout #{i + 1}</p>
                  <p className="text-xs text-gray-500">{new Date(payout.paidAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-400">Cap: ₹{payout.capitalPaid} + ROI: ₹{payout.roiPaid}</p>
                  <p className="text-[#ccff00] font-bold text-lg">Total: ₹{payout.totalPaid}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
)}
`);

fs.writeFileSync(path, content);
console.log('Transform complete.');
