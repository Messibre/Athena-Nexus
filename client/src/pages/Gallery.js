import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../config/api';
import Navbar from '../components/Navbar';

const Gallery = () => {
  const { weekId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [week, setWeek] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekId]);

  const fetchData = async () => {
    try {
      if (weekId) {
        const [submissionsRes, weekRes] = await Promise.all([
          api.get(`/api/weeks/${weekId}/submissions`),
          api.get(`/api/weeks/${weekId}`)
        ]);
        setSubmissions(submissionsRes.data);
        setWeek(weekRes.data);
      } else {
        const response = await api.get('/api/submissions/public');
        setSubmissions(response.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
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
        {week && (
          <div className="card" style={{ marginBottom: '32px' }}>
            <h1>Week {week.week_number}: {week.title || 'Untitled'}</h1>
            {week.description && (
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{week.description}</p>
            )}
          </div>
        )}

        <h2 style={{ marginBottom: '24px' }}>
          {week ? 'Submissions' : 'All Approved Submissions'}
        </h2>

        {submissions.length === 0 ? (
          <div className="card">
            <p style={{ color: 'var(--text-secondary)' }}>No approved submissions yet.</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {submissions.map(submission => (
              <div key={submission._id} className="card">
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ marginBottom: '4px' }}>
                    {submission.user_id?.displayName || submission.user_id?.username || 'Unknown Team'}
                  </h3>
                  {submission.week_id && (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                      Week {submission.week_id.week_number}
                    </p>
                  )}
                </div>

                {submission.description && (
                  <p style={{ marginBottom: '16px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                    {submission.description.length > 100
                      ? submission.description.substring(0, 100) + '...'
                      : submission.description}
                  </p>
                )}

                {submission.tags && submission.tags.length > 0 && (
                  <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {submission.tags.map(tag => (
                      <span key={tag} className="badge badge-info" style={{ fontSize: '11px' }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href={submission.github_repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', fontSize: '14px', flex: 1 }}
                  >
                    GitHub
                  </a>
                  {submission.github_live_demo_url && (
                    <a
                      href={submission.github_live_demo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '14px', flex: 1 }}
                    >
                      Live Demo
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Gallery;

