import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthField({ label, type = 'text', hint, ...props }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const password = type === 'password';
  return <div className="auth-field">
    <label htmlFor={id}>{label}</label>
    <div className="auth-input-wrap">
      <input {...props} id={id} type={password && visible ? 'text' : type} className={password ? 'auth-password-input' : ''} aria-describedby={hint ? `${id}-hint` : undefined} />
      {password && <button type="button" className="auth-password-toggle" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>}
    </div>
    {hint && <p className="auth-field-hint" id={`${id}-hint`}>{hint}</p>}
  </div>;
}
