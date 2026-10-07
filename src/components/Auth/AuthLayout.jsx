import { ArrowUpRight, BarChart3, Building2, Check, Layers3, MessageSquare, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import './auth.css';

export default function AuthLayout({ children, signup = false }) {
  return (
    <main className="auth-page">
      <aside className="auth-story">
        <Link to="/login" className="auth-brand"><span className="auth-brand-mark"><Layers3 size={23} /></span><span>HanuRam<span className="auth-brand-tech">TECH</span></span></Link>
        <div className="auth-story-content">
          <span className="auth-eyebrow">YOUR CUSTOMER GROWTH WORKSPACE</span>
          <h1>Better connections.<br /><span>Stronger business.</span></h1>
          <p>Bring your customers, conversations, and campaigns together. Give your team the clarity to move forward.</p>
          <div className="auth-workspace" aria-label="Workspace capabilities">
            <div className="auth-workspace-top"><span><Building2 size={17} /> Your workspace</span><span className="auth-workspace-badge">Connected</span></div>
            <div className="auth-feature"><span className="auth-feature-icon"><Users size={20} /></span><div><strong>Know your customers</strong><small>One place for every customer relationship</small></div><Check size={16} /></div>
            <div className="auth-feature"><span className="auth-feature-icon"><MessageSquare size={20} /></span><div><strong>Make every conversation count</strong><small>Connect through WhatsApp campaigns</small></div><Check size={16} /></div>
            <div className="auth-feature"><span className="auth-feature-icon"><BarChart3 size={20} /></span><div><strong>Turn insights into action</strong><small>Keep your team focused on what matters</small></div><ArrowUpRight size={17} /></div>
          </div>
          <div className="auth-story-note"><span /> Built for the way your team works</div>
        </div>
        <div className="auth-story-footer">Customer relationships. Thoughtfully connected.</div>
      </aside>
      <section className="auth-main">
        <div className="auth-top-link">{signup ? 'Already have an account?' : 'New to HanuRam Tech?'}<Link to={signup ? '/login' : '/register'}>{signup ? 'Sign in' : 'Create an account'} <ArrowUpRight size={14} /></Link></div>
        <div className="auth-form-container">{children}</div>
        <footer className="auth-footer"><span>© {new Date().getFullYear()} HanuRam Tech</span><Link to="/privacy-policy">Privacy policy</Link></footer>
      </section>
    </main>
  );
}
