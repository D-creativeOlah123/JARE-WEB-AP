import { useEffect, useRef, useState } from 'react';
import { Check, Repeat } from 'lucide-react';
import { useInView } from '../../../hooks/useInView';
import { useReducedMotion } from '../../../hooks/useReducedMotion';
import { formatNaira } from '../../../utils/format';
import styles from './TransferAnimation.module.css';

/**
 * TransferAnimation — phone-to-phone money movement.
 *
 *   - Two phone frames side-by-side over a blurred backdrop.
 *   - Left phone: recipient name + account + amount, PIN dots fill in sequence.
 *   - A plum ₦ coin travels along an SVG path from left phone to right phone.
 *   - Right phone: a credit-alert toast drops in; both phones show a green ✓.
 *   - Total ≈ 2.8s; replays via a "Replay" button, and auto-replays every 9s
 *     only while in view.
 *   - Reduced motion: renders the final frame (both ✓ + toast + no coin anim).
 *
 * All copy comes from `data/landing.js → transfers.animation`.
 *
 * @param {object} props
 * @param {object} props.config    .sender, .recipient, .creditAlert
 */
export default function TransferAnimation({ config }) {
  const reduced = useReducedMotion();
  const [containerRef, inView] = useInView({ threshold: 0.35, once: false });

  // playId key resets the animation; incrementing remounts the keyed subtree.
  const [playId, setPlayId] = useState(0);
  const timerRef = useRef(0);

  // Auto-replay every 9s while in view (not under reduced motion).
  useEffect(() => {
    if (reduced || !inView) return undefined;
    timerRef.current = window.setInterval(() => setPlayId((n) => n + 1), 9000);
    return () => window.clearInterval(timerRef.current);
  }, [reduced, inView]);

  const amount = config.sender.amount;
  const amountDisplay = formatNaira(amount);
  const alertDisplay  = config.creditAlert || `+${formatNaira(amount)}`;

  return (
    <div ref={containerRef} className={styles.wrap} aria-label="Transfer flow between two phones" role="img">
      {reduced ? (
        <div className={styles.stage}>
          <Phone side="left" done>
            <PhoneTop recipient={config.recipient} amountDisplay={amountDisplay} />
            <PinRow filled={4} />
            <Confirm label="Sent" />
          </Phone>
          <CoinTrack isStatic />
          <Phone side="right" done>
            <Alert visible label={alertDisplay} />
            <Confirm label="Received" />
          </Phone>
        </div>
      ) : (
        // Keying on playId remounts everything so CSS animations re-fire.
        <div key={playId} className={styles.stage}>
          <Phone side="left">
            <PhoneTop recipient={config.recipient} amountDisplay={amountDisplay} />
            <PinRow filled={0} animated />
            <Confirm label="Sending…" delay={1400} finalLabel="Sent" />
          </Phone>
          <CoinTrack />
          <Phone side="right">
            <Alert label={alertDisplay} enterDelay={1800} />
            <Confirm label="Received" delay={2400} />
          </Phone>
        </div>
      )}

      {!reduced && (
        <button
          type="button"
          className={`${styles.replay} btn-lift`}
          onClick={() => setPlayId((n) => n + 1)}
          aria-label="Replay transfer animation"
        >
          <Repeat size={14} />
          Replay
        </button>
      )}
    </div>
  );
}

/* ------------- Sub-components (plain JSX, animated via CSS modules) ------------- */

function Phone({ side, done = false, children }) {
  return (
    <div className={`${styles.phone} ${styles[`phone_${side}`]} ${done ? styles.phoneDone : ''}`}>
      <div className={styles.phoneNotch} aria-hidden="true" />
      <div className={styles.phoneScreen}>{children}</div>
    </div>
  );
}

function PhoneTop({ recipient, amountDisplay }) {
  return (
    <>
      <div className={styles.phoneTopRow}>
        <div className={styles.avatarCircle}>
          {(recipient.name || 'A').charAt(0)}
        </div>
        <div className={styles.phoneTopText}>
          <span className={styles.phoneTopName}>{recipient.name}</span>
          <span className={styles.phoneTopSub}>{recipient.account}</span>
        </div>
      </div>
      <div className={styles.amountRow}>
        <span className={styles.amountValue}>{amountDisplay}</span>
      </div>
    </>
  );
}

function PinRow({ filled = 0, animated = false }) {
  // 4 dots. Under animated: each dot has an animation-delay matching its position.
  const dots = Array.from({ length: 4 });
  return (
    <div className={styles.pinRow} aria-label="PIN entered">
      {dots.map((_, i) => (
        <span
          key={i}
          className={`${styles.pinDot} ${animated ? styles.pinDotAnim : ''} ${!animated && i < filled ? styles.pinDotOn : ''}`}
          style={animated ? { animationDelay: `${300 + i * 180}ms` } : undefined}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function Alert({ visible = false, enterDelay = 0, label }) {
  return (
    <div
      className={`${styles.alert} ${visible ? styles.alertVisible : ''}`}
      style={visible ? undefined : { animationDelay: `${enterDelay}ms` }}
    >
      <div className={styles.alertDot} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

function Confirm({ delay = 0, label, finalLabel }) {
  // When finalLabel is supplied, we swap the label at the delay moment via
  // a CSS-only "text replacement" using a transparent pseudo. Simpler here:
  // keep both strings in two spans; CSS controls which is visible.
  return (
    <div className={styles.confirm} style={{ animationDelay: `${delay}ms` }}>
      <span className={styles.confirmTick}>
        <Check size={12} strokeWidth={3} />
      </span>
      <span className={styles.confirmLabel}>{finalLabel || label}</span>
    </div>
  );
}

/* The SVG motion path + the coin that travels along it. The ::after-style
   coin uses CSS Motion Path with `offset-path` + `offset-distance`, animated
   by the `jara-coin-travel` keyframe declared in global.css. */
function CoinTrack({ isStatic = false }) {
  return (
    <div className={styles.track} aria-hidden="true">
      {/* Dashed arc for visual continuity */}
      <svg className={styles.trackSvg} viewBox="0 0 200 100" preserveAspectRatio="none">
        <path
          d="M 10 80 Q 100 -10 190 80"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
      {!isStatic && (
        <span
          className={styles.coin}
          style={{ offsetPath: 'path("M 10 80 Q 100 -10 190 80")' }}
        >
          ₦
        </span>
      )}
      {isStatic && (
        <span className={`${styles.coin} ${styles.coinEnd}`}>₦</span>
      )}
    </div>
  );
}
