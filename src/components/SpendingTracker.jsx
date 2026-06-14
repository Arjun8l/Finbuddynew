import { useEffect, useState } from 'react';
import { supabase } from '../supabase';

function SpendingTracker({ categories, user }) {
  const [spendings, setSpendings] = useState([]);
  const [inputValues, setInputValues] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [userPhone, setUserPhone] = useState(null);
  const [loadingRows, setLoadingRows] = useState({});

  async function loadSpendings() {
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles').select('phone').eq('id', user.id).single();
    if (!profile?.phone) return;
    setUserPhone(profile.phone);
    const { data } = await supabase
      .from('spendings').select('*').eq('phone', profile.phone);
    if (data) {
      setSpendings(data);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }

  useEffect(() => {
    loadSpendings();
    const interval = setInterval(loadSpendings, 30000);
    return () => clearInterval(interval);
  }, [user]);

  async function handleAdd(catName) {
    const key = catName.toLowerCase();
    const value = parseFloat(inputValues[key]) || 0;
    if (!value || !userPhone) return;

    setLoadingRows(prev => ({ ...prev, [key]: true }));
    const { error } = await supabase.from('spendings').insert({
      phone: userPhone, category: key, amount: value, note: 'manual',
    });
    setLoadingRows(prev => ({ ...prev, [key]: false }));

    if (!error) {
      setInputValues(prev => ({ ...prev, [key]: '' }));
      loadSpendings();
    }
  }

  function handleKeyDown(e, catName) {
    if (e.key === 'Enter') handleAdd(catName);
  }

  function getWhatsapp(catName) {
    return spendings
      .filter(s => s.category === catName.toLowerCase() && s.note !== 'manual')
      .reduce((sum, s) => sum + Number(s.amount), 0);
  }

  function getManual(catName) {
    return spendings
      .filter(s => s.category === catName.toLowerCase() && s.note === 'manual')
      .reduce((sum, s) => sum + Number(s.amount), 0);
  }

  function getTotal(catName) {
    return spendings
      .filter(s => s.category === catName.toLowerCase())
      .reduce((sum, s) => sum + Number(s.amount), 0);
  }

  function getBarPercent(total, budget) {
    if (!budget) return 0;
    return Math.min((total / budget) * 100, 100);
  }

  function isOver(total, budget) {
    return total > budget && budget > 0;
  }

  return (
    <div className='module-container'>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <h2>Spending Tracker</h2>
        <button onClick={loadSpendings} className='btn-sync'>
          ↺ Sync
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--silver)' }}>
          Log manually or pull from WhatsApp.
        </p>
        {lastUpdated && (
          <span style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            fontFamily: "'Space Grotesk', sans-serif",
          }}>
            Updated {lastUpdated}
          </span>
        )}
      </div>

      {categories.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          color: 'var(--text-muted)',
          fontSize: '0.88rem',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--r-md)',
        }}>
          Set up your budget categories first.
        </div>
      )}

      {categories.map(cat => {
        const key = cat.name.toLowerCase();
        const manual = getManual(cat.name);
        const whatsapp = getWhatsapp(cat.name);
        const total = getTotal(cat.name);
        const over = isOver(total, cat.budget);
        const pct = getBarPercent(total, cat.budget);
        const isLoading = loadingRows[key];

        return (
          <div key={cat.id} className='tracker-row'>

            {/* Row header */}
            <div className='tracker-header'>
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.25rem', filter: 'grayscale(20%)' }}>{cat.icon}</span>
                {cat.name}
              </span>
              <span style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                background: 'var(--graphite)',
                padding: '3px 12px',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                letterSpacing: '0.02em',
              }}>
                Budget ₹{cat.budget.toLocaleString()}
              </span>
            </div>

            {/* Input row */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
              <input
                type='number'
                placeholder='Enter amount…'
                value={inputValues[key] || ''}
                onChange={e => setInputValues(prev => ({ ...prev, [key]: e.target.value }))}
                onKeyDown={e => handleKeyDown(e, cat.name)}
                className='actual-input'
                style={{ margin: 0, flex: 1 }}
                disabled={isLoading}
              />
              <button
                onClick={() => handleAdd(cat.name)}
                disabled={isLoading || !inputValues[key]}
                style={{
                  padding: '9px 20px',
                  background: isLoading ? 'var(--graphite)' : 'var(--pure)',
                  color: isLoading ? 'var(--silver)' : 'var(--obsidian)',
                  border: 'none',
                  borderRadius: 'var(--r-sm)',
                  cursor: isLoading || !inputValues[key] ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s var(--ease)',
                  opacity: (!inputValues[key] && !isLoading) ? 0.4 : 1,
                  flexShrink: 0,
                  letterSpacing: '0.02em',
                }}
              >
                {isLoading ? '…' : '+ Add'}
              </button>
            </div>

            {/* Source chips */}
            {(manual > 0 || whatsapp > 0) && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                {manual > 0 && (
                  <span className='source-chip chip-manual'>
                    ✏ Manual ₹{manual.toLocaleString()}
                  </span>
                )}
                {whatsapp > 0 && (
                  <span className='source-chip chip-whatsapp'>
                    ◎ WhatsApp ₹{whatsapp.toLocaleString()}
                  </span>
                )}
                <span className={`source-chip chip-total ${over ? 'chip-over' : 'chip-ok'}`}>
                  {over ? '⚠ ' : ''}Total ₹{total.toLocaleString()}
                </span>
              </div>
            )}

            {/* Progress bar */}
            <div className='progress-track'>
              <div
                className={`progress-bar ${over ? 'over-budget' : 'on-budget'}`}
                style={{ width: `${pct}%` }}
              />
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '6px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              <span>{Math.round(pct)}% used</span>
              <span>
                {over
                  ? <span className='overspend-warning' style={{ margin: 0 }}>
                      ⚠ Over by ₹{(total - cat.budget).toLocaleString()}
                    </span>
                  : `₹${(cat.budget - total).toLocaleString()} remaining`
                }
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SpendingTracker;
