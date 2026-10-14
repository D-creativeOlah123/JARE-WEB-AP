import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Trash2 } from 'lucide-react';
import MobileHeader from '../components/MobileHeader';
import { useAuth } from '../hooks/useAuth';
import { updateProfile } from '../services/auth';
import styles from './EditProfile.module.css';

/**
 * Resize an image File to at most `max`×`max` (JPEG, quality 0.82) and
 * return a data URI. Keeps the avatar payload well under the backend cap.
 */
async function fileToResizedDataUrl(file, max = 240) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.82);
}

export default function EditProfile() {
  const { user, refreshMe } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    fullName: '', email: '', phone: '', dob: '', address: '',
  });
  const [avatar, setAvatar]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [notice, setNotice]   = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((f) => ({
      ...f,
      fullName: user.fullName || '',
      email:    user.email    || '',
      phone:    user.phone    || '',
      dob:      user.dob      ? user.dob.slice(0, 10) : '',
      address:  user.address  || '',
    }));
    setAvatar(user.avatar || '');
  }, [user]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleFile(e) {
    setError('');
    const file = e.target.files?.[0];
    e.target.value = '';   // let the same file be picked again after clearing
    if (!file) return;
    if (!/^image\//.test(file.type)) return setError('Please pick an image file.');
    if (file.size > 8 * 1024 * 1024) return setError('Image is too large (max 8 MB).');
    try {
      const dataUri = await fileToResizedDataUrl(file);
      setAvatar(dataUri);
    } catch {
      setError('Could not read that image.');
    }
  }

  function friendlyError(err) {
    const p = err.response?.data?.error;
    if (p?.details?.length) return p.details.map((d) => `${d.field}: ${d.message}`).join(' · ');
    return p?.message || err.message || 'Could not save profile';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true); setNotice(''); setError('');

    // Only send fields that actually changed vs. the loaded user — keeps
    // the payload small (esp. for avatar) and avoids unnecessary validation.
    const patch = {};
    if (form.fullName && form.fullName !== user?.fullName)   patch.fullName = form.fullName;
    if (form.phone    && form.phone    !== user?.phone)      patch.phone    = form.phone;
    if (form.dob      !== (user?.dob ? user.dob.slice(0, 10) : '')) patch.dob = form.dob || null;
    if (form.address  !== (user?.address || ''))             patch.address  = form.address;
    if (avatar        !== (user?.avatar  || ''))             patch.avatar   = avatar;

    if (Object.keys(patch).length === 0) {
      setNotice('Nothing to save.');
      setSaving(false);
      return;
    }

    try {
      await updateProfile(patch);
      await refreshMe();
      setNotice('Profile updated.');
      setTimeout(() => navigate('/profile'), 700);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  const initial = (user?.fullName || '?').charAt(0).toUpperCase();

  return (
    <div className={styles.page}>
      <MobileHeader title="Edit Profile" to="/profile" />

      <div className={styles.avatarWrap}>
        {avatar ? (
          <img src={avatar} alt="Profile" className={styles.avatarImg} />
        ) : (
          <div className={styles.avatar}>{initial}</div>
        )}
        <button
          type="button"
          className={styles.cameraBtn}
          aria-label="Change photo"
          onClick={() => fileRef.current?.click()}
        >
          <Camera size={14} />
        </button>
        {avatar && (
          <button
            type="button"
            className={styles.removeBtn}
            aria-label="Remove photo"
            onClick={() => setAvatar('')}
          >
            <Trash2 size={12} />
          </button>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleFile}
        />
      </div>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <Field label="Full Name">
          <input type="text" value={form.fullName}
            onChange={(e) => set('fullName', e.target.value)} required />
        </Field>

        <Field label="Email address">
          <input type="email" value={form.email} disabled
            title="Contact support to change your email" />
        </Field>

        <Field label="Phone Number">
          <input type="tel" value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+2348012345678" />
        </Field>

        <Field label="Date of Birth">
          <input type="date" value={form.dob}
            onChange={(e) => set('dob', e.target.value)} />
        </Field>

        <Field label="Address">
          <input type="text" value={form.address}
            onChange={(e) => set('address', e.target.value)}
            placeholder="No. 2 Ijakumo street, odo-ona Kekere" />
        </Field>

        {error  && <div className={styles.errorBox}>{error}</div>}
        {notice && <div className={styles.notice}>{notice}</div>}

        <button type="submit" className={styles.saveBtn} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label>{label}</label>
      {children}
    </div>
  );
}
