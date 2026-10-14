import { formatNaira } from '../../utils/format';
import Sheet from '../ui/Sheet';
import Button from '../ui/Button';
import styles from './ReviewSheet.module.css';

/**
 * ReviewSheet — "Confirm transaction" sheet shown just before the PIN
 * entry step. Takes a list of {label,value} rows and surfaces the signed
 * total in a prominent spot.
 *
 * @param {object}   props
 * @param {boolean}  props.open
 * @param {()=>void} props.onClose
 * @param {()=>void} props.onConfirm
 * @param {string}   props.title
 * @param {Array<{label:string,value:React.ReactNode}>} props.rows
 * @param {number}   props.totalKobo
 * @param {string}   [props.ctaLabel='Continue']
 */
export default function ReviewSheet({
  open, onClose, onConfirm,
  title = 'Confirm transfer',
  rows = [],
  totalKobo = 0,
  ctaLabel = 'Continue',
}) {
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm}>{ctaLabel}</Button>
        </>
      }
    >
      <div className={styles.totalBlock}>
        <span className={styles.totalLabel}>Total you'll send</span>
        <span className={styles.total}>{formatNaira(totalKobo / 100, { decimals: 2 })}</span>
      </div>
      <dl className={styles.rows}>
        {rows.map((r) => (
          <div key={r.label} className={styles.row}>
            <dt className={styles.dt}>{r.label}</dt>
            <dd className={styles.dd}>{r.value}</dd>
          </div>
        ))}
      </dl>
    </Sheet>
  );
}
