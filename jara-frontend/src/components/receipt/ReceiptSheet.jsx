import Sheet from '../ui/Sheet';
import Receipt from './Receipt';

/**
 * ReceiptSheet — opens a bottom Sheet rendering `<Receipt>` for a
 * normalised transaction object.
 */
export default function ReceiptSheet({ open, onClose, tx, onReportIssue }) {
  return (
    <Sheet open={open} onClose={onClose} title="Receipt">
      <Receipt tx={tx} onReportIssue={onReportIssue} />
    </Sheet>
  );
}
