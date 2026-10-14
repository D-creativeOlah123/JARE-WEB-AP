import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { faq as copy } from '../../data/landing';
import Band from './ui/Band';
import SectionHeading from './ui/SectionHeading';
import styles from './FAQ.module.css';

/**
 * FAQ — 8 accordion rows. Uses semantic `<details>`/`<summary>` so each
 * row remains searchable + keyboard-operable even if JS fails. Opening
 * is handled by React state so we can animate the body via
 * `grid-template-rows: 0fr → 1fr`.
 */
export default function FAQ() {
  const { heading, items } = copy;
  const [openIdx, setOpenIdx] = useState(-1);

  return (
    <Band tone="light" id="faq" labelledBy="faq-title">
      <SectionHeading
        id="faq-title"
        eyebrow={heading.eyebrow}
        title={heading.title}
        italic={heading.italic}
        align="center"
      />

      <ul className={styles.list} role="list">
        {items.map((item, i) => {
          const open = openIdx === i;
          return (
            <li key={item.q} className={styles.row}>
              <details
                className={styles.details}
                open={open}
                onToggle={(e) => {
                  // Keep React in control of state so the body-grid animation reads consistently.
                  if (e.currentTarget.open !== open) {
                    setOpenIdx(e.currentTarget.open ? i : -1);
                  }
                }}
              >
                <summary className={styles.summary}>
                  <span className={styles.q}>{item.q}</span>
                  <ChevronDown
                    size={16}
                    className={`${styles.chev} ${open ? styles.chevOpen : ''}`}
                    aria-hidden="true"
                  />
                </summary>
                <div className={styles.bodyShell}>
                  <div className={styles.bodyInner}>
                    <p className={styles.a}>{item.a}</p>
                  </div>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
    </Band>
  );
}
