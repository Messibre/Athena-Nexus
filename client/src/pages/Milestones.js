import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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

  useEffect(() => {
    if (!activeCategoryId) return;
    dispatch(fetchMilestoneLevels(activeCategoryId));
    if (isAuthenticated) {
      dispatch(fetchMilestoneProgress({ categoryId: activeCategoryId }));
    }
  }, [dispatch, activeCategoryId, isAuthenticated]);

  const levels = useSelector((state) =>
    selectMilestoneLevels(state, activeCategoryId),
  );
  const challenges = useSelector((state) =>
    selectMilestoneChallenges(state, activeLevelId),
  );
  const mySubmissions = useSelector(selectMyMilestoneSubmissions);

  const activeCategory = categories.find((c) => c._id === activeCategoryId);
  const activeLevel = levels.find((l) => l._id === activeLevelId);
  const activeChallenge = challenges.find((ch) => ch._id === activeChallengeId);
  const resumeStorageKey =
    user?._id || user?.id
      ? `athena-milestones-resume:${user._id || user.id}`
      : "athena-milestones-resume:guest";

  const readResumeState = () => {
    try {
      const rawValue = localStorage.getItem(resumeStorageKey);
      return rawValue ? JSON.parse(rawValue) : null;
    } catch (error) {
      return null;
    }
  };

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
    dispatch(fetchMilestoneChallenges(activeLevelId));
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
    if (!user || !activeCategoryId || !activeLevelId || !activeChallengeId)
      return;

    localStorage.setItem(
      resumeStorageKey,
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
        ? "bg-[#120a21]/80 backdrop-blur-md"
        : "bg-white/90 backdrop-blur-md",
    bgMid:
      theme === "dark"
        ? "bg-[#1a0f2e]/60 backdrop-blur-md"
        : "bg-slate-50/90 backdrop-blur-md",
    border: theme === "dark" ? "border-[#2e1a47]" : "border-slate-200",
    textDim: theme === "dark" ? "text-slate-400" : "text-slate-500",
    textHead: theme === "dark" ? "text-[#f3f4f6]" : "text-slate-900", // Silver/White for dark mode
    accent: "#8b5cf6", // Primary Purple
  };

  return (
    <div
      data-theme={theme}
      className={`min-h-screen transition-colors duration-300 ${theme === "dark" ? "bg-[#0a0514] text-slate-300" : "bg-white text-slate-700"}`}
    >
      <Navbar />

      {/* Background Layer to match Home.js */}
      <div
        className="bg-image-layer"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: 'url("/pur1.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          pointerEvents: "none",
        }}
      />

      <div className="relative z-10 max-w-[100vw] pt-16 md:pt-24 h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)] flex flex-col">
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
            className={`${mobileStep === "categories" ? "flex" : "hidden md:flex"} w-full md:w-64 flex-col border-r ${styles.bgSide} ${styles.border} overflow-y-auto`}
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
            className={`${mobileStep === "challenges" ? "flex" : "hidden md:flex"} w-full md:w-80 flex-col border-r ${styles.bgMid} ${styles.border} overflow-y-auto`}
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
            className={`${mobileStep === "detail" ? "flex" : "hidden md:flex"} flex-1 overflow-y-auto p-6 md:p-12`}
          >
            {activeChallenge ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto w-full"
              >
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: styles.accent }}
                >
                  Challenge {challenges.indexOf(activeChallenge) + 1}
                </span>
                <h2
                  className={`text-3xl md:text-5xl font-extrabold mt-2 tracking-tighter ${styles.textHead}`}
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  {activeChallenge.title.toLowerCase()}
                </h2>
                {!isAuthenticated && (
                  <div
                    className={`mt-6 rounded-2xl border p-4 ${theme === "dark" ? "border-white/10 bg-white/5" : "border-slate-200 bg-white/80"}`}
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#8b5cf6] mb-2">
                      Log in to submit
                    </p>
                    <p className="text-sm opacity-70">
                      Browse the full milestone tree freely. Sign in when you are ready to submit or continue your progress.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        to="/login"
                        className="inline-flex items-center justify-center rounded-xl bg-[#8b5cf6] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-[#7c3aed]"
                      >
                        Log in to submit
                      </Link>
                      <Link
                        to="/gallery"
                        className={`inline-flex items-center justify-center rounded-xl border px-4 py-2.5 text-xs font-black uppercase tracking-wider transition-all ${theme === "dark" ? "border-white/10 text-slate-200 hover:bg-white/5" : "border-slate-200 text-slate-700 hover:bg-slate-100"}`}
                      >
                        View Gallery
                      </Link>
                    </div>
                  </div>
                )}
                <div
                  className={`mt-6 rounded-2xl border p-4 ${theme === "dark" ? "border-white/10 bg-white/5" : "border-slate-200 bg-white/80"}`}
                >
                  <div className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest opacity-70">
                    <span>Progress</span>
                    <span>
                      {completedChallengeCount}/{challenges.length || 0}{" "}
                      complete
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full overflow-hidden bg-black/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#c4b5fd]"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                  <p className="mt-3 text-[11px] uppercase tracking-widest opacity-60">
                    The next unlocked challenge is automatically restored when
                    you return.
                  </p>
                </div>
                <p className="mt-6 text-[14px] leading-relaxed opacity-60">
                  {activeChallenge.description}
                </p>
                {isAuthenticated ? (
                  <form
                    onSubmit={handleSubmit}
                    className={`mt-12 p-6 rounded-2xl border ${styles.bgSide} ${styles.border} space-y-4 shadow-xl`}
                  >
                    <input
                      type="url"
                      required
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className={`w-full p-3 text-[12px] rounded-xl border outline-none focus:border-[#8b5cf6] transition-all ${styles.border} ${theme === "dark" ? "bg-black/40" : "bg-white"}`}
                      placeholder="Github Repo URL"
                    />
                    <button
                      type="submit"
                      className="w-full py-4 text-white text-[11px] font-bold uppercase rounded-xl transition-transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-[#8b5cf6]/20"
                      style={{ backgroundColor: styles.accent }}
                    >
                      Sync Submission
                    </button>
                  </form>
                ) : (
                  <div
                    className={`mt-12 p-6 rounded-2xl border ${styles.bgSide} ${styles.border} shadow-xl`}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.35em] text-[#8b5cf6] mb-2">
                      Log in to submit
                    </p>
                    <p className="text-sm opacity-70">
                      When you are ready to upload progress, sign in to unlock the submission form and resume where you left off.
                    </p>
                    <Link
                      to="/login"
                      className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#8b5cf6] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-[#7c3aed]"
                    >
                      Log in to submit
                    </Link>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="max-w-2xl mx-auto w-full text-[13px] opacity-60">
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
