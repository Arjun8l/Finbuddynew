import { useState } from 'react';

function SetupScreen({ onComplete }) {
  const [income, setIncome] = useState('');
  const [currentSavings, setCurrentSavings] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    const inc = parseFloat(income);
    if (!inc || inc <= 0) {
      setError('Please enter a valid monthly income greater than zero.');
      return;
    }
    setError('');
    onComplete({
      income: inc,
      savings: parseFloat(currentSavings) || 0,
      goal: parseFloat(savingsGoal) || 0
    });
  }

  return (
    <div className='setup-screen'>
      <div className='setup-card'>
        <h1>💰 FinBuddy</h1>
        <p className='setup-subtitle'>Let's set up your financial profile</p>

        <div className='form-group'>
          <label>Monthly Income (₹) *</label>
          <input
            type='number'
            placeholder='e.g. 50000'
            value={income}
            onChange={e => setIncome(e.target.value)}
          />
        </div>

        <div className='form-group'>
          <label>Current Savings Balance (₹)</label>
          <input
            type='number'
            placeholder='e.g. 10000'
            value={currentSavings}
            onChange={e => setCurrentSavings(e.target.value)}
          />
        </div>

        <div className='form-group'>
          <label>Savings Goal (₹)</label>
          <input
            type='number'
            placeholder='e.g. 100000'
            value={savingsGoal}
            onChange={e => setSavingsGoal(e.target.value)}
          />
        </div>

        {error && <p className='error-msg'>{error}</p>}

        <button className='btn-primary' onClick={handleSubmit}>
          Start Budgeting →
        </button>
      </div>
    </div>
  );
}

export default SetupScreen;