import { useState } from 'react';

function Navbar({ currentPage, setPage, onLogout, userName }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tabs = [
    { id: 'budget',   label: 'Budget',   icon: '◻' },
    { id: 'tracker',  label: 'Tracker',  icon: '◈' },
    { id: 'analysis', label: 'Analysis', icon: '◉' },
  ];

  const displayName = userName
    ? (userName.includes('@') ? userName.split('@')[0] : userName)
    : '';

  function handleTabClick(id) {
    setPage(id);
    setDrawerOpen(false);
  }

  return (
    <nav className='navbar'>
      {/* Brand */}
      <div className='nav-brand'>FinBuddy</div>

      {/* Tab group - desktop */}
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

      {/* User / logout - desktop */}
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

      {/* Hamburger - mobile */}
      <button
        className='nav-hamburger'
        onClick={() => setDrawerOpen(true)}
        aria-label='Open menu'
      >
        <span />
        <span />
        <span />
      </button>

      {/* Drawer overlay */}
      {drawerOpen && (
        <div className='drawer-overlay' onClick={() => setDrawerOpen(false)} />
      )}

      {/* Slide-in drawer */}
      <div className={`nav-drawer ${drawerOpen ? 'open' : ''}`}>
        <div className='drawer-header'>
          <span className='nav-brand'>FinBuddy</span>
          <button
            className='drawer-close'
            onClick={() => setDrawerOpen(false)}
            aria-label='Close menu'
          >
            ✕
          </button>
        </div>

        <div className='drawer-tabs'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`drawer-tab ${currentPage === tab.id ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
            >
              <span style={{ marginRight: '10px', fontSize: '0.85rem', opacity: 0.7 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className='drawer-profile'>
          {userName && (
            <div className='drawer-username'>{displayName}</div>
          )}
          <button className='btn-logout drawer-signout' onClick={onLogout}>
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
