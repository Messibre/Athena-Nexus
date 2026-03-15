import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/slices/authSlice';
import { toggleTheme } from '../redux/slices/themeSlice';
import { selectUser, selectIsAuthenticated, selectIsAdmin } from '../redux/selectors/authSelectors';
import { selectTheme } from '../redux/selectors/themeSelectors';

const Navbar = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const theme = useSelector(selectTheme);

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
          <Link to="/milestones" className="navbar-link">Milestones</Link>
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
