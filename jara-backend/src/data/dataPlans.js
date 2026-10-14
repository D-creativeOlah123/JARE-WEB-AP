/**
 * Curated data-plan catalogue.
 * `priceKobo` is what we charge the user; real VTPass integration would
 * cross-check this against their live catalogue on each purchase.
 */
export const DATA_PLANS = [
  // --- MTN ---
  { id: 'mtn-daily-100mb-1d',  network: 'mtn',     bucket: 'daily',   name: '100 MB',  validity: '1 day',   priceKobo:   10000 },
  { id: 'mtn-daily-350mb-1d',  network: 'mtn',     bucket: 'daily',   name: '350 MB',  validity: '1 day',   priceKobo:   35000 },
  { id: 'mtn-weekly-500mb-7d', network: 'mtn',     bucket: 'weekly',  name: '500 MB',  validity: '7 days',  priceKobo:   50000 },
  { id: 'mtn-weekly-1gb-7d',   network: 'mtn',     bucket: 'weekly',  name: '1 GB',    validity: '7 days',  priceKobo:   80000 },
  { id: 'mtn-monthly-1gb-30d', network: 'mtn',     bucket: 'monthly', name: '1 GB',    validity: '30 days', priceKobo:  100000 },
  { id: 'mtn-monthly-2gb-30d', network: 'mtn',     bucket: 'monthly', name: '2 GB',    validity: '30 days', priceKobo:  150000 },
  { id: 'mtn-monthly-5gb-30d', network: 'mtn',     bucket: 'monthly', name: '5 GB',    validity: '30 days', priceKobo:  300000 },

  // --- Airtel ---
  { id: 'airtel-daily-100mb-1d',   network: 'airtel',  bucket: 'daily',   name: '100 MB',  validity: '1 day',   priceKobo:  10000 },
  { id: 'airtel-weekly-750mb-7d',  network: 'airtel',  bucket: 'weekly',  name: '750 MB',  validity: '7 days',  priceKobo:  50000 },
  { id: 'airtel-monthly-1.5gb-30d',network: 'airtel',  bucket: 'monthly', name: '1.5 GB',  validity: '30 days', priceKobo: 100000 },
  { id: 'airtel-monthly-4gb-30d',  network: 'airtel',  bucket: 'monthly', name: '4 GB',    validity: '30 days', priceKobo: 250000 },

  // --- Glo ---
  { id: 'glo-daily-125mb-1d',    network: 'glo',      bucket: 'daily',   name: '125 MB',  validity: '1 day',   priceKobo:  10000 },
  { id: 'glo-weekly-800mb-7d',   network: 'glo',      bucket: 'weekly',  name: '800 MB',  validity: '7 days',  priceKobo:  50000 },
  { id: 'glo-monthly-2.5gb-30d', network: 'glo',      bucket: 'monthly', name: '2.5 GB',  validity: '30 days', priceKobo: 150000 },
  { id: 'glo-monthly-7.7gb-30d', network: 'glo',      bucket: 'monthly', name: '7.7 GB',  validity: '30 days', priceKobo: 250000 },

  // --- 9mobile ---
  { id: '9mob-daily-40mb-1d',    network: '9mobile',  bucket: 'daily',   name: '40 MB',   validity: '1 day',   priceKobo:  10000 },
  { id: '9mob-weekly-650mb-7d',  network: '9mobile',  bucket: 'weekly',  name: '650 MB',  validity: '7 days',  priceKobo:  50000 },
  { id: '9mob-monthly-1.5gb-30d',network: '9mobile',  bucket: 'monthly', name: '1.5 GB',  validity: '30 days', priceKobo: 100000 },
];

export function findDataPlan(id) {
  return DATA_PLANS.find((p) => p.id === id);
}

export function listPlansByNetwork(network) {
  return DATA_PLANS.filter((p) => p.network === network);
}
