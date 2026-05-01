import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  Github,
  ExternalLink,
  Layers,
  Trophy,
  Search,
  Filter,
  ImageOff,
} from "lucide-react";
import Navbar from "../components/Navbar";
import {
  fetchWeekById,
  fetchWeekSubmissions,
} from "../redux/thunks/weeksThunks";
import { fetchPublicSubmissions } from "../redux/thunks/submissionsThunks";
import { fetchPublicMilestoneSubmissions } from "../redux/thunks/milestonesThunks";
import { selectWeekSubmissions } from "../redux/selectors/weeksSelectors";
import {
  selectPublicSubmissions,
  selectSubmissionsLoading,
} from "../redux/selectors/submissionsSelectors";
import { selectPublicMilestoneSubmissions } from "../redux/selectors/milestonesSelectors";
import { selectIsAuthenticated } from "../redux/selectors/authSelectors";

export const selectTheme = (state) => state.theme.theme;

const Gallery = () => {
  const { weekId } = useParams();
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme) || "dark";
  const [localLoading, setLocalLoading] = useState(true);
  const [view, setView] = useState("weekly");
  const [searchQuery, setSearchQuery] = useState("");
  const [weekFilter, setWeekFilter] = useState("all");
  const [techFilter, setTechFilter] = useState("all");
  const [error, setError] = useState("");
  const isAuthenticated = useSelector(selectIsAuthenticated);

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

    const decorated = list.map((submission) => {
      const isMilestone = view === "milestones";
      const techStack = isMilestone
        ? submission.categoryId?.name || "Milestone"
        : (submission.tags || []).join(", ") || "General";
      const submissionWeekId =
        submission.week_id?._id || submission.week_id || "";

      return {
        ...submission,
        isMilestone,
        techStack,
        submissionWeekId,
      };
    });

    return decorated.filter((submission) => {
      const loweredQuery = searchQuery.toLowerCase();
      const matchesSearch = !loweredQuery
        ? true
        : (submission.user_id?.username || submission.userId?.username || "")
            .toLowerCase()
            .includes(loweredQuery) ||
          (
            submission.user_id?.displayName ||
            submission.userId?.displayName ||
            ""
          )
            .toLowerCase()
            .includes(loweredQuery) ||
          (submission.description || submission.notes || "")
            .toLowerCase()
            .includes(loweredQuery) ||
          (submission.challengeId?.title || submission.week_id?.title || "")
            .toLowerCase()
            .includes(loweredQuery);

      const matchesWeek =
        weekFilter === "all" || submission.submissionWeekId === weekFilter;

      const matchesTech =
        techFilter === "all" ||
        submission.techStack.toLowerCase().includes(techFilter.toLowerCase());

      return matchesSearch && matchesWeek && matchesTech;
    });
  }, [
    view,
    weekId,
    weekSubmissions,
    publicSubmissions,
    milestoneSubmissions,
    searchQuery,
    weekFilter,
    techFilter,
  ]);

  const weekOptions = useMemo(() => {
    const unique = new Map();
    const source =
      view === "weekly" ? (weekId ? weekSubmissions : publicSubmissions) : [];

    source.forEach((submission) => {
      const weekValue = submission.week_id?._id || submission.week_id;
      if (weekValue && !unique.has(weekValue)) {
        unique.set(weekValue, {
          value: weekValue,
          label: `Week ${submission.week_id?.week_number || "?"}`,
        });
      }
    });

    return [...unique.values()];
  }, [view, weekId, weekSubmissions, publicSubmissions]);

  const techOptions = useMemo(() => {
    const unique = new Set();
    activeSubmissions.forEach((submission) => {
      (submission.techStack || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => unique.add(item));
    });
    return [...unique];
  }, [activeSubmissions]);

  useEffect(() => {
    if (weekId) {
      setView("weekly");
      setWeekFilter(weekId);
    }
  }, [weekId]);

  useEffect(() => {
    if (view === "weekly") {
      setWeekFilter(weekId || "all");
    } else {
      setWeekFilter("all");
    }
    setTechFilter("all");
  }, [view, weekId]);

  useEffect(() => {
    const run = async () => {
      setLocalLoading(true);
      setError("");
      try {
        await Promise.all([
          dispatch(fetchPublicSubmissions()),
          dispatch(fetchPublicMilestoneSubmissions()),
        ]);

        if (weekId) {
          await Promise.all([
            dispatch(fetchWeekSubmissions(weekId)),
            dispatch(fetchWeekById(weekId)),
          ]);
        }
      } catch (err) {
        setError("Unable to load gallery data. Please try again.");
      } finally {
        setLocalLoading(false);
      }
    };
    run();
  }, [dispatch, weekId]);

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
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className={`text-sm font-bold truncate ${styles.textHead}`}>
                {isMilestone
                  ? submission.challengeId?.title || "Milestone Project"
                  : submission.week_id?.title || "Final Project"}
              </h3>
              <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-50">
                {isMilestone ? "Milestone" : "Final"}
              </span>
            </div>
            <p className="text-[11px] opacity-50 font-medium truncate">
              {isMilestone
                ? `${submission.categoryId?.name || "Atlas"} · Lvl ${submission.levelId?.levelNumber || "?"}`
                : `Week ${submission.week_id?.week_number || "?"}`}
            </p>
          </div>
        </div>

        {submission.screenshotUrl ? (
          <img
            src={submission.screenshotUrl}
            alt={`${submission.user_id?.displayName || submission.userId?.displayName || "Team"} project preview`}
            className="mb-4 h-40 w-full rounded-2xl object-cover border border-white/10"
          />
        ) : (
          <div
            className={`mb-4 flex h-40 w-full items-center justify-center rounded-2xl border border-dashed ${theme === "dark" ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-100"}`}
          >
            <div className="flex flex-col items-center gap-2 text-center opacity-60">
              <ImageOff size={26} />
              <p
                className={`text-[10px] font-black uppercase tracking-[0.35em] ${styles.textHead}`}
              >
                Thumbnail unavailable
              </p>
            </div>
          </div>
        )}

        <p
          className={`text-[12px] leading-relaxed mb-4 line-clamp-2 flex-grow ${styles.textMain}`}
        >
          {submission.description || submission.notes || "No documentation."}
        </p>

        <div className="mt-auto mb-3 flex items-center justify-between gap-2 text-[11px] font-black uppercase tracking-widest opacity-60">
          <span>
            {submission.user_id?.displayName ||
              submission.userId?.displayName ||
              submission.user_id?.username ||
              submission.userId?.username ||
              "Unknown team"}
          </span>
          <span>
            {new Date(
              submission.createdAt || submission.created_at || Date.now(),
            ).toLocaleDateString()}
          </span>
        </div>

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

          {!isAuthenticated && (
            <div className={`mb-6 rounded-2xl border p-4 ${styles.card}`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#8b5cf6] mb-2">
                    Log in to submit
                  </p>
                  <p className={`text-sm ${styles.textMain}`}>
                    Browse the full showcase freely, then sign in when you are
                    ready to submit your own project.
                  </p>
                </div>
                <Link
                  to="/submit"
                  className="inline-flex items-center justify-center rounded-xl bg-[#8b5cf6] px-5 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-[#7c3aed]"
                >
                  Log in to submit
                </Link>
              </div>
            </div>
          )}

          <div
            className={`p-1.5 rounded-2xl border flex flex-col sm:flex-row gap-2 ${styles.card}`}
          >
            <div className="flex flex-wrap gap-1">
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
                Final Projects
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

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {view === "weekly" && (
              <label className={`rounded-xl border px-4 py-3 ${styles.card}`}>
                <span className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.32em] opacity-60">
                  <Filter size={12} /> Week
                </span>
                <select
                  value={weekFilter}
                  onChange={(e) => setWeekFilter(e.target.value)}
                  className={`w-full bg-transparent text-sm outline-none ${styles.textHead}`}
                >
                  <option value="all">All weeks</option>
                  {weekOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className={`rounded-xl border px-4 py-3 ${styles.card}`}>
              <span className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.32em] opacity-60">
                <Filter size={12} /> Tech Stack
              </span>
              <select
                value={techFilter}
                onChange={(e) => setTechFilter(e.target.value)}
                className={`w-full bg-transparent text-sm outline-none ${styles.textHead}`}
              >
                <option value="all">All stacks</option>
                {techOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>

            <div className={`rounded-xl border px-4 py-3 ${styles.card}`}>
              <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.32em] opacity-60">
                Submission Type
              </span>
              <p className={`text-sm font-black ${styles.textHead}`}>
                {view === "weekly" ? "Final projects" : "Milestone entries"}
              </p>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
