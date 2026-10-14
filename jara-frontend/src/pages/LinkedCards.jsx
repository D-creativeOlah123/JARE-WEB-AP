import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Plus, Trash2, Star } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import {
  listCards,
  initiateAddCard,
  verifyAddCard,
  deleteCard,
  makeCardDefault,
} from '../services/cards';
import Skeleton from '../components/Skeleton';
import Spinner from '../components/Spinner';
import styles from './LinkedCards.module.css';

export default function LinkedCards() {
  const [cards, setCards]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [error, setError]   = useState('');
  const [busy, setBusy]     = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Load on mount.
  async function refresh() {
    setLoading(true);
    try {
      const list = await listCards();
      setCards(list);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load cards');
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, []);

  // Handle Paystack redirect: `?ref=CARD_...` after callback_url returned.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (!ref) return;
    (async () => {
      try {
        await verifyAddCard(ref);
        setNotice('Card added successfully.');
        await refresh();
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Could not verify card.');
      } finally {
        navigate('/profile/cards', { replace: true });
        setTimeout(() => setNotice(''), 3000);
      }
    })();
  }, [location.search, navigate]);

  async function handleAdd() {
    setError('');
    setBusy(true);
    try {
      const result = await initiateAddCard();
      if (result.mode === 'stub') {
        setNotice('Test card added (stub mode — no real charge).');
        await refresh();
        setTimeout(() => setNotice(''), 3000);
      } else if (result.authorizationUrl) {
        window.location.href = result.authorizationUrl;
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not start card add.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id, brand, last4) {
    if (!window.confirm(`Remove ${brand} ending in ${last4}?`)) return;
    try {
      await deleteCard(id);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not delete card.');
    }
  }

  async function handleMakeDefault(id) {
    try {
      await makeCardDefault(id);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not update default.');
    }
  }

  return (
    <div className={styles.page}>
      <MobileHeader title="Linked Cards" to="/profile" />

      {loading ? (
        <ul className={styles.list} aria-busy="true">
          {Array.from({ length: 2 }).map((_, i) => (
            <li key={i} className={styles.card}>
              <Skeleton width={40} height={40} radius="50%" />
              <div className={styles.cardText} style={{ gap: 6 }}>
                <Skeleton width="55%" height={12} />
                <Skeleton width="35%" height={10} />
              </div>
            </li>
          ))}
        </ul>
      ) : cards.length === 0 ? (
        <p className={styles.empty}>No cards linked yet.</p>
      ) : (
        <ul className={styles.list}>
          {cards.map((c, idx) => (
            <li
              key={c._id}
              className={`${styles.card} animate-fadeSlide`}
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className={styles.cardIcon}><CreditCard size={20} /></div>
              <div className={styles.cardText}>
                <span className={styles.cardName}>
                  {c.brand}
                  {c.isDefault && <span className={styles.defaultBadge}>Default</span>}
                </span>
                <span className={styles.cardMeta}>
                  •••• {c.last4} · {c.expMonth}/{String(c.expYear).slice(-2)}
                </span>
              </div>
              {!c.isDefault && (
                <button
                  type="button"
                  className={styles.starBtn}
                  onClick={() => handleMakeDefault(c._id)}
                  aria-label="Make default"
                  title="Make default"
                >
                  <Star size={16} />
                </button>
              )}
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={() => handleDelete(c._id, c.brand, c.last4)}
                aria-label={`Delete ${c.brand}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error  && <div className={styles.errorBox}>{error}</div>}
      {notice && <div className={styles.notice}>{notice}</div>}

      <button type="button" className={`${styles.addBtn} btn-lift`} onClick={handleAdd} disabled={busy}>
        {busy ? <Spinner size={16} /> : <Plus size={16} />}
        {busy ? 'Starting…' : 'Add New Card'}
      </button>
    </div>
  );
}
