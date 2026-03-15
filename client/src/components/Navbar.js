import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { toggleTheme } from '../store/themeSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const theme = useSelector((state) => state.theme.theme);
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <nav className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="navbar-brand">
          Athena Nexus
        </Link>
        <div className="navbar-links">
          <Link to="/" className="navbar-link">Home</Link>
          <Link to="/challenges" className="navbar-link">Challenges</Link>
          <Link to="/gallery" className="navbar-link">Gallery</Link>
          <Link to="/about" className="navbar-link">About</Link>

          <button
            onClick={() => dispatch(toggleTheme())}
            className="theme-toggle"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? 'Dark' : 'Light'}
          </button>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="navbar-link">Dashboard</Link>
              {isAdmin && (
                <Link to="/admin" className="navbar-link">Admin</Link>
              )}
              <span className="navbar-link" style={{ color: 'var(--text-secondary)' }}>
                {user?.displayName || user?.username}
              </span>
              <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '8px 16px' }}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary" style={{ padding: '8px 16px' }}>
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
