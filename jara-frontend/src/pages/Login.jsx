import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { friendlyAuthError } from '../utils/authErrors';
import AuthLayout from '../components/auth/AuthLayout';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { InlineError } from '../components/states/ErrorState';
import OfflineBanner from '../components/states/OfflineBanner';
import styles from './Login.module.css';

/**
 * Login — split-screen auth page. Email/phone + password; forwards to the
 * `from` route when ProtectedRoute redirected the user here.
 *
 * Error states handled:
 *  - Invalid credentials → server `error.message` shown as InlineError
 *  - Rate-limited (429)  → friendly "Too many tries, wait a bit"
 *  - Offline             → OfflineBanner across the top
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ identifier: identifier.trim(), password });
      navigate(redirectTo, { replace: true });
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
        photo="welcome"
        heroLine1="Welcome back,"
        heroLineItalic="let's move money."
      >
        <header className={styles.head}>
          <h1 className={styles.title}>Sign in to Jara</h1>
          <p className={styles.subtitle}>
            Use your email or Nigerian phone number and your password.
          </p>
        </header>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            label="Email or mobile number"
            type="text"
            autoComplete="username"
            placeholder="chinedu@jara.dev or +2348012345678"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
          />

          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            iconRight={showPassword ? EyeOff : Eye}
            required
          />
          {/* Click the right-side icon by clicking the invisible overlay */}
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className={styles.showPwBtn}
          >
            {showPassword ? 'Hide password' : 'Show password'}
          </button>

          <div className={styles.row}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <span>Remember me on this device</span>
            </label>
            <Link to="/forgot-password" className={styles.forgot}>
              Forgot password?
            </Link>
          </div>

          <InlineError message={error} />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            iconLeft={LogIn}
            loading={submitting}
            disabled={!identifier || !password}
            fullWidth
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className={styles.footer}>
          New to Jara?{' '}
          <Link to="/signup" className={styles.footerLink}>Open an account</Link>
        </p>
      </AuthLayout>
    </>
  );
}

