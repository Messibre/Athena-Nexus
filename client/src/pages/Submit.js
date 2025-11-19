import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../config/api';
import Navbar from '../components/Navbar';

const Submit = () => {
  const [searchParams] = useSearchParams();
  const [weeks, setWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [submissionId, setSubmissionId] = useState(null);
  const [githubRepo, setGithubRepo] = useState('');
  const [liveDemo, setLiveDemo] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWeeks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Handle URL parameters
    const weekParam = searchParams.get('week');
    const editParam = searchParams.get('edit');
    
    if (weekParam && weeks.length > 0) {
      setSelectedWeek(weekParam);
    }
    
    if (editParam) {
      setSubmissionId(editParam);
      fetchSubmission(editParam);
    }
  }, [searchParams, weeks]);

  const fetchWeeks = async () => {
    try {
      const response = await api.get('/api/weeks');
      setWeeks(response.data);
      const active = response.data.find(w => w.isActive);
      if (active && !searchParams.get('week')) {
        setSelectedWeek(active._id);
      }
    } catch (error) {
      console.error('Error fetching weeks:', error);
    }
  };

  const fetchSubmission = async (id) => {
    try {
      const response = await api.get(`/api/submissions/${id}`);
      const sub = response.data;
      setSelectedWeek(sub.week_id?._id || sub.week_id);
      setGithubRepo(sub.github_repo_url || '');
      setLiveDemo(sub.github_live_demo_url || '');
      setDescription(sub.description || '');
      setTags(sub.tags || []);
    } catch (error) {
      console.error('Error fetching submission:', error);
      setError('Failed to load submission for editing');
    }
  };

  const handleTagChange = (tag) => {
    setTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!selectedWeek) {
      setError('Please select a week');
      setLoading(false);
      return;
    }

    if (!githubRepo) {
      setError('GitHub repository URL is required');
      setLoading(false);
      return;
    }

    // Validate GitHub URL
    const githubRegex = /^https:\/\/github\.com\/[\w\-.]+\/[\w\-.]+$/;
    if (!githubRegex.test(githubRepo)) {
      setError('Invalid GitHub URL. Must be in format: https://github.com/owner/repo');
      setLoading(false);
      return;
    }

    // Validate live demo URL if provided
    if (liveDemo) {
      try {
        new URL(liveDemo);
      } catch {
        setError('Invalid live demo URL');
        setLoading(false);
        return;
      }
    }

    try {
      if (submissionId) {
        // Update existing submission
        await api.put(`/api/submissions/${submissionId}`, {
          github_repo_url: githubRepo,
          github_live_demo_url: liveDemo || '',
          description: description.substring(0, 300),
          tags
        });
        setSuccess('Submission updated successfully!');
      } else {
        // Create new submission
        await api.post('/api/submissions', {
          week_id: selectedWeek,
          github_repo_url: githubRepo,
          github_live_demo_url: liveDemo || '',
          description: description.substring(0, 300),
          tags
        });
        setSuccess('Submission created successfully!');
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ maxWidth: '600px', marginTop: '32px' }}>
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '24px' }}>
            {submissionId ? 'Update Your Submission' : 'Submit Your Project'}
          </h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Week *</label>
              <select
                className="form-select"
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                required
                disabled={!!submissionId}
              >
                <option value="">Select a week</option>
                {weeks.map(week => (
                  <option key={week._id} value={week._id}>
                    Week {week.week_number}: {week.title || 'Untitled'}
                  </option>
                ))}
              </select>
              {submissionId && (
                <small style={{ color: '#6b7280', fontSize: '14px' }}>
                  Week cannot be changed when updating a submission
                </small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">GitHub Repository URL *</label>
              <input
                type="url"
                className="form-input"
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="https://github.com/owner/repo"
                required
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                Format: https://github.com/owner/repo
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Live Demo URL</label>
              <input
                type="url"
                className="form-input"
                value={liveDemo}
                onChange={(e) => setLiveDemo(e.target.value)}
                placeholder="https://your-demo.netlify.app"
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                GitHub Pages, Netlify, Vercel, etc.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Description (max 300 characters)</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                placeholder="Brief description of your project..."
              />
              <small style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                {description.length}/300 characters
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['web', 'mobile', 'uiux'].map(tag => (
                  <label
                    key={tag}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      padding: '8px 16px',
                      border: tags.includes(tag) ? '2px solid var(--primary)' : '2px solid var(--border-light)',
                      borderRadius: '6px',
                      backgroundColor: tags.includes(tag) ? 'var(--badge-info-bg)' : 'var(--bg-primary)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={tags.includes(tag)}
                      onChange={() => handleTagChange(tag)}
                      style={{ marginRight: '8px' }}
                    />
                    {tag.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? (submissionId ? 'Updating...' : 'Submitting...') : (submissionId ? 'Update Submission' : 'Submit Project')}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Submit;

