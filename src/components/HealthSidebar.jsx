import { useState, useEffect, useRef } from 'react';
import { getSavingsRate, getHealthStatus } from '../utils/financeHelpers';

const tips = [
  'Track every expense — small ones add up faster than you think.',
  'The 50/30/20 rule: 50% needs, 30% wants, 20% savings.',
  'Build an emergency fund covering 3–6 months of expenses.',
  'Pay yourself first: transfer to savings before spending.',
  'Review your subscriptions monthly and cancel unused ones.',
  'Cook at home more — food is often the easiest budget to trim.',
  'Avoid lifestyle inflation when your income increases.',
  'Set specific savings goals — vague goals rarely get achieved.',
  'Invest early; even small amounts benefit from compound growth.',
  'A budget is not a restriction, it is a permission slip to spend.',
];

function HealthSidebar({ income, savings, savingsGoal, categories }) {
  const [tipIndex, setTipIndex] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // Close on outside click (mobile only)
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        mobileOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !e.target.closest('.health-sidebar-toggle')
      ) {
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileOpen]);

  const totalSpent   = categories.reduce((s, c) => s + (c.actual || 0), 0);
  const remaining    = income - totalSpent;
  const savingsRate  = getSavingsRate(totalSpent, income);
  const healthStatus = getHealthStatus(savingsRate);
  const goalProgress = savingsGoal > 0 ? Math.min((savings / savingsGoal) * 100, 100) : 0;

  const sidebarContent = (
    <>
      <h3>Financial Health</h3>

      <div className={`health-badge health-${healthStatus.toLowerCase().replace(' ', '-')}`}>
        {healthStatus}
      </div>

      <div className='sidebar-stat'>
        <span>Monthly Income</span>
        <strong>₹{income.toLocaleString()}</strong>
      </div>
      <div className='sidebar-stat'>
        <span>Remaining</span>
        <strong>₹{remaining.toLocaleString()}</strong>
      </div>
      <div className='sidebar-stat'>
        <span>Savings Rate</span>
        <strong>{savingsRate}%</strong>
      </div>

      {savingsGoal > 0 && (
        <div className='goal-section'>
          <p>Savings Goal Progress</p>
          <div className='goal-track'>
            <div className='goal-bar' style={{ width: `${goalProgress}%` }} />
          </div>
          <p>{Math.round(goalProgress)}% of ₹{savingsGoal.toLocaleString()}</p>
        </div>
      )}

      <div className='tip-box'>
        <p className='tip-label'>💡 Tip</p>
        <p className='tip-text'>{tips[tipIndex]}</p>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className='health-sidebar-toggle'
        onClick={() => setMobileOpen(o => !o)}
        aria-label='Toggle Financial Health'
      >
        ◈
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && <div className='health-sidebar-backdrop' onClick={() => setMobileOpen(false)} />}

      {/* Sidebar — desktop always visible, mobile slides in */}
      <aside
        ref={sidebarRef}
        className={`health-sidebar${mobileOpen ? ' mobile-open' : ''}`}
      >
        {/* Mobile close button inside panel */}
        <button
          className='health-sidebar-close'
          onClick={() => setMobileOpen(false)}
          aria-label='Close'
        >
          ✕
        </button>

        {sidebarContent}
      </aside>
    </>
  );
}

export default HealthSidebar;
