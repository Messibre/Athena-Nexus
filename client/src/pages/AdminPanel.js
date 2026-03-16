import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from '../components/Navbar';
import {
  fetchAdminWeeks,
  fetchAdminWeekById,
  createAdminWeek,
  updateAdminWeek,
  deleteAdminWeek,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  deleteAdminUser,
  fetchAdminSubmissions,
  updateAdminSubmissionStatus,
  exportAdminSubmissions,
  fetchAdminStats,
  fetchAdminMilestoneCategories,
  createAdminMilestoneCategory,
  updateAdminMilestoneCategory,
  deleteAdminMilestoneCategory,
  fetchAdminMilestoneLevels,
  createAdminMilestoneLevel,
  updateAdminMilestoneLevel,
  deleteAdminMilestoneLevel,
  fetchAdminMilestoneChallenges,
  createAdminMilestoneChallenge,
  updateAdminMilestoneChallenge,
  deleteAdminMilestoneChallenge,
  fetchAdminMilestoneSubmissions,
  updateAdminMilestoneSubmissionStatus
} from '../redux/thunks/adminThunks';
import {
  selectAdminWeeks,
  selectAdminUsers,
  selectAdminSubmissions,
  selectAdminStats,
  selectAdminLoading,
  selectAdminActionLoading,
  selectAdminMilestoneCategories,
  selectAdminMilestoneLevels,
  selectAdminMilestoneChallenges,
  selectAdminMilestoneSubmissions
} from '../redux/selectors/adminSelectors';

const AdminPanel = () => {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'weeks');
  const [editingWeek, setEditingWeek] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const weeks = useSelector(selectAdminWeeks);
  const users = useSelector(selectAdminUsers);
  const submissions = useSelector(selectAdminSubmissions);
  const stats = useSelector(selectAdminStats);
  const loading = useSelector(selectAdminLoading);
  const actionLoading = useSelector(selectAdminActionLoading);
  const milestoneCategories = useSelector(selectAdminMilestoneCategories);
  const milestoneLevels = useSelector(selectAdminMilestoneLevels);
  const milestoneChallenges = useSelector(selectAdminMilestoneChallenges);
  const milestoneSubmissions = useSelector(selectAdminMilestoneSubmissions);

  const [weekForm, setWeekForm] = useState({ week_number: '', title: '', description: '', startDate: '', deadlineDate: '', resources: '', isActive: false });
  const [userForm, setUserForm] = useState({ username: '', password: '', displayName: '', email: '', members: '' });
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const [milestoneCategoryForm, setMilestoneCategoryForm] = useState({ key: '', name: '', description: '', order: 0, isActive: true });
  const [milestoneLevelForm, setMilestoneLevelForm] = useState({ categoryId: '', levelNumber: '', title: '', description: '', isActive: true });
  const [milestoneChallengeForm, setMilestoneChallengeForm] = useState({ categoryId: '', levelId: '', title: '', description: '', requirements: '', resources: '', tags: '', difficulty: 'beginner', isActive: true });
  const [editingMilestoneCategoryId, setEditingMilestoneCategoryId] = useState(null);
  const [editingMilestoneLevelId, setEditingMilestoneLevelId] = useState(null);
  const [editingMilestoneChallengeId, setEditingMilestoneChallengeId] = useState(null);
  const [milestoneReviewNotes, setMilestoneReviewNotes] = useState('');
  const [selectedMilestoneSubmission, setSelectedMilestoneSubmission] = useState(null);

  const loadWeekForEdit = useCallback(async (weekId) => {
    try {
      const week = await dispatch(fetchAdminWeekById(weekId)).unwrap();
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
  }, [dispatch]);

  const loadUserForEdit = useCallback(async (userId) => {
    try {
      const user = users.find(u => u._id === userId);
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
  }, [users]);

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

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab !== activeTab && activeTab) {
      setSearchParams({ tab: activeTab });
    }
  }, [activeTab, searchParams, setSearchParams]);

  useEffect(() => {
    if (activeTab === 'weeks') {
      dispatch(fetchAdminWeeks());
    } else if (activeTab === 'users') {
      dispatch(fetchAdminUsers());
    } else if (activeTab === 'submissions') {
      dispatch(fetchAdminSubmissions());
    } else if (activeTab === 'stats') {
      dispatch(fetchAdminStats());
    } else if (activeTab === 'milestone-categories') {
      dispatch(fetchAdminMilestoneCategories());
    } else if (activeTab === 'milestone-levels') {
      dispatch(fetchAdminMilestoneCategories());
      dispatch(fetchAdminMilestoneLevels());
    } else if (activeTab === 'milestone-challenges') {
      dispatch(fetchAdminMilestoneCategories());
      dispatch(fetchAdminMilestoneLevels());
      dispatch(fetchAdminMilestoneChallenges());
    } else if (activeTab === 'milestone-submissions') {
      dispatch(fetchAdminMilestoneSubmissions());
    }
  }, [activeTab, dispatch]);

  const handleCreateWeek = async (e) => {
    e.preventDefault();
    try {
      const resources = weekForm.resources ? weekForm.resources.split(',').map(r => r.trim()).filter(r => r) : [];
      await dispatch(createAdminWeek({
        week_number: parseInt(weekForm.week_number),
        title: weekForm.title,
        description: weekForm.description,
        startDate: weekForm.startDate || null,
        deadlineDate: weekForm.deadlineDate || null,
        resources
      })).unwrap();
      resetWeekForm();
      dispatch(fetchAdminWeeks());
      alert('Week created successfully!');
    } catch (error) {
      alert(error || 'Failed to create week');
    }
  };

  const handleUpdateWeek = async (e) => {
    e.preventDefault();
    if (!editingWeek) return;
    try {
      const resources = weekForm.resources ? weekForm.resources.split(',').map(r => r.trim()).filter(r => r) : [];
      await dispatch(updateAdminWeek({
        id: editingWeek._id,
        payload: {
          title: weekForm.title,
          description: weekForm.description,
          startDate: weekForm.startDate || null,
          deadlineDate: weekForm.deadlineDate || null,
          resources,
          isActive: weekForm.isActive
        }
      })).unwrap();
      resetWeekForm();
      dispatch(fetchAdminWeeks());
      alert('Week updated successfully!');
    } catch (error) {
      alert(error || 'Failed to update week');
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
      await dispatch(createAdminUser({
        username: userForm.username,
        password: userForm.password,
        displayName: userForm.displayName || userForm.username,
        email: userForm.email,
        members
      })).unwrap();
      resetUserForm();
      dispatch(fetchAdminUsers());
      alert('User created successfully!');
    } catch (error) {
      alert(error || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const members = userForm.members ? userForm.members.split(',').map(m => ({ name: m.trim() })).filter(m => m.name) : [];
      await dispatch(updateAdminUser({
        id: editingUser._id,
        payload: {
          displayName: userForm.displayName || userForm.username,
          email: userForm.email,
          members
        }
      })).unwrap();
      resetUserForm();
      dispatch(fetchAdminUsers());
      alert('User updated successfully!');
    } catch (error) {
      alert(error || 'Failed to update user');
    }
  };

  const handleResetUserPassword = async (userId) => {
    const newPassword = window.prompt("Enter a new password for this user:");
    if (!newPassword) return;

    try {
      await dispatch(resetAdminUserPassword({ id: userId, payload: { newPassword } })).unwrap();
      alert("Password reset successfully.");
    } catch (error) {
      alert(error || "Failed to reset password");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Delete this user? This action cannot be undone.")) return;
    try {
      await dispatch(deleteAdminUser(userId)).unwrap();
      dispatch(fetchAdminUsers());
      alert("User deleted successfully.");
    } catch (error) {
      alert(error || "Failed to delete user");
    }
  };

  const resetUserForm = () => {
    setUserForm({ username: '', password: '', displayName: '', email: '', members: '' });
    setEditingUser(null);
  };

  const handleUpdateSubmissionStatus = async (submissionId, status) => {
    try {
      await dispatch(updateAdminSubmissionStatus({
        id: submissionId,
        payload: {
          status,
          reviewerNotes: reviewNotes
        }
      })).unwrap();
      setSelectedSubmission(null);
      setReviewNotes('');
      dispatch(fetchAdminSubmissions());
      alert('Submission status updated!');
    } catch (error) {
      alert(error || 'Failed to update status');
    }
  };

  const handleExportCSV = async () => {
    try {
      const blobData = await dispatch(exportAdminSubmissions()).unwrap();
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'submissions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert(error || 'Failed to export CSV');
    }
  };

  const handleCreateMilestoneCategory = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createAdminMilestoneCategory({
        key: milestoneCategoryForm.key,
        name: milestoneCategoryForm.name,
        description: milestoneCategoryForm.description,
        order: parseInt(milestoneCategoryForm.order || 0),
        isActive: milestoneCategoryForm.isActive
      })).unwrap();
      setMilestoneCategoryForm({ key: '', name: '', description: '', order: 0, isActive: true });
      dispatch(fetchAdminMilestoneCategories());
      alert('Category created successfully!');
    } catch (error) {
      alert(error || 'Failed to create category');
    }
  };

  const handleEditMilestoneCategory = (category) => {
    setEditingMilestoneCategoryId(category._id);
    setMilestoneCategoryForm({
      key: category.key,
      name: category.name,
      description: category.description || '',
      order: category.order || 0,
      isActive: category.isActive
    });
  };

  const handleUpdateMilestoneCategory = async (e) => {
    e.preventDefault();
    if (!editingMilestoneCategoryId) return;
    try {
      await dispatch(updateAdminMilestoneCategory({
        id: editingMilestoneCategoryId,
        payload: {
          key: milestoneCategoryForm.key,
          name: milestoneCategoryForm.name,
          description: milestoneCategoryForm.description,
          order: parseInt(milestoneCategoryForm.order || 0),
          isActive: milestoneCategoryForm.isActive
        }
      })).unwrap();
      setEditingMilestoneCategoryId(null);
      setMilestoneCategoryForm({ key: '', name: '', description: '', order: 0, isActive: true });
      dispatch(fetchAdminMilestoneCategories());
      alert('Category updated successfully!');
    } catch (error) {
      alert(error || 'Failed to update category');
    }
  };

  const handleDeleteMilestoneCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      await dispatch(deleteAdminMilestoneCategory(id)).unwrap();
      dispatch(fetchAdminMilestoneCategories());
    } catch (error) {
      alert(error || 'Failed to delete category');
    }
  };

  const handleCreateMilestoneLevel = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createAdminMilestoneLevel({
        categoryId: milestoneLevelForm.categoryId,
        levelNumber: parseInt(milestoneLevelForm.levelNumber),
        title: milestoneLevelForm.title,
        description: milestoneLevelForm.description,
        isActive: milestoneLevelForm.isActive
      })).unwrap();
      setMilestoneLevelForm({ categoryId: '', levelNumber: '', title: '', description: '', isActive: true });
      dispatch(fetchAdminMilestoneLevels());
      alert('Level created successfully!');
    } catch (error) {
      alert(error || 'Failed to create level');
    }
  };

  const handleEditMilestoneLevel = (level) => {
    setEditingMilestoneLevelId(level._id);
    setMilestoneLevelForm({
      categoryId: level.categoryId?._id || level.categoryId,
      levelNumber: level.levelNumber,
      title: level.title,
      description: level.description || '',
      isActive: level.isActive
    });
  };

  const handleUpdateMilestoneLevel = async (e) => {
    e.preventDefault();
    if (!editingMilestoneLevelId) return;
    try {
      await dispatch(updateAdminMilestoneLevel({
        id: editingMilestoneLevelId,
        payload: {
          levelNumber: parseInt(milestoneLevelForm.levelNumber),
          title: milestoneLevelForm.title,
          description: milestoneLevelForm.description,
          isActive: milestoneLevelForm.isActive
        }
      })).unwrap();
      setEditingMilestoneLevelId(null);
      setMilestoneLevelForm({ categoryId: '', levelNumber: '', title: '', description: '', isActive: true });
      dispatch(fetchAdminMilestoneLevels());
      alert('Level updated successfully!');
    } catch (error) {
      alert(error || 'Failed to update level');
    }
  };

  const handleDeleteMilestoneLevel = async (id) => {
    if (!window.confirm('Delete this level?')) return;
    try {
      await dispatch(deleteAdminMilestoneLevel(id)).unwrap();
      dispatch(fetchAdminMilestoneLevels());
    } catch (error) {
      alert(error || 'Failed to delete level');
    }
  };

  const handleCreateMilestoneChallenge = async (e) => {
    e.preventDefault();
    try {
      const requirements = milestoneChallengeForm.requirements
        ? milestoneChallengeForm.requirements.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const resources = milestoneChallengeForm.resources
        ? milestoneChallengeForm.resources.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const tags = milestoneChallengeForm.tags
        ? milestoneChallengeForm.tags.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      await dispatch(createAdminMilestoneChallenge({
        categoryId: milestoneChallengeForm.categoryId,
        levelId: milestoneChallengeForm.levelId,
        title: milestoneChallengeForm.title,
        description: milestoneChallengeForm.description,
        requirements,
        resources,
        tags,
        difficulty: milestoneChallengeForm.difficulty,
        isActive: milestoneChallengeForm.isActive
      })).unwrap();
      setMilestoneChallengeForm({ categoryId: '', levelId: '', title: '', description: '', requirements: '', resources: '', tags: '', difficulty: 'beginner', isActive: true });
      dispatch(fetchAdminMilestoneChallenges());
      alert('Challenge created successfully!');
    } catch (error) {
      alert(error || 'Failed to create challenge');
    }
  };

  const handleEditMilestoneChallenge = (challenge) => {
    setEditingMilestoneChallengeId(challenge._id);
    setMilestoneChallengeForm({
      categoryId: challenge.categoryId?._id || challenge.categoryId,
      levelId: challenge.levelId?._id || challenge.levelId,
      title: challenge.title,
      description: challenge.description || '',
      requirements: (challenge.requirements || []).join(', '),
      resources: (challenge.resources || []).join(', '),
      tags: (challenge.tags || []).join(', '),
      difficulty: challenge.difficulty || 'beginner',
      isActive: challenge.isActive
    });
  };

  const handleUpdateMilestoneChallenge = async (e) => {
    e.preventDefault();
    if (!editingMilestoneChallengeId) return;
    try {
      const requirements = milestoneChallengeForm.requirements
        ? milestoneChallengeForm.requirements.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const resources = milestoneChallengeForm.resources
        ? milestoneChallengeForm.resources.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      const tags = milestoneChallengeForm.tags
        ? milestoneChallengeForm.tags.split(',').map(s => s.trim()).filter(Boolean)
        : [];
      await dispatch(updateAdminMilestoneChallenge({
        id: editingMilestoneChallengeId,
        payload: {
          title: milestoneChallengeForm.title,
          description: milestoneChallengeForm.description,
          requirements,
          resources,
          tags,
          difficulty: milestoneChallengeForm.difficulty,
          isActive: milestoneChallengeForm.isActive
        }
      })).unwrap();
      setEditingMilestoneChallengeId(null);
      setMilestoneChallengeForm({ categoryId: '', levelId: '', title: '', description: '', requirements: '', resources: '', tags: '', difficulty: 'beginner', isActive: true });
      dispatch(fetchAdminMilestoneChallenges());
      alert('Challenge updated successfully!');
    } catch (error) {
      alert(error || 'Failed to update challenge');
    }
  };

  const handleDeleteMilestoneChallenge = async (id) => {
    if (!window.confirm('Delete this challenge?')) return;
    try {
      await dispatch(deleteAdminMilestoneChallenge(id)).unwrap();
      dispatch(fetchAdminMilestoneChallenges());
    } catch (error) {
      alert(error || 'Failed to delete challenge');
    }
  };

  const handleUpdateMilestoneSubmissionStatus = async (submissionId, status) => {
    try {
      await dispatch(updateAdminMilestoneSubmissionStatus({
        id: submissionId,
        payload: { status, reviewerNotes: milestoneReviewNotes }
      })).unwrap();
      setSelectedMilestoneSubmission(null);
      setMilestoneReviewNotes('');
      dispatch(fetchAdminMilestoneSubmissions());
      alert('Milestone submission status updated!');
    } catch (error) {
      alert(error || 'Failed to update milestone submission');
    }
  };

  const filteredLevelsForCategory = useMemo(() => {
    if (!milestoneChallengeForm.categoryId) return [];
    return milestoneLevels.filter(lvl => (lvl.categoryId?._id || lvl.categoryId) === milestoneChallengeForm.categoryId);
  }, [milestoneLevels, milestoneChallengeForm.categoryId]);

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
          <button
            className={`btn ${activeTab === 'milestone-categories' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('milestone-categories');
              setSearchParams({ tab: 'milestone-categories' });
            }}
          >
            Milestone Categories
          </button>
          <button
            className={`btn ${activeTab === 'milestone-levels' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('milestone-levels');
              setSearchParams({ tab: 'milestone-levels' });
            }}
          >
            Milestone Levels
          </button>
          <button
            className={`btn ${activeTab === 'milestone-challenges' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('milestone-challenges');
              setSearchParams({ tab: 'milestone-challenges' });
            }}
          >
            Milestone Challenges
          </button>
          <button
            className={`btn ${activeTab === 'milestone-submissions' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setActiveTab('milestone-submissions');
              setSearchParams({ tab: 'milestone-submissions' });
            }}
          >
            Milestone Submissions
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
                      <button type="submit" className="btn btn-primary" disabled={actionLoading}>
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
                      <button type="submit" className="btn btn-primary" disabled={actionLoading}>
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
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleResetUserPassword(user._id)}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          Reset Password
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          Delete
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
                  <button onClick={handleExportCSV} className="btn btn-success" disabled={actionLoading}>
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

            {activeTab === 'milestone-categories' && (
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
                <div className="card" style={{ marginBottom: '24px', gridColumn: '2' }}>
                  <h2 style={{ marginBottom: '16px' }}>
                    {editingMilestoneCategoryId ? 'Edit Milestone Category' : 'Create Milestone Category'}
                  </h2>
                  <form onSubmit={editingMilestoneCategoryId ? handleUpdateMilestoneCategory : handleCreateMilestoneCategory}>
                    <div className="form-group">
                      <label className="form-label">Key *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={milestoneCategoryForm.key}
                        onChange={(e) => setMilestoneCategoryForm({ ...milestoneCategoryForm, key: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={milestoneCategoryForm.name}
                        onChange={(e) => setMilestoneCategoryForm({ ...milestoneCategoryForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-textarea"
                        value={milestoneCategoryForm.description}
                        onChange={(e) => setMilestoneCategoryForm({ ...milestoneCategoryForm, description: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Order</label>
                      <input
                        type="number"
                        className="form-input"
                        value={milestoneCategoryForm.order}
                        onChange={(e) => setMilestoneCategoryForm({ ...milestoneCategoryForm, order: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={milestoneCategoryForm.isActive}
                          onChange={(e) => setMilestoneCategoryForm({ ...milestoneCategoryForm, isActive: e.target.checked })}
                        />
                        Active Category
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                        {editingMilestoneCategoryId ? 'Update Category' : 'Create Category'}
                      </button>
                      {editingMilestoneCategoryId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMilestoneCategoryId(null);
                            setMilestoneCategoryForm({ key: '', name: '', description: '', order: 0, isActive: true });
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div style={{ gridColumn: '1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ marginBottom: 0 }}>Categories</h2>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingMilestoneCategoryId(null);
                        setMilestoneCategoryForm({ key: '', name: '', description: '', order: 0, isActive: true });
                      }}
                    >
                      New
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {milestoneCategories.map(category => (
                      <button
                        key={category._id}
                        type="button"
                        onClick={() => handleEditMilestoneCategory(category)}
                        className={`btn ${editingMilestoneCategoryId === category._id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <span>{category.name}</span>
                        {category.isActive && <span className="badge badge-success">Active</span>}
                      </button>
                    ))}
                    {milestoneCategories.length === 0 && (
                      <p style={{ color: 'var(--text-secondary)' }}>No categories yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'milestone-levels' && (
              <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
                <div className="card" style={{ marginBottom: '24px', gridColumn: '2' }}>
                  <h2 style={{ marginBottom: '16px' }}>
                    {editingMilestoneLevelId ? 'Edit Milestone Level' : 'Create Milestone Level'}
                  </h2>
                  <form onSubmit={editingMilestoneLevelId ? handleUpdateMilestoneLevel : handleCreateMilestoneLevel}>
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select
                        className="form-input"
                        value={milestoneLevelForm.categoryId}
                        onChange={(e) => setMilestoneLevelForm({ ...milestoneLevelForm, categoryId: e.target.value })}
                        disabled={!!editingMilestoneLevelId}
                        required
                      >
                        <option value="">Select category</option>
                        {milestoneCategories.map(category => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Level Number *</label>
                      <input
                        type="number"
                        className="form-input"
                        value={milestoneLevelForm.levelNumber}
                        onChange={(e) => setMilestoneLevelForm({ ...milestoneLevelForm, levelNumber: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={milestoneLevelForm.title}
                        onChange={(e) => setMilestoneLevelForm({ ...milestoneLevelForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-textarea"
                        value={milestoneLevelForm.description}
                        onChange={(e) => setMilestoneLevelForm({ ...milestoneLevelForm, description: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={milestoneLevelForm.isActive}
                          onChange={(e) => setMilestoneLevelForm({ ...milestoneLevelForm, isActive: e.target.checked })}
                        />
                        Active Level
                      </label>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                        {editingMilestoneLevelId ? 'Update Level' : 'Create Level'}
                      </button>
                      {editingMilestoneLevelId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMilestoneLevelId(null);
                            setMilestoneLevelForm({ categoryId: '', levelNumber: '', title: '', description: '', isActive: true });
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div style={{ gridColumn: '1' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h2 style={{ marginBottom: 0 }}>Levels</h2>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingMilestoneLevelId(null);
                        setMilestoneLevelForm({ categoryId: '', levelNumber: '', title: '', description: '', isActive: true });
                      }}
                    >
                      New
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {milestoneLevels.map(level => (
                      <button
                        key={level._id}
                        type="button"
                        onClick={() => handleEditMilestoneLevel(level)}
                        className={`btn ${editingMilestoneLevelId === level._id ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      >
                        <span>Level {level.levelNumber}: {level.title}</span>
                        {level.isActive && <span className="badge badge-success">Active</span>}
                      </button>
                    ))}
                    {milestoneLevels.length === 0 && (
                      <p style={{ color: 'var(--text-secondary)' }}>No levels yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

                        {activeTab === "milestone-challenges" && (
              <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "24px", alignItems: "start" }}>
                <div className="card" style={{ marginBottom: "24px", gridColumn: "2" }}>
                  <h2 style={{ marginBottom: "16px" }}>
                    {editingMilestoneChallengeId ? "Edit Milestone Challenge" : "Create Milestone Challenge"}
                  </h2>
                  <form onSubmit={editingMilestoneChallengeId ? handleUpdateMilestoneChallenge : handleCreateMilestoneChallenge}>
                    <div className="form-group">
                      <label className="form-label">Category *</label>
                      <select
                        className="form-input"
                        value={milestoneChallengeForm.categoryId}
                        onChange={(e) => {
                          setMilestoneChallengeForm({
                            ...milestoneChallengeForm,
                            categoryId: e.target.value,
                            levelId: ""
                          });
                        }}
                        disabled={!!editingMilestoneChallengeId}
                        required
                      >
                        <option value="">Select category</option>
                        {milestoneCategories.map(category => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Level *</label>
                      <select
                        className="form-input"
                        value={milestoneChallengeForm.levelId}
                        onChange={(e) => setMilestoneChallengeForm({ ...milestoneChallengeForm, levelId: e.target.value })}
                        disabled={!milestoneChallengeForm.categoryId || !!editingMilestoneChallengeId}
                        required
                      >
                        <option value="">Select level</option>
                        {filteredLevelsForCategory.map(level => (
                          <option key={level._id} value={level._id}>
                            Level {level.levelNumber}: {level.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Title *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={milestoneChallengeForm.title}
                        onChange={(e) => setMilestoneChallengeForm({ ...milestoneChallengeForm, title: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="form-textarea"
                        value={milestoneChallengeForm.description}
                        onChange={(e) => setMilestoneChallengeForm({ ...milestoneChallengeForm, description: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Requirements (comma-separated)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={milestoneChallengeForm.requirements}
                        onChange={(e) => setMilestoneChallengeForm({ ...milestoneChallengeForm, requirements: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Resources (comma-separated)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={milestoneChallengeForm.resources}
                        onChange={(e) => setMilestoneChallengeForm({ ...milestoneChallengeForm, resources: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tags (comma-separated)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={milestoneChallengeForm.tags}
                        onChange={(e) => setMilestoneChallengeForm({ ...milestoneChallengeForm, tags: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Difficulty</label>
                      <select
                        className="form-input"
                        value={milestoneChallengeForm.difficulty}
                        onChange={(e) => setMilestoneChallengeForm({ ...milestoneChallengeForm, difficulty: e.target.value })}
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={milestoneChallengeForm.isActive}
                          onChange={(e) => setMilestoneChallengeForm({ ...milestoneChallengeForm, isActive: e.target.checked })}
                        />
                        Active Challenge
                      </label>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" className="btn btn-primary" disabled={actionLoading}>
                        {editingMilestoneChallengeId ? "Update Challenge" : "Create Challenge"}
                      </button>
                      {editingMilestoneChallengeId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMilestoneChallengeId(null);
                            setMilestoneChallengeForm({ categoryId: "", levelId: "", title: "", description: "", requirements: "", resources: "", tags: "", difficulty: "beginner", isActive: true });
                          }}
                          className="btn btn-secondary"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div style={{ gridColumn: "1" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h2 style={{ marginBottom: 0 }}>Challenges</h2>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditingMilestoneChallengeId(null);
                        setMilestoneChallengeForm({ categoryId: "", levelId: "", title: "", description: "", requirements: "", resources: "", tags: "", difficulty: "beginner", isActive: true });
                      }}
                    >
                      New
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {milestoneChallenges.map(challenge => (
                      <button
                        key={challenge._id}
                        type="button"
                        onClick={() => handleEditMilestoneChallenge(challenge)}
                        className={`btn ${editingMilestoneChallengeId === challenge._id ? "btn-primary" : "btn-secondary"}`}
                        style={{ textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                      >
                        <span>{challenge.title}</span>
                        {challenge.isActive && <span className="badge badge-success">Active</span>}
                      </button>
                    ))}
                    {milestoneChallenges.length === 0 && (
                      <p style={{ color: "var(--text-secondary)" }}>No challenges yet.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'milestone-submissions' && (
              <div>
                <div className="grid grid-2">
                  {milestoneSubmissions.map(submission => (
                    <div key={submission._id} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <h3>{submission.userId?.displayName || submission.userId?.username || 'Unknown User'}</h3>
                        <span className={`badge ${
                          submission.status === 'approved' ? 'badge-success' :
                          submission.status === 'rejected' ? 'badge-danger' : 'badge-warning'
                        }`}>
                          {submission.status}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        {submission.categoryId?.name || 'Category'} · Level {submission.levelId?.levelNumber || 'N/A'}
                      </p>
                      {submission.challengeId?.title && (
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          Challenge: {submission.challengeId.title}
                        </p>
                      )}
                      {submission.description && (
                        <p style={{ marginBottom: '12px' }}>{submission.description}</p>
                      )}
                      <div style={{ marginBottom: '12px' }}>
                        {submission.repoUrl && (
                          <a href={submission.repoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', marginRight: '12px' }}>
                            GitHub
                          </a>
                        )}
                        {submission.demoUrl && (
                          <a href={submission.demoUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                            Live Demo
                          </a>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateMilestoneSubmissionStatus(submission._id, 'approved')}
                          className="btn btn-success"
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setSelectedMilestoneSubmission(submission)}
                          className="btn btn-danger"
                          style={{ padding: '6px 12px', fontSize: '14px' }}
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedMilestoneSubmission && (
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
                      <h2 style={{ marginBottom: '16px' }}>Reject Milestone Submission</h2>
                      <div className="form-group">
                        <label className="form-label">Reviewer Notes</label>
                        <textarea
                          className="form-textarea"
                          value={milestoneReviewNotes}
                          onChange={(e) => setMilestoneReviewNotes(e.target.value)}
                          placeholder="Explain why this submission was rejected..."
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleUpdateMilestoneSubmissionStatus(selectedMilestoneSubmission._id, 'rejected')}
                          className="btn btn-danger"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMilestoneSubmission(null);
                            setMilestoneReviewNotes('');
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



