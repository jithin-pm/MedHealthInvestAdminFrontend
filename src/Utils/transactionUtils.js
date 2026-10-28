const formatDateDDMMYYYY = (dateVal) => {
  const d = dateVal ? new Date(dateVal) : new Date();
  if (isNaN(d.getTime())) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `${day}${month}${year}`;
  }
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}${month}${year}`;
};

/**
 * Formats a transaction into the exact institutional ID matching the user-side format.
 * - Special Investments: SPL-DDMMYYYY-XX (e.g. SPL-26102026-01)
 * - Special Payouts: SPL-PAY-DDMMYYYY-XX (e.g. SPL-PAY-26102026-01)
 * - Exclusive Investments: EXP-DDMMYYYY-XX (e.g. EXP-26102026-01)
 * - Exclusive Payouts: EXP-PAY-DDMMYYYY-XX (e.g. EXP-PAY-26102026-01)
 * - Refunds: REF-DDMMYYYY-XX (e.g. REF-26102026-11)
 * - Standard Payouts: STD-DDMMYYYY-XX (e.g. STD-26102026-11)
 * - Standard Investments: Razorpay ID (pay_xxxxxxxxxx) or INV-xxxxxx
 */
export const getDisplayTransactionId = (tx) => {
  if (!tx) return '---';

  const txDate = tx.transactionDate || tx.created_at || tx.createdAt || tx.date || new Date();
  const dateStr = formatDateDDMMYYYY(txDate);

  const isRefund = 
    tx.type === 'REFUND' || 
    tx.project?.status === 'EXPIRED' ||
    (typeof tx.description === 'string' && tx.description.toLowerCase().includes('refund')) ||
    (typeof tx.transactionId === 'string' && tx.transactionId.startsWith('REF-'));

  // 1. Refunds
  if (isRefund) {
    const invId = tx.investmentId || (typeof tx.id === 'string' && tx.id.startsWith('sp_inv_') ? tx.id.replace('sp_inv_', '') : tx.id);
    return `REF-${dateStr}-${String(invId).padStart(2, '0')}`;
  }

  const isSpecial = 
    tx.project?.projectType === 'Special' || 
    tx.project?.projectCategory === 'Special' || 
    (typeof tx.transactionId === 'string' && tx.transactionId.startsWith('SP_')) ||
    (typeof tx.id === 'string' && tx.id.startsWith('sp_inv_'));

  const isExclusive = 
    tx.project?.projectType === 'Exclusive' || 
    tx.project?.projectCategory === 'Exclusive';

  // 2. Special Projects
  if (isSpecial) {
    if (tx.type === 'PAYOUT' || (typeof tx.transactionId === 'string' && tx.transactionId.startsWith('SP_PAYOUT_'))) {
      const parts = tx.transactionId?.split('_');
      // Format: SP_PAYOUT_{payoutId}_{timestamp}
      const payoutId = (parts && parts.length >= 3 && !isNaN(parts[2])) ? parts[2] : (tx.investmentId || tx.id);
      return `SPL-PAY-${dateStr}-${String(payoutId).padStart(2, '0')}`;
    }
    const invId = tx.investmentId || (typeof tx.id === 'string' && tx.id.startsWith('sp_inv_') ? tx.id.replace('sp_inv_', '') : tx.id);
    return `SPL-${dateStr}-${String(invId).padStart(2, '0')}`;
  }

  // 3. Exclusive Projects
  if (isExclusive) {
    const invId = tx.investmentId || tx.id;
    if (tx.type === 'PAYOUT') {
      return `EXP-PAY-${dateStr}-${String(invId).padStart(2, '0')}`;
    }
    return `EXP-${dateStr}-${String(invId).padStart(2, '0')}`;
  }

  // 4. Standard Projects
  if (tx.type === 'PAYOUT') {
    const invId = tx.investmentId || tx.id;
    return `STD-${dateStr}-${String(invId).padStart(2, '0')}`;
  }

  // Standard Investments: Razorpay ID if present
  if (tx.transactionId && tx.transactionId.startsWith('pay_')) {
    return tx.transactionId;
  }

  const invId = tx.investmentId || tx.id;
  return `INV-${String(invId).padStart(6, '0')}`;
};
