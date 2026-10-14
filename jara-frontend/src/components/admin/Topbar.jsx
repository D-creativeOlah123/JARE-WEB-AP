import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, User, ArrowLeftRight, Receipt, Target, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { adminSearch } from '../../services/admin';
import styles from './Topbar.module.css';

function formatNaira(k) {
  return `₦${(k / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export default function Topbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initial = user?.fullName?.trim().charAt(0)?.toUpperCase() || 'A';

  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);

  // Debounced search — fire 250ms after typing stops, only if ≥2 chars.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q.trim().length < 2) { setResults(null); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await adminSearch(q.trim());
        setResults(data);
        setOpen(true);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  // Close on outside click.
  useEffect(() => {
    function onDown(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function go(to) {
    setOpen(false);
    setQ('');
    navigate(to);
  }

  const anyResults = results && (
    results.users.length ||
    results.transfers.length ||
    results.services.length ||
    results.goals.length ||
    results.groups.length
  );

  return (
    <header className={styles.topbar}>
      <div className={styles.search} ref={boxRef}>
        <Search size={16} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search users, transfers, goals..."
          aria-label="Search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { if (results) setOpen(true); }}
        />

        {open && (
          <div className={styles.dropdown}>
            {loading && <div className={styles.status}>Searching…</div>}
            {!loading && !anyResults && (
              <div className={styles.status}>No matches for "{q}"</div>
            )}

            {results?.users?.length > 0 && (
              <SearchGroup label="Users" icon={User}>
                {results.users.map((u) => (
                  <button key={u._id} className={styles.hit}
                    onClick={() => go(`/admin/users/${u._id}`)}>
                    <span className={styles.hitTitle}>{u.fullName}</span>
                    <span className={styles.hitMeta}>
                      {u.email} · {u.role}{u.suspended ? ' · suspended' : ''}
                    </span>
                  </button>
                ))}
              </SearchGroup>
            )}

            {results?.transfers?.length > 0 && (
              <SearchGroup label="Transfers" icon={ArrowLeftRight}>
                {results.transfers.map((t) => (
                  <button key={t._id} className={styles.hit}
                    onClick={() => go('/admin/transactions')}>
                    <span className={styles.hitTitle}>
                      {t.reference} — {formatNaira(t.amount)}
                    </span>
                    <span className={styles.hitMeta}>
                      {t.type} · {t.status}
                      {t.toBank?.accountName ? ` · ${t.toBank.accountName}` : ''}
                    </span>
                  </button>
                ))}
              </SearchGroup>
            )}

            {results?.services?.length > 0 && (
              <SearchGroup label="Bill Payments" icon={Receipt}>
                {results.services.map((s) => (
                  <button key={s._id} className={styles.hit}
                    onClick={() => go('/admin/transactions?tab=bills')}>
                    <span className={styles.hitTitle}>
                      {s.reference} — {formatNaira(s.amount)}
                    </span>
                    <span className={styles.hitMeta}>
                      {s.type} · {s.provider} · {s.status}
                    </span>
                  </button>
                ))}
              </SearchGroup>
            )}

            {results?.goals?.length > 0 && (
              <SearchGroup label="Goals" icon={Target}>
                {results.goals.map((g) => (
                  <button key={g._id} className={styles.hit}
                    onClick={() => go('/admin/goals')}>
                    <span className={styles.hitTitle}>{g.name}</span>
                    <span className={styles.hitMeta}>
                      {formatNaira(g.savedAmount)} / {formatNaira(g.targetAmount)} · {g.status}
                    </span>
                  </button>
                ))}
              </SearchGroup>
            )}

            {results?.groups?.length > 0 && (
              <SearchGroup label="Groups" icon={Users}>
                {results.groups.map((g) => (
                  <button key={g._id} className={styles.hit}
                    onClick={() => go('/admin/groups')}>
                    <span className={styles.hitTitle}>{g.name}</span>
                    <span className={styles.hitMeta}>
                      code {g.inviteCode} · {g.memberCount ?? 0} members
                    </span>
                  </button>
                ))}
              </SearchGroup>
            )}
          </div>
        )}
      </div>

      <div className={styles.right}>
        <Link to="/admin/notifications" className={styles.bell} aria-label="Notifications">
          <Bell size={18} />
          <span className={styles.dot} />
        </Link>

        <div className={styles.userBlock}>
          {user?.avatar ? (
            <img src={user.avatar} alt="Profile" className={styles.avatarImg} />
          ) : (
            <div className={styles.avatar}>{initial}</div>
          )}
          <div className={styles.userText}>
            <span className={styles.userName}>{user?.fullName || 'Admin'}</span>
            <span className={styles.userEmail}>{user?.email}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

function SearchGroup({ label, icon: Icon, children }) {
  return (
    <div className={styles.group}>
      <div className={styles.groupHead}>
        <Icon size={12} />
        <span>{label}</span>
      </div>
      {children}
    </div>
  );
}
