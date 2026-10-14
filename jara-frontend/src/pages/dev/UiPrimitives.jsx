import { useState } from 'react';
import {
  Save, Trash2, Send, Sun, Moon, Monitor, Search, Zap, Users, HeadphonesIcon,
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import Button      from '../../components/ui/Button';
import Input       from '../../components/ui/Input';
import AmountInput from '../../components/ui/AmountInput';
import PhoneInput  from '../../components/ui/PhoneInput';
import OtpInput    from '../../components/ui/OtpInput';
import Select      from '../../components/ui/Select';
import Toggle      from '../../components/ui/Toggle';
import Chip        from '../../components/ui/Chip';
import Avatar      from '../../components/ui/Avatar';
import ProviderMark from '../../components/ui/ProviderMark';
import BankMark    from '../../components/ui/BankMark';
import StatusPill  from '../../components/ui/StatusPill';
import ListRow     from '../../components/ui/ListRow';
import PageHeader  from '../../components/ui/PageHeader';
import Sheet       from '../../components/ui/Sheet';
import EmptyState  from '../../components/states/EmptyState';
import ErrorState, { InlineError } from '../../components/states/ErrorState';
import OfflineBanner from '../../components/states/OfflineBanner';
import { appImages } from '../../data/appImages';
import styles from './UiPrimitives.module.css';

/**
 * /dev/ui — showcase of every `components/ui/*` + `components/states/*`
 * primitive. DEV-only, gated in App.jsx by `import.meta.env.DEV`.
 *
 * Variants: light / dark / system via the theme toggle; press buttons to
 * fire toasts, open the sheet, etc. Checkpoint A proof.
 */
export default function UiPrimitives() {
  const { pref, setTheme, mode } = useTheme();
  const toast = useToast();

  // State for interactive demos
  const [sheetOpen, setSheetOpen] = useState(false);
  const [amountKobo, setAmountKobo] = useState(100_000);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [plan, setPlan]       = useState('weekly');
  const [chipPick, setChipPick] = useState('MTN');

  return (
    <main className={styles.wrap}>
      <OfflineBanner />

      <PageHeader
        title="UI primitives · Phase A"
        subtitle={`Theme: ${pref} (resolved: ${mode}). DEV-only showcase.`}
        actions={
          <>
            {['light', 'dark', 'system'].map((t) => (
              <Button
                key={t}
                size="sm"
                variant={pref === t ? 'primary' : 'ghost'}
                onClick={() => setTheme(t)}
                iconLeft={t === 'light' ? Sun : t === 'dark' ? Moon : Monitor}
              >
                {t}
              </Button>
            ))}
          </>
        }
      />

      {/* ---------- Button ---------- */}
      <Section title="Button">
        <div className={styles.row}>
          <Button variant="primary"   iconLeft={Save}>Primary</Button>
          <Button variant="secondary" iconLeft={Users}>Secondary</Button>
          <Button variant="ghost"     iconLeft={Search}>Ghost</Button>
          <Button variant="danger"    iconLeft={Trash2}>Danger</Button>
          <Button loading>Loading…</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className={styles.row}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg" iconRight={Send}>Large</Button>
          <Button fullWidth variant="primary">Full width</Button>
        </div>
      </Section>

      {/* ---------- Inputs ---------- */}
      <Section title="Inputs">
        <div className={styles.grid2}>
          <Input label="Full name" placeholder="Chinedu Okoro" />
          <Input label="Email" type="email" placeholder="chinedu@jara.dev"
            helper="We'll send a verification code here." />
          <Input label="BVN"
            value="•••••••1234"
            onChange={() => {}}
            error="BVN must be exactly 11 digits" />
          <PhoneInput label="Phone number" value={phone} onChange={setPhone} />
          <AmountInput label="Amount" valueKobo={amountKobo} onChange={setAmountKobo}
            helper={`Receives ${(amountKobo / 100).toLocaleString('en-NG')} NGN`} />
          <Select label="Savings frequency" value={plan} onChange={(e) => setPlan(e.target.value)}
            options={[
              { value: 'daily',   label: 'Daily'   },
              { value: 'weekly',  label: 'Weekly'  },
              { value: 'monthly', label: 'Monthly' },
            ]} />
        </div>
        <OtpInput label="One-time code" value={otp} onChange={setOtp} length={6}
          autoFocus={false} onComplete={(v) => toast.success(`OTP ${v} entered`)} />
      </Section>

      {/* ---------- Toggle + Chip ---------- */}
      <Section title="Toggle & Chip">
        <Toggle label="Push notifications" description="Transfer and bill updates."
          on={enabled} onToggle={() => setEnabled((v) => !v)} />
        <Toggle label="Security alerts" description="Always on." on={true} onToggle={() => {}} disabled />
        <div className={styles.row}>
          <Chip>Neutral</Chip>
          <Chip variant="brand">Brand</Chip>
          <Chip variant="success">Success</Chip>
          <Chip variant="danger">Danger</Chip>
          <Chip variant="warning">Warning</Chip>
          <Chip variant="info">Info</Chip>
        </div>
        <div className={styles.row}>
          {['MTN', 'Airtel', 'Glo', '9mobile'].map((p) => (
            <Chip
              key={p}
              variant="brand"
              selected={chipPick === p}
              onSelect={() => setChipPick(p)}
            >
              {p}
            </Chip>
          ))}
          <span className={styles.hint}>Picked: <strong>{chipPick}</strong></span>
        </div>
      </Section>

      {/* ---------- Avatar / ProviderMark / BankMark / StatusPill ---------- */}
      <Section title="Marks & pills">
        <div className={styles.row}>
          <Avatar name="Chinedu Okoro" size="sm" />
          <Avatar name="Aminat Bello"  size="md" />
          <Avatar name="Tunde Adekunle" size="lg" />
          <Avatar name="Ngozi Umeh"    size="xl" />
        </div>
        <div className={styles.row}>
          <ProviderMark name="MTN" />
          <ProviderMark name="Airtel" />
          <ProviderMark name="Glo" />
          <ProviderMark name="DStv" />
          <ProviderMark name="IKEDC" />
          <ProviderMark name="WAEC" />
        </div>
        <div className={styles.row}>
          <BankMark bankName="Guaranty Trust Bank" />
          <BankMark bankName="Access Bank" />
          <BankMark bankName="First Bank of Nigeria" />
          <BankMark bankName="Zenith Bank" />
          <BankMark bankName="UBA Nigeria" size="lg" />
          <BankMark bankName="Opay Microfinance" size="sm" />
        </div>
        <div className={styles.row}>
          {['pending', 'completed', 'failed', 'open', 'in_progress', 'resolved', 'active', 'suspended', 'verified'].map((s) => (
            <StatusPill key={s} status={s} />
          ))}
        </div>
      </Section>

      {/* ---------- ListRow ---------- */}
      <Section title="ListRow">
        <div className={styles.list}>
          <ListRow
            leading={<Avatar name="Aminat Bello" />}
            title="Sent to Aminat Bello"
            subtitle="GTBank · 9123456789"
            amountKobo={-25_000_00}
          />
          <ListRow
            leading={<BankMark bankName="Zenith Bank" />}
            title="Received from Tunde Adekunle"
            subtitle="Zenith · 2m ago"
            amountKobo={+120_000_00}
          />
          <ListRow
            leading={<ProviderMark name="MTN" labelHidden />}
            title="MTN Airtime"
            subtitle="08012345678 · pending"
            trailing="— — —"
          />
          <ListRow
            leading={<Avatar name="Umeh Family" />}
            title="Umeh Family Rent"
            subtitle="Next ₦50,000 on Fri 10 Oct"
            onClick={() => toast.info('Row click', 'Would navigate to the group.')}
          />
        </div>
      </Section>

      {/* ---------- Toast ---------- */}
      <Section title="Toast">
        <div className={styles.row}>
          <Button variant="secondary" iconLeft={Zap} onClick={() => toast.success('Saved', 'Your profile was updated.')}>
            Success
          </Button>
          <Button variant="secondary" onClick={() => toast.error('Transfer failed', 'Provider timed out — retry in a moment.')}>
            Error
          </Button>
          <Button variant="secondary" onClick={() => toast.warn('Low balance', 'Fund your wallet to continue.')}>
            Warning
          </Button>
          <Button variant="secondary" onClick={() => toast.info('Heads up', 'New feature available.')}>
            Info
          </Button>
        </div>
      </Section>

      {/* ---------- Sheet ---------- */}
      <Section title="Sheet">
        <Button onClick={() => setSheetOpen(true)}>Open sheet</Button>
        <Sheet
          open={sheetOpen}
          onClose={() => setSheetOpen(false)}
          title="Confirm transfer"
          footer={
            <>
              <Button variant="ghost" onClick={() => setSheetOpen(false)}>Cancel</Button>
              <Button
                variant="primary"
                onClick={() => { setSheetOpen(false); toast.success('Done'); }}
              >
                Continue
              </Button>
            </>
          }
        >
          <div className={styles.sheetRows}>
            <SheetRow label="To"      value="Aminat Bello" />
            <SheetRow label="Bank"    value="GTBank" />
            <SheetRow label="Account" value="9123456789" />
            <SheetRow label="Amount"  value="₦25,000.00" />
            <SheetRow label="Fee"     value="₦10.00" />
          </div>
        </Sheet>
      </Section>

      {/* ---------- Empty / Error / InlineError ---------- */}
      <Section title="State components">
        <div className={styles.grid2}>
          <EmptyState
            image={appImages.emptyFirstGoal}
            title="Start your first goal"
            body="Set a target, Jara auto-saves for you."
            cta={{ label: 'Create goal', onClick: () => toast.info('Would open /my-jara/new') }}
          />
          <EmptyState
            icon={HeadphonesIcon}
            title="No tickets yet"
            body="Open one if you ever hit a wall — we reply within 24h."
            cta={{ label: 'Contact support', onClick: () => toast.info('Would open /profile/support') }}
          />
        </div>
        <div className={styles.grid2}>
          <ErrorState
            title="Couldn't load transfers"
            detail="Provider timed out — try again in a moment."
            reference="JR_7f3a19c0"
            onRetry={() => toast.info('Retry fired')}
          />
          <div className={styles.list}>
            <InlineError message="Transfer failed · insufficient balance" onRetry={() => toast.info('Retry fired')} />
          </div>
        </div>
      </Section>
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section className={styles.section}>
      <header className={styles.sectionHead}>{title}</header>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function SheetRow({ label, value }) {
  return (
    <div className={styles.sheetRow}>
      <span className={styles.sheetRowLabel}>{label}</span>
      <span className={styles.sheetRowValue}>{value}</span>
    </div>
  );
}
