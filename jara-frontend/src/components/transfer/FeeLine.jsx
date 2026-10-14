import { formatNaira } from '../../utils/format';
import styles from './FeeLine.module.css';

/**
 * FeeLine — three rows under the AmountInput:
 *   Amount · Fee · Balance after
 *
 * Pure math on kobo numbers. The caller supplies the current wallet
 * balance so the "balance after" preview is always correct.
 *
 * @param {object} props
 * @param {number} props.amountKobo
 * @param {number} props.feeKobo
 * @param {number} props.walletKobo
 */
export default function FeeLine({ amountKobo = 0, feeKobo = 0, walletKobo = 0 }) {
  const after = walletKobo - amountKobo - feeKobo;
  const over  = after < 0;
  return (
    <dl className={styles.wrap}>
      <Row label="Amount"        value={formatNaira(amountKobo / 100, { decimals: 2 })} />
      <Row label="Fee"           value={feeKobo === 0 ? 'Free' : formatNaira(feeKobo / 100, { decimals: 2 })} />
      <Row
        label="Balance after"
        value={formatNaira(Math.max(after, 0) / 100, { decimals: 2 })}
        tone={over ? 'danger' : 'muted'}
      />
    </dl>
  );
}

function Row({ label, value, tone }) {
  return (
    <div className={`${styles.row} ${tone ? styles[tone] : ''}`}>
      <dt className={styles.dt}>{label}</dt>
      <dd className={styles.dd}>{value}</dd>
    </div>
  );
}
