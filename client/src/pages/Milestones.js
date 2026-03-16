import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Layers,
  List,
  Menu,
  Sparkles,
} from "lucide-react";
import Navbar from "../components/Navbar";
import MilestoneSidebar from "../components/MilestoneSidebar";
import {
  fetchMilestoneCategories,
  fetchMilestoneLevels,
  fetchMilestoneProgress,
  fetchMilestoneChallenges,
  fetchMyMilestoneSubmissions,
  createMilestoneSubmission,
  updateMilestoneSubmission,
} from "../redux/thunks/milestonesThunks";
import {
  selectMilestoneCategories,
  selectMilestoneLevels,
  selectMilestoneChallenges,
  selectMyMilestoneSubmissions,
  selectMilestoneProgress,
  selectMilestonesLoading,
  selectMilestonesActionLoading,
} from "../redux/selectors/milestonesSelectors";

const Milestones = () => {
  const dispatch = useDispatch();
  const categories = useSelector(selectMilestoneCategories);
  const loading = useSelector(selectMilestonesLoading);
  const actionLoading = useSelector(selectMilestonesActionLoading);
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [activeLevelId, setActiveLevelId] = useState("");
  const [activeChallengeId, setActiveChallengeId] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListOpen, setIsListOpen] = useState(false);

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
    setActiveLevelId("");
    setActiveChallengeId("");
    setSubmitError("");
    setSubmitSuccess("");
  }, [dispatch, activeCategoryId]);

  const levels = useSelector((state) =>
    selectMilestoneLevels(state, activeCategoryId),
  );
  const progress = useSelector((state) =>
    selectMilestoneProgress(state, activeCategoryId),
  );
  const challenges = useSelector((state) =>
    selectMilestoneChallenges(state, activeLevelId),
  );
  const mySubmissions = useSelector(selectMyMilestoneSubmissions);

  const activeCategory = categories.find(
    (category) => category._id === activeCategoryId,
  );
  const activeLevel = levels.find((level) => level._id === activeLevelId);
  const activeChallenge = challenges.find(
    (challenge) => challenge._id === activeChallengeId,
  );

  const progressMap = useMemo(() => {
    return progress.reduce((acc, item) => {
      acc[item.levelId] = item.status;
      return acc;
    }, {});
  }, [progress]);

  const getStatusBadge = (status) => {
    if (status === "completed")
      return { className: "status-success", text: "Completed" };
    if (status === "unlocked")
      return { className: "status-info", text: "In Progress" };
    return { className: "status-warning", text: "Not Started" };
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
      setRepoUrl("");
      setDemoUrl("");
      setNotes("");
      return;
    }
    const existing = mySubmissions.find((submission) => {
      const challengeId = submission.challengeId?._id || submission.challengeId;
      return challengeId === activeChallengeId;
    });
    if (existing) {
      setRepoUrl(existing.repoUrl || "");
      setDemoUrl(existing.demoUrl || "");
      setNotes(existing.notes || "");
    } else {
      setRepoUrl("");
      setDemoUrl("");
      setNotes("");
    }
  }, [activeChallengeId, mySubmissions]);

  const handleSelectLevel = (levelId) => {
    setActiveLevelId(levelId);
    setActiveChallengeId("");
    setSubmitError("");
    setSubmitSuccess("");
    setIsListOpen(true);
  };

  const handleSelectChallenge = (challengeId) => {
    setActiveChallengeId(challengeId);
    setSubmitError("");
    setSubmitSuccess("");
    setIsListOpen(false);
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
      if (submission?.status !== "approved") {
        return i;
      }
    }
    return challenges.length;
  }, [challenges, mySubmissions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!activeChallengeId) return;
    const existing = getSubmissionForChallenge(activeChallengeId);

    try {
      if (existing) {
        await dispatch(
          updateMilestoneSubmission({
            id: existing._id,
            payload: { repoUrl, demoUrl, notes },
          }),
        ).unwrap();
        setSubmitSuccess("Submission updated.");
      } else {
        await dispatch(
          createMilestoneSubmission({
            challengeId: activeChallengeId,
            repoUrl,
            demoUrl,
            notes,
          }),
        ).unwrap();
        setSubmitSuccess("Submission created.");
      }
      dispatch(fetchMyMilestoneSubmissions());
    } catch (error) {
      setSubmitError(error || "Failed to submit");
    }
  };

  const listVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-shell">
        <div className="dashboard-body">
          <div className="dashboard-header">
            <div>
              <div className="dashboard-title">Milestone Atlas</div>
              <div className="dashboard-subtitle">
                Track each level like a curated inbox of breakthroughs.
              </div>
            </div>
            <div className="dashboard-actions">
              <button
                className="ghost-btn mobile-only"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu size={16} /> Menu
              </button>
              <button
                className="ghost-btn mobile-only"
                onClick={() => setIsListOpen(true)}
              >
                <List size={16} /> Items
              </button>
              <Link to="/challenges" className="ghost-btn">
                Weekly Challenges
              </Link>
            </div>
          </div>

          {isSidebarOpen && (
            <div className="mobile-overlay">
              <div className="mobile-panel">
                <MilestoneSidebar
                  categories={categories}
                  activeCategoryId={activeCategoryId}
                  onSelectCategory={(id) => {
                    setActiveCategoryId(id);
                    setIsSidebarOpen(false);
                  }}
                  levels={levels}
                  activeLevelId={activeLevelId}
                  onSelectLevel={(id) => {
                    handleSelectLevel(id);
                    setIsSidebarOpen(false);
                  }}
                  levelProgressMap={progressMap}
                  activeChallengeId={activeChallengeId}
                  showChangeChallenge={!!activeChallengeId}
                  onChangeChallenge={() => {
                    setActiveChallengeId("");
                    setIsSidebarOpen(false);
                  }}
                  loading={loading}
                  onClose={() => setIsSidebarOpen(false)}
                />
              </div>
            </div>
          )}

          {isListOpen && (
            <div className="mobile-overlay">
              <div className="mobile-panel list pane glass-panel">
                <div className="pane-header">
                  <span className="pane-title">Challenges</span>
                  <button className="ghost-btn" onClick={() => setIsListOpen(false)}>
                    Close
                  </button>
                </div>
                <div className="pane-body">
                  {!activeLevelId ? (
                    <p className="tree-subtle">Select a level to view challenges.</p>
                  ) : challenges.length === 0 ? (
                    <p className="tree-subtle">No challenges available for this level.</p>
                  ) : (
                    <div className="list-stack">
                      {challenges.map((challenge, index) => {
                        const submission = getSubmissionForChallenge(challenge._id);
                        const status = submission?.status || "not submitted";
                        const isLocked = index > firstIncompleteIndex;
                        const badge = isLocked
                          ? { className: "status-warning", text: "Locked" }
                          : status === "approved"
                            ? { className: "status-success", text: "Approved" }
                            : { className: "status-info", text: "Open" };
                        return (
                          <button
                            key={challenge._id}
                            type="button"
                            onClick={() => handleSelectChallenge(challenge._id)}
                            disabled={isLocked}
                            className={`list-row ${
                              activeChallengeId === challenge._id ? "active" : ""
                            }`}
                            style={{ opacity: isLocked ? 0.6 : 1 }}
                          >
                            <div>
                              <div className="list-row-title">{challenge.title}</div>
                              <div className="list-row-meta">
                                <span>Level {activeLevel?.levelNumber || "-"}</span>
                                <span>•</span>
                                <span>{activeCategory?.name || "Milestone"}</span>
                              </div>
                            </div>
                            <span className={`status-pill ${badge.className}`}>
                              {badge.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="dashboard-grid">
            <div className="desktop-only">
              <MilestoneSidebar
                categories={categories}
                activeCategoryId={activeCategoryId}
                onSelectCategory={(id) => {
                  setActiveCategoryId(id);
                }}
                levels={levels}
                activeLevelId={activeLevelId}
                onSelectLevel={handleSelectLevel}
                levelProgressMap={progressMap}
                activeChallengeId={activeChallengeId}
                showChangeChallenge={!!activeChallengeId}
                onChangeChallenge={() => setActiveChallengeId("")}
                loading={loading}
                className="pane glass-panel"
              />
            </div>

            <div className="desktop-only pane">
              <div className="pane-header">
                <span className="pane-title">Challenge Queue</span>
                <span className="tree-subtle">
                  {activeLevel
                    ? `Level ${activeLevel.levelNumber}`
                    : "Select a level"}
                </span>
              </div>
              <div className="pane-body">
                {!activeLevelId ? (
                  <p className="tree-subtle">Select a level to view challenges.</p>
                ) : challenges.length === 0 ? (
                  <p className="tree-subtle">No challenges available for this level.</p>
                ) : (
                  <div className="list-stack">
                    {challenges.map((challenge, index) => {
                      const submission = getSubmissionForChallenge(challenge._id);
                      const status = submission?.status || "not submitted";
                      const isLocked = index > firstIncompleteIndex;
                      const badge = isLocked
                        ? { className: "status-warning", text: "Locked" }
                        : status === "approved"
                          ? { className: "status-success", text: "Approved" }
                          : { className: "status-info", text: "Open" };
                      return (
                        <motion.button
                          key={challenge._id}
                          type="button"
                          onClick={() => handleSelectChallenge(challenge._id)}
                          disabled={isLocked}
                          className={`list-row ${
                            activeChallengeId === challenge._id ? "active" : ""
                          }`}
                          style={{ opacity: isLocked ? 0.6 : 1 }}
                          initial="hidden"
                          animate="visible"
                          variants={listVariants}
                        >
                          <div>
                            <div className="list-row-title">{challenge.title}</div>
                            <div className="list-row-meta">
                              <span>Level {activeLevel?.levelNumber || "-"}</span>
                              <span>•</span>
                              <span>{activeCategory?.name || "Milestone"}</span>
                            </div>
                          </div>
                          <span className={`status-pill ${badge.className}`}>
                            {badge.text}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pane">
              <div className="pane-header">
                <span className="pane-title">Detail View</span>
                <span className="tree-subtle">
                  {activeChallenge ? "Challenge Selected" : "Awaiting Selection"}
                </span>
              </div>
              <div className="pane-body">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeChallenge?._id || "empty"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="detail-card">
                      <div className="detail-title">Overview</div>
                      <div className="detail-text">
                        <strong style={{ color: "#f8fafc" }}>
                          {activeCategory?.name || "Select a category"}
                        </strong>
                        <p className="detail-text">
                          {activeCategory?.description ||
                            "Category details will appear here."}
                        </p>
                      </div>
                      <div style={{ marginTop: "16px" }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <div className="list-row-title">
                              {activeLevel
                                ? `Level ${activeLevel.levelNumber}: ${activeLevel.title}`
                                : "Select a level"}
                            </div>
                            <p className="detail-text">
                              {activeLevel?.description ||
                                "Level details will appear here."}
                            </p>
                          </div>
                          {activeLevel && (
                            <span
                              className={`status-pill ${
                                getStatusBadge(
                                  progressMap[activeLevel._id] || "locked",
                                ).className
                              }`}
                            >
                              {
                                getStatusBadge(
                                  progressMap[activeLevel._id] || "locked",
                                ).text
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="detail-card">
                      <div className="detail-title">Challenge</div>
                      {!activeChallenge ? (
                        <p className="detail-text">
                          Select a challenge to see full details.
                        </p>
                      ) : (
                        <>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "10px",
                              marginBottom: "12px",
                            }}
                          >
                            <Sparkles size={18} />
                            <span className="list-row-title">
                              {activeChallenge.title}
                            </span>
                          </div>
                          {activeChallenge.description && (
                            <p className="detail-text" style={{ marginBottom: "12px" }}>
                              {activeChallenge.description}
                            </p>
                          )}
                          {activeChallenge.requirements?.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                              <div className="list-row-title">Requirements</div>
                              <ul style={{ marginTop: "8px", paddingLeft: "18px" }}>
                                {activeChallenge.requirements.map((item) => (
                                  <li key={item} className="detail-text">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {activeChallenge.resources?.length > 0 && (
                            <div style={{ marginBottom: "12px" }}>
                              <div className="list-row-title">Resources</div>
                              <ul style={{ marginTop: "8px", paddingLeft: "18px" }}>
                                {activeChallenge.resources.map((item) => (
                                  <li key={item} className="detail-text">
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {activeChallenge.tags?.length > 0 && (
                            <div className="list-row-meta" style={{ flexWrap: "wrap" }}>
                              {activeChallenge.tags.map((tag) => (
                                <span key={tag} className="status-pill status-info">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="detail-card">
                      <div className="detail-title">Submit Your Work</div>
                      {!activeChallengeId ? (
                        <p className="detail-text">
                          Select a challenge to submit your work.
                        </p>
                      ) : (
                        <form onSubmit={handleSubmit} className="list-stack">
                          {submitError && (
                            <div className="alert alert-error">{submitError}</div>
                          )}
                          {submitSuccess && (
                            <div className="alert alert-success">{submitSuccess}</div>
                          )}
                          {(() => {
                            const existing =
                              getSubmissionForChallenge(activeChallengeId);
                            if (existing?.status === "approved") {
                              return (
                                <div className="alert alert-info">
                                  This submission has been approved and can't be edited.
                                </div>
                              );
                            }
                            return null;
                          })()}

                          <label className="list-stack">
                            <span className="list-row-title">Repo URL</span>
                            <input
                              type="url"
                              value={repoUrl}
                              onChange={(e) => setRepoUrl(e.target.value)}
                              placeholder="https://github.com/yourname/project"
                              required
                              disabled={
                                actionLoading ||
                                getSubmissionForChallenge(activeChallengeId)
                                  ?.status === "approved"
                              }
                              className="form-input"
                            />
                          </label>
                          <label className="list-stack">
                            <span className="list-row-title">Demo URL (optional)</span>
                            <input
                              type="url"
                              value={demoUrl}
                              onChange={(e) => setDemoUrl(e.target.value)}
                              placeholder="https://your-demo.com"
                              disabled={
                                actionLoading ||
                                getSubmissionForChallenge(activeChallengeId)
                                  ?.status === "approved"
                              }
                              className="form-input"
                            />
                          </label>
                          <label className="list-stack">
                            <span className="list-row-title">Notes (optional)</span>
                            <textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              rows={4}
                              disabled={
                                actionLoading ||
                                getSubmissionForChallenge(activeChallengeId)
                                  ?.status === "approved"
                              }
                              className="form-textarea"
                            />
                          </label>
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                              actionLoading ||
                              getSubmissionForChallenge(activeChallengeId)
                                ?.status === "approved"
                            }
                          >
                            {actionLoading ? "Submitting..." : "Submit"}
                          </button>
                        </form>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="pane-body" style={{ paddingTop: 0 }}>
                <div className="list-row-meta">
                  <Clock size={14} />
                  <span>Milestone cadence updates as you progress.</span>
                  <span>•</span>
                  <CheckCircle2 size={14} />
                  <span>Submit when ready.</span>
                  <span>•</span>
                  <Layers size={14} />
                  <span>{activeLevel ? "Level focused" : "Level not set"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Milestones;
