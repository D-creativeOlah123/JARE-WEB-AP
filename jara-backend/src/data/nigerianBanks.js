/**
 * Seed list of Nigerian banks with CBN codes.
 * These are the same codes Paystack + Flutterwave return, so we can swap
 * to a live Paystack /bank fetch later without changing consumers.
 */
export const NIGERIAN_BANKS = [
  { code: '044', name: 'Access Bank' },
  { code: '063', name: 'Access Bank (Diamond)' },
  { code: '050', name: 'Ecobank Nigeria' },
  { code: '070', name: 'Fidelity Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '214', name: 'First City Monument Bank' },
  { code: '058', name: 'Guaranty Trust Bank' },
  { code: '082', name: 'Keystone Bank' },
  { code: '076', name: 'Polaris Bank' },
  { code: '101', name: 'Providus Bank' },
  { code: '221', name: 'Stanbic IBTC Bank' },
  { code: '232', name: 'Sterling Bank' },
  { code: '033', name: 'United Bank For Africa' },
  { code: '032', name: 'Union Bank of Nigeria' },
  { code: '215', name: 'Unity Bank' },
  { code: '035', name: 'Wema Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '090267', name: 'Kuda Microfinance Bank' },
  { code: '100004', name: 'OPay' },
  { code: '100033', name: 'PalmPay' },
];

export function findBankByCode(code) {
  return NIGERIAN_BANKS.find((b) => b.code === String(code));
}
