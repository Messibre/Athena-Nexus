import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../config/api';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const user = useSelector((state) => state.auth.user);
  const [submissions, setSubmissions] = useState([]);
  const [activeWeek, setActiveWeek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [submissionsRes, weekRes] = await Promise.all([
        api.get('/api/submissions/my-submissions'),
        api.get('/api/weeks/active')
      ]);

      setSubmissions(submissionsRes.data);
      setActiveWeek(weekRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-warning', text: 'Pending' },
      approved: { class: 'badge-success', text: 'Approved' },
      rejected: { class: 'badge-danger', text: 'Rejected' }
    };
    const badge = badges[status] || badges.pending;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container" style={{ marginTop: '32px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ marginBottom: '8px' }}>
                Welcome, {user?.displayName || user?.username}!
              </h1>
              <p style={{ color: 'var(--text-secondary)' }}>Manage your weekly submissions</p>
            </div>
            <Link to="/settings" className="btn btn-outline">
              Team Settings
            </Link>
          </div>
        </div>

        {activeWeek && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Current Challenge</h2>
            </div>
            <h3 style={{ marginBottom: '12px' }}>Week {activeWeek.week_number}: {activeWeek.title}</h3>
            {activeWeek.description && (
              <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>{activeWeek.description}</p>
            )}
            {activeWeek.deadlineDate && (
              <p style={{ marginBottom: '16px' }}>
                <strong>Deadline:</strong> {formatDate(activeWeek.deadlineDate)}
              </p>
            )}
            <Link to="/submit" className="btn btn-primary">
              Submit Project
            </Link>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Your Submissions</h2>
          </div>

          {submissions.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No submissions yet. Start by submitting your first project!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {submissions.map((submission) => (
                <div
                  key={submission._id}
                    style={{
                      padding: '16px',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      backgroundColor: 'var(--bg-tertiary)'
                    }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ marginBottom: '4px' }}>
                        Week {submission.week_id?.week_number || 'N/A'}: {submission.week_id?.title || 'Untitled'}
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        Submitted: {formatDate(submission.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>

                  {submission.description && (
                    <p style={{ marginBottom: '12px', color: 'var(--text-tertiary)' }}>{submission.description}</p>
                  )}

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <a
                      href={submission.github_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                      style={{ padding: '8px 16px', fontSize: '14px' }}
                    >
                      GitHub Repo
                    </a>
                    {submission.github_live_demo_url && (
                      <a
                        href={submission.github_live_demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                      >
                        Live Demo
                      </a>
                    )}
                  </div>

                  {submission.reviewerNotes && (
                    <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'var(--badge-warning-bg)', color: 'var(--badge-warning-text)', borderRadius: '6px' }}>
                      <strong>Reviewer Notes:</strong> {submission.reviewerNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
