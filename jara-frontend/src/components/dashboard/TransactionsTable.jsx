import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatNaira } from '../../utils/format';
import styles from './TransactionsTable.module.css';

/**
 * Recent transactions table. Amount is signed — positive = credit (green),
 * negative = debit (red). Category is rendered as a coloured pill.
 */
export default function TransactionsTable({ transactions, total = 247 }) {
  const shown = transactions.length;

  return (
    <div className={styles.card}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Description</th>
              <th>Category</th>
              <th>Source</th>
              <th className={styles.right}>Amount</th>
              
              <th className={styles.right}>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => {
              const dt = new Date(tx.date);
              const isCredit = tx.amount >= 0;
              return (
                <tr key={tx.id}>
                  <td>
                    <div className={styles.dateMain}>{dt.toLocaleDateString('en-GB')}</div>
                    <div className={styles.dateSub}>
                      {dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td>
                    <div className={styles.descMain}>{tx.description}</div>
                    <div className={styles.descSub}>{tx.reference}</div>
                  </td>
                  <td>
                    <span className={styles.pill}>{tx.category}</span>
                  </td>
                  <td>{tx.source}</td>
                  <td className={`${styles.right} ${isCredit ? styles.credit : styles.debit}`}>
                    <div className={styles.amountInner}>
                      {isCredit ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {formatNaira(tx.amount, { showSign: true })}
                    </div>
                  </td>
                  <td className={styles.right}>
                    {tx.balance ? formatNaira(tx.balance) : <span style={{ color: '#6B7280' }}>—</span>}
                  </td>
                  <td>
                    <span className={`${styles.status} ${styles[`status_${tx.status}`] || ''}`}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <span className={styles.footerText}>Showing 1–{shown} of {total} transactions</span>
        <div className={styles.pager}>
          <button type="button" className={styles.pageBtn} disabled>Previous</button>
          <button type="button" className={styles.pageBtn} disabled>Next</button>
        </div>
      </div>
    </div>
  );
}
