import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { EnvelopeSimple, Lock, User, Buildings } from '@phosphor-icons/react';
import { toast } from 'sonner';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await register(email, password, name, tenantName);
      toast.success('Account created successfully!');
      navigate('/dashboards');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex">
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1762535371664-017f7b938f62?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2MTJ8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYXJjaGl0ZWN0dXJlJTIwY2xlYW4lMjBsaWdodHxlbnwwfHx8fDE3NzQ5MzgyMDV8MA&ixlib=rb-4.1.0&q=85)' }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 p-12 flex flex-col justify-end">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-white mb-4">
            Get Started<br />with Your Dashboard
          </h2>
          <p className="text-base text-white/90 leading-relaxed max-w-md">
            Create your account and start building powerful dashboards with Excel data integration.
          </p>
        </div>
      </div>
      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-12">
            <Buildings size={40} weight="bold" className="text-black mb-6" />
            <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-3">Create Account</h1>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Join us and start managing your business data
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 block mb-2">
                Full Name
              </label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" weight="bold" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-none focus:ring-2 focus:ring-black focus:border-black text-sm"
                  placeholder="John Doe"
                  required
                  data-testid="register-name-input"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 block mb-2">
                Email Address
              </label>
              <div className="relative">
                <EnvelopeSimple size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" weight="bold" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-none focus:ring-2 focus:ring-black focus:border-black text-sm"
                  placeholder="john@company.com"
                  required
                  data-testid="register-email-input"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 block mb-2">
                Password
              </label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" weight="bold" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-none focus:ring-2 focus:ring-black focus:border-black text-sm"
                  placeholder="••••••••"
                  required
                  minLength={6}
                  data-testid="register-password-input"
                />
              </div>
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 block mb-2">
                Company Name (Optional)
              </label>
              <div className="relative">
                <Buildings size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" weight="bold" />
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-none focus:ring-2 focus:ring-black focus:border-black text-sm"
                  placeholder="Acme Corp"
                  data-testid="register-tenant-input"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-black text-white font-bold uppercase tracking-[0.1em] text-sm rounded-none transition-all duration-200 hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="register-submit-button"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link 
                to="/login" 
                className="font-bold text-black hover:underline"
                data-testid="login-link"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;