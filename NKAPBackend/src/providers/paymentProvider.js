export async function createPaymentInstruction({ method, reference, amount, currency }) {
  const provider = method === 'interac' ? 'interac-ca' : 'bank-ca';
  const instructions = method === 'interac'
    ? `Envoyez ${amount} ${currency} par Interac au courriel de règlement, message : ${reference}`
    : `Effectuez un virement de ${amount} ${currency} avec la référence ${reference}`;
  return { provider, status: 'expected', instructions };
}

export async function verifyPayment({ amount, declaredAmount }) {
  if (Number(amount) !== Number(declaredAmount)) {
    return { status: 'mismatch', provider: 'manual' };
  }
  return { status: 'verified', provider: 'manual' };
}
