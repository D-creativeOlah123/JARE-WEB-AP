import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import styles from './MobileHeader.module.css';

/**
 * Centered title with a back arrow on the left — the shared header
 * pattern from every mobile mockup. Pass `to` for a specific back
 * destination, otherwise it does a history back.
 */
export default function MobileHeader({ title, to, right }) {
  const navigate = useNavigate();
  const Back = to ? Link : 'button';
  const backProps = to ? { to } : { type: 'button', onClick: () => navigate(-1) };
  return (
    <header className={styles.header}>
      <Back {...backProps} className={styles.back} aria-label="Back">
        <ArrowLeft size={20} />
      </Back>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.right}>{right}</div>
    </header>
  );
}
