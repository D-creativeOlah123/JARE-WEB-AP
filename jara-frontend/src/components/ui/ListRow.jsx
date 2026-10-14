import { ChevronRight } from 'lucide-react';
import { formatNaira } from '../../utils/format';
import styles from './ListRow.module.css';

/**
 * ListRow — the universal "row with leading mark + title/subtitle +
 * trailing amount + chevron" layout used by the ledger, beneficiaries,
 * notifications, support tickets, …
 *
 * @param {object}   props
 * @param {React.ReactNode} [props.leading]   e.g. an <Avatar/>, <BankMark/>, lucide icon
 * @param {string}   props.title
 * @param {string}   [props.subtitle]
 * @param {number}   [props.amountKobo]       signed; +ve → green, −ve → red
 * @param {string}   [props.trailing]         custom trailing text instead of the amount
 * @param {boolean}  [props.chevron=true]
 * @param {string}   [props.to]               when set, the whole row becomes a <Link>
 * @param {()=>void} [props.onClick]
 */
export default function ListRow({
  leading,
  title,
  subtitle,
  amountKobo,
  trailing,
  chevron = true,
  to,
  onClick,
  className = '',
}) {
  const amount = amountKobo !== undefined
    ? renderAmount(amountKobo)
    : trailing !== undefined
      ? <span className={styles.trailing}>{trailing}</span>
      : null;

  const inner = (
    <>
      {leading && <span className={styles.leading}>{leading}</span>}
      <span className={styles.text}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </span>
      {amount}
      {chevron && <ChevronRight size={16} className={styles.chev} aria-hidden="true" />}
    </>
  );

  const cls = `${styles.row} ${className}`.trim();
  const label = subtitle ? `${title}, ${subtitle}` : title;
  const amountAria = amountKobo !== undefined
    ? `, ${amountKobo >= 0 ? 'Credit' : 'Debit'} ${formatNaira(Math.abs(amountKobo) / 100, { decimals: 2 })}`
    : '';

  if (onClick) {
    return (
      <button type="button" className={cls} onClick={onClick} aria-label={label + amountAria}>
        {inner}
      </button>
    );
  }
  if (to) {
    return (
      <a href={to} className={cls} aria-label={label + amountAria}>
        {inner}
      </a>
    );
  }
  return (
    <div className={cls} aria-label={label + amountAria}>
      {inner}
    </div>
  );
}

function renderAmount(kobo) {
  const isDebit = kobo < 0;
  const txt = formatNaira(Math.abs(kobo) / 100, { decimals: 2 });
  return (
    <span className={`${styles.amount} ${isDebit ? styles.debit : styles.credit}`}>
      {isDebit ? '−' : '+'}{txt}
    </span>
  );
}
