import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { Github, ExternalLink, Layers, Trophy, Search } from "lucide-react";
import Navbar from "../components/Navbar";
import {
  fetchWeekById,
  fetchWeekSubmissions,
} from "../redux/thunks/weeksThunks";
import { fetchPublicSubmissions } from "../redux/thunks/submissionsThunks";
import { fetchPublicMilestoneSubmissions } from "../redux/thunks/milestonesThunks";
import {
  selectWeekById,
  selectWeekSubmissions,
} from "../redux/selectors/weeksSelectors";
import {
  selectPublicSubmissions,
  selectSubmissionsLoading,
} from "../redux/selectors/submissionsSelectors";
import { selectPublicMilestoneSubmissions } from "../redux/selectors/milestonesSelectors";

export const selectTheme = (state) => state.theme.theme;

const Gallery = () => {
  const { weekId } = useParams();
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme) || "dark";
  const [localLoading, setLocalLoading] = useState(true);
  const [view, setView] = useState("weekly");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  const week = useSelector((state) =>
    weekId ? selectWeekById(state, weekId) : null,
  );
  const weekSubmissions = useSelector((state) =>
    weekId ? selectWeekSubmissions(state, weekId) : [],
  );
  const publicSubmissions = useSelector(selectPublicSubmissions);
  const submissionsLoading = useSelector(selectSubmissionsLoading);
  const milestoneSubmissions = useSelector(selectPublicMilestoneSubmissions);

  const styles = {
    bg: theme === "dark" ? "bg-[#0a0514]" : "bg-slate-50",
    card:
      theme === "dark"
        ? "bg-[#120a21]/80 border-[#2e1a47] backdrop-blur-md"
        : "bg-white/90 border-slate-200 backdrop-blur-md",
    textMain: theme === "dark" ? "text-slate-400" : "text-slate-600",
    textHead: theme === "dark" ? "text-white" : "text-slate-900",
    input:
      theme === "dark"
        ? "bg-black/30 border-[#2e1a47]"
        : "bg-white border-slate-200",
  };

  const activeSubmissions = useMemo(() => {
    const list =
      view === "weekly"
        ? weekId
          ? weekSubmissions
          : publicSubmissions
        : milestoneSubmissions;

    if (!searchQuery) return list;
    return list.filter(
      (s) =>
        (s.user_id?.username || s.userId?.username || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        (s.description || s.notes || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
  }, [
    view,
    weekId,
    weekSubmissions,
    publicSubmissions,
    milestoneSubmissions,
    searchQuery,
  ]);

  useEffect(() => {
    if (weekId) setView("weekly");
  }, [weekId]);

  useEffect(() => {
    const run = async () => {
      setLocalLoading(true);
      setError("");
      try {
        if (view === "weekly") {
          if (weekId) {
            await Promise.all([
              dispatch(fetchWeekSubmissions(weekId)),
              dispatch(fetchWeekById(weekId)),
            ]);
          } else {
            await dispatch(fetchPublicSubmissions()).unwrap();
          }
        } else {
          await dispatch(fetchPublicMilestoneSubmissions()).unwrap();
        }
      } catch (err) {
        setError("Unable to load gallery data. Please try again.");
      } finally {
        setLocalLoading(false);
      }
    };
    run();
  }, [dispatch, weekId, view]);

  const ProjectCard = ({ submission, isMilestone }) => (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`group relative rounded-2xl p-5 border transition-all duration-300 hover:shadow-xl ${styles.card}`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-start gap-3 mb-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              theme === "dark"
                ? "bg-[#8b5cf6]/20 text-[#a78bfa]"
                : "bg-[#8b5cf6]/10 text-[#7c3aed]"
            }`}
          >
            {isMilestone ? <Layers size={18} /> : <Trophy size={18} />}
          </div>
          <div className="min-w-0">
            <h3 className={`text-sm font-bold truncate ${styles.textHead}`}>
              {isMilestone
                ? submission.challengeId?.title
                : submission.user_id?.displayName ||
                  submission.user_id?.username}
            </h3>
            <p className="text-[11px] opacity-50 font-medium truncate">
              {isMilestone
                ? `${submission.userId?.username} - Lvl ${submission.levelId?.levelNumber}`
                : weekId
                  ? "Entry"
                  : `Week ${submission.week_id?.week_number}`}
            </p>
          </div>
        </div>

        <p
          className={`text-[12px] leading-relaxed mb-4 line-clamp-2 flex-grow ${styles.textMain}`}
        >
          {submission.description || submission.notes || "No documentation."}
        </p>

        <div className="flex items-center gap-2 pt-4 border-t border-white/5">
          <a
            href={submission.github_repo_url || submission.repoUrl}
            target="_blank"
            rel="noreferrer"
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
              theme === "dark"
                ? "bg-white/5 text-white hover:bg-white/10"
                : "bg-slate-100 text-slate-900 hover:bg-slate-200"
            }`}
          >
            <Github size={12} /> Repo
          </a>
          {(submission.github_live_demo_url || submission.demoUrl) && (
            <a
              href={submission.github_live_demo_url || submission.demoUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-[#8b5cf6] text-white text-[10px] font-black uppercase tracking-wider hover:bg-[#7c3aed] shadow-lg shadow-[#8b5cf6]/20"
            >
              <ExternalLink size={12} /> Live
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div
      data-theme={theme}
      className={`min-h-screen transition-colors duration-300 font-['Space_Grotesk'] ${styles.bg}`}
    >
      <Navbar />

      <div
        className="bg-image-layer"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: 'url("/pur1.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: theme === "dark" ? 0.4 : 0.85,
          pointerEvents: "none",
        }}
      />

      <section className="relative z-10 pt-16 pb-8">
        <div className="container mx-auto px-6">
          <header className="max-w-3xl mb-10">
            <span className="text-[#8b5cf6] text-[10px] font-black uppercase tracking-[0.4em] mb-2 block">
              Community Showcase
            </span>
            <h1
              className={`text-4xl md:text-5xl font-['Fraunces'] font-black tracking-tighter mb-4 ${styles.textHead}`}
            >
              The Gallery.
            </h1>
            <p
              className={`text-sm md:text-base font-medium leading-relaxed max-w-xl ${styles.textMain}`}
            >
              Explore projects built by the community. One week, one challenge,
              one masterpiece.
            </p>
          </header>

          <div
            className={`p-1.5 rounded-2xl border flex flex-col sm:flex-row gap-2 ${styles.card}`}
          >
            <div className="flex gap-1">
              <button
                onClick={() => setView("weekly")}
                className={`flex-1 sm:flex-none py-2.5 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  view === "weekly"
                    ? theme === "dark"
                      ? "bg-[#8b5cf6] text-white"
                      : "bg-[#8b5cf6] text-white"
                    : "opacity-40 hover:opacity-100"
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setView("milestones")}
                className={`flex-1 sm:flex-none py-2.5 px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  view === "milestones"
                    ? theme === "dark"
                      ? "bg-[#8b5cf6] text-white"
                      : "bg-[#8b5cf6] text-white"
                    : "opacity-40 hover:opacity-100"
                }`}
              >
                Milestones
              </button>
            </div>
            <div
              className={`flex-1 relative rounded-xl border ${styles.input}`}
            >
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30"
                size={14}
              />
              <input
                type="text"
                placeholder="Search projects or creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-full bg-transparent border-0 focus:ring-0 pl-10 pr-4 text-[12px] font-medium"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 container mx-auto px-6 pb-20">
        <div className="flex items-center gap-4 mb-8 opacity-20">
          <div className="h-[1px] flex-1 bg-current" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">
            {activeSubmissions.length} Results
          </span>
          <div className="h-[1px] flex-1 bg-current" />
        </div>

        {localLoading || submissionsLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-[#8b5cf6]/20 border-t-[#8b5cf6] rounded-full animate-spin mx-auto mb-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-30">
              Fetching...
            </span>
          </div>
        ) : error ? (
          <div className="py-20 text-center text-[12px] font-semibold opacity-60">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeSubmissions.map((sub) => (
              <ProjectCard
                key={sub._id}
                submission={sub}
                isMilestone={view === "milestones"}
              />
            ))}
            {activeSubmissions.length === 0 && (
              <div className="col-span-full text-center text-[12px] opacity-50">
                No submissions found for this view yet.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Gallery;
