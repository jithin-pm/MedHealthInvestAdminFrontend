import jsPDF from 'jspdf';
import logo from '../assets/MHI-LOGO-BLACK.png';

const getBase64ImageFromUrl = async (url) => {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error("Error converting image to Base64:", e);
        return null;
    }
};

export const generateInvestmentReceipt = async (data, userData, action = 'download') => {
    const { amount, paymentId, projectTitle, duration, isPayout, isRefund, paybackProof } = data;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    const reportId = `MHI-${paymentId?.slice(-6).toUpperCase() || 'TX-9921'}`;

    // ... (rest of the code remains same until the end)
    // 1. Header Section
    try {
        doc.addImage(logo, 'PNG', 20, 12, 16, 16);
    } catch (e) {
        console.error("Logo failed to load", e);
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('MED HEALTH INVEST', 20, 35);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('HEALTHCARE INVESTMENT PLATFORM', 20, 40);

    // Right Column: Receipt Metadata
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    doc.text(`Receipt ID: ${reportId}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - 20, 30, { align: 'right' });
    doc.text('Status: Official Record', pageWidth - 20, 35, { align: 'right' });

    // Divider Line
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(20, 48, pageWidth - 20, 48);
    
    // Signature Accent
    doc.setDrawColor(204, 255, 0);
    doc.setLineWidth(2);
    doc.line(20, 48, 50, 48);

    // Main Content Title (Centered)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    let mainHeading = 'INVESTMENT RECEIPT';
    if (isRefund) mainHeading = 'REFUND RECEIPT';
    else if (isPayout) mainHeading = 'PAYOUT RECEIPT';
    
    doc.text(mainHeading, pageWidth / 2, 62, { align: 'center' });

    // Helper to draw a Formal Table Row
    const drawRow = (x, y, width, label, value, isHighlighted = false) => {
        const col1Width = 60;
        const col2Width = width - col1Width;
        const h = 10;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.1);
        doc.rect(x, y, col1Width, h);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont('helvetica', 'bold');
        doc.text(label.toUpperCase(), x + 5, y + 6.5);
        doc.rect(x + col1Width, y, col2Width, h);
        doc.setFontSize(isHighlighted ? 11 : 9);
        doc.setTextColor(isHighlighted ? 0 : 150);
        doc.setFont('helvetica', 'bold');
        doc.text(value.toString(), x + col1Width + 5, y + 6.5);
        return h;
    };

    let currentY = 70;
    const tableWidth = pageWidth - 40;

    // Table 1: Transaction Overview
    const table1Data = [
        ['Receipt ID', reportId],
        ['Payment Date', new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })],
        ['Investor Name', userData.fullName || userData.name || 'N/A'],
        ['Contact Email', userData.email || 'N/A'],
        ['Payment Status', 'SUCCESSFUL']
    ];
    table1Data.forEach(row => {
        currentY += drawRow(20, currentY, tableWidth, row[0], row[1]);
    });

    currentY += 15;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    
    let sectionTitle = 'INVESTMENT DETAILS';
    if (isRefund) sectionTitle = 'REFUND PARTICULARS';
    else if (isPayout) sectionTitle = 'PAYOUT PARTICULARS';

    doc.text(sectionTitle, 20, currentY);
    currentY += 8;

    // Table 2: Details
    const table2Data = [
        ['Project Name', projectTitle || 'N/A'],
        ['ROI (Annual)', isRefund ? 'N/A (Capital Refund)' : '18% Annual ROI'],
        ['Duration', duration || 'N/A']
    ];

    if (!isPayout && !isRefund) {
        table2Data.push(['Payment Method', 'Razorpay Secure Gateway']);
        table2Data.push(['Transaction ID', paymentId || 'N/A']);
    }

    let amountLabel = 'Principal Amount';
    if (isRefund) amountLabel = 'Refund Amount';
    else if (isPayout) amountLabel = 'Payout Amount';

    table2Data.push([amountLabel, `INR ${Number(amount).toLocaleString('en-IN')}.00`, true]);
    table2Data.forEach(row => {
        currentY += drawRow(20, currentY, tableWidth, row[0], row[1], row[2] || false);
    });

    // 4. Payback Proof Image
    if (paybackProof) {
        doc.addPage();
        currentY = 20;
        
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text('VERIFIED PAYMENT PROOF', 20, currentY);
        currentY += 10;
        
        const base64Img = await getBase64ImageFromUrl(paybackProof);
        if (base64Img) {
            try {
                // Calculate dimensions to maintain aspect ratio while keeping it large
                // A4 page is ~210x297mm. tableWidth is pageWidth - 40.
                const format = base64Img.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
                // Using a larger height for dedicated page
                const imageHeight = 150; 
                doc.addImage(base64Img, format, 20, currentY, tableWidth, imageHeight);
            } catch (e) {
                console.error("doc.addImage failed", e);
            }
        }
    }

    // Footer
    const pHeight = doc.internal.pageSize.getHeight();
    const footerY = pHeight - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(180, 180, 180);
    doc.text(`This receipt is an official record of your healthcare capital ${isRefund ? 'refund' : isPayout ? 'settlement' : 'allocation'}, secured by Med Health Invest.`, 20, footerY);
    doc.text('Audit Reference: ' + paymentId, 20, footerY + 5);

    if (action === 'view') {
        window.open(doc.output('bloburl'), '_blank');
    } else {
        doc.save(`MHI_${isRefund ? 'Refund' : isPayout ? 'Payout' : 'Receipt'}_${reportId}.pdf`);
    }
};
