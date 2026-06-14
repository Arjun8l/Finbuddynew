import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';

const COLORS = ['#16a34a','#2563eb','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#84cc16'];

function AnalysisDashboard({ income, categories, user }) {
  const [spendings, setSpendings] = useState([]);

  async function loadSpendings() {
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles').select('phone').eq('id', user.id).single();
    if (!profile?.phone) return;

    const { data } = await supabase
      .from('spendings').select('*').eq('phone', profile.phone);
    if (data) setSpendings(data);
  }

  useEffect(() => {
    loadSpendings();
  }, [user]);

  function getTotal(catName) {
    return spendings
      .filter(s => s.category === catName.toLowerCase())
      .reduce((sum, s) => sum + Number(s.amount), 0);
  }

  const totalBudgeted = categories.reduce((s, c) => s + (c.budget || 0), 0);
  const totalSpent = categories.reduce((s, c) => s + getTotal(c.name), 0);
  const netRemaining = income - totalSpent;
  const savingsRate = income > 0 ? Math.round((netRemaining / income) * 100) : 0;

  const barData = categories.map(cat => ({
    name: cat.name.length > 8 ? cat.name.slice(0, 8) + '…' : cat.name,
    Budgeted: cat.budget || 0,
    Spent: getTotal(cat.name),
  }));

  const pieData = categories
    .map(cat => ({ name: cat.name, value: getTotal(cat.name) }))
    .filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: '8px', padding: '10px 14px', fontSize: '13px' }}>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color, margin: '2px 0' }}>
              {p.name}: ₹{p.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className='module-container'>
      <h2>Analysis Dashboard</h2>

      {/* Summary Cards */}
      <div className='summary-panel'>
        <div className='summary-card'>
          <span>Monthly Income</span>
          <strong>₹{income.toLocaleString()}</strong>
        </div>
        <div className='summary-card'>
          <span>Total Budgeted</span>
          <strong>₹{totalBudgeted.toLocaleString()}</strong>
        </div>
        <div className='summary-card'>
          <span>Total Spent</span>
          <strong style={{ color: totalSpent > totalBudgeted ? '#dc2626' : '#16a34a' }}>
            ₹{totalSpent.toLocaleString()}
          </strong>
        </div>
        <div className='summary-card highlight'>
          <span>Remaining</span>
          <strong style={{ color: netRemaining < 0 ? '#dc2626' : '#16a34a' }}>
            ₹{netRemaining.toLocaleString()}
          </strong>
        </div>
        <div className='summary-card'>
          <span>Savings Rate</span>
          <strong style={{ color: savingsRate < 0 ? '#dc2626' : '#16a34a' }}>
            {savingsRate}%
          </strong>
        </div>
      </div>

      {/* Bar Chart */}
      <h3 style={{ marginTop: '28px', marginBottom: '12px' }}>Budget vs Spent</h3>
      <div style={{ width: '100%', height: 280 }}>
        <ResponsiveContainer>
          <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray='3 3' stroke='#f1f5f9' />
            <XAxis dataKey='name' tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey='Budgeted' fill='#93c5fd' radius={[4,4,0,0]} />
            <Bar dataKey='Spent' fill='#16a34a' radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      {pieData.length > 0 && (
        <>
          <h3 style={{ marginTop: '28px', marginBottom: '12px' }}>Spending Breakdown</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <div style={{ width: 220, height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={pieData} cx='50%' cy='50%' innerRadius={55}
                    outerRadius={90} paddingAngle={3} dataKey='value'>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: '160px' }}>
              {pieData.map((d, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center',
                  gap: '8px', marginBottom: '8px', fontSize: '13px' }}>
                  <div style={{ width: 12, height: 12, borderRadius: '3px',
                    background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{d.name}</span>
                  <strong>₹{d.value.toLocaleString()}</strong>
                  <span style={{ color: '#94a3b8' }}>
                    ({totalSpent > 0 ? Math.round((d.value / totalSpent) * 100) : 0}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Category Table */}
      <h3 style={{ marginTop: '28px', marginBottom: '12px' }}>Category Breakdown</h3>
      <table className='analysis-table'>
        <thead>
          <tr>
            <th>Category</th>
            <th>Budgeted</th>
            <th>Spent</th>
            <th>Difference</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => {
            const spent = getTotal(cat.name);
            const diff = cat.budget - spent;
            const over = diff < 0;
            return (
              <tr key={cat.id}>
                <td>{cat.icon} {cat.name}</td>
                <td>₹{cat.budget.toLocaleString()}</td>
                <td>₹{spent.toLocaleString()}</td>
                <td className={over ? 'text-red' : 'text-green'}>
                  {over ? '-' : '+'}₹{Math.abs(diff).toLocaleString()}
                </td>
                <td>{over ? '⚠️ Over' : '✅ OK'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AnalysisDashboard;
