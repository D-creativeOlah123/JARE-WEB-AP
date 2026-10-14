import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Target, Users, ArrowUpRight, Receipt } from 'lucide-react';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notifications';
import styles from './Notifications.module.css';

const ICONS = {
  transfer:     ArrowUpRight,
  contribution: Target,
  goal:         Target,
  group:        Users,
  service:      Receipt,
  system:       Bell,
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listNotifications()
      .then(setItems)
      .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  async function handleReadOne(id) {
    setItems((list) => list.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    try { await markNotificationRead(id); } catch { /* keep optimistic */ }
  }

  async function handleReadAll() {
    setItems((list) => list.map((n) => ({ ...n, isRead: true })));
    try { await markAllNotificationsRead(); } catch { /* keep optimistic */ }
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button type="button" className={styles.readAll} onClick={handleReadAll}>
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </header>

      {loading ? (
        <p className={styles.status}>Loading…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : items.length === 0 ? (
        <section className={styles.empty}>
          <h3 className={styles.emptyTitle}>Nothing here yet</h3>
          <p className={styles.emptySub}>Transfers, contributions, and group activity will show up here as they happen.</p>
        </section>
      ) : (
        <ul className={styles.list}>
          {items.map((n) => {
            const Icon = ICONS[n.type] || Bell;
            const body = (
              <>
                <div className={styles.rowIcon}><Icon size={16} /></div>
                <div className={styles.rowText}>
                  <span className={styles.rowTitle}>{n.title}</span>
                  <span className={styles.rowBody}>{n.body}</span>
                  <span className={styles.rowTime}>{new Date(n.createdAt).toLocaleString()}</span>
                </div>
                {!n.isRead && <span className={styles.dot} />}
              </>
            );
            return (
              <li
                key={n._id}
                className={`${styles.row} ${!n.isRead ? styles.rowUnread : ''}`}
                onClick={() => handleReadOne(n._id)}
              >
                {n.meta?.link ? (
                  <Link to={n.meta.link} className={styles.rowLink}>{body}</Link>
                ) : (
                  <div className={styles.rowLink}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
