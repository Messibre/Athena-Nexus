import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import { changePassword, fetchMe } from '../redux/thunks/authThunks';
import { updateUserProfile } from '../redux/thunks/usersThunks';
import { selectUser } from '../redux/selectors/authSelectors';

const Settings = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [profileForm, setProfileForm] = useState({
    displayName: '',
    email: '',
    contactEmail: '',
    members: []
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || '',
        email: user.email || '',
        contactEmail: user.contactEmail || '',
        members: user.members || []
      });
    }
  }, [user]);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await dispatch(updateUserProfile({
        id: user._id || user.id,
        payload: {
          displayName: profileForm.displayName,
          email: profileForm.email,
          contactEmail: profileForm.contactEmail,
          members: profileForm.members
        }
      })).unwrap();
      await dispatch(fetchMe()).unwrap();
      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError(error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const hasLetter = /[A-Za-z]/.test(passwordForm.newPassword);
    const hasNumber = /\d/.test(passwordForm.newPassword);
    if (!hasLetter || !hasNumber) {
      setError('Password must contain both letters and numbers');
      return;
    }

    setLoading(true);

    try {
      await dispatch(
        changePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      ).unwrap();
      setSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err || 'Failed to change password');
    }

    setLoading(false);
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...profileForm.members];
    if (!newMembers[index]) {
      newMembers[index] = { name: '', role: '', githubUsername: '', email: '' };
    }
    newMembers[index][field] = value;
    setProfileForm({ ...profileForm, members: newMembers });
  };

  const addMember = () => {
    setProfileForm({
      ...profileForm,
      members: [...profileForm.members, { name: '', role: '', githubUsername: '', email: '' }]
    });
  };

  const removeMember = (index) => {
    const newMembers = profileForm.members.filter((_, i) => i !== index);
    setProfileForm({ ...profileForm, members: newMembers });
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: '800px', marginTop: '32px' }}>
        <h1 style={{ marginBottom: '24px' }}>Team Settings</h1>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`btn ${activeTab === 'password' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('password')}
          >
            Change Password
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {activeTab === 'profile' && (
          <div className="card">
            <h2 style={{ marginBottom: '24px' }}>Update Team Profile</h2>
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  placeholder="Your team's display name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="team@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Contact Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={profileForm.contactEmail}
                  onChange={(e) => setProfileForm({ ...profileForm, contactEmail: e.target.value })}
                  placeholder="contact@example.com"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Team Members</label>
                {profileForm.members.map((member, index) => (
                  <div key={index} style={{ marginBottom: '16px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <strong>Member {index + 1}</strong>
                      <button
                        type="button"
                        onClick={() => removeMember(index)}
                        className="btn btn-danger"
                        style={{ padding: '4px 12px', fontSize: '12px' }}
                      >
                        Remove
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Name"
                        value={member.name || ''}
                        onChange={(e) => handleMemberChange(index, 'name', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Role (optional)"
                        value={member.role || ''}
                        onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                      />
                      <input
                        type="text"
                        className="form-input"
                        placeholder="GitHub Username"
                        value={member.githubUsername || ''}
                        onChange={(e) => handleMemberChange(index, 'githubUsername', e.target.value)}
                      />
                      <input
                        type="email"
                        className="form-input"
                        placeholder="Email"
                        value={member.email || ''}
                        onChange={(e) => handleMemberChange(index, 'email', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addMember}
                  className="btn btn-outline"
                  style={{ marginBottom: '16px' }}
                >
                  + Add Member
                </button>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="card">
            <h2 style={{ marginBottom: '24px' }}>Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  placeholder="8+ characters, letters + numbers"
                />
                <small style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  8+ characters, must include letters and numbers
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
};

export default Settings;
