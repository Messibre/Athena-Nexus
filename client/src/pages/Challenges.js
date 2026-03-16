import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Inbox,
  List,
  Menu,
  Shield,
  User,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { fetchWeeks } from "../redux/thunks/weeksThunks";
import { fetchMySubmissions } from "../redux/thunks/submissionsThunks";
import { fetchAdminSubmissions, deleteAdminWeek } from "../redux/thunks/adminThunks";
import { selectWeeks } from "../redux/selectors/weeksSelectors";
import {
  selectMySubmissions,
  selectSubmissionsLoading,
} from "../redux/selectors/submissionsSelectors";
import {
  selectAdminSubmissions,
  selectAdminLoading,
} from "../redux/selectors/adminSelectors";
import {
  selectIsAdmin,
  selectIsAuthenticated,
} from "../redux/selectors/authSelectors";

const Challenges = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const weeks = useSelector(selectWeeks);
  const submissions = useSelector(selectMySubmissions);
  const submissionsLoading = useSelector(selectSubmissionsLoading);
  const adminSubmissions = useSelector(selectAdminSubmissions);
  const adminLoading = useSelector(selectAdminLoading);
  const [submissionCounts, setSubmissionCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeWeekId, setActiveWeekId] = useState("");
  const [activeItemId, setActiveItemId] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await dispatch(fetchWeeks()).unwrap();
        if (isAuthenticated && !isAdmin) {
          await dispatch(fetchMySubmissions()).unwrap();
        }

        if (isAdmin) {
          await dispatch(fetchAdminSubmissions()).unwrap();
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (error.message?.includes("Network Error") || error.code === "ERR_NETWORK") {
          console.error(
            "Backend API is not reachable. Please configure REACT_APP_API_URL in Netlify environment variables.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [dispatch, isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const counts = {};
    adminSubmissions.forEach((sub) => {
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
  }, [adminSubmissions, isAdmin]);

  const sortedWeeks = useMemo(() => {
    return [...weeks].sort((a, b) => b.week_number - a.week_number);
  }, [weeks]);

  useEffect(() => {
    if (!sortedWeeks.length) return;
    if (!activeWeekId) {
      setActiveWeekId(sortedWeeks[0]._id);
    }
  }, [sortedWeeks, activeWeekId]);

  const activeWeek = sortedWeeks.find((week) => week._id === activeWeekId);

  const getUserSubmission = (weekId) => {
    return submissions.find(
      (sub) => sub.week_id?._id === weekId || sub.week_id === weekId,
    );
  };

  const handleEditWeek = (weekId) => {
    navigate(`/admin?tab=weeks&edit=${weekId}`);
  };

  const handleDeleteWeek = async (weekId) => {
    if (!window.confirm("Are you sure you want to delete this week? This action cannot be undone.")) {
      return;
    }
    try {
      await dispatch(deleteAdminWeek(weekId)).unwrap();
      dispatch(fetchWeeks());
      alert("Week deleted successfully");
    } catch (error) {
      alert(error || "Failed to delete week");
    }
  };

  const formatDate = (date) => {
    if (!date) return "Not set";
    return new Date(date).toLocaleDateString();
  };

  const formatRange = (week) => {
    if (!week?.startDate && !week?.deadlineDate) return "Dates TBD";
    const start = week.startDate ? formatDate(week.startDate) : "TBD";
    const end = week.deadlineDate ? formatDate(week.deadlineDate) : "TBD";
    return `${start} - ${end}`;
  };

  const getStatusPill = (status) => {
    if (status === "approved") return "status-success";
    if (status === "rejected") return "status-danger";
    if (status === "pending") return "status-warning";
    return "status-info";
  };

  const listItems = useMemo(() => {
    if (!activeWeek) return [];
    const items = [
      {
        id: `week-${activeWeek._id}`,
        type: "challenge",
        title: activeWeek.title || `Week ${activeWeek.week_number}`,
        status: activeWeek.isActive ? "Active" : "Archived",
        week: activeWeek,
      },
    ];

    if (isAdmin) {
      const weekSubmissions = adminSubmissions.filter((sub) => {
        const weekId = sub.week_id?._id || sub.week_id;
        return weekId === activeWeek._id;
      });
      weekSubmissions.forEach((submission) => {
        items.push({
          id: `submission-${submission._id}`,
          type: "submission",
          title: submission.user_id?.displayName || submission.user_id?.username || "Submission",
          status: submission.status || "pending",
          submission,
        });
      });
    } else if (isAuthenticated) {
      const userSubmission = getUserSubmission(activeWeek._id);
      if (userSubmission) {
        items.push({
          id: `submission-${userSubmission._id}`,
          type: "submission",
          title: "Your Submission",
          status: userSubmission.status || "pending",
          submission: userSubmission,
        });
      }
    }

    return items;
  }, [activeWeek, isAdmin, adminSubmissions, isAuthenticated, submissions]);

  useEffect(() => {
    if (!listItems.length) {
      setActiveItemId("");
      return;
    }
    if (!listItems.find((item) => item.id === activeItemId)) {
      setActiveItemId(listItems[0].id);
    }
  }, [listItems, activeItemId]);

  const activeItem = listItems.find((item) => item.id === activeItemId);

  if (loading || submissionsLoading || adminLoading) {
    return (
      <>
        <Navbar />
        <div className="loading">Loading...</div>
      </>
    );
  }

  const isDeadlinePassed = (deadlineDate) => {
    if (!deadlineDate) return false;
    return new Date() > new Date(deadlineDate);
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-shell">
        <div className="dashboard-body">
          <div className="dashboard-header">
            <div>
              <div className="dashboard-title">Weekly Challenge Inbox</div>
              <div className="dashboard-subtitle">
                Browse each week like curated correspondence and drill into submissions.
              </div>
            </div>
            <div className="dashboard-actions">
              <button
                className="ghost-btn mobile-only"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={16} /> Menu
              </button>
              <button className="ghost-btn mobile-only" onClick={() => setIsListOpen(true)}>
                <List size={16} /> Items
              </button>
              {isAdmin && (
                <Link to="/admin?tab=weeks" className="ghost-btn">
                  Manage Challenges
                </Link>
              )}
              <Link to="/milestones" className="ghost-btn">
                Milestones
              </Link>
            </div>
          </div>

          {isSidebarOpen && (
            <div className="mobile-overlay">
              <div className="mobile-panel pane glass-panel">
                <div className="pane-header">
                  <span className="pane-title">Weeks</span>
                  <button className="ghost-btn" onClick={() => setIsSidebarOpen(false)}>
                    Close
                  </button>
                </div>
                <div className="pane-body">
                  <div className="list-stack">
                    {sortedWeeks.map((week) => {
                      const counts = submissionCounts[week._id];
                      return (
                        <button
                          key={week._id}
                          className={`list-row ${
                            activeWeekId === week._id ? "active" : ""
                          }`}
                          onClick={() => {
                            setActiveWeekId(week._id);
                            setIsSidebarOpen(false);
                          }}
                          type="button"
                        >
                          <div>
                            <div className="list-row-title">
                              Week {week.week_number}: {week.title || "Untitled"}
                            </div>
                            <div className="list-row-meta">
                              <CalendarDays size={14} />
                              <span>{formatRange(week)}</span>
                            </div>
                          </div>
                          {isAdmin && counts && (
                            <span className="status-pill status-info">
                              {counts.total} submissions
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isListOpen && (
            <div className="mobile-overlay">
              <div className="mobile-panel list pane glass-panel">
                <div className="pane-header">
                  <span className="pane-title">Inbox</span>
                  <button className="ghost-btn" onClick={() => setIsListOpen(false)}>
                    Close
                  </button>
                </div>
                <div className="pane-body">
                  {listItems.length === 0 ? (
                    <p className="tree-subtle">No items yet.</p>
                  ) : (
                    <div className="list-stack">
                      {listItems.map((item) => (
                        <button
                          key={item.id}
                          className={`list-row ${activeItemId === item.id ? "active" : ""}`}
                          onClick={() => {
                            setActiveItemId(item.id);
                            setIsListOpen(false);
                          }}
                          type="button"
                        >
                          <div>
                            <div className="list-row-title">{item.title}</div>
                            <div className="list-row-meta">
                              {item.type === "submission" ? (
                                <>
                                  <User size={14} />
                                  <span>Submission</span>
                                </>
                              ) : (
                                <>
                                  <Inbox size={14} />
                                  <span>Challenge Brief</span>
                                </>
                              )}
                            </div>
                          </div>
                          <span className={`status-pill ${getStatusPill(item.status)}`}>
                            {item.status}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-grid">
            <div className="desktop-only pane glass-panel">
              <div className="pane-header">
                <span className="pane-title">Weekly Challenges</span>
                <span className="tree-subtle">{sortedWeeks.length} weeks</span>
              </div>
              <div className="pane-body">
                {sortedWeeks.length === 0 ? (
                  <p className="tree-subtle">No challenges available yet.</p>
                ) : (
                  <div className="list-stack">
                    {sortedWeeks.map((week) => {
                      const counts = submissionCounts[week._id];
                      return (
                        <motion.button
                          key={week._id}
                          className={`list-row ${
                            activeWeekId === week._id ? "active" : ""
                          }`}
                          onClick={() => setActiveWeekId(week._id)}
                          type="button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div>
                            <div className="list-row-title">
                              Week {week.week_number}: {week.title || "Untitled"}
                            </div>
                            <div className="list-row-meta">
                              <CalendarDays size={14} />
                              <span>{formatRange(week)}</span>
                            </div>
                          </div>
                          {isAdmin && counts && (
                            <span className="status-pill status-info">
                              {counts.total} submissions
                            </span>
                          )}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="desktop-only pane">
              <div className="pane-header">
                <span className="pane-title">Inbox</span>
                <span className="tree-subtle">
                  {activeWeek ? `Week ${activeWeek.week_number}` : "Select a week"}
                </span>
              </div>
              <div className="pane-body">
                {listItems.length === 0 ? (
                  <p className="tree-subtle">No items yet.</p>
                ) : (
                  <div className="list-stack">
                    {listItems.map((item) => (
                      <motion.button
                        key={item.id}
                        className={`list-row ${activeItemId === item.id ? "active" : ""}`}
                        onClick={() => setActiveItemId(item.id)}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div>
                          <div className="list-row-title">{item.title}</div>
                          <div className="list-row-meta">
                            {item.type === "submission" ? (
                              <>
                                <User size={14} />
                                <span>Submission</span>
                              </>
                            ) : (
                              <>
                                <Inbox size={14} />
                                <span>Challenge Brief</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className={`status-pill ${getStatusPill(item.status)}`}>
                          {item.status}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pane">
              <div className="pane-header">
                <span className="pane-title">Detail View</span>
                <span className="tree-subtle">
                  {activeWeek ? `Week ${activeWeek.week_number}` : "Waiting"}
                </span>
              </div>
              <div className="pane-body">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeItem?.id || "empty"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {!activeWeek ? (
                      <div className="detail-card">
                        <div className="detail-title">Select a week</div>
                        <p className="detail-text">
                          Choose a week from the sidebar to view challenge details.
                        </p>
                      </div>
                    ) : activeItem?.type === "submission" ? (
                      <div className="detail-card">
                        <div className="detail-title">Submission Details</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                          {isAdmin ? <Shield size={16} /> : <User size={16} />}
                          <span className="list-row-title">{activeItem.title}</span>
                        </div>
                        <div className="list-row-meta" style={{ marginBottom: "12px" }}>
                          <span className={`status-pill ${getStatusPill(activeItem.status)}`}>
                            {activeItem.status}
                          </span>
                          <span>Week {activeWeek.week_number}</span>
                        </div>
                        {activeItem.submission?.description && (
                          <p className="detail-text" style={{ marginBottom: "12px" }}>
                            {activeItem.submission.description}
                          </p>
                        )}
                        <div className="list-row-meta" style={{ gap: "16px" }}>
                          {activeItem.submission?.github_repo_url && (
                            <a
                              href={activeItem.submission.github_repo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ghost-btn"
                            >
                              GitHub
                            </a>
                          )}
                          {activeItem.submission?.github_live_demo_url && (
                            <a
                              href={activeItem.submission.github_live_demo_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ghost-btn"
                            >
                              Live Demo
                            </a>
                          )}
                        </div>
                        {isAdmin && (
                          <div style={{ marginTop: "16px" }}>
                            <Link to="/admin?tab=submissions" className="btn btn-secondary">
                              Review in Admin
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="detail-card">
                        <div className="detail-title">
                          Week {activeWeek.week_number}: {activeWeek.title || "Challenge Brief"}
                        </div>
                        {activeWeek.description && (
                          <p className="detail-text" style={{ marginBottom: "12px" }}>
                            {activeWeek.description}
                          </p>
                        )}
                        <div className="list-row-meta" style={{ marginBottom: "12px" }}>
                          <CalendarDays size={14} />
                          <span>{formatRange(activeWeek)}</span>
                          <span>•</span>
                          <Clock size={14} />
                          <span>
                            {isDeadlinePassed(activeWeek.deadlineDate)
                              ? "Closed"
                              : "Open"}
                          </span>
                        </div>
                        {activeWeek.resources && activeWeek.resources.length > 0 && (
                          <div style={{ marginBottom: "12px" }}>
                            <div className="list-row-title">Resources</div>
                            <ul style={{ marginTop: "8px", paddingLeft: "18px" }}>
                              {activeWeek.resources.map((resource, idx) => (
                                <li key={idx} className="detail-text">
                                  <a href={resource} target="_blank" rel="noopener noreferrer">
                                    {resource}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <Link to={`/gallery/${activeWeek._id}`} className="btn btn-outline">
                            View Submissions
                          </Link>
                          {isAuthenticated && !isAdmin && (
                            <>
                              {!getUserSubmission(activeWeek._id) &&
                                !isDeadlinePassed(activeWeek.deadlineDate) && (
                                  <Link to={`/submit?week=${activeWeek._id}`} className="btn btn-primary">
                                    Submit Project
                                  </Link>
                                )}
                              {getUserSubmission(activeWeek._id) &&
                                !isDeadlinePassed(activeWeek.deadlineDate) && (
                                  <Link
                                    to={`/submit?week=${activeWeek._id}&edit=${getUserSubmission(activeWeek._id)._id}`}
                                    className="btn btn-secondary"
                                  >
                                    Update Submission
                                  </Link>
                                )}
                            </>
                          )}
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleEditWeek(activeWeek._id)}
                                className="btn btn-secondary"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteWeek(activeWeek._id)}
                                className="btn btn-danger"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="pane-body" style={{ paddingTop: 0 }}>
                <div className="list-row-meta">
                  <CheckCircle2 size={14} />
                  <span>Keep submissions tidy like a curated mailbox.</span>
                  <span>•</span>
                  <Inbox size={14} />
                  <span>{activeWeek ? "Week selected" : "Week not set"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Challenges;
