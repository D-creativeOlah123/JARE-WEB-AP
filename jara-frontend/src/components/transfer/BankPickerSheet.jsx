import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import Sheet from '../ui/Sheet';
import BankMark from '../ui/BankMark';
import Input from '../ui/Input';
import Skeleton from '../Skeleton';
import { listBanks } from '../../services/banks';
import styles from './BankPickerSheet.module.css';

/**
 * BankPickerSheet — searchable bottom sheet of Nigerian banks.
 *
 * Lists come from `/api/banks`; cached per-session via a module-level
 * promise so the sheet opens instantly after the first time.
 *
 * @param {object} props
 * @param {boolean}  props.open
 * @param {()=>void} props.onClose
 * @param {(bank:{code:string,name:string})=>void} props.onPick
 */
let banksPromise = null;
function loadBanks() {
  if (!banksPromise) banksPromise = listBanks().catch(() => []);
  return banksPromise;
}

export default function BankPickerSheet({ open, onClose, onPick }) {
  const [banks, setBanks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]   = useState('');

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    loadBanks().then((list) => {
      if (cancelled) return;
      setBanks(Array.isArray(list) ? list : []);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banks;
    return banks.filter((b) =>
      b.name.toLowerCase().includes(q) || b.code.includes(q),
    );
  }, [banks, query]);

  return (
    <Sheet open={open} onClose={onClose} title="Pick a bank">
      <div className={styles.wrap}>
        <Input
          label=""
          iconLeft={Search}
          placeholder="Search banks or codes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          fullWidth
        />
        <ul className={styles.list} role="listbox">
          {loading && Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className={styles.skeletonRow}>
              <Skeleton width={36} height={36} radius={10} />
              <Skeleton width="55%" height={14} />
            </li>
          ))}
          {!loading && filtered.map((b) => (
            <li key={b.code}>
              <button
                type="button"
                role="option"
                className={styles.bankRow}
                onClick={() => onPick(b)}
              >
                <BankMark bankName={b.name} />
                <div className={styles.bankText}>
                  <span className={styles.bankName}>{b.name}</span>
                  <span className={styles.bankCode}>{b.code}</span>
                </div>
              </button>
            </li>
          ))}
          {!loading && filtered.length === 0 && (
            <li className={styles.empty}>No banks match "{query}".</li>
          )}
        </ul>
      </div>
    </Sheet>
  );
}
