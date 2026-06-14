import { useState } from 'react';
import { supabase } from '../supabase';

function ResetPassword({ onDone }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters!');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match!');
      return;
    }
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password updated successfully!');
      setTimeout(() => onDone(), 2000);
    }
    setLoading(false);
  }

  return (
    <div className='setup-screen'>
      <div className='setup-card'>
        <h1>💰 FinBuddy</h1>
        <p className='setup-subtitle'>Set your new password</p>
        {success && <p className='success-msg'>✅ {success}</p>}
        {error && <p className='error-msg'>{error}</p>}
        <div className='form-group'>
          <label>New Password</label>
          <input
            type='password'
            placeholder='Min 6 characters'
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <div className='form-group'>
          <label>Confirm Password</label>
          <input
            type='password'
            placeholder='Repeat your password'
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
        </div>
        <button className='btn-primary' onClick={handleReset} disabled={loading}>
          {loading ? 'Updating...' : 'Update Password →'}
        </button>
      </div>
    </div>
  );
}

export default ResetPassword;