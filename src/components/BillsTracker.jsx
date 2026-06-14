import { useState } from 'react';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / DAY_MS);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function statusLabel(days) {
  if (days < 0) return { text: 'Overdue', cls: 'bill-overdue' };
  if (days === 0) return { text: 'Due today', cls: 'bill-today' };
  if (days <= 3) return { text: `Due in ${days}d`, cls: 'bill-soon' };
  return { text: `Due in ${days}d`, cls: 'bill-upcoming' };
}

function BillsTracker({ bills, onAddBill, onRemoveBill, onTogglePaid }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  function handleAdd() {
    if (!name.trim() || !dueDate) return;
    onAddBill({
      id: Date.now(),
      name: name.trim(),
      amount: Number(amount) || 0,
      dueDate,
      paid: false,
    });
    setName('');
    setAmount('');
    setDueDate('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleAdd();
  }

  const sorted = [...(bills || [])].sort((a, b) =>
    new Date(a.dueDate) - new Date(b.dueDate)
  );

  const unpaid = sorted.filter(b => !b.paid);
  const totalDue = unpaid.reduce((s, b) => s + (b.amount || 0), 0);
  const overdueCount = unpaid.filter(b => daysUntil(b.dueDate) < 0).length;

  return (
    <div className='bills-tracker'>
      <h3>Upcoming Bills</h3>

      <div className='bills-summary'>
        <div className='bills-summary-item'>
          <span>Total Due</span>
          <strong>₹{totalDue.toLocaleString()}</strong>
        </div>
        <div className='bills-summary-item'>
          <span>Overdue</span>
          <strong className={overdueCount > 0 ? 'text-amber' : ''}>{overdueCount}</strong>
        </div>
      </div>

      <div className='bills-list'>
        {sorted.length === 0 && (
          <p className='bills-empty'>No bills added yet.</p>
        )}
        {sorted.map(bill => {
          const days = daysUntil(bill.dueDate);
          const status = statusLabel(days);
          return (
            <div
              className={`bill-row ${bill.paid ? 'bill-paid' : ''}`}
              key={bill.id}
            >
              <label className='bill-checkbox'>
                <input
                  type='checkbox'
                  checked={!!bill.paid}
                  onChange={() => onTogglePaid(bill.id)}
                />
              </label>
              <div className='bill-info'>
                <div className='bill-name-row'>
                  <span className='bill-name'>{bill.name}</span>
                  <span className='bill-amount'>₹{(bill.amount || 0).toLocaleString()}</span>
                </div>
                <div className='bill-meta-row'>
                  <span>{formatDate(bill.dueDate)}</span>
                  {!bill.paid && <span className={status.cls}>{status.text}</span>}
                  {bill.paid && <span className='bill-paid-label'>Paid</span>}
                </div>
              </div>
              <button
                className='bill-remove'
                onClick={() => onRemoveBill(bill.id)}
                aria-label='Remove bill'
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div className='bills-add'>
        <input
          type='text'
          placeholder='Bill name'
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className='bills-add-row'>
          <input
            type='number'
            placeholder='Amount'
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <input
            type='date'
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button className='bills-add-btn' onClick={handleAdd}>
          + Add Bill
        </button>
      </div>
    </div>
  );
}

export default BillsTracker;