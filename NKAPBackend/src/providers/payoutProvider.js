export async function sendPayout(transfer) {
  if (transfer.payout_reference) {
    return {
      accepted: true,
      duplicate: true,
      payoutReference: transfer.payout_reference,
      partner: transfer.partner_code,
    };
  }
  const mobile = /money/i.test(transfer.reception_mode || transfer.method || '');
  const partner = mobile ? 'mm-cm' : 'bank-cm';
  return {
    accepted: true,
    duplicate: false,
    payoutReference: `PAY-${transfer.reference}`,
    partner,
  };
}
