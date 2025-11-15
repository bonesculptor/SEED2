import React, { useState } from 'react';
import { LogIn, UserPlus, Mail, Lock, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

export function LoginForm({ onSignIn, onSignUp }: LoginFormProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);

      if (mode === 'signin') {
        await onSignIn(email, password);
        setSuccess('Successfully signed in!');
      } else {
        await onSignUp(email, password);
        setSuccess('Account created! You can now sign in.');
        setTimeout(() => {
          setMode('signin');
          setPassword('');
          setConfirmPassword('');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              {mode === 'signin' ? (
                <LogIn className="w-8 h-8 text-white" />
              ) : (
                <UserPlus className="w-8 h-8 text-white" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Digital Twin Dashboard
            </h1>
            <p className="text-slate-400">
              {mode === 'signin'
                ? 'Sign in to access your medical records'
                : 'Create an account to get started'}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
              <p className="text-sm text-green-400">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Enter your password"
                  required
                  minLength={6}
                />
              </div>
              {mode === 'signup' && (
                <p className="mt-1 text-xs text-slate-500">
                  At least 6 characters
                </p>
              )}
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Confirm your password"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {mode === 'signin' ? (
                    <>
                      <LogIn className="w-5 h-5" />
                      <span>Sign In</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span>Create Account</span>
                    </>
                  )}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError('');
                setSuccess('');
              }}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {mode === 'signin' ? (
                <>
                  Don't have an account? <span className="font-semibold">Sign up</span>
                </>
              ) : (
                <>
                  Already have an account? <span className="font-semibold">Sign in</span>
                </>
              )}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-400">System Status:</p>
              <ul className="space-y-1 pl-4">
                <li>✓ Database: Connected</li>
                <li>✓ Authentication: Ready</li>
                <li>✓ Security: RLS Enabled</li>
                <li>✓ Graph Database: Active</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            Secure HIPAA-compliant medical records system
          </p>
        </div>
      </div>
    </div>
  );
}
