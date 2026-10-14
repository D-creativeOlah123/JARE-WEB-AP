export const NETWORKS = [
  { id: 'mtn',     name: 'MTN',     color: '#FFCC00' },
  { id: 'airtel',  name: 'Airtel',  color: '#ED1C24' },
  { id: 'glo',     name: 'Glo',     color: '#00A651' },
  { id: '9mobile', name: '9mobile', color: '#017A3C' },
];

export function findNetwork(id) {
  return NETWORKS.find((n) => n.id === String(id).toLowerCase());
}
