import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

/** useToast — returns the toast API: `.success()`, `.error()`, `.warn()`, `.info()`, `.push()`, `.dismiss()`. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside <ToastProvider>');
  return ctx;
}
