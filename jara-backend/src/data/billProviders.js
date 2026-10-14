/**
 * Catalogue of bill providers and their VTPass serviceIDs. Values here are
 * the source of truth for backend validation AND the API response the
 * frontend renders in wizards. Prices are in kobo where noted.
 *
 * Package/variant lists are keyed by our internal `id` (which is also the
 * VTPass serviceID for that provider). Frontend fetches `/services/bills`
 * to build the pickers.
 */

// ---------------------------------------------------------------------------
// Electricity (prepaid + postpaid). VTPass serviceIDs are lowercase, hyphenated.
// User picks a meter type; amount is arbitrary (min ₦500 in most DISCOs).
// ---------------------------------------------------------------------------
export const DISCOS = [
  { id: 'ikeja-electric',     label: 'Ikeja Electric (IKEDC)',   short: 'IKEDC' },
  { id: 'eko-electric',       label: 'Eko Electric (EKEDC)',     short: 'EKEDC' },
  { id: 'abuja-electric',     label: 'Abuja Electric (AEDC)',    short: 'AEDC'  },
  { id: 'kano-electric',      label: 'Kano Electric (KEDCO)',    short: 'KEDCO' },
  { id: 'portharcourt-electric', label: 'PH Electric (PHED)',    short: 'PHED'  },
  { id: 'ibadan-electric',    label: 'Ibadan Electric (IBEDC)',  short: 'IBEDC' },
  { id: 'enugu-electric',     label: 'Enugu Electric (EEDC)',    short: 'EEDC'  },
  { id: 'jos-electric',       label: 'Jos Electric (JED)',       short: 'JED'   },
  { id: 'kaduna-electric',    label: 'Kaduna Electric',          short: 'KAEDCO'},
];

export const METER_TYPES = [
  { id: 'prepaid',  label: 'Prepaid'  },
  { id: 'postpaid', label: 'Postpaid' },
];

export function findDisco(id) {
  return DISCOS.find((d) => d.id === String(id || '').toLowerCase()) || null;
}

// ---------------------------------------------------------------------------
// Cable TV — DStv, GOtv, Startimes, Showmax. Each has fixed packages.
// Prices frozen locally so we don't need a live catalogue call every time.
// ---------------------------------------------------------------------------
export const CABLE_PROVIDERS = [
  { id: 'dstv',      label: 'DStv'      },
  { id: 'gotv',      label: 'GOtv'      },
  { id: 'startimes', label: 'Startimes' },
  { id: 'showmax',   label: 'Showmax'   },
];

export const CABLE_PACKAGES = [
  // DStv
  { id: 'dstv-padi',       providerId: 'dstv',      label: 'DStv Padi',         priceKobo: 380000  },
  { id: 'dstv-yanga',      providerId: 'dstv',      label: 'DStv Yanga',        priceKobo: 525000  },
  { id: 'dstv-confam',     providerId: 'dstv',      label: 'DStv Confam',       priceKobo: 950000  },
  { id: 'dstv79',          providerId: 'dstv',      label: 'DStv Compact',      priceKobo: 1500000 },
  { id: 'dstv7',           providerId: 'dstv',      label: 'DStv Compact Plus', priceKobo: 2500000 },
  { id: 'dstv3',           providerId: 'dstv',      label: 'DStv Premium',      priceKobo: 3720000 },
  // GOtv
  { id: 'gotv-smallie',    providerId: 'gotv',      label: 'GOtv Smallie',      priceKobo: 150000  },
  { id: 'gotv-jinja',      providerId: 'gotv',      label: 'GOtv Jinja',        priceKobo: 290000  },
  { id: 'gotv-jolli',      providerId: 'gotv',      label: 'GOtv Jolli',        priceKobo: 440000  },
  { id: 'gotv-max',        providerId: 'gotv',      label: 'GOtv Max',          priceKobo: 660000  },
  { id: 'gotv-supa',       providerId: 'gotv',      label: 'GOtv Supa',         priceKobo: 880000  },
  // Startimes (monthly)
  { id: 'nova',            providerId: 'startimes', label: 'Nova (1 month)',    priceKobo: 150000  },
  { id: 'basic',           providerId: 'startimes', label: 'Basic (1 month)',   priceKobo: 260000  },
  { id: 'smart',           providerId: 'startimes', label: 'Smart (1 month)',   priceKobo: 380000  },
  { id: 'classic',         providerId: 'startimes', label: 'Classic (1 month)', priceKobo: 460000  },
  { id: 'super',           providerId: 'startimes', label: 'Super (1 month)',   priceKobo: 690000  },
  // Showmax
  { id: 'full',            providerId: 'showmax',   label: 'Full',              priceKobo: 320000  },
  { id: 'mobile',          providerId: 'showmax',   label: 'Mobile',            priceKobo: 160000  },
  { id: 'pro',             providerId: 'showmax',   label: 'Pro',               priceKobo: 630000  },
  { id: 'pro_mobile',      providerId: 'showmax',   label: 'Pro Mobile',        priceKobo: 320000  },
];

export function findCableProvider(id) {
  return CABLE_PROVIDERS.find((p) => p.id === String(id || '').toLowerCase()) || null;
}

export function findCablePackage(id) {
  return CABLE_PACKAGES.find((p) => p.id === String(id || '').toLowerCase()) || null;
}

// ---------------------------------------------------------------------------
// Education — WAEC PIN, JAMB PIN, NECO. Fixed price per product.
// ---------------------------------------------------------------------------
export const EDU_PROVIDERS = [
  { id: 'waec',        label: 'WAEC'      },
  { id: 'waec-registration', label: 'WAEC Registration' },
  { id: 'jamb',        label: 'JAMB'      },
];

export const EDU_PRODUCTS = [
  { id: 'waec1',       providerId: 'waec',              label: 'WAEC Result Checker PIN', priceKobo:  350000 },
  { id: 'waecdirect',  providerId: 'waec',              label: 'WAEC (single)',           priceKobo:  350000 },
  { id: 'waecregis',   providerId: 'waec-registration', label: 'WAEC Registration PIN',   priceKobo: 2500000 },
  { id: 'utme',        providerId: 'jamb',              label: 'UTME (no mock)',          priceKobo:  450000 },
  { id: 'utme-mock',   providerId: 'jamb',              label: 'UTME (with mock)',        priceKobo:  500000 },
];

export function findEduProvider(id) {
  return EDU_PROVIDERS.find((p) => p.id === String(id || '').toLowerCase()) || null;
}

export function findEduProduct(id) {
  return EDU_PRODUCTS.find((p) => p.id === String(id || '').toLowerCase()) || null;
}
