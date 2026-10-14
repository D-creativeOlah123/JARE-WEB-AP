import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Mail, MessageSquareText, Check, ArrowRight, Copy, Share2, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { register, setTransferPin, sendOtp, verifyOtp } from '../services/auth';
import { getMyAccount } from '../services/accounts';
import { formatNaira } from '../utils/format';
import AuthLayout from '../components/auth/AuthLayout';
import AuthProgress from '../components/auth/AuthProgress';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PhoneInput from '../components/ui/PhoneInput';
import OtpInput from '../components/ui/OtpInput';
import PinInput from '../components/PinInput';
import { InlineError } from '../components/states/ErrorState';
import OfflineBanner from '../components/states/OfflineBanner';
import { landingImages } from '../data/landingImages';
import Img from '../components/landing/ui/Img';
import { useToast } from '../hooks/useToast';
import { friendlyAuthError } from '../utils/authErrors';
import styles from './Signup.module.css';

/**
 * Signup — 7-step wizard (unchanged step order), redesigned chrome.
 *
 *   form → create-pin → confirm-pin → pin-success → pick-channel
 *        → verify-otp → account-created → /dashboard
 *
 * The 4 progress segments map to steps as:
 *   Details  : form
 *   PIN      : create-pin / confirm-pin / pin-success
 *   Verify   : pick-channel / verify-otp
 *   Done     : account-created
 *
 * NIN capture is deferred — see SCOPE_NOTES.md.
 */

const STEPS = ['Details', 'PIN', 'Verify', 'Done'];
function stepIndex(step) {
  if (step === 'form') return 0;
  if (step === 'create-pin' || step === 'confirm-pin' || step === 'pin-success') return 1;
  if (step === 'pick-channel' || step === 'verify-otp') return 2;
  return 3;
}

export default function Signup() {
  const { hydrate, refreshMe } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState('form');
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    bvn: '',
    password: '',
    confirmPassword: '',
    agree: false,
  });
  const [pin, setPin]       = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinShake, setPinShake]     = useState(false);
  const [channel, setChannel] = useState('email');
  const [otp, setOtp]         = useState('');
  const [devHint, setDevHint] = useState('');
  const [error, setError]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [account, setAccount] = useState(null);

  async function handleSubmitForm(e) {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (!form.agree) return setError('Please accept the Terms & Conditions to continue');
    setSubmitting(true);
    try {
      const data = await register({
        fullName: form.fullName.trim(),
        email:    form.email.trim(),
        phone:    form.phone,
        bvn:      form.bvn,
        password: form.password,
      });
      hydrate(data);
      setStep('create-pin');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function completePin(pinVal, confirmVal) {
    setError('');
    if (pinVal !== confirmVal) {
      setPinShake(true);
      setTimeout(() => setPinShake(false), 320);
      setError('PINs do not match. Try again.');
      setPin(''); setPinConfirm(''); setStep('create-pin');
      return;
    }
    setSubmitting(true);
    try {
      await setTransferPin(pinVal);
      await refreshMe();
      setStep('pin-success');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendOtp() {
    setError('');
    setSubmitting(true);
    try {
      const res = await sendOtp({
        channel,
        purpose: 'signup',
        identifier: channel === 'email' ? form.email : form.phone,
      });
      setDevHint(res?.devOtp ? `Dev OTP: ${res.devOtp}` : '');
      setOtp('');
      setStep('verify-otp');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(codeVal) {
    setError('');
    setSubmitting(true);
    try {
      await verifyOtp({
        channel,
        purpose: 'signup',
        identifier: channel === 'email' ? form.email : form.phone,
        code: codeVal,
      });
      await refreshMe();
      const acct = await getMyAccount().catch(() => null);
      setAccount(acct);
      setStep('account-created');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopy() {
    if (!account?.accountNumber) return;
    try {
      await navigator.clipboard.writeText(account.accountNumber);
      toast.success('Copied', 'Your account number is on the clipboard.');
    } catch {
      toast.error('Could not copy', 'Select the number and copy it manually.');
    }
  }

  async function handleShare() {
    if (!account?.accountNumber) return;
    const text = `My Jara account number is ${account.accountNumber} (${form.fullName}).`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My Jara account', text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.info('Copied to share', 'Account details copied — paste anywhere.');
      }
    } catch { /* user cancelled the share sheet; silent */ }
  }

  return (
    <>
      <OfflineBanner />
      <AuthLayout
        photo="open"
        heroLine1="Open an account,"
        heroLineItalic="start banking today."
      >
        <AuthProgress steps={STEPS} active={stepIndex(step)} />

        {step === 'form' && (
          <SignupForm
            form={form}
            setForm={setForm}
            onSubmit={handleSubmitForm}
            error={error}
            submitting={submitting}
          />
        )}

        {(step === 'create-pin' || step === 'confirm-pin') && (
          <PinStep
            title={step === 'create-pin' ? 'Create your transfer PIN' : 'Confirm your transfer PIN'}
            subtitle={
              step === 'create-pin'
                ? 'You\'ll enter this 4-digit PIN on every transfer.'
                : 'Re-enter the PIN to confirm.'
            }
            value={step === 'create-pin' ? pin : pinConfirm}
            shake={pinShake}
            onChange={(v) => {
              if (step === 'create-pin') {
                setPin(v);
                if (v.length === 4) setStep('confirm-pin');
              } else {
                setPinConfirm(v);
                if (v.length === 4) completePin(pin, v);
              }
            }}
            error={step === 'confirm-pin' ? error : ''}
            submitting={submitting}
          />
        )}

        {step === 'pin-success' && (
          <div className={styles.success}>
            <div className={styles.successMedallion} aria-hidden="true"><Check size={28} /></div>
            <h1 className={styles.title}>PIN set</h1>
            <p className={styles.subtitle}>Nice. Last two steps — verify your contact and you're in.</p>
            <Button
              variant="primary"
              size="lg"
              iconRight={ArrowRight}
              onClick={() => setStep('pick-channel')}
              fullWidth
            >
              Continue
            </Button>
          </div>
        )}

        {step === 'pick-channel' && (
          <ChannelStep
            channel={channel}
            setChannel={setChannel}
            email={form.email}
            phone={form.phone}
            onContinue={handleSendOtp}
            submitting={submitting}
            error={error}
          />
        )}

        {step === 'verify-otp' && (
          <VerifyStep
            channel={channel}
            value={otp}
            onChange={(v) => {
              setOtp(v);
              if (v.length === 5) handleVerifyOtp(v);
            }}
            devHint={devHint}
            error={error}
            submitting={submitting}
            onResend={handleSendOtp}
          />
        )}

        {step === 'account-created' && (
          <AccountCreated
            fullName={form.fullName}
            account={account}
            onCopy={handleCopy}
            onShare={handleShare}
            onContinue={() => navigate('/dashboard', { replace: true })}
          />
        )}
      </AuthLayout>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Step sub-components                                                */
/* ------------------------------------------------------------------ */

function SignupForm({ form, setForm, onSubmit, error, submitting }) {
  const [showPassword, setShowPassword] = useState(false);

  const bvnDisplay = form.bvnReveal
    ? form.bvn
    : form.bvn.length ? '•'.repeat(Math.max(0, form.bvn.length - 4)) + form.bvn.slice(-4) : '';

  const set = (k, v) => setForm({ ...form, [k]: v });

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <header className={styles.head}>
        <h1 className={styles.title}>Open your Jara account</h1>
        <p className={styles.subtitle}>
          Takes about 3 minutes. All fields below are needed to meet KYC Tier 1.
        </p>
      </header>

      {/* Group: About you */}
      <Group heading="About you">
        <Input
          label="Full name"
          placeholder="Chinedu Okoro"
          value={form.fullName}
          onChange={(e) => set('fullName', e.target.value)}
          autoComplete="name"
          required
        />
      </Group>

      {/* Group: Contact */}
      <Group heading="Contact">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          autoComplete="email"
          required
        />
        <PhoneInput
          label="Mobile number"
          value={form.phone}
          onChange={(v) => set('phone', v)}
          helper="We'll SMS a verification code here."
        />
      </Group>

      {/* Group: Identity */}
      <Group heading="Identity">
        <Input
          label="BVN"
          inputMode="numeric"
          placeholder="11-digit Bank Verification Number"
          value={form.bvnReveal ? form.bvn : (form.bvn.length ? bvnDisplay : '')}
          onChange={(e) => {
            // Always accept raw digits; the display mask is a view-only concern.
            const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
            set('bvn', digits);
          }}
          onFocus={() => set('bvnReveal', true)}
          onBlur={() => set('bvnReveal', false)}
          helper={'Used only to verify your identity. Dial *565*0# to look up yours.'}
          required
        />
        <KycTierCard />
      </Group>

      {/* Group: Password */}
      <Group heading="Password">
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="At least 8 chars, with a letter and a number"
          value={form.password}
          onChange={(e) => set('password', e.target.value)}
          autoComplete="new-password"
          iconRight={showPassword ? EyeOff : Eye}
          required
        />
        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter the password"
          value={form.confirmPassword}
          onChange={(e) => set('confirmPassword', e.target.value)}
          autoComplete="new-password"
          required
        />
        <button
          type="button"
          onClick={() => setShowPassword((v) => !v)}
          className={styles.showPwBtn}
        >
          {showPassword ? 'Hide passwords' : 'Show passwords'}
        </button>
      </Group>

      <label className={styles.agree}>
        <input
          type="checkbox"
          checked={form.agree}
          onChange={(e) => set('agree', e.target.checked)}
        />
        <span>
          I agree to the{' '}
          <a href="#terms" onClick={(e) => e.preventDefault()}>Terms &amp; Conditions</a>{' '}
          and{' '}
          <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy policy</a>
          .
        </span>
      </label>

      <InlineError message={error} />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        iconRight={ArrowRight}
        loading={submitting}
        disabled={
          !form.fullName || !form.email || !form.phone ||
          form.bvn.length !== 11 || !form.password || !form.confirmPassword || !form.agree
        }
        fullWidth
      >
        {submitting ? 'Creating account…' : 'Continue'}
      </Button>

      <p className={styles.footer}>
        Already have an account?{' '}
        <Link to="/login" className={styles.footerLink}>Sign in</Link>
      </p>
    </form>
  );
}

function Group({ heading, children }) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.groupHead}>{heading}</legend>
      <div className={styles.groupBody}>{children}</div>
    </fieldset>
  );
}

/** KYC tier card — Tier 1 pulled from PlatformSettings defaults; Tier 2 greyed. */
function KycTierCard() {
  // Platform defaults mirror backend `PlatformSettings.limits` seeds.
  // When settings become fetched-per-user, pull from a `useLimits()` hook.
  const tier1MaxNaira = 1_000_000;

  return (
    <div className={styles.kyc}>
      <div className={`${styles.kycRow} ${styles.kycRowActive}`}>
        <div className={styles.kycMark}><Check size={12} strokeWidth={3} /></div>
        <div className={styles.kycText}>
          <span className={styles.kycTitle}>Tier 1 · BVN verified</span>
          <span className={styles.kycSub}>
            Up to {formatNaira(tier1MaxNaira)} per transfer, no monthly limit.
          </span>
        </div>
      </div>
      <div className={styles.kycRow} aria-disabled="true">
        <div className={`${styles.kycMark} ${styles.kycMarkDisabled}`}>2</div>
        <div className={styles.kycText}>
          <span className={styles.kycTitle}>Tier 2 · Add NIN + address</span>
          <span className={styles.kycSub}>Coming soon · raises limits on transfers &amp; cards.</span>
        </div>
      </div>
    </div>
  );
}

function PinStep({ title, subtitle, value, onChange, error, submitting, shake }) {
  return (
    <div className={styles.centerStep}>
      <header className={styles.head}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>
      <div className={`${styles.pinArea} ${shake ? styles.shake : ''}`}>
        <PinInput length={4} value={value} onChange={onChange} />
      </div>
      <InlineError message={error} />
      {submitting && <p className={styles.subtitle}>Securing your PIN…</p>}
    </div>
  );
}

function ChannelStep({ channel, setChannel, email, phone, onContinue, submitting, error }) {
  const maskEmail = (e) => {
    if (!e) return '';
    const [name, host] = e.split('@');
    return `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 3))}@${host}`;
  };
  const maskPhone = (p) => {
    if (!p) return '';
    return `${p.slice(0, 7)} ${'*'.repeat(5)} ${p.slice(-2)}`;
  };

  return (
    <div className={styles.centerStep}>
      <header className={styles.head}>
        <h1 className={styles.title}>Where should we send the code?</h1>
        <p className={styles.subtitle}>A 5-digit code to confirm your contact.</p>
      </header>

      <div className={styles.channels}>
        <ChannelCard
          active={channel === 'email'}
          onClick={() => setChannel('email')}
          icon={<Mail size={16} />}
          label="Via email"
          hint={maskEmail(email)}
        />
        <ChannelCard
          active={channel === 'sms'}
          onClick={() => setChannel('sms')}
          icon={<MessageSquareText size={16} />}
          label="Via SMS"
          hint={maskPhone(phone)}
        />
      </div>

      <InlineError message={error} />

      <Button
        variant="primary"
        size="lg"
        iconRight={ArrowRight}
        onClick={onContinue}
        loading={submitting}
        fullWidth
      >
        {submitting ? 'Sending code…' : 'Send code'}
      </Button>
    </div>
  );
}

function ChannelCard({ active, onClick, icon, label, hint }) {
  return (
    <button
      type="button"
      className={`${styles.channelCard} ${active ? styles.channelActive : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span className={styles.channelIcon}>{icon}</span>
      <span className={styles.channelText}>
        <span className={styles.channelLabel}>{label}</span>
        <span className={styles.channelValue}>{hint}</span>
      </span>
      <span className={styles.channelCheck}>
        {active && <Check size={14} strokeWidth={3} />}
      </span>
    </button>
  );
}

/* ---------------- Verify OTP step with 60s resend countdown --------- */

function VerifyStep({ channel, value, onChange, devHint, error, submitting, onResend }) {
  const [left, setLeft] = useState(60);
  useEffect(() => {
    const id = setInterval(() => setLeft((n) => (n > 0 ? n - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);
  function resend() { setLeft(60); onResend(); }

  const target = channel === 'sms' ? 'mobile number' : 'email address';
  return (
    <div className={styles.centerStep}>
      <header className={styles.head}>
        <h1 className={styles.title}>Enter the code</h1>
        <p className={styles.subtitle}>
          A 5-digit code was sent to your {target}.
        </p>
      </header>

      <OtpInput
        value={value}
        onChange={onChange}
        length={5}
        label="One-time code"
        error={error}
      />

      {devHint && <p className={styles.devHint}>{devHint}</p>}
      {submitting && <p className={styles.subtitle}>Verifying…</p>}

      <button
        type="button"
        className={styles.resend}
        onClick={resend}
        disabled={left > 0 || submitting}
      >
        {left > 0 ? `Resend code in ${left}s` : 'Resend code'}
      </button>
    </div>
  );
}

/* ---------------- Account created step --------------------------------- */

function AccountCreated({ fullName, account, onCopy, onShare, onContinue }) {
  const accountNumber = account?.accountNumber || '…';
  return (
    <div className={styles.created}>
      <div className={styles.successMedallion} aria-hidden="true">
        <CheckCircle2 size={28} />
      </div>
      <h1 className={styles.title}>You're banking.</h1>
      <p className={styles.subtitle}>
        Welcome aboard, {firstName(fullName)}. Here's your new Jara account number.
      </p>

      <div className={styles.acctCard}>
        <span className={styles.acctLabel}>Jara account number</span>
        <span className={styles.acctValue}>{accountNumber}</span>
        <span className={styles.acctHolder}>{fullName}</span>
        <div className={styles.acctActions}>
          <Button variant="secondary" size="sm" iconLeft={Copy}  onClick={onCopy}>Copy</Button>
          <Button variant="ghost"     size="sm" iconLeft={Share2} onClick={onShare}>Share</Button>
        </div>
      </div>

      <div className={styles.cardPreviewRow}>
        <div className={styles.cardThumb} aria-hidden="true">
          <Img image={landingImages.card1} aspect="4/5" className={styles.cardThumbImg} />
        </div>
        <p className={styles.cardThumbText}>
          Your virtual Jara card is ready — tap <strong>Continue</strong> to see it.
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onContinue}
        iconRight={ArrowRight}
        fullWidth
      >
        Go to dashboard
      </Button>
    </div>
  );
}

function firstName(full) {
  return (full || '').trim().split(/\s+/)[0] || 'there';
}
