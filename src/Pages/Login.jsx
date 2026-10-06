import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Button from '../components/UI/button';
import Input from '../components/UI/input';
import { useAuthStore } from '../store/authstore';
import { authFormSchemas } from '../config/formSchemas';
import { validateBySchema } from '../utils/formValidation';
import { resolveDefaultRoute } from '../utils/defaultRoute';

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    const validationError = validateBySchema(formData, authFormSchemas.login);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const result = await login(formData.email, formData.password);

    if (result.success) {
      toast.success('Welcome back!');
      navigate(resolveDefaultRoute(useAuthStore.getState().user));
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">HanuRam Tech</h1>
          <p className="mt-2 text-gray-500">Sign in to your account</p>
        </div>

        <div className="rounded-xl border bg-white p-4 sm:p-6 lg:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
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

            <Button type="submit" className="w-full bg-amber-500" isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">
              Sign up
            </Link>
          </p>
        </div>
        <p className="mt-6 text-center text-sm text-gray-500">
          <a href="/privacy-policy" className="underline underline-offset-4 hover:text-gray-900">Privacy Policy</a>
        </p>
      </div>
    </div>
  );
}
