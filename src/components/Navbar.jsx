function Navbar({ currentPage, setPage, onLogout, userName }) {
  const tabs = [
    { id: 'budget',   label: 'Budget',   icon: '◻' },
    { id: 'tracker',  label: 'Tracker',  icon: '◈' },
    { id: 'analysis', label: 'Analysis', icon: '◉' },
  ];

  return (
    <nav className='navbar'>
      {/* Brand */}
      <div className='nav-brand'>FinBuddy</div>

      {/* Tab group */}
      <div className='nav-tabs'>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab ${currentPage === tab.id ? 'active' : ''}`}
            onClick={() => setPage(tab.id)}
          >
            <span style={{ marginRight: '6px', fontSize: '0.7rem', opacity: 0.7 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* User / logout */}
      <div className='nav-user'>
        {userName && (
          <span style={{
            fontSize: '0.78rem',
            color: 'rgba(255,255,255,0.3)',
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: '0.02em',
          }}>
            {userName.includes('@') ? userName.split('@')[0] : userName}
          </span>
        )}
        <button className='btn-logout' onClick={onLogout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
