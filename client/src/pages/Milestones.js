import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Lock,
  Github,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import Navbar from "../components/Navbar";
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
  selectMilestonesLoading,
  selectMilestonesActionLoading,
} from "../redux/selectors/milestonesSelectors";

export const selectTheme = (state) => state.theme.theme;

const Milestones = () => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme) || "dark";
  const categories = useSelector(selectMilestoneCategories);
  const loading = useSelector(selectMilestonesLoading);
  const actionLoading = useSelector(selectMilestonesActionLoading);

  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [activeLevelId, setActiveLevelId] = useState("");
  const [activeChallengeId, setActiveChallengeId] = useState("");
  const [mobileStep, setMobileStep] = useState("categories");

  const [repoUrl, setRepoUrl] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    dispatch(fetchMilestoneCategories());
    dispatch(fetchMyMilestoneSubmissions());
  }, [dispatch]);

  useEffect(() => {
    if (categories.length && !activeCategoryId)
      setActiveCategoryId(categories[0]._id);
  }, [categories, activeCategoryId]);

  useEffect(() => {
    if (!activeCategoryId) return;
    dispatch(fetchMilestoneLevels(activeCategoryId));
    dispatch(fetchMilestoneProgress({ categoryId: activeCategoryId }));
    setActiveLevelId("");
    setActiveChallengeId("");
  }, [dispatch, activeCategoryId]);

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

  const getSubmissionForChallenge = (id) =>
    mySubmissions.find((s) => (s.challengeId?._id || s.challengeId) === id);

  const firstIncompleteIndex = useMemo(() => {
    for (let i = 0; i < challenges.length; i++) {
      if (getSubmissionForChallenge(challenges[i]._id)?.status !== "approved")
        return i;
    }
    return challenges.length;
  }, [challenges, mySubmissions]);

  useEffect(() => {
    if (levels.length && !activeLevelId) setActiveLevelId(levels[0]._id);
  }, [levels, activeLevelId]);

  useEffect(() => {
    if (!activeLevelId) return;
    dispatch(fetchMilestoneChallenges(activeLevelId));
    setActiveChallengeId("");
  }, [dispatch, activeLevelId]);

  useEffect(() => {
    const existing = getSubmissionForChallenge(activeChallengeId);
    setRepoUrl(existing?.repoUrl || "");
    setDemoUrl(existing?.demoUrl || "");
    setNotes(existing?.notes || "");
  }, [activeChallengeId, mySubmissions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      console.error(err);
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

      <div className="relative z-10 max-w-[100vw] h-[calc(100vh-64px)] flex flex-col">
        <div
          className={`flex items-center justify-between px-4 py-2 border-b ${styles.bgMid} ${styles.border}`}
        >
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase">
            <button
              onClick={() =>
                setMobileStep(
                  mobileStep === "detail" ? "challenges" : "categories",
                )
              }
              className="md:hidden p-1"
            >
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
                  disabled={idx > firstIncompleteIndex}
                  onClick={() => {
                    setActiveChallengeId(ch._id);
                    setMobileStep("detail");
                  }}
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
                    {getSubmissionForChallenge(ch._id)?.status ===
                      "approved" && <CheckCircle2 size={12} />}
                    {idx > firstIncompleteIndex && (
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
                <p className="mt-6 text-[14px] leading-relaxed opacity-60">
                  {activeChallenge.description}
                </p>
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
              </motion.div>
            ) : (
              <div className="max-w-2xl mx-auto w-full text-[13px] opacity-60">
                Select a challenge to view details and submit your work.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Milestones;
