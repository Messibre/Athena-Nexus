import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signup } from '../redux/thunks/authThunks';
import Navbar from '../components/Navbar';
import { selectAuthActionLoading } from '../redux/selectors/authSelectors';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    email: '',
    members: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const actionLoading = useSelector(selectAuthActionLoading);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const hasLetter = /[A-Za-z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    if (!hasLetter || !hasNumber) {
      setError('Password must contain both letters and numbers');
      return;
    }

    try {
      await dispatch(
        signup({
          username: formData.username,
          password: formData.password,
          displayName: formData.displayName || formData.username,
          email: formData.email,
          members: formData.members
        })
      ).unwrap();
      navigate('/dashboard');
    } catch (err) {
      setError(err || 'Failed to create account');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: '500px', marginTop: '60px' }}>
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '24px', textAlign: 'center' }}>
            Register Your Team
          </h2>

          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Create an account for your team of 3 members
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Group Username *</label>
              <input
                type="text"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Choose a unique username"
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                This will be your login username
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input
                type="text"
                name="displayName"
                className="form-input"
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Your team's display name (optional)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                name="password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="At least 8 characters, letters + numbers"
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                8+ characters, must include letters and numbers
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Re-enter your password"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                name="email"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
                placeholder="team@example.com (optional)"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Team Members</label>
              <input
                type="text"
                name="members"
                className="form-input"
                value={formData.members}
                onChange={handleChange}
                placeholder="Member 1, Member 2, Member 3 (optional)"
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Separate names with commas
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={actionLoading}
            >
              {actionLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: '600' }}>
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
