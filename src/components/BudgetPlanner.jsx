import { useState } from 'react';

function BudgetPlanner({ income, categories, onUpdateBudget, onAddCategory, onRemoveCategory, onSyncWhatsapp }) {
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('📦');
  const [syncing, setSyncing] = useState(false);

  const totalBudgeted = categories.reduce((sum, c) => sum + (c.budget || 0), 0);
  const unallocated = income - totalBudgeted;
  const pctAllocated = income > 0 ? Math.min((totalBudgeted / income) * 100, 100) : 0;

  function handleAdd() {
    if (!newName.trim()) return;
    onAddCategory({ name: newName.trim(), icon: newIcon, recommended: 0 });
    setNewName('');
    setNewIcon('📦');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd();
  }

  async function handleSync() {
    if (!onSyncWhatsapp) return;
    setSyncing(true);
    await onSyncWhatsapp();
    setSyncing(false);
  }

  return (
    <div className='module-container'>

      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
        <h2>Budget Planner</h2>
        <button onClick={handleSync} disabled={syncing} className='btn-sync'>
          {syncing ? '⏳ Syncing…' : '↺ Sync WhatsApp'}
        </button>
      </div>

      {/* Income + allocation bar */}
      <div style={{ marginBottom: '20px' }}>
        <p className='income-display'>
          Monthly income — <strong>₹{income.toLocaleString()}</strong>
        </p>

        {/* Thin allocation meter */}
        <div style={{
          height: '2px',
          background: 'var(--graphite)',
          borderRadius: '20px',
          marginTop: '10px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${pctAllocated}%`,
            background: unallocated < 0
              ? 'linear-gradient(90deg, var(--amber), var(--danger))'
              : 'linear-gradient(90deg, var(--silver), var(--pure))',
            borderRadius: '20px',
            transition: 'width 0.5s var(--ease)',
          }} />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
          fontSize: '0.72rem',
          color: 'var(--text-muted)',
          fontFamily: "'Space Grotesk', sans-serif",
        }}>
          <span>{Math.round(pctAllocated)}% allocated</span>
          <span>₹{totalBudgeted.toLocaleString()} / ₹{income.toLocaleString()}</span>
        </div>
      </div>

      {/* Unallocated badge */}
      <div className={`unallocated ${unallocated < 0 ? 'over' : ''}`}>
        {unallocated < 0 ? '⚠' : '✦'}&nbsp;
        {unallocated < 0
          ? `Over-allocated by ₹${Math.abs(unallocated).toLocaleString()}`
          : `₹${unallocated.toLocaleString()} unallocated`}
      </div>

      {/* Category rows */}
      <div className='category-list'>
        {categories.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            border: '1px dashed var(--border)',
            borderRadius: 'var(--r-md)',
          }}>
            No categories yet — add one below.
          </div>
        )}

        {categories.map(cat => (
          <div key={cat.id} className='category-row'>
            <span className='cat-icon'>{cat.icon}</span>
            <span className='cat-name'>{cat.name}</span>
            {cat.recommended > 0 && (
              <span className='cat-recommended'>
                ₹{Math.round(cat.recommended).toLocaleString()} suggested
              </span>
            )}
            <input
              type='number'
              value={cat.budget}
              min={0}
              onChange={e => onUpdateBudget(cat.id, parseFloat(e.target.value) || 0)}
              className='budget-input'
              placeholder='0'
            />
            <button
              onClick={() => onRemoveCategory(cat.id)}
              className='btn-remove'
              title={`Remove ${cat.name}`}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add category */}
      <div className='add-category'>
        <h3>Add category</h3>
        <div className='add-row' style={{ marginTop: '14px' }}>
          <input
            type='text'
            placeholder='Category name'
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            type='text'
            placeholder='Icon'
            value={newIcon}
            onChange={e => setNewIcon(e.target.value)}
            className='icon-input'
          />
          <button onClick={handleAdd} className='btn-primary'>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

export default BudgetPlanner;
