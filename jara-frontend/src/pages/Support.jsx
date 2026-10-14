import { useEffect, useState } from 'react';
import { HelpCircle, MessageSquare, ChevronDown, Mail, Phone } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import Spinner from '../components/Spinner';
import Skeleton from '../components/Skeleton';
import { submitTicket, listMyTickets } from '../services/support';
import { useAuth } from '../hooks/useAuth';
import styles from './Support.module.css';

const CATEGORIES = [
  { id: 'account',  label: 'Account & profile' },
  { id: 'transfer', label: 'Transfers & wallet' },
  { id: 'payment',  label: 'Bills & payments' },
  { id: 'card',     label: 'Cards' },
  { id: 'other',    label: 'Something else' },
];

const FAQS = [
  {
    q: 'How do I reset my transfer PIN?',
    a: 'Go to Profile → Security & PIN → Change Pin. If you have forgotten your PIN entirely, contact support via the form below and we\'ll reset it after verifying your identity.',
  },
  {
    q: 'A bank transfer failed — what happens to my money?',
    a: 'Failed bank transfers are refunded to your Jara wallet automatically, usually within seconds. If your balance was debited and the refund hasn\'t landed in 10 minutes, open a support ticket with the transfer reference.',
  },
  {
    q: 'How long do transfers to other banks take?',
    a: 'Most bank transfers settle within a few minutes; a small number stay in "processing" for up to 24 hours depending on the receiving bank.',
  },
  {
    q: 'Is my BVN safe?',
    a: 'Your BVN is stored encrypted and is used only to verify your identity for regulatory purposes — we never share it with third parties.',
  },
  {
    q: 'How do I close my account?',
    a: 'Withdraw any remaining balance, then open a support ticket from this page with the subject "Close my account" — we\'ll walk you through the final steps.',
  },
];

const STATUS_LABEL = {
  open:         'Open',
  in_progress:  'In progress',
  resolved:     'Resolved',
};

export default function Support() {
  const { user } = useAuth();
  const [subject, setSubject]   = useState('');
  const [category, setCategory] = useState('other');
  const [message, setMessage]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [notice, setNotice]     = useState('');

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openFaq, setOpenFaq] = useState(0);

  async function refresh() {
    setLoading(true);
    try {
      const list = await listMyTickets();
      setTickets(list);
    } catch {
      // silent — form still usable
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { refresh(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setNotice('');
    setSubmitting(true);
    try {
      await submitTicket({ subject, category, message });
      setNotice('Ticket submitted — we\'ll get back to you shortly.');
      setSubject(''); setMessage(''); setCategory('other');
      await refresh();
    } catch (err) {
      const p = err.response?.data?.error;
      setError(p?.details?.map((d) => d.message).join(' · ') || p?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <MobileHeader title="Support / Help Center" to="/profile" />

      <section className={`${styles.hero} animate-fadeSlide`}>
        <HelpCircle size={22} />
        <div>
          <h2 className={styles.heroTitle}>How can we help?</h2>
          <p className={styles.heroSub}>
            Browse common questions or send us a message — average reply under 24h.
          </p>
        </div>
      </section>

      <section className={styles.contactRow}>
        <a href="mailto:support@jara.dev" className={`${styles.contactCard} btn-lift`}>
          <Mail size={16} />
          <div>
            <span className={styles.contactLabel}>Email</span>
            <span className={styles.contactValue}>support@jara.dev</span>
          </div>
        </a>
        <a href="tel:+2348000000000" className={`${styles.contactCard} btn-lift`}>
          <Phone size={16} />
          <div>
            <span className={styles.contactLabel}>Call</span>
            <span className={styles.contactValue}>+234 800 000 0000</span>
          </div>
        </a>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Frequently asked</h3>
        <ul className={styles.faqList}>
          {FAQS.map((f, i) => {
            const open = openFaq === i;
            return (
              <li key={f.q} className={styles.faq}>
                <button
                  type="button"
                  className={styles.faqQ}
                  onClick={() => setOpenFaq(open ? -1 : i)}
                  aria-expanded={open}
                >
                  <span>{f.q}</span>
                  <ChevronDown size={14} className={`${styles.chev} ${open ? styles.chevOpen : ''}`} />
                </button>
                {open && <p className={`${styles.faqA} animate-fadeSlide`}>{f.a}</p>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Send us a message</h3>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.field}>
            <label>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Briefly, what's this about?"
              maxLength={120}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Include any relevant references, dates, and amounts."
              rows={5}
              minLength={10}
              maxLength={2000}
              required
            />
            <span className={styles.counter}>{message.length} / 2000</span>
          </div>

          {error  && <div className={styles.errorBox}>{error}</div>}
          {notice && <div className={styles.noticeBox}>{notice}</div>}

          <button
            type="submit"
            className={`${styles.submit} btn-lift`}
            disabled={submitting || subject.length < 3 || message.length < 10}
          >
            {submitting ? <><Spinner size={14} /> Submitting…</> : (<><MessageSquare size={14} /> Submit ticket</>)}
          </button>

          <p className={styles.contactHint}>
            Signed in as <strong>{user?.email}</strong>. We'll reply to this email unless you specify another.
          </p>
        </form>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Your tickets</h3>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton height={44} radius={12} />
            <Skeleton height={44} radius={12} />
          </div>
        ) : tickets.length === 0 ? (
          <p className={styles.empty}>No tickets yet — form above sends your first.</p>
        ) : (
          <ul className={styles.ticketList}>
            {tickets.map((t, idx) => (
              <li
                key={t._id}
                className={`${styles.ticket} animate-fadeSlide`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className={styles.ticketHead}>
                  <span className={styles.ticketSubj}>{t.subject}</span>
                  <span className={`${styles.badge} ${styles[`badge_${t.status}`]}`}>
                    {STATUS_LABEL[t.status] || t.status}
                  </span>
                </div>
                <p className={styles.ticketMsg}>{t.message}</p>
                {t.resolution && (
                  <p className={styles.ticketRes}>
                    <strong>Support reply:</strong> {t.resolution}
                  </p>
                )}
                <span className={styles.ticketDate}>
                  {new Date(t.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
