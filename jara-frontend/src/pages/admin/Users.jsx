import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronRight, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { listAdminUsers } from '../../services/admin';
import styles from './Users.module.css';

const ROLE_FILTERS = [
  { id: '',         label: 'All' },
  { id: 'customer', label: 'Customers' },
  { id: 'admin',    label: 'Admins' },
];

export default function AdminUsers() {
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [users, setUsers] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // Debounce search input so we don't spam the endpoint on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setError('');
      listAdminUsers({ q: q.trim() || undefined, role: role || undefined, limit: 25 })
        .then((res) => { setUsers(res.users); setCursor(res.nextCursor); })
        .catch((err) => setError(err.response?.data?.error?.message || 'Failed to load users'))
        .finally(() => setLoading(false));
    }, 220);
    return () => clearTimeout(t);
  }, [q, role]);

  async function handleLoadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await listAdminUsers({
        q: q.trim() || undefined,
        role: role || undefined,
        limit: 25,
        cursor,
      });
      setUsers((list) => [...list, ...res.users]);
      setCursor(res.nextCursor);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <h1 className={styles.title}>Users</h1>
          <p className={styles.subtitle}>Search, filter, and manage every Jara account.</p>
        </div>
      </header>

      <div className={styles.controls}>
        <div className={styles.search}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, or phone…"
            aria-label="Search users"
          />
        </div>
        <div className={styles.filters}>
          {ROLE_FILTERS.map((f) => (
            <button
              key={f.id || 'all'}
              type="button"
              className={`${styles.filter} ${role === f.id ? styles.filterActive : ''}`}
              onClick={() => setRole(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className={styles.status}>Loading users…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : users.length === 0 ? (
        <p className={styles.status}>No users match those filters.</p>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Joined</th>
                  <th className={styles.right}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <UserRow key={u._id} u={u} />
                ))}
              </tbody>
            </table>
          </div>
          <footer className={styles.footer}>
            <span className={styles.footerText}>
              Showing {users.length} user{users.length !== 1 ? 's' : ''}
              {cursor ? ' · more available' : ''}
            </span>
            {cursor && (
              <button
                type="button"
                className={styles.loadMore}
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}
          </footer>
        </div>
      )}
    </div>
  );
}

function UserRow({ u }) {
  const initial = (u.fullName || '?').charAt(0).toUpperCase();
  const joined = new Date(u.createdAt).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  return (
    <tr>
      <td>
        <div className={styles.userCell}>
          <div className={styles.avatar}>{initial}</div>
          <div className={styles.userText}>
            <span className={styles.userName}>{u.fullName}</span>
            <span className={styles.userEmail}>{u.email}</span>
          </div>
        </div>
      </td>
      <td>
        <span className={`${styles.rolePill} ${u.role === 'admin' ? styles.roleAdmin : styles.roleCustomer}`}>
          {u.role === 'admin' && <ShieldCheck size={12} />}
          {u.role}
        </span>
      </td>
      <td>
        <div className={styles.verifyCell}>
          <VerifyBadge label="Email" ok={u.emailVerified} />
          <VerifyBadge label="Phone" ok={u.phoneVerified} />
        </div>
      </td>
      <td className={styles.joined}>{joined}</td>
      <td className={styles.right}>
        <Link to={`/admin/users/${u._id}`} className={styles.viewBtn}>
          View <ChevronRight size={14} />
        </Link>
      </td>
    </tr>
  );
}

function VerifyBadge({ label, ok }) {
  return (
    <span className={`${styles.verify} ${ok ? styles.verifyOk : styles.verifyOff}`}>
      {ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {label}
    </span>
  );
}
