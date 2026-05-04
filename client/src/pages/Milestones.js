import React, { useEffect, useMemo, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { CheckCircle2, ChevronRight, ChevronLeft, Lock } from "lucide-react";
import Navbar from "../components/Navbar";
import { selectUser } from "../redux/selectors/authSelectors";
import { selectIsAuthenticated } from "../redux/selectors/authSelectors";
import {
  fetchMilestoneCategories,
  fetchMilestoneLevels,
  fetchMilestoneChallenges,
  fetchMilestoneProgress,
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
} from "../redux/selectors/milestonesSelectors";
import MiniModal from "../components/MiniModal";

export const selectTheme = (state) => state.theme.theme;

const Milestones = () => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme) || "dark";
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const categories = useSelector(selectMilestoneCategories);

  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [activeLevelId, setActiveLevelId] = useState("");
  const [activeChallengeId, setActiveChallengeId] = useState("");
  const [mobileStep, setMobileStep] = useState("categories");

  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const handleMobileStepBack = () => {
    if (mobileStep === "detail") {
      setMobileStep("challenges");
      return true;
    }

    if (mobileStep === "challenges") {
      setMobileStep("categories");
      return true;
    }

    return false;
  };

  useEffect(() => {
    dispatch(fetchMilestoneCategories());
    if (isAuthenticated) {
      dispatch(fetchMyMilestoneSubmissions());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    if (!categories.length || activeCategoryId) return;

    const savedState = readResumeState();
    if (
      savedState?.categoryId &&
      categories.some((category) => category._id === savedState.categoryId)
    ) {
      setActiveCategoryId(savedState.categoryId);
      return;
    }

    setActiveCategoryId(categories[0]._id);
  }, [categories, activeCategoryId]);

  const levels = useSelector((state) =>
    selectMilestoneLevels(state, activeCategoryId),
  );
  const challenges = useSelector((state) =>
    selectMilestoneChallenges(state, activeLevelId),
  );
  const mySubmissions = useSelector(selectMyMilestoneSubmissions);
  const progress = useSelector((state) =>
    selectMilestoneProgress(state, activeCategoryId),
  );

  // refs to avoid re-dispatching the same fetch repeatedly
  const lastFetchedLevelsRef = useRef(null);
  const lastFetchedChallengesRef = useRef(null);
  const lastFetchedProgressRef = useRef(null);

  useEffect(() => {
    if (!activeCategoryId) return;

    const hasLevels = Array.isArray(levels) && levels.length > 0;
    if (!hasLevels && lastFetchedLevelsRef.current !== activeCategoryId) {
      dispatch(fetchMilestoneLevels(activeCategoryId));
      lastFetchedLevelsRef.current = activeCategoryId;
    }

    if (isAuthenticated) {
      const hasProgress = Array.isArray(progress) && progress.length > 0;
      if (!hasProgress && lastFetchedProgressRef.current !== activeCategoryId) {
        dispatch(fetchMilestoneProgress({ categoryId: activeCategoryId }));
        lastFetchedProgressRef.current = activeCategoryId;
      }
    }
  }, [dispatch, activeCategoryId, isAuthenticated, levels, progress]);

  const activeCategory = categories.find((c) => c._id === activeCategoryId);
  const activeLevel = levels.find((l) => l._id === activeLevelId);
  const activeChallenge = challenges.find((ch) => ch._id === activeChallengeId);
  const guestResumeStorageKey = "athena-milestones-resume:guest";
  const resumeStorageKey =
    user?._id || user?.id
      ? `athena-milestones-resume:${user._id || user.id}`
      : guestResumeStorageKey;

  const readResumeState = (storageKey = resumeStorageKey) => {
    try {
      const rawValue = localStorage.getItem(storageKey);
      return rawValue ? JSON.parse(rawValue) : null;
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    try {
      const existingUserState = localStorage.getItem(resumeStorageKey);
      if (!existingUserState) {
        const guestState = localStorage.getItem(guestResumeStorageKey);
        if (guestState) {
          localStorage.setItem(resumeStorageKey, guestState);
          localStorage.removeItem(guestResumeStorageKey);
        }
      }
    } catch (error) {
      return;
    }
  }, [isAuthenticated, user, resumeStorageKey]);

  const getSubmissionForChallenge = (id) =>
    mySubmissions.find((s) => (s.challengeId?._id || s.challengeId) === id);

  const firstIncompleteIndex = useMemo(() => {
    for (let i = 0; i < challenges.length; i++) {
      if (!getSubmissionForChallenge(challenges[i]._id)) return i;
    }
    return challenges.length;
  }, [challenges, mySubmissions]);

  const completedChallengeCount = useMemo(
    () =>
      challenges.filter((challenge) =>
        Boolean(getSubmissionForChallenge(challenge._id)),
      ).length,
    [challenges, mySubmissions],
  );

  const completionPercent = challenges.length
    ? Math.round((completedChallengeCount / challenges.length) * 100)
    : 0;

  const nextChallenge = useMemo(() => {
    if (!challenges.length) return null;

    const incompleteIndex =
      firstIncompleteIndex === challenges.length
        ? challenges.length - 1
        : firstIncompleteIndex;
    return challenges[incompleteIndex] || challenges[0] || null;
  }, [challenges, firstIncompleteIndex]);

  useEffect(() => {
    if (!levels.length) return;

    const savedState = readResumeState();
    if (savedState?.categoryId === activeCategoryId && savedState?.levelId) {
      const savedLevelExists = levels.some(
        (level) => level._id === savedState.levelId,
      );
      if (savedLevelExists) {
        setActiveLevelId(savedState.levelId);
        if (savedState.challengeId) {
          setActiveChallengeId(savedState.challengeId);
          setMobileStep("detail");
        }
        return;
      }
    }

    if (!activeLevelId) setActiveLevelId(levels[0]._id);
  }, [levels, activeLevelId, activeCategoryId]);

  useEffect(() => {
    if (!activeLevelId) return;
    if (lastFetchedChallengesRef.current === activeLevelId) return;
    dispatch(fetchMilestoneChallenges(activeLevelId));
    lastFetchedChallengesRef.current = activeLevelId;
  }, [dispatch, activeLevelId]);

  useEffect(() => {
    if (!challenges.length) return;

    const savedState = readResumeState();
    const savedChallengeExists =
      savedState?.challengeId &&
      savedState?.levelId === activeLevelId &&
      challenges.some((challenge) => challenge._id === savedState.challengeId);

    if (savedChallengeExists && !activeChallengeId) {
      setActiveChallengeId(savedState.challengeId);
      setMobileStep("detail");
      return;
    }

    if (activeChallengeId) {
      const activeStillExists = challenges.some(
        (challenge) => challenge._id === activeChallengeId,
      );
      if (activeStillExists) return;
    }

    const targetChallenge = nextChallenge || challenges[0];
    if (targetChallenge) {
      setActiveChallengeId(targetChallenge._id);
      setMobileStep("detail");
    }
  }, [challenges, activeLevelId, activeChallengeId, nextChallenge]);

  useEffect(() => {
    const existing = getSubmissionForChallenge(activeChallengeId);
    setRepoUrl(existing?.repoUrl || "");
    setDemoUrl(existing?.demoUrl || "");
    setNotes(existing?.notes || "");
  }, [activeChallengeId, mySubmissions]);

  useEffect(() => {
    if (!activeCategoryId || !activeLevelId || !activeChallengeId) return;

    const storageKey = user ? resumeStorageKey : guestResumeStorageKey;

    localStorage.setItem(
      storageKey,
      JSON.stringify({
        categoryId: activeCategoryId,
        levelId: activeLevelId,
        challengeId: activeChallengeId,
      }),
    );
  }, [
    user,
    activeCategoryId,
    activeLevelId,
    activeChallengeId,
    resumeStorageKey,
    guestResumeStorageKey,
  ]);

  useEffect(() => {
    const onMobileBack = (event) => {
      if (window.innerWidth >= 768) {
        return;
      }

      if (handleMobileStepBack()) {
        event.preventDefault();
      }
    };

    window.addEventListener("app:mobile-back", onMobileBack);
    return () => window.removeEventListener("app:mobile-back", onMobileBack);
  }, [mobileStep]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitSuccess("");
    setSubmitError("");

    try {
      const existing = getSubmissionForChallenge(activeChallengeId);
      if (existing) {
        await dispatch(
          updateMilestoneSubmission({
            id: existing._id,
            payload: { repoUrl, demoUrl, notes },
          }),
        ).unwrap();
      } else {
        await dispatch(
          createMilestoneSubmission({
            challengeId: activeChallengeId,
            repoUrl,
            demoUrl,
            notes,
          }),
        ).unwrap();
      }
      setSubmitSuccess("Synced!");
      dispatch(fetchMyMilestoneSubmissions());
    } catch (err) {
      setSubmitError(
        typeof err === "string" ? err : "Failed to sync submission",
      );
    }
  };

  const styles = {
    bgMain: "transparent",
    bgSide:
      theme === "dark"
        ? "bg-[#120a21]/70 backdrop-blur-lg"
        : "bg-white/72 backdrop-blur-lg",
    bgMid:
      theme === "dark"
        ? "bg-[#1a0f2e]/48 backdrop-blur-lg"
        : "bg-white/62 backdrop-blur-lg",
    border: theme === "dark" ? "border-[#2e1a47]" : "border-slate-200/80",
    textDim: theme === "dark" ? "text-slate-400" : "text-slate-700",
    textHead: theme === "dark" ? "text-[#f8fafc]" : "text-slate-900",
    accent: "#7c3aed",
  };

  return (
    <div
      data-theme={theme}
      className={`secondary-page-shell min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-[#0a0514] text-slate-300" : "bg-white text-slate-800"}`}
    >
      <Navbar />

      <div className="secondary-page-bg-layer" />

      <div className="relative z-10 max-w-[100vw] pt-16 md:pt-14 h-[calc(100vh-1rem)] md:h-[calc(100vh-1rem)] flex flex-col">
        <div
          className={`flex items-center justify-between px-4 py-2 border-b ${styles.bgMid} ${styles.border}`}
        >
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
            <button onClick={handleMobileStepBack} className="md:hidden p-1">
              <ChevronLeft size={16} />
            </button>
            <span className={styles.textHead}>
              {activeCategory?.name || "Atlas"}
            </span>
            {activeLevel && (
              <>
                <ChevronRight size={10} className="opacity-20" />
                <span className={styles.textHead}>
                  Lvl {activeLevel.levelNumber}
                </span>
              </>
            )}
          </div>
          <Link
            to="/challenges"
            className="text-[10px] font-bold"
            style={{ color: styles.accent }}
          >
            WEEKLY
          </Link>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div
            className={`${mobileStep === "categories" ? "flex" : "hidden md:flex"} w-full md:w-56 flex-col border-r ${styles.bgSide} ${styles.border} overflow-y-auto`}
          >
            {categories.map((cat) => (
              <div key={cat._id} className={`border-b ${styles.border}`}>
                <button
                  onClick={() => setActiveCategoryId(cat._id)}
                  className={`w-full text-left px-4 py-3 text-[12px] transition-colors ${activeCategoryId === cat._id ? "bg-[#8b5cf6]/10" : styles.textDim}`}
                  style={{
                    color:
                      activeCategoryId === cat._id ? styles.accent : undefined,
                  }}
                >
                  {cat.name}
                </button>
                {activeCategoryId === cat._id &&
                  levels.map((lvl) => (
                    <button
                      key={lvl._id}
                      onClick={() => {
                        setActiveLevelId(lvl._id);
                        setActiveChallengeId("");
                        setMobileStep("challenges");
                      }}
                      className={`w-full text-left px-6 py-2 text-[11px] border-l-2 transition-all ${activeLevelId === lvl._id ? "border-[#8b5cf6]" : "border-transparent " + styles.textDim}`}
                      style={{
                        color:
                          activeLevelId === lvl._id ? styles.accent : undefined,
                      }}
                    >
                      Level {lvl.levelNumber}
                    </button>
                  ))}
              </div>
            ))}
          </div>

          <div
            className={`${mobileStep === "challenges" ? "flex" : "hidden md:flex"} w-full md:w-72 flex-col border-r ${styles.bgMid} ${styles.border} overflow-y-auto`}
          >
            {challenges.length === 0 ? (
              <div className="p-6 text-[12px] opacity-60">
                No challenges available for this level yet.
              </div>
            ) : (
              challenges.map((ch, idx) => (
                <button
                  key={ch._id}
                  onClick={() => {
                    setActiveChallengeId(ch._id);
                    setMobileStep("detail");
                  }}
                  disabled={isAuthenticated && idx > firstIncompleteIndex}
                  className={`w-full text-left p-4 border-b transition-all ${styles.border} ${activeChallengeId === ch._id ? "text-white" : "hover:bg-white/5"}`}
                  style={{
                    backgroundColor:
                      activeChallengeId === ch._id
                        ? styles.accent
                        : "transparent",
                  }}
                >
                  <div className="flex justify-between items-start font-bold text-[13px]">
                    {ch.title}{" "}
                    {getSubmissionForChallenge(ch._id) && (
                      <CheckCircle2 size={12} />
                    )}
                    {isAuthenticated && idx > firstIncompleteIndex && (
                      <Lock size={12} className="opacity-70" />
                    )}
                  </div>
                  <div className="text-[10px] uppercase opacity-60">
                    {getSubmissionForChallenge(ch._id)?.status || "Open"}
                  </div>
                </button>
              ))
            )}
          </div>

          <div
            className={`${mobileStep === "detail" ? "flex" : "hidden md:flex"} flex-1 overflow-y-auto p-6 md:p-12 min-h-[520px]`}
          >
            {activeChallenge ? (
              <div className="max-w-3xl mx-auto w-full">
                <div
                  className={`rounded-[28px] border p-6 md:p-8 shadow-2xl min-h-[420px] ${styles.bgSide} ${styles.border}`}
                >
                  <span
                    className="text-[10px] font-black uppercase tracking-[0.35em]"
                    style={{ color: styles.accent }}
                  >
                    Challenge {challenges.indexOf(activeChallenge) + 1}
                  </span>
                  <h2
                    className={`mt-2 text-2xl md:text-4xl font-bold tracking-tight ${styles.textHead}`}
                  >
                    {activeChallenge.title}
                  </h2>

                  <div className="mt-6 flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-[0.35em] opacity-70">
                    <span>Progress</span>
                    <span>
                      {completedChallengeCount}/{challenges.length || 0}{" "}
                      complete
                    </span>
                  </div>
                  <div className="mt-3 h-2.5 rounded-full overflow-hidden bg-black/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#c4b5fd]"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>

                  <p className="mt-5 text-[15px] leading-relaxed opacity-75 max-w-2xl">
                    {activeChallenge.description}
                  </p>

                  <div
                    className={`mt-8 rounded-2xl border p-5 md:p-6 ${theme === "dark" ? "border-white/10 bg-white/5" : "border-slate-200 bg-white/70"}`}
                  >
                    {isAuthenticated ? (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                          type="url"
                          required
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          className={`w-full px-4 py-3 text-[14px] rounded-xl border outline-none focus:border-[#7c3aed] transition-all ${styles.border} ${theme === "dark" ? "bg-black/35" : "bg-white"}`}
                          placeholder="GitHub repo URL"
                        />
                        <input
                          type="url"
                          value={demoUrl}
                          onChange={(e) => setDemoUrl(e.target.value)}
                          className={`w-full px-4 py-3 text-[14px] rounded-xl border outline-none focus:border-[#7c3aed] transition-all ${styles.border} ${theme === "dark" ? "bg-black/35" : "bg-white"}`}
                          placeholder="Live demo URL"
                        />
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          rows={4}
                          className={`w-full px-4 py-3 text-[14px] rounded-xl border outline-none focus:border-[#7c3aed] transition-all resize-none ${styles.border} ${theme === "dark" ? "bg-black/35" : "bg-white"}`}
                          placeholder="Short notes"
                        />
                        <button
                          type="submit"
                          className="w-full rounded-xl px-4 py-3 text-xs font-black uppercase tracking-[0.35em] text-white transition-transform hover:scale-[1.01] active:scale-95 shadow-lg shadow-[#7c3aed]/20"
                          style={{ backgroundColor: styles.accent }}
                        >
                          Sync Submission
                        </button>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.35em] text-[#7c3aed]">
                            Log in to submit
                          </p>
                          <p className="mt-2 text-sm opacity-70">
                            Sign in to unlock the submission form and save your
                            progress.
                          </p>
                        </div>
                        <Link
                          to="/login"
                          className="inline-flex items-center justify-center rounded-xl bg-[#7c3aed] px-4 py-3 text-xs font-black uppercase tracking-[0.35em] text-white transition-all hover:bg-[#6d28d9]"
                        >
                          Log in to submit
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto w-full min-h-[420px] flex items-center justify-center text-[13px] opacity-60 text-center px-4">
                Select a challenge to view details and submit your work.
              </div>
            )}
          </div>
        </div>
      </div>

      <MiniModal
        open={!!submitError || !!submitSuccess}
        title={submitError ? "Submission Error" : "Submission Updated"}
        message={submitError || submitSuccess}
        onClose={() => {
          setSubmitError("");
          setSubmitSuccess("");
        }}
      />
    </div>
  );
};

export default Milestones;
