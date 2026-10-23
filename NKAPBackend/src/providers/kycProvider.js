export const kycProvider = {
  name: process.env.KYC_PROVIDER || 'manual',
  async submit() {
    return { provider: process.env.KYC_PROVIDER || 'manual', status: 'pending' };
  },
};
