import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../config/api';
import Navbar from '../components/Navbar';

const AdminPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'weeks');
  const [editingWeek, setEditingWeek] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [weeks, setWeeks] = useState([]);
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [weekForm, setWeekForm] = useState({ week_number: '', title: '', description: '', startDate: '', deadlineDate: '', resources: '', isActive: false });
  const [userForm, setUserForm] = useState({ username: '', password: '', displayName: '', email: '', members: '' });
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const loadWeekForEdit = useCallback(async (weekId) => {
    try {
      const response = await api.get(`/api/weeks/${weekId}`);
      const week = response.data;
      setEditingWeek(week);
      setWeekForm({
        week_number: week.week_number,
        title: week.title || '',
        description: week.description || '',
        startDate: week.startDate ? new Date(week.startDate).toISOString().slice(0, 16) : '',
        deadlineDate: week.deadlineDate ? new Date(week.deadlineDate).toISOString().slice(0, 16) : '',
        resources: week.resources ? week.resources.join(', ') : '',
        isActive: week.isActive || false
      });
      setActiveTab('weeks');
    } catch (error) {
      console.error('Error loading week:', error);
    }
  }, []);

  const loadUserForEdit = useCallback(async (userId) => {
    try {
      const response = await api.get(`/api/admin/users`);
      const user = response.data.find(u => u._id === userId);
      if (user) {
        setEditingUser(user);
        setUserForm({
          username: user.username,
          password: '',
          displayName: user.displayName || '',
          email: user.email || '',
          members: user.members ? user.members.map(m => m.name).join(', ') : ''
        });
        setActiveTab('users');
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  }, []);

  // Handle URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    const editWeek = searchParams.get('edit');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
    if (editWeek && (tab === 'weeks' || !tab)) {
      loadWeekForEdit(editWeek);
    }
  }, [searchParams, activeTab, loadWeekForEdit]);

  // Update URL when tab changes (but not on initial load)
  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab !== activeTab && activeTab) {
      setSearchParams({ tab: activeTab });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'weeks') {
        const response = await api.get('/api/weeks');
        setWeeks(response.data.sort((a, b) => b.week_number - a.week_number));
      } else if (activeTab === 'users') {
        const response = await api.get('/api/admin/users');
        setUsers(response.data);
      } else if (activeTab === 'submissions') {
        const response = await api.get('/api/admin/submissions');
        setSubmissions(response.data);
      } else if (activeTab === 'stats') {
        const response = await api.get('/api/admin/stats');
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWeek = async (e) => {
    e.preventDefault();
    try {
      const resources = weekForm.resources ? weekForm.resources.split(',').map(r => r.trim()).filter(r => r) : [];
      await api.post('/api/admin/weeks', {
        week_number: parseInt(weekForm.week_number),
        title: weekForm.title,
        description: weekForm.description,
        startDate: weekForm.startDate || null,
        deadlineDate: weekForm.deadlineDate || null,
        resources
      });
      resetWeekForm();
      fetchData();
      alert('Week created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create week');
    }
  };

  const handleUpdateWeek = async (e) => {
    e.preventDefault();
    if (!editingWeek) return;
    try {
      const resources = weekForm.resources ? weekForm.resources.split(',').map(r => r.trim()).filter(r => r) : [];
      await api.put(`/api/admin/weeks/${editingWeek._id}`, {
        title: weekForm.title,
        description: weekForm.description,
        startDate: weekForm.startDate || null,
        deadlineDate: weekForm.deadlineDate || null,
        resources,
        isActive: weekForm.isActive
      });
      resetWeekForm();
      fetchData();
      alert('Week updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update week');
    }
  };

  const resetWeekForm = () => {
    setWeekForm({ week_number: '', title: '', description: '', startDate: '', deadlineDate: '', resources: '', isActive: false });
    setEditingWeek(null);
    setSearchParams({ tab: 'weeks' });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const members = userForm.members ? userForm.members.split(',').map(m => ({ name: m.trim() })).filter(m => m.name) : [];
      await api.post('/api/admin/users', {
        username: userForm.username,
        password: userForm.password,
        displayName: userForm.displayName || userForm.username,
        email: userForm.email,
        members
      });
      resetUserForm();
      fetchData();
      alert('User created successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const members = userForm.members ? userForm.members.split(',').map(m => ({ name: m.trim() })).filter(m => m.name) : [];
      await api.put(`/api/admin/users/${editingUser._id}`, {
        displayName: userForm.displayName || userForm.username,
        email: userForm.email,
        members
      });
      resetUserForm();
      fetchData();
      alert('User updated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update user');
    }
  };

  const resetUserForm = () => {
    setUserForm({ username: '', password: '', displayName: '', email: '', members: '' });
    setEditingUser(null);
  };

  const handleUpdateSubmissionStatus = async (submissionId, status) => {
    try {
      await api.put(`/api/admin/submissions/${submissionId}/status`, {
        status,
        reviewerNotes: reviewNotes
      });
      setSelectedSubmission(null);
      setReviewNotes('');
      fetchData();
      alert('Submission status updated!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/api/admin/submissions/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'submissions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export CSV');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ marginTop: '32px' }}>
        <h1 style={{ marginBottom: '24px' }}>Admin Panel</h1>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button
            className={`btn ${activeTab === 'weeks' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('weeks')}
          >
            Weeks
          </button>
          <button
            className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('users');
              setSearchParams({ tab: 'users' });
            }}
          >
            Users
          </button>
          <button
            className={`btn ${activeTab === 'submissions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('submissions');
              setSearchParams({ tab: 'submissions' });
            }}
          >
            Submissions
          </button>
          <button
            className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('stats');
              setSearchParams({ tab: 'stats' });
            }}
          >
            Statistics
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {activeTab === 'weeks' && (
              <div>
                <div className="card" style={{ marginBottom: '24px' }}>
                  <h2 style={{ marginBottom: '16px' }}>
                    {editingWeek ? `Edit Week ${editingWeek.week_number}` : 'Create New Week'}
                  </h2>
                  <form onSubmit={editingWeek ? handleUpdateWeek : handleCreateWeek}>
                    {!editingWeek && (
                      <div className="form-group">
                        <label className="form-label">Week Number *</label>
                        <input
                          type="number"
                          className="form-input"
                          value={weekForm.week_number}
                          onChange={(e) => setWeekForm({ ...weekForm, week_number: e.target.value })}
                          required
                        />
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-input"
                        value={weekForm.title}
                        onChange={(e) => setWeekForm({ ...weekForm, title: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-textarea"
                        value={weekForm.description}
                        onChange={(e) => setWeekForm({ ...weekForm, description: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={weekForm.startDate}
                        onChange={(e) => setWeekForm({ ...weekForm, startDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Deadline</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={weekForm.deadlineDate}
                        onChange={(e) => setWeekForm({ ...weekForm, deadlineDate: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Resources (comma-separated URLs)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={weekForm.resources}
                        onChange={(e) => setWeekForm({ ...weekForm, resources: e.target.value })}
                        placeholder="https://example.com/resource1, https://example.com/resource2"
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={weekForm.isActive}
                          onChange={(e) => setWeekForm({ ...weekForm, isActive: e.target.checked })}
                        />
                        Active Week
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" className="btn btn-primary">
                        {editingWeek ? 'Update Week' : 'Create Week'}
                      </button>
                      {editingWeek && (
                        <button type="button" onClick={resetWeekForm} className="btn btn-secondary">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <h2 style={{ marginBottom: '16px' }}>All Weeks</h2>
                <div className="grid grid-2">
                  {weeks.map(week => (
                    <div key={week._id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <h3>Week {week.week_number}: {week.title || 'Untitled'}</h3>
                        {week.isActive && <span className="badge badge-success">Active</span>}
                      </div>
                      {week.description && <p style={{ color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '12px' }}>{week.description}</p>}
                      <button
                        onClick={() => loadWeekForEdit(week._id)}
                        className="btn btn-secondary"
                        style={{ width: '100%', marginTop: '8px' }}
                      >
                        Edit
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <div className="card" style={{ marginBottom: '24px' }}>
                  <h2 style={{ marginBottom: '16px' }}>
                    {editingUser ? `Edit Group: ${editingUser.username}` : 'Create New Group'}
                  </h2>
                  <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                    {!editingUser && (
                      <>
                        <div className="form-group">
                          <label className="form-label">Username *</label>
                          <input
                            type="text"
                            className="form-input"
                            value={userForm.username}
                            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Password *</label>
                          <input
                            type="password"
                            className="form-input"
                            value={userForm.password}
                            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                            required
                          />
                          <small style={{ color: 'var(--text-secondary)' }}>8+ characters, letters + numbers</small>
                        </div>
                      </>
                    )}
                    <div className="form-group">
                      <label className="form-label">Display Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={userForm.displayName}
                        onChange={(e) => setUserForm({ ...userForm, displayName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        className="form-input"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Members (comma-separated names)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={userForm.members}
                        onChange={(e) => setUserForm({ ...userForm, members: e.target.value })}
                        placeholder="Alice, Bob, Charlie"
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" className="btn btn-primary">
                        {editingUser ? 'Update Group' : 'Create Group'}
                      </button>
                      {editingUser && (
                        <button type="button" onClick={resetUserForm} className="btn btn-secondary">
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <h2 style={{ marginBottom: '16px' }}>All Groups</h2>
                <div className="grid grid-2">
                  {users.map(user => (
                    <div key={user._id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <h3>{user.displayName || user.username}</h3>
                          <p style={{ color: 'var(--text-secondary)' }}>Username: {user.username}</p>
                          {user.members && user.members.length > 0 && (
                            <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
                              Members: {user.members.map(m => m.name).join(', ')}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => loadUserForEdit(user._id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'submissions' && (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <button onClick={handleExportCSV} className="btn btn-success">
                    Export CSV
                  </button>
                </div>
                <div className="grid grid-2">
                  {submissions.map(submission => (
                    <div key={submission._id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h3>{submission.user_id?.displayName || submission.user_id?.username}</h3>
                        <span className={`badge ${
                          submission.status === 'approved' ? 'badge-success' :
                          submission.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {submission.status}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Week {submission.week_id?.week_number || 'N/A'}
                      </p>
                      {submission.description && (
                        <p style={{ marginBottom: '12px' }}>{submission.description}</p>
                      )}
                      <div style={{ marginBottom: '12px' }}>
                        <a href={submission.github_repo_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', marginRight: '12px' }}>
                          GitHub
                        </a>
                        {submission.github_live_demo_url && (
                          <a href={submission.github_live_demo_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                            Live Demo
                          </a>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateSubmissionStatus(submission._id, 'approved')}
                          className="btn btn-success"
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedSubmission && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                  }}>
                    <div className="card" style={{ maxWidth: '500px', width: '90%' }}>
                      <h2 style={{ marginBottom: '16px' }}>Reject Submission</h2>
                      <div className="form-group">
                        <label className="form-label">Reviewer Notes</label>
                        <textarea
                          className="form-textarea"
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Explain why this submission was rejected..."
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateSubmissionStatus(selectedSubmission._id, 'rejected')}
                          className="btn btn-danger"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubmission(null);
                            setReviewNotes('');
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && stats && (
              <div className="grid grid-3">
                <div className="card">
                  <h3>Total Users</h3>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalUsers}</p>
                </div>
                <div className="card">
                  <h3>Total Weeks</h3>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalWeeks}</p>
                </div>
                <div className="card">
                  <h3>Total Submissions</h3>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--primary)' }}>{stats.totalSubmissions}</p>
                </div>
                <div className="card">
                  <h3>Approved</h3>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--success)' }}>{stats.approvedSubmissions}</p>
                </div>
                <div className="card">
                  <h3>Pending</h3>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--warning)' }}>{stats.pendingSubmissions}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default AdminPanel;

