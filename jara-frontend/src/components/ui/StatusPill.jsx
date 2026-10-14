import styles from './StatusPill.module.css';

/**
 * StatusPill — the canonical status chip. One of a fixed set of status
 * slugs maps to a consistent colour pair + friendly label.
 *
 *   <StatusPill status="pending" />         →  "Pending" in amber
 *
 * @param {object} props
 * @param {string} props.status
 * @param {string} [props.label]   override the default label
 */
const MAP = {
  pending:     { variant: 'warning', label: 'Pending'      },
  processing:  { variant: 'warning', label: 'Processing'   },
  completed:   { variant: 'success', label: 'Completed'    },
  success:     { variant: 'success', label: 'Success'      },
  failed:      { variant: 'danger',  label: 'Failed'       },
  cancelled:   { variant: 'danger',  label: 'Cancelled'    },
  open:        { variant: 'warning', label: 'Open'         },
  in_progress: { variant: 'info',    label: 'In progress'  },
  resolved:    { variant: 'success', label: 'Resolved'     },
  active:      { variant: 'info',    label: 'Active'       },
  suspended:   { variant: 'danger',  label: 'Suspended'    },
  verified:    { variant: 'success', label: 'Verified'     },
  unverified:  { variant: 'neutral', label: 'Unverified'   },
};

export default function StatusPill({ status, label, className = '' }) {
  const entry = MAP[status] || { variant: 'neutral', label: status };
  const cls = `${styles.pill} ${styles[`v_${entry.variant}`]} ${className}`.trim();
  return <span className={cls}>{label || entry.label}</span>;
}
