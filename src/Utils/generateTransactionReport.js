import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../assets/MHI-LOGO-BLACK.png';

/**
 * Get the last financial year range (April 1 - March 31).
 * Indian financial year runs from April 1 to March 31.
 */
const getLastFinancialYear = () => {
    const now = new Date();
    let endYear, startYear;

    // If current month is Jan-Mar, last FY ended March of previous year
    if (now.getMonth() < 3) { // Jan=0, Feb=1, Mar=2
        endYear = now.getFullYear() - 1;
        startYear = endYear - 1;
    } else {
        // If current month is Apr-Dec, last FY ended March of current year
        endYear = now.getFullYear();
        startYear = endYear - 1;
    }

    return {
        start: new Date(startYear, 3, 1),   // April 1
        end: new Date(endYear, 2, 31, 23, 59, 59), // March 31
        label: `FY ${startYear}-${endYear.toString().slice(-2)}`
    };
};

/**
 * Generate a PDF report of transactions for the last financial year.
 * @param {Array} transactions - All transactions from the API
 * @param {string} filterType - 'ALL' | 'INVESTMENT' | 'PAYOUT' | 'REFUND'
 */
export const generateTransactionReport = (transactions, filterType = 'ALL') => {
    const fy = getLastFinancialYear();

    // Filter transactions by last financial year date range
    let filtered = transactions.filter(tx => {
        const txDate = new Date(tx.transactionDate);
        return txDate >= fy.start && txDate <= fy.end;
    });

    // Filter by payment type
    if (filterType !== 'ALL') {
        filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.transactionDate) - new Date(a.transactionDate));

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const reportId = `MHI-RPT-${Math.floor(1000 + Math.random() * 9000)}`;

    // ═══════════════════════════════════════════
    // 1. HEADER SECTION (Same as user-side)
    // ═══════════════════════════════════════════
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

    // Right Column: Report Metadata
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);

    doc.text(`Report ID: ${reportId}`, pageWidth - 20, 25, { align: 'right' });
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - 20, 30, { align: 'right' });
    doc.text('Status: Official Record', pageWidth - 20, 35, { align: 'right' });

    // Divider Line
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.line(20, 48, pageWidth - 20, 48);

    // Signature Accent (brand green)
    doc.setDrawColor(204, 255, 0);
    doc.setLineWidth(2);
    doc.line(20, 48, 50, 48);

    // ═══════════════════════════════════════════
    // 2. REPORT TITLE
    // ═══════════════════════════════════════════
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const titleMap = {
        'ALL': 'ALL TRANSACTIONS REPORT',
        'INVESTMENT': 'INVESTMENT TRANSACTIONS REPORT',
        'PAYOUT': 'PAYOUT TRANSACTIONS REPORT',
        'REFUND': 'REFUND TRANSACTIONS REPORT'
    };
    doc.text(titleMap[filterType] || 'TRANSACTIONS REPORT', pageWidth / 2, 60, { align: 'center' });

    // Financial Year Label
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Financial Year: ${fy.label}`, pageWidth / 2, 67, { align: 'center' });
    doc.text(
        `Period: ${fy.start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to ${fy.end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
        pageWidth / 2, 73, { align: 'center' }
    );

    // ═══════════════════════════════════════════
    // 3. SUMMARY STATISTICS
    // ═══════════════════════════════════════════
    let currentY = 85;

    const totalAmount = filtered.reduce((acc, tx) => acc + Number(tx.amount), 0);
    const investmentTotal = filtered.filter(tx => tx.type === 'INVESTMENT').reduce((acc, tx) => acc + Number(tx.amount), 0);
    const payoutTotal = filtered.filter(tx => tx.type === 'PAYOUT').reduce((acc, tx) => acc + Number(tx.amount), 0);
    const refundTotal = filtered.filter(tx => tx.type === 'REFUND').reduce((acc, tx) => acc + Number(tx.amount), 0);

    // Summary box
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(20, currentY, pageWidth - 40, 28, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150, 150, 150);

    const colX = [30, 75, 120, 160];

    doc.text('TOTAL RECORDS', colX[0], currentY + 8);
    doc.text('INVESTMENTS', colX[1], currentY + 8);
    doc.text('PAYOUTS', colX[2], currentY + 8);
    doc.text('REFUNDS', colX[3], currentY + 8);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`${filtered.length}`, colX[0], currentY + 18);

    if (filterType === 'ALL') {
        doc.text(`INR ${investmentTotal.toLocaleString('en-IN')}`, colX[1], currentY + 18);
        doc.text(`INR ${payoutTotal.toLocaleString('en-IN')}`, colX[2], currentY + 18);
        doc.text(`INR ${refundTotal.toLocaleString('en-IN')}`, colX[3], currentY + 18);
    } else {
        doc.text(`INR ${totalAmount.toLocaleString('en-IN')}`, colX[1], currentY + 18);
        doc.text('-', colX[2], currentY + 18);
        doc.text('-', colX[3], currentY + 18);
    }

    currentY += 38;

    // ═══════════════════════════════════════════
    // 4. TRANSACTION TABLE
    // ═══════════════════════════════════════════
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('TRANSACTION LEDGER', 20, currentY);
    currentY += 5;

    if (filtered.length === 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('No transactions found for the selected financial year and payment type.', 20, currentY + 10);
    } else {
        const tableData = filtered.map((tx, index) => [
            index + 1,
            tx.user?.fullName || 'N/A',
            tx.project?.projectName || 'N/A',
            tx.type,
            new Date(tx.transactionDate).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric'
            }),
            `INR ${Number(tx.amount).toLocaleString('en-IN')}`,
            tx.status === 'SUCCESS' ? 'Completed' : tx.status
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['#', 'Investor', 'Project', 'Type', 'Date', 'Amount', 'Status']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [245, 245, 245],
                textColor: [0, 0, 0],
                fontSize: 8,
                fontStyle: 'bold',
                lineColor: [220, 220, 220],
                lineWidth: 0.1
            },
            styles: {
                fontSize: 7.5,
                cellPadding: 4,
                font: 'helvetica',
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 12 },
                1: { cellWidth: 28 },
                2: { cellWidth: 30 },
                3: { halign: 'center', cellWidth: 28 },
                4: { cellWidth: 28 },
                5: { halign: 'right', fontStyle: 'bold', cellWidth: 25 },
                6: { halign: 'center', cellWidth: 20 }
            },
            margin: { left: 20, right: 20 },
            didParseCell: (data) => {
                // Color-code the Type column
                if (data.section === 'body' && data.column.index === 3) {
                    const val = data.cell.raw;
                    if (val === 'REFUND') {
                        data.cell.styles.textColor = [220, 50, 50];
                    } else if (val === 'PAYOUT') {
                        data.cell.styles.textColor = [0, 160, 100];
                    } else {
                        data.cell.styles.textColor = [50, 100, 220];
                    }
                    data.cell.styles.fontStyle = 'bold';
                }
            }
        });

        // Total Amount Row
        const finalY = doc.lastAutoTable.finalY + 5;
        doc.setFillColor(240, 240, 240);
        doc.roundedRect(pageWidth - 90, finalY, 70, 12, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`Total: INR ${totalAmount.toLocaleString('en-IN')}`, pageWidth - 25, finalY + 8, { align: 'right' });
    }

    // ═══════════════════════════════════════════
    // 5. FOOTER
    // ═══════════════════════════════════════════
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(7);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(180, 180, 180);
        doc.text(
            `This is a system-generated transaction report for ${fy.label}. Med Health Invest Pvt Ltd.`,
            20, pHeight - 15
        );
        doc.text(`Report ID: ${reportId} | Page ${i} of ${pageCount}`, 20, pHeight - 10);
    }

    // Save with descriptive filename
    const typeLabel = filterType === 'ALL' ? 'All' : filterType.charAt(0) + filterType.slice(1).toLowerCase();
    doc.save(`MHI_${typeLabel}_Transactions_${fy.label.replace(/\s+/g, '_')}.pdf`);
};
