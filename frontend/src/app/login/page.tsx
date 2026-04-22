'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_URL } from '@/lib/constants';

// Add type safety for Google and Apple SDKs
declare global {
  interface Window {
    google: any;
    AppleID: any;
    googleTokenClient: any;
  }
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRegistering, setIsRegistering] = useState(searchParams.get('register') === 'true');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState({ a: 0, b: 0, result: '' });

  useEffect(() => {
    setIsRegistering(searchParams.get('register') === 'true');
  }, [searchParams]);

  useEffect(() => {
    // Initialize Google Identity Services
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (typeof window !== 'undefined' && window.google && googleClientId) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
      });

      // Initialize Token Client for Custom Button
      window.googleTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        callback: (tokenResponse: any) => handleGoogleTokenResponse(tokenResponse),
      });
    }

    // Initialize Apple Sign In
    const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    if (typeof window !== 'undefined' && window.AppleID && appleClientId) {
      window.AppleID.auth.init({
        clientId: appleClientId,
        scope: 'name email',
        redirectURI: window.location.origin + '/login',
        usePopup: true,
      });
    }

    generateCaptcha();
  }, [isRegistering]);

  const generateCaptcha = () => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ a, b, result: '' });
  };

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/google/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });

      if (!res.ok) throw new Error('Google sign-in failed');

      const data = await res.json();
      completeLogin(data.access_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleTokenResponse = async (tokenResponse: any) => {
    if (tokenResponse.error) {
        console.error('Google OAuth Error:', tokenResponse.error);
        return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/auth/google/access-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: tokenResponse.access_token }),
      });

      if (!res.ok) throw new Error('Google sign-in failed');

      const data = await res.json();
      completeLogin(data.access_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      setError('Google Client ID not configured');
      return;
    }
    
    if (window.googleTokenClient) {
        window.googleTokenClient.requestAccessToken();
    } else {
        window.google.accounts.id.prompt(); 
    }
  };

  const handleAppleLogin = async () => {
    if (!process.env.NEXT_PUBLIC_APPLE_CLIENT_ID) {
      setError('Apple Client ID not configured');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await window.AppleID.auth.signIn();
      // response contains { authorization: { code, id_token, state }, user }
      
      const res = await fetch(`${API_URL}/auth/apple/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id_token: response.authorization.id_token,
          user: response.user 
        }),
      });

      if (!res.ok) throw new Error('Apple sign-in failed');

      const data = await res.json();
      completeLogin(data.access_token);
    } catch (err: any) {
      if (err.error !== 'popup_closed_by_user') {
        setError(err.message || 'Apple sign-in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const completeLogin = (token: string) => {
    const payloadJSON = atob(token.split('.')[1]);
    const payload = JSON.parse(payloadJSON);
    
    if (payload.role === 'Admin') {
        throw new Error('Administrators must log in through the secure HQ Portal.');
    }

    localStorage.setItem('access_token', token);
    router.push('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRegistering && parseInt(captcha.result) !== captcha.a + captcha.b) {
      setError('Incorrect captcha solution. Please try again.');
      generateCaptcha();
      return;
    }

    setError('');
    setLoading(true);

    try {
      const endpoint = isRegistering ? '/auth/register' : '/auth/login';
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || (isRegistering ? 'Registration failed' : 'Invalid credentials'));
      }

      const data = await res.json();
      completeLogin(data.access_token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-24 min-h-[80vh]">
      <div className="w-full max-w-md p-8 rounded-2xl bg-white/[0.03] border border-white/5 shadow-2xl backdrop-blur-xl h-fit">
        <h2 className="text-3xl font-bold text-white mb-2 text-center">
          {isRegistering ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-400 text-center mb-8">
          {isRegistering ? 'Start extracting data today' : 'Sign in to your account'}
        </p>

        {error && (
          <div className="mb-4 bg-red-500/20 border border-red-500/50 text-red-300 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com" 
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono" 
            />
          </div>

          {isRegistering && (
            <div className="mt-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-xs font-black uppercase tracking-widest text-blue-400 mb-2">Human Verification</label>
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                <span className="text-lg font-black text-white italic">{captcha.a} + {captcha.b} = </span>
                <input 
                  type="number"
                  required
                  value={captcha.result}
                  onChange={(e) => setCaptcha({ ...captcha, result: e.target.value })}
                  placeholder="?"
                  className="w-20 px-3 py-2 rounded-lg bg-black/50 border border-white/10 text-white text-center font-black focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(37,99,235,0.3)]"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          {isRegistering ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            {isRegistering ? 'Log in here' : 'Register now'}
          </button>
        </p>

        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-sm text-gray-600 uppercase font-medium">or continue with</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button 
            type="button" 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center gap-3 w-full justify-center disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M11.99 13.9v-3.72h9.36c.14.73.22 1.5.22 2.33 0 6.64-4.59 11.36-11.58 11.36C4.85 23.87 0 19.04 0 12S4.85.13 10.15.13c3.08 0 5.76 1.13 7.82 3.09l-2.84 2.76c-1.39-1.29-3.32-2.07-5.11-2.07-4.14 0-7.53 3.39-7.53 7.53s3.39 7.53 7.53 7.53c4.27 0 6.64-2.88 7.08-5.07h-7.11z"/></svg>
            <span className="font-medium text-sm">Google</span>
          </button>
          <button 
            type="button" 
            onClick={handleAppleLogin}
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors flex items-center gap-3 w-full justify-center disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 17 19"><path fill="currentColor" d="M12.44.1A6.74 6.74 0 0011 2.92a6.43 6.43 0 00-2 4.19 5.86 5.86 0 001.5 0 6.66 6.66 0 001.37-2.73 6.51 6.51 0 002-4.28 5.75 5.75 0 00-1.43 0zM17 14.54c0 1.94-1.35 4.09-3 4.09-1 0-1.57-.65-3-.65s-1.89.65-3 .65c-1.63 0-3-2.15-3-4.09v-.53c0-3.6 2.31-5.5 4.54-5.5a4.23 4.23 0 012.82 1.35 4 4 0 012.78-1.35C16.51 8.5 17 10 17 10s-1.82.72-1.82 2.65a2.53 2.53 0 001.44 2.21v-.32H17zM1.77 15C1 13.9.52 12.16.52 10.3c0-2 .69-4.2 1.9-5.5a5.45 5.45 0 014.24-1.92c1 0 1.57.65 3 .65s1.89-.65 3-.65a5.43 5.37 0 014.15 1.83 5.17 5.17 0 01-1.25 3.32c-1.12 1.44-2.78 2.29-4.52 2.29a4.83 4.83 0 01-2.91-1 4.5 4.5 0 00-2.82 1.13A4 4 0 001.77 15z"/></svg>
            <span className="font-medium text-sm">Apple</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#050505]">
          <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
