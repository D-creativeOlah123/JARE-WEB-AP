import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, MessageSquareText, Check, ArrowRight, CheckCircle2 } from 'lucide-react';
import { forgotPassword, resetPassword } from '../services/auth';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import OtpInput from '../components/ui/OtpInput';
import { InlineError } from '../components/states/ErrorState';
import OfflineBanner from '../components/states/OfflineBanner';
import { friendlyAuthError } from '../utils/authErrors';
import styles from './ForgotPassword.module.css';

/**
 * ForgotPassword — redesigned 4-step wizard:
 *   request → verify → new-password → success
 *
 * The reset-password backend accepts a 5-digit numeric OTP; we show 5 boxes.
 * Rate-limit (429) and offline states handled by `friendlyAuthError` + banner.
 */
export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep]             = useState('request');
  const [identifier, setIdentifier] = useState('');
  const [channel, setChannel]       = useState('email');
  const [code, setCode]             = useState('');
  const [newPassword, setNewPassword]       = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [devHint, setDevHint] = useState('');
  const [error, setError]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleRequest(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const res = await forgotPassword({ identifier: identifier.trim(), channel });
      setDevHint(res?.dev?.devOtp ? `Dev OTP: ${res.dev.devOtp}` : '');
      setStep('verify');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReset(e) {
    e?.preventDefault?.();
    setError('');
    if (newPassword !== confirmPassword) return setError('Passwords do not match');
    setSubmitting(true);
    try {
      await resetPassword({
        identifier: identifier.trim(),
        channel,
        code,
        newPassword,
      });
      setStep('success');
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <OfflineBanner />
      <AuthLayout
        photo="reset"
        heroLine1="Reset your password,"
        heroLineItalic="then keep moving."
      >
        {step === 'request' && (
          <>
            <header className={styles.head}>
              <h1 className={styles.title}>Forgot password</h1>
              <p className={styles.subtitle}>
                We'll send a 5-digit code to the email or phone on file.
              </p>
            </header>

            <form onSubmit={handleRequest} className={styles.form} noValidate>
              <Input
                label="Email or mobile number"
                type="text"
                placeholder="chinedu@jara.dev or +2348012345678"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
              />

              <fieldset className={styles.channels}>
                <legend className={styles.channelsLegend}>Where should we send the code?</legend>
                <ChannelCard
                  active={channel === 'email'}
                  onClick={() => setChannel('email')}
                  icon={<Mail size={16} />}
                  label="Via email"
                  hint="To the email on file"
                />
                <ChannelCard
                  active={channel === 'sms'}
                  onClick={() => setChannel('sms')}
                  icon={<MessageSquareText size={16} />}
                  label="Via SMS"
                  hint="To the mobile number on file"
                />
              </fieldset>

              <InlineError message={error} />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                loading={submitting}
                disabled={!identifier}
                fullWidth
              >
                {submitting ? 'Sending code…' : 'Send code'}
              </Button>
            </form>
          </>
        )}

        {step === 'verify' && (
          <>
            <header className={styles.head}>
              <h1 className={styles.title}>Verify code</h1>
              <p className={styles.subtitle}>
                We sent a <strong>5-digit code</strong> to your {channel === 'sms' ? 'mobile number' : 'email'}.
              </p>
            </header>

            <OtpInput
              value={code}
              onChange={(v) => {
                setCode(v);
                if (v.length === 5) setStep('new-password');
              }}
              length={5}
              label="One-time code"
              error={error}
            />

            {devHint && <p className={styles.devHint}>{devHint}</p>}

            <button
              type="button"
              className={styles.resend}
              onClick={handleRequest}
              disabled={submitting}
            >
              Resend code
            </button>
          </>
        )}

        {step === 'new-password' && (
          <>
            <header className={styles.head}>
              <h1 className={styles.title}>Create a new password</h1>
              <p className={styles.subtitle}>At least 8 characters, with a letter and a number.</p>
            </header>

            <form onSubmit={handleReset} className={styles.form} noValidate>
              <Input
                label="New password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Your new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                iconRight={showPassword ? EyeOff : Eye}
              />
              <Input
                label="Re-enter new password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm the new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className={styles.showPwBtn}
              >
                {showPassword ? 'Hide passwords' : 'Show passwords'}
              </button>

              <InlineError message={error} />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                iconRight={ArrowRight}
                loading={submitting}
                disabled={!newPassword || !confirmPassword}
                fullWidth
              >
                {submitting ? 'Updating…' : 'Update password'}
              </Button>
            </form>
          </>
        )}

        {step === 'success' && (
          <div className={styles.success}>
            <div className={styles.successMedallion} aria-hidden="true">
              <CheckCircle2 size={28} />
            </div>
            <h1 className={styles.title}>Password updated</h1>
            <p className={styles.subtitle}>
              You can now sign in with your new password.
            </p>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => navigate('/login', { replace: true })}
            >
              Sign in
            </Button>
          </div>
        )}

        {step === 'request' && (
          <p className={styles.footer}>
            Remembered it?{' '}
            <Link to="/login" className={styles.footerLink}>Sign in</Link>
          </p>
        )}
      </AuthLayout>
    </>
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
        <span className={styles.channelHint}>{hint}</span>
      </span>
      <span className={styles.channelCheck}>
        {active && <Check size={14} strokeWidth={3} />}
      </span>
    </button>
  );
}
