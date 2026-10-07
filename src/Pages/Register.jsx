import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Button from '../components/UI/button';
import Input from '../components/Auth/AuthField';
import AuthLayout from '../components/Auth/AuthLayout';
import { ArrowRight, Building2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authstore';
import { authFormSchemas } from '../config/formSchemas';
import { validateBySchema } from '../utils/formValidation';
import { resolveDefaultRoute } from '../utils/defaultRoute';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    companyName: '',
  });
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [registrationId, setRegistrationId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isLoading) return;

    const registrationValidationSchema = {
      name: authFormSchemas.register.name,
      companyName: authFormSchemas.register.companyName,
      phone: authFormSchemas.register.phone,
      email: authFormSchemas.register.email,
      password: authFormSchemas.register.password,
    };
    const validationError = validateBySchema(formData, registrationValidationSchema);
    if (validationError) {
      setError(validationError);
      return;
    }

    const result = await register(formData);

    if (result.success) {
      if (result.otpRequired) {
        toast.success(result.message || 'OTP sent to your phone.');
        setDevOtp(result.devOtp || '');
        setRegistrationId(result.registrationId || '');
        setOtpStep(true);
      } else {
        toast.success(result.message || 'Registration successful!');
        navigate(resolveDefaultRoute(useAuthStore.getState().user));
      }
    } else {
      setError(result.message || 'Please try again.');
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (isLoading) return;

    const otpValidationError = validateBySchema({ otp }, { otp: authFormSchemas.register.otp });
    if (otpValidationError) {
      setError(otpValidationError);
      return;
    }

    const result = await register({
      ...formData,
      otp,
      registrationId,
    });

    if (result.success) {
      toast.success('Registration completed successfully!');
      navigate(resolveDefaultRoute(useAuthStore.getState().user));
    } else {
      setError(result.message || 'Please try again.');
    }
  };

  return (
    <AuthLayout signup>
      <div className="auth-form-icon"><Building2 size={22} /></div>
      <p className="auth-kicker">GET STARTED WITH HANURAM TECH</p>
      <h2>{otpStep ? 'Verify your phone.' : 'Build better relationships.'}</h2>
      <p className="auth-description">{otpStep ? 'Enter your verification code to finish setting up your account.' : 'Create your account and bring your customer relationships into focus.'}</p>
          <form onSubmit={otpStep ? handleOtpSubmit : handleSubmit} className="auth-form" aria-busy={isLoading}>
            {error && <div className="auth-error" role="alert">{error}</div>}
            {otpStep ? (
              <>
                <div className="auth-otp-note">
                  Enter the OTP sent to {formData.phone}.
                  {devOtp && import.meta.env.DEV ? <span className="mt-1 block font-semibold">Development OTP: {devOtp}</span> : null}
                </div>

                <Input
                  autoComplete="one-time-code" minLength={4} maxLength={8} autoFocus label="Verification code"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                />

                <Button type="submit" className="auth-submit" isLoading={isLoading}>
                  {isLoading ? 'Verifying...' : 'Verify & continue'}
                </Button>
                <button type="button" className="auth-back" disabled={isLoading} onClick={() => { setOtpStep(false); setOtp(''); setError(''); }}>Back to account details</button>
              </>
            ) : (
              <>
            <Input
              autoComplete="name" disabled={isLoading} label="Full name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              autoComplete="organization" disabled={isLoading} label="Company name"
              type="text"
              placeholder="Acme Inc."
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />

            <Input
              autoComplete="tel" disabled={isLoading} label="Phone number" hint="We will send a code to verify your phone number."
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />

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
              minLength={6} hint="Use at least 6 characters." label="Password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              autoComplete="new-password"
            />

            <Button type="submit" className="auth-submit" isLoading={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'} {!isLoading && <ArrowRight size={16} />}
            </Button>
              </>
            )}
          </form>
      <p className="auth-bottom-link">Already have an account? <Link to="/login">Sign in</Link></p>
      <p className="auth-security"><ShieldCheck size={14} /> Your customer workspace starts here</p>
    </AuthLayout>
  );
}
