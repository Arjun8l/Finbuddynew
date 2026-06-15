import { useState, useRef, useEffect } from 'react';

function Navbar({ currentPage, setPage, onLogout, userName }) {
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const accountRef = useRef(null);
  const sidebarRef = useRef(null);

  const tabs = [
    { id: 'budget',   label: 'Budget',   icon: '◻' },
    { id: 'tracker',  label: 'Tracker',  icon: '◈' },
    { id: 'analysis', label: 'Analysis', icon: '◉' },
  ];

  const displayName = userName
    ? (userName.includes('@') ? userName.split('@')[0] : userName)
    : '';

  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

  useEffect(() => {
    function handleClickOutside(e) {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
      if (
        mobileSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target) &&
        !e.target.closest('.mis-toggle')
      ) {
        setMobileSidebarOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileSidebarOpen]);

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

      {/* Toggle button - mobile */}
      <button
        className='mis-toggle'
        onClick={() => setMobileSidebarOpen(o => !o)}
        aria-label='Toggle menu'
      >
        ☰
      </button>

      {/* Backdrop - mobile */}
      {mobileSidebarOpen && (
        <div className='mis-backdrop' onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* Icon + label sidebar - mobile */}
      <aside ref={sidebarRef} className={`mobile-icon-sidebar${mobileSidebarOpen ? ' mis-open' : ''}`}>
        <div className='mis-brand'>
          <span className='mis-dot' />
          <span className='mis-brand-text'>FinBuddy</span>
        </div>

        <div className='mis-tabs'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`mis-tab ${currentPage === tab.id ? 'active' : ''}`}
              onClick={() => {
                setPage(tab.id);
                setMobileSidebarOpen(false);
              }}
              aria-label={tab.label}
            >
              <span className='mis-icon'>{tab.icon}</span>
              <span className='mis-label'>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className='mis-footer' ref={accountRef}>
          {accountOpen && (
            <div className='mis-account-popover'>
              <div className='mis-popover-name'>{displayName}</div>
              <button className='mis-popover-action' onClick={onLogout}>
                Sign out
              </button>
            </div>
          )}
          <button
            className='mis-account-btn'
            onClick={() => setAccountOpen(o => !o)}
            aria-label='Account'
          >
            <span className='mis-avatar'>{initial}</span>
            <span className='mis-label'>Account</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Navbar;
