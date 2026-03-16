import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import { fetchWeekById, fetchWeekSubmissions } from '../redux/thunks/weeksThunks';
import { fetchPublicSubmissions } from '../redux/thunks/submissionsThunks';
import { fetchPublicMilestoneSubmissions } from '../redux/thunks/milestonesThunks';
import { selectWeekById, selectWeekSubmissions } from '../redux/selectors/weeksSelectors';
import { selectPublicSubmissions, selectSubmissionsLoading } from '../redux/selectors/submissionsSelectors';
import { selectPublicMilestoneSubmissions } from '../redux/selectors/milestonesSelectors';

const Gallery = () => {
  const { weekId } = useParams();
  const dispatch = useDispatch();
  const [localLoading, setLocalLoading] = useState(true);
  const [view, setView] = useState('weekly');

  const week = useSelector((state) => (weekId ? selectWeekById(state, weekId) : null));
  const weekSubmissions = useSelector((state) =>
    weekId ? selectWeekSubmissions(state, weekId) : []
  );
  const publicSubmissions = useSelector(selectPublicSubmissions);
  const submissionsLoading = useSelector(selectSubmissionsLoading);
  const milestoneSubmissions = useSelector(selectPublicMilestoneSubmissions);

  const submissions = useMemo(() => {
    return weekId ? weekSubmissions : publicSubmissions;
  }, [weekId, weekSubmissions, publicSubmissions]);

  useEffect(() => {
    if (weekId) {
      setView('weekly');
    }
  }, [weekId]);

  useEffect(() => {
    const run = async () => {
      setLocalLoading(true);
      try {
        if (view === 'weekly') {
          if (weekId) {
            await Promise.all([
              dispatch(fetchWeekSubmissions(weekId)),
              dispatch(fetchWeekById(weekId))
            ]);
          } else {
            await dispatch(fetchPublicSubmissions()).unwrap();
          }
        } else {
          await dispatch(fetchPublicMilestoneSubmissions()).unwrap();
        }
      } finally {
        setLocalLoading(false);
      }
    };

    run();
  }, [dispatch, weekId, view]);

  if (localLoading || (view === 'weekly' && submissionsLoading)) {
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>Gallery</h1>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn ${view === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('weekly')}
            >
              Weekly Challenges
            </button>
            <button
              type="button"
              className={`btn ${view === 'milestones' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setView('milestones')}
            >
              Milestone Challenges
            </button>
          </div>
        </div>

        {week && (
          <div className="card" style={{ marginBottom: '32px' }}>
            <h1>Week {week.week_number}: {week.title || 'Untitled'}</h1>
            {week.description && (
              <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{week.description}</p>
            )}
          </div>
        )}

        <h2 style={{ marginBottom: '24px' }}>
          {view === 'weekly' ? (week ? 'Submissions' : 'All Approved Submissions') : 'All Approved Milestone Submissions'}
        </h2>

        {view === 'weekly' ? (
          submissions.length === 0 ? (
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
          )
        ) : milestoneSubmissions.length === 0 ? (
          <div className="card">
            <p style={{ color: 'var(--text-secondary)' }}>No milestone submissions yet.</p>
          </div>
        ) : (
          <div className="grid grid-3">
            {milestoneSubmissions.map((submission) => (
              <div key={submission._id} className="card">
                <div style={{ marginBottom: '12px' }}>
                  <h3 style={{ marginBottom: '4px' }}>
                    {submission.challengeId?.title || 'Milestone Challenge'}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    {submission.userId?.displayName || submission.userId?.username || 'Unknown Team'} · {submission.categoryId?.name || 'Category'} · Level {submission.levelId?.levelNumber || '-'}
                  </p>
                </div>

                {submission.notes && (
                  <p style={{ marginBottom: '16px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
                    {submission.notes.length > 100
                      ? submission.notes.substring(0, 100) + '...'
                      : submission.notes}
                  </p>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <span className="badge badge-info" style={{ textTransform: 'capitalize' }}>
                    {submission.status || 'pending'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <a
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline"
                    style={{ padding: '8px 16px', fontSize: '14px', flex: 1 }}
                  >
                    GitHub
                  </a>
                  {submission.demoUrl && (
                    <a
                      href={submission.demoUrl}
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
