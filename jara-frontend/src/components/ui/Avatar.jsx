import styles from './Avatar.module.css';

/**
 * Avatar — photo if `src` provided, otherwise initials on a deterministic
 * plum-family gradient keyed by a hash of `name`.
 *
 * @param {object} props
 * @param {string} props.name
 * @param {string} [props.src]         user.avatar data URI or URL
 * @param {'sm'|'md'|'lg'|'xl'} [props.size='md']
 * @param {string} [props.className]
 */
export default function Avatar({ name, src, size = 'md', className = '', ...rest }) {
  const initials = toInitials(name);
  const style = { ...gradientForName(name) };
  const cls = `${styles.avatar} ${styles[`s_${size}`]} ${className}`.trim();

  if (src) {
    return (
      <img
        src={src}
        alt={name ? `${name}'s photo` : 'Profile photo'}
        className={cls}
        {...rest}
      />
    );
  }
  return (
    <span className={cls} style={style} role="img" aria-label={name || 'User'} {...rest}>
      {initials}
    </span>
  );
}

function toInitials(name) {
  if (!name) return '•';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '•';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* Deterministic plum-family gradient from the name. */
function gradientForName(name) {
  let h = 0;
  for (let i = 0; i < (name || '?').length; i++) {
    h = (h * 31 + (name || '?').charCodeAt(i)) | 0;
  }
  const hue = 290 + (Math.abs(h) % 30) - 15;             // 275–305
  const l1 = 50 + (Math.abs(h >> 3) % 10);               // 50–59
  const l2 = Math.max(20, l1 - 25);
  return {
    background: `linear-gradient(135deg, hsl(${hue} 45% ${l1}%), hsl(${hue + 10} 55% ${l2}%))`,
    color: 'white',
  };
}
