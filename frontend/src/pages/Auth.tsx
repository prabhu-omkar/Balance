import { useState } from 'react';
import axios from 'axios';
import { useStore } from '../store/store';
import { Activity } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [upiId, setUpiId] = useState('');
  const [globalOptIn, setGlobalOptIn] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { setCurrentUser } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const payload = isLogin ? { name, password } : { name, password, upiId, globalOptIn };
      const res = await axios.post(endpoint, payload);
      setCurrentUser(res.data.user, res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-sm animate-fade-in relative z-10">
        <div className="flex flex-col items-center justify-center space-y-3 mb-8">
          <div className="w-12 h-12 bg-white rounded-xl shadow-subtle flex items-center justify-center border border-border">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-primary">Balance</h1>
            <p className="text-sm text-secondary mt-1">The minimalist debt simplifier</p>
          </div>
        </div>

        <div className="card p-8">
          <h2 className="text-lg font-medium mb-6">{isLogin ? 'Sign in to your account' : 'Create an account'}</h2>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-negative text-sm border border-red-100 rounded-md flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-negative block" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-primary">Username</label>
              <input type="text" required className="input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-primary">Password</label>
              <input type="password" required className="input" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {!isLogin && (
              <div className="animate-fade-in stagger-1">
                <label className="block text-sm font-medium mb-1.5 text-primary">UPI ID <span className="text-tertiary font-normal">(Optional)</span></label>
                <input type="text" className="input" placeholder="e.g. name@bank" value={upiId} onChange={e => setUpiId(e.target.value)} />
                
                <div className="flex items-start gap-3 mt-5 p-3 bg-gray-50 rounded-md border border-border">
                  <div className="flex items-center h-5">
                    <input 
                      type="checkbox" 
                      id="optIn" 
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" 
                      checked={globalOptIn} 
                      onChange={e => setGlobalOptIn(e.target.checked)} 
                    />
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="optIn" className="text-sm font-medium text-primary cursor-pointer">Global Minimal Cash Flow</label>
                    <p className="text-xs text-secondary mt-0.5 leading-relaxed">
                      Participate in the global network to automatically simplify debts with mutual contacts.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-2 relative overflow-hidden group">
              <span className={`transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </span>
              {loading && <div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-secondary">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:text-accent font-medium transition-colors">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
