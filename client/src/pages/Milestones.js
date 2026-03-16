import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import {
  fetchMilestoneCategories,
  fetchMilestoneLevels,
  fetchMilestoneProgress,
  fetchMilestoneChallenges,
  fetchMyMilestoneSubmissions,
  createMilestoneSubmission,
  updateMilestoneSubmission
} from '../redux/thunks/milestonesThunks';
import {
  selectMilestoneCategories,
  selectMilestoneLevels,
  selectMilestoneChallenges,
  selectMyMilestoneSubmissions,
  selectMilestoneProgress,
  selectMilestonesLoading,
  selectMilestonesActionLoading
} from '../redux/selectors/milestonesSelectors';

const Milestones = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectMilestoneCategories);
  const loading = useSelector(selectMilestonesLoading);
  const actionLoading = useSelector(selectMilestonesActionLoading);
  const [activeCategoryId, setActiveCategoryId] = useState('');
  const [activeLevelId, setActiveLevelId] = useState('');
  const [activeChallengeId, setActiveChallengeId] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  useEffect(() => {
    dispatch(fetchMilestoneCategories());
    dispatch(fetchMyMilestoneSubmissions());
  }, [dispatch]);

  useEffect(() => {
    if (categories.length && !activeCategoryId) {
      setActiveCategoryId(categories[0]._id);
    }
  }, [categories, activeCategoryId]);

  useEffect(() => {
    if (!activeCategoryId) return;
    dispatch(fetchMilestoneLevels(activeCategoryId));
    dispatch(fetchMilestoneProgress({ categoryId: activeCategoryId }));
    setActiveLevelId('');
    setActiveChallengeId('');
    setSubmitError('');
    setSubmitSuccess('');
  }, [dispatch, activeCategoryId]);

  const levels = useSelector((state) => selectMilestoneLevels(state, activeCategoryId));
  const progress = useSelector((state) => selectMilestoneProgress(state, activeCategoryId));
  const challenges = useSelector((state) => selectMilestoneChallenges(state, activeLevelId));
  const mySubmissions = useSelector(selectMyMilestoneSubmissions);

  const activeCategory = categories.find((category) => category._id === activeCategoryId);
  const activeLevel = levels.find((level) => level._id === activeLevelId);
  const activeChallenge = challenges.find((challenge) => challenge._id === activeChallengeId);

  const progressMap = useMemo(() => {
    return progress.reduce((acc, item) => {
      acc[item.levelId] = item.status;
      return acc;
    }, {});
  }, [progress]);

  const getStatusBadge = (status) => {
    if (status === 'completed') return { className: 'badge-success', text: 'Completed' };
    if (status === 'unlocked') return { className: 'badge-info', text: 'In Progress' };
    return { className: 'badge-warning', text: 'Not Started' };
  };

  useEffect(() => {
    if (!activeLevelId) return;
    dispatch(fetchMilestoneChallenges(activeLevelId));
  }, [dispatch, activeLevelId]);

  useEffect(() => {
    if (!levels.length) return;
    if (activeLevelId) return;
    if (levels[0]?._id) {
      setActiveLevelId(levels[0]._id);
    }
  }, [levels, activeLevelId]);

  useEffect(() => {
    if (!activeChallengeId) {
      setRepoUrl('');
      setDemoUrl('');
      setNotes('');
      return;
    }
    const existing = mySubmissions.find((submission) => {
      const challengeId = submission.challengeId?._id || submission.challengeId;
      return challengeId === activeChallengeId;
    });
    if (existing) {
      setRepoUrl(existing.repoUrl || '');
      setDemoUrl(existing.demoUrl || '');
      setNotes(existing.notes || '');
    } else {
      setRepoUrl('');
      setDemoUrl('');
      setNotes('');
    }
  }, [activeChallengeId, mySubmissions]);

  const handleSelectLevel = (levelId) => {
    setActiveLevelId(levelId);
    setActiveChallengeId('');
    setSubmitError('');
    setSubmitSuccess('');
  };

  const handleSelectChallenge = (challengeId) => {
    setActiveChallengeId(challengeId);
    setSubmitError('');
    setSubmitSuccess('');
  };

  const getSubmissionForChallenge = (challengeId) => {
    return mySubmissions.find((submission) => {
      const id = submission.challengeId?._id || submission.challengeId;
      return id === challengeId;
    });
  };

  const firstIncompleteIndex = useMemo(() => {
    for (let i = 0; i < challenges.length; i += 1) {
      const submission = getSubmissionForChallenge(challenges[i]._id);
      if (submission?.status !== 'approved') {
        return i;
      }
    }
    return challenges.length;
  }, [challenges, mySubmissions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!activeChallengeId) return;
    const existing = getSubmissionForChallenge(activeChallengeId);

    try {
      if (existing) {
        await dispatch(
          updateMilestoneSubmission({
            id: existing._id,
            payload: { repoUrl, demoUrl, notes }
          })
        ).unwrap();
        setSubmitSuccess('Submission updated.');
      } else {
        await dispatch(
          createMilestoneSubmission({
            challengeId: activeChallengeId,
            repoUrl,
            demoUrl,
            notes
          })
        ).unwrap();
        setSubmitSuccess('Submission created.');
      }
      dispatch(fetchMyMilestoneSubmissions());
    } catch (error) {
      setSubmitError(error || 'Failed to submit');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>Milestone Challenges</h1>
          <Link to="/challenges" className="btn btn-outline">Weekly Challenges</Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '24px', alignItems: 'start' }}>
          <div className="card" style={{ marginBottom: '24px', gridColumn: '2' }}>
            <h2 style={{ marginBottom: '16px' }}>Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <h3 style={{ marginBottom: '6px' }}>{activeCategory?.name || 'Select a category'}</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {activeCategory?.description || 'Category details will appear here.'}
                </p>
              </div>
              <div>
                <h3 style={{ marginBottom: '6px' }}>
                  {activeLevel ? `Level ${activeLevel.levelNumber}: ${activeLevel.title}` : 'Select a level'}
                </h3>
                <p style={{ color: 'var(--text-secondary)' }}>
                  {activeLevel?.description || 'Level details will appear here.'}
                </p>
                {activeLevel && (
                  <div style={{ marginTop: '8px' }}>
                    <span className={`badge ${getStatusBadge(progressMap[activeLevel._id] || 'locked').className}`}>
                      {getStatusBadge(progressMap[activeLevel._id] || 'locked').text}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <h3 style={{ marginBottom: '8px' }}>Challenge</h3>
              {!activeChallenge ? (
                <p style={{ color: 'var(--text-secondary)' }}>Select a challenge to see full details.</p>
              ) : (
                <>
                  <h4 style={{ marginBottom: '8px' }}>{activeChallenge.title}</h4>
                  {activeChallenge.description && (
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>
                      {activeChallenge.description}
                    </p>
                  )}
                  {activeChallenge.requirements?.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <h4 style={{ marginBottom: '6px' }}>Requirements</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)' }}>
                        {activeChallenge.requirements.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {activeChallenge.resources?.length > 0 && (
                    <div style={{ marginBottom: '12px' }}>
                      <h4 style={{ marginBottom: '6px' }}>Resources</h4>
                      <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)' }}>
                        {activeChallenge.resources.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {activeChallenge.tags?.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {activeChallenge.tags.map((tag) => (
                        <span key={tag} className="badge badge-info">{tag}</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        <div className="card" style={{ marginBottom: '24px', gridColumn: '1' }}>
          <h2 style={{ marginBottom: '16px' }}>Categories</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map((category) => (
              <button
                key={category._id}
                className={`btn ${activeCategoryId === category._id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveCategoryId(category._id)}
                style={{ textAlign: 'left' }}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card" style={{ marginBottom: '24px', gridColumn: '1' }}>
          <h2 style={{ marginBottom: '16px' }}>Levels</h2>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : levels.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No levels available yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {levels.map((level) => {
                const status = progressMap[level._id] || 'locked';
                const badge = getStatusBadge(status);
                const isActive = activeLevelId === level._id;
                return (
                  <button
                    key={level._id}
                    type="button"
                    onClick={() => handleSelectLevel(level._id)}
                    className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <span>Level {level.levelNumber}: {level.title}</span>
                    <span className={`badge ${badge.className}`}>{badge.text}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ marginBottom: '24px', gridColumn: '1' }}>
          <h2 style={{ marginBottom: '16px' }}>Challenges</h2>
          {!activeLevelId ? (
            <p style={{ color: 'var(--text-secondary)' }}>Select a level to view challenges.</p>
          ) : challenges.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No challenges available for this level yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {challenges.map((challenge, index) => {
                const submission = getSubmissionForChallenge(challenge._id);
                const status = submission?.status || 'not submitted';
                const isActive = activeChallengeId === challenge._id;
                const isLocked = index > firstIncompleteIndex;
                return (
                  <button
                    key={challenge._id}
                    type="button"
                    onClick={() => handleSelectChallenge(challenge._id)}
                    disabled={isLocked}
                    className={`btn ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      textAlign: 'left',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      opacity: isLocked ? 0.6 : 1
                    }}
                  >
                    <span>{challenge.title}</span>
                    <span className={`badge ${isLocked ? 'badge-warning' : 'badge-info'}`} style={{ textTransform: 'capitalize' }}>
                      {isLocked ? 'locked' : status}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="card" style={{ gridColumn: '2' }}>
          <h2 style={{ marginBottom: '16px' }}>Submit Your Work</h2>
          {!activeChallengeId ? (
            <p style={{ color: 'var(--text-secondary)' }}>Select a challenge to submit your work.</p>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {submitError && <div className="alert alert-error">{submitError}</div>}
              {submitSuccess && <div className="alert alert-success">{submitSuccess}</div>}
              {(() => {
                const existing = getSubmissionForChallenge(activeChallengeId);
                if (existing?.status === 'approved') {
                  return (
                    <div className="alert alert-info">
                      This submission has been approved and can’t be edited.
                    </div>
                  );
                }
                return null;
              })()}

              <label>
                Repo URL
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/yourname/project"
                  required
                  disabled={actionLoading || getSubmissionForChallenge(activeChallengeId)?.status === 'approved'}
                />
              </label>
              <label>
                Demo URL (optional)
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="https://your-demo.com"
                  disabled={actionLoading || getSubmissionForChallenge(activeChallengeId)?.status === 'approved'}
                />
              </label>
              <label>
                Notes (optional)
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  disabled={actionLoading || getSubmissionForChallenge(activeChallengeId)?.status === 'approved'}
                />
              </label>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  actionLoading ||
                  getSubmissionForChallenge(activeChallengeId)?.status === 'approved'
                }
              >
                {actionLoading ? 'Submitting...' : 'Submit'}
              </button>
            </form>
          )}
        </div>
        </div>
      </div>
    </>
  );
};

export default Milestones;





