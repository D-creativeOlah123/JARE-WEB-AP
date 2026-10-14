import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { formatNaira } from '../utils/format';
import styles from './BalanceCard.module.css';

/**
 * Magenta balance card used across Home / Transfer / My Jara.
 * `account` shape: { accountNumber, balance (kobo), balanceNaira }
 */
export default function BalanceCard({ account, label = 'Current Balance' }) {
  const [hidden, setHidden] = useState(false);

  const naira = (account?.balance ?? 0) / 100;
  const display = hidden ? '₦*****.**' : formatNaira(naira, { decimals: 2 });

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.label}>{label}</span>
        <button
          type="button"
          className={styles.toggle}
          onClick={() => setHidden((h) => !h)}
          aria-label={hidden ? 'Show balance' : 'Hide balance'}
        >
          {hidden ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <div className={styles.amount}>{display}</div>
      <div className={styles.number}>
        Account Number: <strong>{account?.accountNumber || '——'}</strong>
      </div>
    </div>
  );
}
