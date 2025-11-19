import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../config/api';
import Navbar from '../components/Navbar';
import AuthContext from '../context/AuthContext';

const Challenges = () => {
  const { isAuthenticated, isAdmin } = useContext(AuthContext);
  const [weeks, setWeeks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionCounts, setSubmissionCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [weeksRes, submissionsRes] = await Promise.all([
        api.get('/api/weeks'),
        isAuthenticated && !isAdmin ? api.get('/api/submissions/my-submissions') : Promise.resolve({ data: [] })
      ]);
      
      setWeeks(weeksRes.data.sort((a, b) => b.week_number - a.week_number));
      
      if (isAuthenticated && !isAdmin) {
        setSubmissions(submissionsRes.data);
      }
      
      // For admins, get submission counts per week
      if (isAdmin) {
        try {
          const countsRes = await api.get('/api/admin/submissions');
          const counts = {};
          countsRes.data.forEach(sub => {
            const weekId = sub.week_id?._id || sub.week_id;
            if (weekId) {
              if (!counts[weekId]) {
                counts[weekId] = { total: 0, approved: 0, pending: 0, rejected: 0 };
              }
              counts[weekId].total++;
              counts[weekId][sub.status] = (counts[weekId][sub.status] || 0) + 1;
            }
          });
          setSubmissionCounts(counts);
        } catch (error) {
          console.error('Error fetching submission counts:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserSubmission = (weekId) => {
    return submissions.find(sub => sub.week_id?._id === weekId || sub.week_id === weekId);
  };

  const handleEditWeek = (weekId) => {
    navigate(`/admin?tab=weeks&edit=${weekId}`);
  };

  const handleDeleteWeek = async (weekId) => {
    if (!window.confirm('Are you sure you want to delete this week? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/api/admin/weeks/${weekId}`);
      fetchData();
      alert('Week deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete week');
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not set';
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

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: 'badge-warning', text: 'Pending' },
      approved: { class: 'badge-success', text: 'Approved' },
      rejected: { class: 'badge-danger', text: 'Rejected' }
    };
    const badge = badges[status] || badges.pending;
    return <span className={`badge ${badge.class}`}>{badge.text}</span>;
  };

  const isDeadlinePassed = (deadlineDate) => {
    if (!deadlineDate) return false;
    return new Date() > new Date(deadlineDate);
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1>Weekly Challenges</h1>
          {isAdmin && (
            <Link to="/admin?tab=weeks" className="btn btn-primary">
              Manage Challenges
            </Link>
          )}
        </div>

        {weeks.length === 0 ? (
          <div className="card">
            <p style={{ color: 'var(--text-secondary)' }}>No challenges available yet.</p>
            {isAdmin && (
              <Link to="/admin?tab=weeks" className="btn btn-primary" style={{ marginTop: '16px' }}>
                Create First Challenge
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-2">
            {weeks.map(week => {
              const userSubmission = isAuthenticated && !isAdmin ? getUserSubmission(week._id) : null;
              const counts = submissionCounts[week._id];
              const deadlinePassed = isDeadlinePassed(week.deadlineDate);

              return (
                <div key={week._id} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <h2 style={{ marginBottom: '8px' }}>
                      Week {week.week_number}
                    </h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {week.isActive && (
                        <span className="badge badge-success">Active</span>
                      )}
                      {deadlinePassed && (
                        <span className="badge badge-danger">Closed</span>
                      )}
                    </div>
                  </div>
                  
                  {week.title && (
                    <h3 style={{ marginBottom: '12px', color: 'var(--text-primary)' }}>{week.title}</h3>
                  )}
                  
                  {week.description && (
                    <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>{week.description}</p>
                  )}
                  
                  <div style={{ marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                    {week.deadlineDate && (
                      <p>
                        <strong>Deadline:</strong> {formatDate(week.deadlineDate)}
                        {deadlinePassed && <span style={{ color: 'var(--danger)', marginLeft: '8px' }}>(Passed)</span>}
                      </p>
                    )}
                    {week.startDate && (
                      <p><strong>Start:</strong> {formatDate(week.startDate)}</p>
                    )}
                  </div>

                  {/* Admin: Show submission counts */}
                  {isAdmin && counts && (
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
                      <strong style={{ fontSize: '14px' }}>Submissions:</strong>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px' }}>Total: {counts.total}</span>
                        <span style={{ fontSize: '13px', color: 'var(--success)' }}>Approved: {counts.approved}</span>
                        <span style={{ fontSize: '13px', color: 'var(--warning)' }}>Pending: {counts.pending}</span>
                        <span style={{ fontSize: '13px', color: 'var(--danger)' }}>Rejected: {counts.rejected}</span>
                      </div>
                    </div>
                  )}

                  {/* Group: Show submission status */}
                  {isAuthenticated && !isAdmin && userSubmission && (
                    <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'var(--badge-warning-bg)', color: 'var(--badge-warning-text)', borderRadius: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: '600' }}>Your Submission:</span>
                        {getStatusBadge(userSubmission.status)}
                      </div>
                      {userSubmission.reviewerNotes && (
                        <p style={{ marginTop: '8px', fontSize: '13px' }}>
                          {userSubmission.reviewerNotes}
                        </p>
                      )}
                    </div>
                  )}

                  {week.resources && week.resources.length > 0 && (
                    <div style={{ marginBottom: '16px' }}>
                      <strong style={{ fontSize: '14px' }}>Resources:</strong>
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        {week.resources.map((resource, idx) => (
                          <li key={idx}>
                          <a href={resource} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                            {resource}
                          </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Public/All: View Submissions */}
                    <Link
                      to={`/gallery/${week._id}`}
                      className="btn btn-outline"
                      style={{ flex: 1, textAlign: 'center' }}
                    >
                      View Submissions
                    </Link>

                    {/* Group: Submit button */}
                    {isAuthenticated && !isAdmin && (
                      <>
                        {!userSubmission && !deadlinePassed && (
                          <Link
                            to={`/submit?week=${week._id}`}
                            className="btn btn-primary"
                            style={{ flex: 1, textAlign: 'center' }}
                          >
                            Submit Project
                          </Link>
                        )}
                        {userSubmission && !deadlinePassed && (
                          <Link
                            to={`/submit?week=${week._id}&edit=${userSubmission._id}`}
                            className="btn btn-secondary"
                            style={{ flex: 1, textAlign: 'center' }}
                          >
                            Update Submission
                          </Link>
                        )}
                      </>
                    )}

                    {/* Admin: Edit/Delete buttons */}
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEditWeek(week._id)}
                          className="btn btn-secondary"
                          style={{ flex: 1, textAlign: 'center' }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteWeek(week._id)}
                          className="btn btn-danger"
                          style={{ flex: 1, textAlign: 'center' }}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Challenges;

