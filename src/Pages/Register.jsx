import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import Button from '../components/UI/button';
import Input from '../components/UI/input';
import { useAuthStore } from '../store/authstore';

export default function Register() {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
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
    const result = await register(formData);

    if (result.success) {
      if (result.otpRequired) {
        toast.success(result.message || 'OTP sent to your phone.');
        setDevOtp(result.devOtp || '');
        setRegistrationId(result.registrationId || '');
        setOtpStep(true);
      } else {
        toast.success(result.message || 'Registration successful!');
        navigate('/dashboard');
      }
    } else {
      toast.error(result.message);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const result = await register({
      ...formData,
      otp,
      registrationId,
    });

    if (result.success) {
      toast.success('Registration completed successfully!');
      navigate('/dashboard');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">CustomerLoop</h1>
          <p className="mt-2 text-gray-500">Create your account</p>
        </div>

        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <form onSubmit={otpStep ? handleOtpSubmit : handleSubmit} className="space-y-6">
            {otpStep ? (
              <>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  Enter the OTP sent to {formData.phone}.
                  {devOtp ? <span className="mt-1 block font-semibold">Development OTP: {devOtp}</span> : null}
                </div>

                <Input
                  label="Phone OTP"
                  type="text"
                  inputMode="numeric"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />

                <Button type="submit" className="w-full bg-amber-500" isLoading={isLoading}>
                  Verify OTP & Continue
                </Button>
              </>
            ) : (
              <>
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Company Name"
              type="text"
              placeholder="Acme Inc."
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              required
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />

            <Button type="submit" className="w-full bg-amber-500" isLoading={isLoading}>
              Create Account
            </Button>
              </>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
