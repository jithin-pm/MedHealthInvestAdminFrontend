import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/MHI-LOGO-BLACK.png';

export const generateProjectStatement = (project, investors) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // 1. Header Section - Modern Corporate Layout
    const headerHeight = 45;
    
    // Left Column: Branding
    try {
        doc.addImage(logo, 'PNG', 20, 12, 16, 16);
    } catch (e) {
        console.error("Logo failed to load", e);
    }
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('MED HEALTH INVEST PVT LTD', 20, 35);
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('HEALTHCARE INVESTMENT PLATFORM', 20, 40);

    // Right Column: Report Metadata
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AUDIT STATEMENT', pageWidth - 20, 20, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    const reportDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const reportId = `MHI-${project.id || 'GEN'}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    doc.text(`Report ID: ${reportId}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`Date: ${reportDate}`, pageWidth - 20, 30, { align: 'right' });
    doc.text('Status: Official Record', pageWidth - 20, 35, { align: 'right' });

    // Divider Line
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(20, 48, pageWidth - 20, 48);
    
    // Signature Accent
    doc.setDrawColor(204, 255, 0);
    doc.setLineWidth(2);
    doc.line(20, 48, 50, 48);

    // 2. Project Overview Section
    doc.setFontSize(14);
    doc.text(project.projectName.toUpperCase(), 20, 62);

    // Metadata Grid
    const detailsX = [20, 85, 150];
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT CATEGORY', detailsX[0], 72);
    doc.text('TARGET AMOUNT', detailsX[1], 72);
    doc.text('COLLECTED AMOUNT', detailsX[2], 72);

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.text(project.projectCategory, detailsX[0], 79);
    doc.text(`INR ${Number(project.targetAmount).toLocaleString()}`, detailsX[1], 79);
    doc.text(`INR ${Number(project.collectedAmount).toLocaleString()}`, detailsX[2], 79);

    doc.setTextColor(150, 150, 150);
    doc.text('ESTIMATED ROI', detailsX[0], 92);
    doc.text('DURATION', detailsX[1], 92);
    doc.text('PROJECT STATUS', detailsX[2], 92);

    doc.setTextColor(0, 0, 0);
    doc.text(`${project.roi}%`, detailsX[0], 99);
    doc.text(`${project.duration} Months`, detailsX[1], 99);
    doc.text(project.status, detailsX[2], 99);

    // 3. Investor Registry Table
    doc.setFontSize(12);
    doc.text('INVESTOR ALLOCATION REGISTRY', 20, 115);
    
    const tableData = investors.map((inv, index) => [
        index + 1,
        inv.investor?.fullName || 'N/A',
        inv.investor?.email || 'N/A',
        `INR ${Number(inv.amount).toLocaleString()}`,
        new Date(inv.created_at).toLocaleDateString('en-GB')
    ]);

    autoTable(doc, {
        startY: 120,
        head: [['#', 'Investor Identity', 'Primary Contact', 'Capital Allocation', 'Transaction Date']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [245, 245, 245],
            textColor: [0, 0, 0],
            fontSize: 9,
            fontStyle: 'bold',
            lineColor: [220, 220, 220],
            lineWidth: 0.1
        },
        styles: {
            fontSize: 8.5,
            cellPadding: 5,
            font: 'helvetica'
        },
        columnStyles: {
            3: { halign: 'right', fontStyle: 'bold' },
            0: { halign: 'center' }
        },
        margin: { left: 20, right: 20 }
    });

    // 4. Footer Section
    const finalY = doc.lastAutoTable.finalY || 150;
    
    // Add a signature line if space allows
    if (finalY < 250) {
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(pageWidth - 80, finalY + 30, pageWidth - 20, finalY + 30);
        doc.setFontSize(8);
        doc.text('Authorized Signatory', pageWidth - 50, finalY + 35, { align: 'center' });
    }

    doc.setFontSize(7);
    doc.setTextColor(180, 180, 180);
    doc.setFont('helvetica', 'italic');
    doc.text([
        `Statement Generated on: ${new Date().toLocaleString('en-IN')}`,
        'CONFIDENTIAL: This document contains proprietary institutional data. Unauthorized distribution is prohibited.',
        'This is a digitally generated document and remains valid without a physical signature.'
    ], 20, doc.internal.pageSize.height - 20);

    // Save PDF
    doc.save(`Statement_${project.projectName.replace(/\s+/g, '_')}.pdf`);
};

