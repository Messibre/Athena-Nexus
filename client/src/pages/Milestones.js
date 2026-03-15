import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { fetchMilestoneCategories, fetchMilestoneLevels, fetchMilestoneProgress } from '../redux/thunks/milestonesThunks';
import {
  selectMilestoneCategories,
  selectMilestoneLevels,
  selectMilestoneProgress,
  selectMilestonesLoading
} from '../redux/selectors/milestonesSelectors';

const Milestones = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectMilestoneCategories);
  const loading = useSelector(selectMilestonesLoading);
  const [activeCategoryId, setActiveCategoryId] = useState('');

  useEffect(() => {
    dispatch(fetchMilestoneCategories());
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
  }, [dispatch, activeCategoryId]);

  const levels = useSelector((state) => selectMilestoneLevels(state, activeCategoryId));
  const progress = useSelector((state) => selectMilestoneProgress(state, activeCategoryId));

  const progressMap = useMemo(() => {
    return progress.reduce((acc, item) => {
      acc[item.levelId] = item.status;
      return acc;
    }, {});
  }, [progress]);

  const getStatusBadge = (status) => {
    if (status === 'completed') return { className: 'badge-success', text: 'Completed' };
    if (status === 'unlocked') return { className: 'badge-info', text: 'Unlocked' };
    return { className: 'badge-warning', text: 'Locked' };
  };

  return (
    <>
      <Navbar />
      <div className="container" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>Milestone Challenges</h1>
          <Link to="/challenges" className="btn btn-outline">Weekly Challenges</Link>
        </div>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '16px' }}>Categories</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {categories.map((category) => (
              <button
                key={category._id}
                className={`btn ${activeCategoryId === category._id ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveCategoryId(category._id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '16px' }}>Levels</h2>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : levels.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No levels available yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {levels.map((level) => {
                const status = progressMap[level._id] || 'locked';
                const badge = getStatusBadge(status);
                return (
                  <div key={level._id} className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3>Level {level.levelNumber}: {level.title}</h3>
                        {level.description && (
                          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>{level.description}</p>
                        )}
                      </div>
                      <span className={`badge ${badge.className}`}>{badge.text}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Milestones;
