function Navbar({ currentPage, setPage, onLogout, userName }) {
  const tabs = [
    { id: 'budget',   label: 'Budget',   icon: '◻' },
    { id: 'tracker',  label: 'Tracker',  icon: '◈' },
    { id: 'analysis', label: 'Analysis', icon: '◉' },
  ];

  const displayName = userName
    ? (userName.includes('@') ? userName.split('@')[0] : userName)
    : '';

  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

  return (
    <>
      {/* Top navbar - desktop */}
      <nav className='navbar'>
        <div className='nav-brand'>FinBuddy</div>

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

        <div className='nav-user'>
          {userName && (
            <span style={{
              fontSize: '0.78rem',
              color: 'rgba(255,255,255,0.3)',
              fontFamily: "'Space Grotesk', sans-serif",
              letterSpacing: '0.02em',
            }}>
              {displayName}
            </span>
          )}
          <button className='btn-logout' onClick={onLogout}>
            Sign out
          </button>
        </div>
      </nav>

      {/* Icon-only sidebar - mobile */}
      <aside className='mobile-icon-sidebar'>
        <div className='mis-brand'>
          <span className='mis-dot' />
        </div>

        <div className='mis-tabs'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`mis-tab ${currentPage === tab.id ? 'active' : ''}`}
              onClick={() => setPage(tab.id)}
              aria-label={tab.label}
              title={tab.label}
            >
              <span className='mis-icon'>{tab.icon}</span>
            </button>
          ))}
        </div>

        <div className='mis-footer'>
          <div className='mis-avatar' title={displayName}>
            {initial}
          </div>
          <button
            className='mis-signout'
            onClick={onLogout}
            aria-label='Sign out'
            title='Sign out'
          >
            ⏻
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
