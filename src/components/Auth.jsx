import { useState } from 'react';
import { supabase } from '../supabase';

// n8n Webhooks (Production URLs)
const EMAIL_OTP_WEBHOOK = 'https://emailotp.app.n8n.cloud/webhook/2070431d-6bdf-40be-a832-7bbc08df1450';
const WHATSAPP_OTP_WEBHOOK = 'https://emailotp.app.n8n.cloud/webhook/71a22c53-460b-49ee-bcb6-455acd1436ff';

function Auth({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);

  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpLoading, setPhoneOtpLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function resetForm() {
    setName(''); setEmail(''); setPhone(''); setPassword('');
    setEmailOtp(''); setPhoneOtp('');
    setEmailOtpSent(false); setPhoneOtpSent(false);
    setEmailVerified(false); setPhoneVerified(false);
    setError(''); setSuccess('');
  }

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  async function handleLogin() {
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true); setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
    } else {
      setTimeout(() => onLogin(data.user), 400);
    }
    setLoading(false);
  }

  // ─── GOOGLE LOGIN ─────────────────────────────────────────────────────────
  async function handleGoogleLogin() {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        queryParams: {
          prompt: 'select_account',
        },
      },
    });
    if (error) setError(error.message);
  }

  // ─── SEND EMAIL OTP ───────────────────────────────────────────────────────
  async function handleSendEmailOtp() {
    if (!name) { setError('Please enter your name first!'); return; }
    if (!email) { setError('Please enter your email!'); return; }
    setEmailOtpLoading(true); setError('');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const { error: dbError } = await supabase.from('email_otps').insert({
      email,
      otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    if (dbError) {
      setError('Failed to generate OTP. Try again!');
      setEmailOtpLoading(false);
      return;
    }

    try {
      await fetch(EMAIL_OTP_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, name }),
      });
    } catch (err) {
      console.log('Email webhook error', err);
    }

    setEmailOtpSent(true);
    setSuccess('OTP sent to your email! Check your inbox.');
    setEmailOtpLoading(false);
  }

  // ─── VERIFY EMAIL OTP ─────────────────────────────────────────────────────
  async function handleVerifyEmailOtp() {
    if (!emailOtp || emailOtp.length !== 6) {
      setError('Please enter the 6-digit OTP from your email!'); return;
    }
    setEmailOtpLoading(true); setError('');

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email)
      .eq('otp', emailOtp)
      .eq('used', false)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      setError('Invalid or expired OTP! Please try again.');
      setEmailOtpLoading(false);
      return;
    }

    await supabase.from('email_otps').update({ used: true }).eq('id', data.id);

    setEmailVerified(true);
    setSuccess('Email verified! ✅ Now verify your WhatsApp number.');
    setEmailOtpLoading(false);
  }

  // ─── SEND WHATSAPP OTP ────────────────────────────────────────────────────
  async function handleSendPhoneOtp() {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit phone number!'); return;
    }
    setPhoneOtpLoading(true); setError('');

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const formattedPhone = `whatsapp:+91${phone.replace(/\D/g, '')}`;

    const { error: dbError } = await supabase.from('whatsapp_otps').insert({
      phone: formattedPhone,
      otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    if (dbError) {
      setError('Failed to generate OTP. Try again!');
      setPhoneOtpLoading(false);
      return;
    }

    try {
      await fetch(WHATSAPP_OTP_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, otp, name }),
      });
    } catch (err) {
      console.log('WhatsApp webhook error', err);
    }

    setPhoneOtpSent(true);
    setSuccess('OTP sent to your WhatsApp! Check your messages.');
    setPhoneOtpLoading(false);
  }

  // ─── VERIFY WHATSAPP OTP ──────────────────────────────────────────────────
  async function handleVerifyPhoneOtp() {
    if (!phoneOtp || phoneOtp.length !== 6) {
      setError('Please enter the 6-digit WhatsApp OTP!'); return;
    }
    setPhoneOtpLoading(true); setError('');

    const formattedPhone = `whatsapp:+91${phone.replace(/\D/g, '')}`;
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('whatsapp_otps')
      .select('*')
      .eq('phone', formattedPhone)
      .eq('otp', phoneOtp)
      .eq('used', false)
      .gte('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      setError('Invalid or expired WhatsApp OTP! Please try again.');
      setPhoneOtpLoading(false);
      return;
    }

    await supabase.from('whatsapp_otps').update({ used: true }).eq('id', data.id);

    setPhoneVerified(true);
    setSuccess('WhatsApp verified! ✅');
    setPhoneOtpLoading(false);
  }

  // ─── COMPLETE SIGNUP ──────────────────────────────────────────────────────
  async function handleCompleteSignup() {
    if (!name) { setError('Please enter your name!'); return; }
    if (!emailVerified) { setError('Please verify your email first!'); return; }
    if (!phoneVerified) { setError('Please verify your WhatsApp first!'); return; }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters!'); return;
    }
    setLoading(true); setError('');

    const formattedPhone = `whatsapp:+91${phone.replace(/\D/g, '')}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name,
        email,
        phone: formattedPhone,
      });
    }

    setSuccess('🎉 Account created! You can now log in.');
    setMode('login');
    resetForm();
    setLoading(false);
  }

  // ─── FORGOT PASSWORD ──────────────────────────────────────────────────────
  async function handleForgotPassword() {
    if (!email) { setError('Please enter your email!'); return; }
    setLoading(true); setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password reset link sent to ' + email + '! Check your inbox.');
    }
    setLoading(false);
  }

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div className='setup-screen'>
      <div className='setup-card'>
        <h1>💰 FinBuddy</h1>

        {(mode === 'login' || mode === 'signup') && (
          <div className='auth-tabs'>
            <button
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); resetForm(); }}
            >
              Login
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); resetForm(); }}
            >
              Sign Up
            </button>
          </div>
        )}

        {success && <p className='success-msg'>✅ {success}</p>}
        {error && <p className='error-msg'>⚠️ {error}</p>}

        {/* ══════ LOGIN ══════ */}
        {mode === 'login' && (
          <>
            <div className='form-group'>
              <label>Email</label>
              <input type='email' placeholder='your@email.com'
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className='form-group'>
              <label>Password</label>
              <input type='password' placeholder='Your password'
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()} />
            </div>
            <button className='btn-primary' onClick={handleLogin} disabled={loading}>
              {loading ? 'Please wait...' : 'Login →'}
            </button>

            <div className='divider-or'><span>or</span></div>

            <button className='btn-google' onClick={handleGoogleLogin} type='button'>
              <svg width="18" height="18" viewBox="0 0 48 48" style={{ marginRight: 8 }}>
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Continue with Google
            </button>

            <p className='forgot-link' onClick={() => { setMode('forgot'); resetForm(); }}>
              Forgot Password?
            </p>
          </>
        )}

        {/* ══════ SIGNUP ══════ */}
        {mode === 'signup' && (
          <>
            {/* Name */}
            <div className='form-group'>
              <label>Full Name</label>
              <input type='text' placeholder='e.g. Arjun'
                value={name} onChange={e => setName(e.target.value)} />
            </div>

            {/* Email + OTP */}
            <div className='form-group'>
              <label>
                Email
                {emailVerified && <span className='verified-badge'>✅ Verified</span>}
              </label>
              <div className='otp-row'>
                <input type='email' placeholder='your@email.com'
                  value={email} onChange={e => setEmail(e.target.value)}
                  disabled={emailVerified} />
                <button className='btn-otp'
                  onClick={handleSendEmailOtp}
                  disabled={emailOtpLoading || emailVerified}>
                  {emailOtpLoading ? '...' : emailVerified ? '✅' : emailOtpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
              {emailOtpSent && !emailVerified && (
                <div className='otp-verify-row'>
                  <input type='text' placeholder='Enter 6-digit email OTP'
                    value={emailOtp} onChange={e => setEmailOtp(e.target.value)}
                    maxLength={6} inputMode='numeric' />
                  <button className='btn-otp'
                    onClick={handleVerifyEmailOtp}
                    disabled={emailOtpLoading}>
                    {emailOtpLoading ? '...' : 'Verify'}
                  </button>
                </div>
              )}
            </div>

            {/* WhatsApp + OTP */}
            <div className='form-group'>
              <label>
                WhatsApp Number <span className='label-hint'>(without +91)</span>
                {phoneVerified && <span className='verified-badge'>✅ Verified</span>}
              </label>
              <div className='otp-row'>
                <input type='tel' placeholder='e.g. 9182817968'
                  value={phone} onChange={e => setPhone(e.target.value)}
                  disabled={phoneVerified} maxLength={10} />
                <button className='btn-otp'
                  onClick={handleSendPhoneOtp}
                  disabled={phoneOtpLoading || phoneVerified || !emailVerified}>
                  {phoneOtpLoading ? '...' : phoneVerified ? '✅' : phoneOtpSent ? 'Resend' : 'Send OTP'}
                </button>
              </div>
              {!emailVerified && (
                <p className='field-hint'>Verify email first to unlock WhatsApp OTP</p>
              )}
              {phoneOtpSent && !phoneVerified && (
                <div className='otp-verify-row'>
                  <input type='text' placeholder='Enter 6-digit WhatsApp OTP'
                    value={phoneOtp} onChange={e => setPhoneOtp(e.target.value)}
                    maxLength={6} inputMode='numeric' />
                  <button className='btn-otp'
                    onClick={handleVerifyPhoneOtp}
                    disabled={phoneOtpLoading}>
                    {phoneOtpLoading ? '...' : 'Verify'}
                  </button>
                </div>
              )}
            </div>

            {/* Password */}
            <div className='form-group'>
              <label>Password</label>
              <input type='password' placeholder='Min 6 characters'
                value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <button className='btn-primary'
              onClick={handleCompleteSignup}
              disabled={loading || !emailVerified || !phoneVerified}>
              {loading ? 'Creating Account...' : 'Create Account →'}
            </button>
          </>
        )}

        {/* ══════ FORGOT PASSWORD ══════ */}
        {mode === 'forgot' && (
          <>
            <p className='setup-subtitle'>Enter your email to reset password</p>
            <div className='form-group'>
              <label>Email</label>
              <input type='email' placeholder='your@email.com'
                value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <button className='btn-primary' onClick={handleForgotPassword} disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link →'}
            </button>
            <p className='forgot-link' onClick={() => { setMode('login'); resetForm(); }}>
              ← Back to Login
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Auth;
