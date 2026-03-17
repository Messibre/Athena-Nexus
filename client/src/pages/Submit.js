import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import { fetchWeeks } from '../redux/thunks/weeksThunks';
import { fetchSubmissionById, createSubmission, updateSubmission } from '../redux/thunks/submissionsThunks';
import { selectWeeks } from '../redux/selectors/weeksSelectors';
import { selectCurrentSubmission, selectSubmissionsActionLoading } from '../redux/selectors/submissionsSelectors';

const Submit = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const weeks = useSelector(selectWeeks);
  const currentSubmission = useSelector(selectCurrentSubmission);
  const actionLoading = useSelector(selectSubmissionsActionLoading);

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
    dispatch(fetchWeeks());
  }, [dispatch]);

  useEffect(() => {
    const weekParam = searchParams.get('week');
    const editParam = searchParams.get('edit');

    if (weekParam && weeks.length > 0) {
      setSelectedWeek(weekParam);
    }

    if (editParam) {
      setSubmissionId(editParam);
      dispatch(fetchSubmissionById(editParam));
    }
  }, [searchParams, weeks, dispatch]);

  useEffect(() => {
    if (currentSubmission && submissionId) {
      const sub = currentSubmission;
      setSelectedWeek(sub.week_id?._id || sub.week_id);
      setGithubRepo(sub.github_repo_url || '');
      setLiveDemo(sub.github_live_demo_url || '');
      setDescription(sub.description || '');
      setTags(sub.tags || []);
    }
  }, [currentSubmission, submissionId]);

  const activeWeekId = useMemo(() => {
    const active = weeks.find(w => w.isActive);
    return active ? active._id : '';
  }, [weeks]);

  useEffect(() => {
    if (!searchParams.get('week') && activeWeekId && !selectedWeek) {
      setSelectedWeek(activeWeekId);
    }
  }, [activeWeekId, selectedWeek, searchParams]);

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

    const githubRegex = /^https:\/\/github\.com\/[\w-.]+\/[\w-.]+$/;
    if (!githubRegex.test(githubRepo)) {
      setError('Invalid GitHub URL. Must be in format: https://github.com/owner/repo');
      setLoading(false);
      return;
    }

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
        await dispatch(
          updateSubmission({
            id: submissionId,
            payload: {
              github_repo_url: githubRepo,
              github_live_demo_url: liveDemo || '',
              description: description.substring(0, 300),
              tags
            }
          })
        ).unwrap();
        setSuccess('Submission updated successfully!');
      } else {
        await dispatch(
          createSubmission({
            week_id: selectedWeek,
            github_repo_url: githubRepo,
            github_live_demo_url: liveDemo || '',
            description: description.substring(0, 300),
            tags
          })
        ).unwrap();
        setSuccess('Submission created successfully!');
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err || 'Failed to submit. Please try again.');
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
              style={{ width: '100%', marginTop: '16px' }}
              disabled={loading || actionLoading}
            >
              {loading || actionLoading ? 'Submitting...' : submissionId ? 'Update Submission' : 'Submit Project'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default Submit;
