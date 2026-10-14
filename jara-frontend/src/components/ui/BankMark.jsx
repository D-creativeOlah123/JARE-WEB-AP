import styles from './BankMark.module.css';

/**
 * BankMark — hash-derived colour chip with the bank's initials.
 * Text-only, no logos. Used in bank picker rows, beneficiary lists, etc.
 *
 * @param {object} props
 * @param {string} props.bankName
 * @param {'sm'|'md'|'lg'} [props.size='md']
 */
export default function BankMark({ bankName, size = 'md', className = '' }) {
  const initials = initialsFromBank(bankName);
  const style = hashColour(bankName);
  const cls = `${styles.mark} ${styles[`s_${size}`]} ${className}`.trim();
  return (
    <span className={cls} style={style} role="img" aria-label={bankName}>
      {initials}
    </span>
  );
}

function initialsFromBank(name) {
  if (!name) return '•';
  const skip = new Set(['bank', 'of', 'the', 'plc', 'ltd', 'limited', 'nigeria', 'microfinance']);
  const parts = String(name).trim().split(/\s+/).filter((p) => !skip.has(p.toLowerCase()));
  const letters = (parts.length ? parts : [name]).map((p) => p[0]).join('');
  return letters.slice(0, 2).toUpperCase();
}

function hashColour(name) {
  let h = 0;
  for (let i = 0; i < (name || '?').length; i++) {
    h = (h * 31 + (name || '?').charCodeAt(i)) | 0;
  }
  const hue = Math.abs(h) % 360;
  return {
    background: `linear-gradient(135deg, hsl(${hue} 55% 42%), hsl(${(hue + 20) % 360} 55% 28%))`,
    color: 'white',
  };
}
