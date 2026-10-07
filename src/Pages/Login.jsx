import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Button from '../components/UI/button';
import Input from '../components/Auth/AuthField';
import AuthLayout from '../components/Auth/AuthLayout';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authstore';
import { authFormSchemas } from '../config/formSchemas';
import { validateBySchema } from '../utils/formValidation';
import { resolveDefaultRoute } from '../utils/defaultRoute';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isLoading) return;

    const validationError = validateBySchema(formData, authFormSchemas.login);
    if (validationError) {
      setError(validationError);
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('Welcome back!');
      navigate(resolveDefaultRoute(useAuthStore.getState().user));
    } else {
      setError(result.message || 'Please try again.');
    }
  };

  return (
    <AuthLayout>
      <div className="auth-form-icon"><LockKeyhole size={22} /></div>
      <p className="auth-kicker">WELCOME TO YOUR WORKSPACE</p>
      <h2>Welcome back.</h2>
      <p className="auth-description">Sign in to stay connected with your customers and keep your business moving.</p>
          <form onSubmit={handleSubmit} className="auth-form" aria-busy={isLoading}>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <Input
              label="Email address"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              autoComplete="current-password"
            />

            <Button type="submit" className="auth-submit" isLoading={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'} {!isLoading && <ArrowRight size={16} />}
            </Button>
          </form>
      <p className="auth-bottom-link">Don't have an account? <Link to="/register">Create an account</Link></p>
      <p className="auth-security"><ShieldCheck size={14} /> Your customer workspace starts here</p>
    </AuthLayout>
  );
}
