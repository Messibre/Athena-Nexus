import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Inbox,
  Shield,
  User,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  ExternalLink,
  Github,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { fetchWeeks } from "../redux/thunks/weeksThunks";
import { fetchMySubmissions } from "../redux/thunks/submissionsThunks";
import {
  fetchAdminSubmissions,
  deleteAdminWeek,
} from "../redux/thunks/adminThunks";
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

export const selectTheme = (state) => state.theme.theme;

const Challenges = () => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme) || "dark";
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const weeks = useSelector(selectWeeks);
  const submissions = useSelector(selectMySubmissions);
  const submissionsLoading = useSelector(selectSubmissionsLoading);
  const adminSubmissions = useSelector(selectAdminSubmissions);
  const adminLoading = useSelector(selectAdminLoading);

  const [loading, setLoading] = useState(true);
  const [activeWeekId, setActiveWeekId] = useState("");
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        await dispatch(fetchWeeks()).unwrap();
        if (isAuthenticated && !isAdmin)
          await dispatch(fetchMySubmissions()).unwrap();
        if (isAdmin) await dispatch(fetchAdminSubmissions()).unwrap();
      } catch (error) {
        console.error("Data fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [dispatch, isAuthenticated, isAdmin]);

  const sortedWeeks = useMemo(() => {
    return [...weeks].sort((a, b) => b.week_number - a.week_number);
  }, [weeks]);

  useEffect(() => {
    if (sortedWeeks.length && !activeWeekId) {
      setActiveWeekId(sortedWeeks[0]._id);
    }
  }, [sortedWeeks, activeWeekId]);

  const activeWeek = sortedWeeks.find((week) => week._id === activeWeekId);
  const userSubmission = useMemo(
    () =>
      submissions.find(
        (sub) => (sub.week_id?._id || sub.week_id) === activeWeekId,
      ),
    [submissions, activeWeekId],
  );

  const handleSelectWeek = (id) => {
    setActiveWeekId(id);
    setShowMobileDetails(true);
  };

  const handleToggleTheme = () => {};

  const isDeadlinePassed = (date) => date && new Date() > new Date(date);

  if (loading || submissionsLoading || adminLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-[#0a0a0a] text-white" : "bg-white text-black"}`}
      >
        <div className="text-[11px] uppercase tracking-widest animate-pulse">
          Synchronizing...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${theme === "dark" ? "bg-[#0a0a0a] text-slate-300" : "bg-slate-50 text-slate-700"}`}
    >
      <Navbar />

      <div className="max-w-[1400px] mx-auto h-[calc(100vh-64px)] flex flex-col">
        {/* Responsive Header */}
        <header
          className={`flex items-center justify-between px-4 md:px-6 py-3 border-b ${theme === "dark" ? "bg-[#111] border-white/5" : "bg-white border-slate-200"}`}
        >
          <div className="flex items-center gap-2 md:gap-3">
            {showMobileDetails && (
              <button
                onClick={() => setShowMobileDetails(false)}
                className="md:hidden p-1 -ml-1"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <h1
              className={`text-[11px] md:text-sm font-bold tracking-tighter uppercase ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              {showMobileDetails ? `Week ${activeWeek?.week_number}` : "Inbox"}
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={handleToggleTheme}
              className="p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              {theme === "dark" ? (
                <Sun size={14} className="text-yellow-500" />
              ) : (
                <Moon size={14} className="text-slate-600" />
              )}
            </button>
            <Link
              to="/milestones"
              className="text-[10px] md:text-[11px] font-bold text-blue-500 hover:underline"
            >
              MILESTONES →
            </Link>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {/* COLUMN 1: WEEKS LIST (Hidden on mobile when detail is shown) */}
          <aside
            className={`
            ${showMobileDetails ? "hidden md:flex" : "flex"} 
            w-full md:w-80 border-r flex flex-col overflow-y-auto 
            ${theme === "dark" ? "bg-[#0f0f0f] border-white/5" : "bg-white border-slate-200"}
          `}
          >
            <div className="p-4 border-b border-transparent">
              <span className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em]">
                Chronology
              </span>
            </div>
            {sortedWeeks.map((week) => (
              <button
                key={week._id}
                onClick={() => handleSelectWeek(week._id)}
                className={`group text-left p-4 md:p-5 border-b transition-all ${
                  activeWeekId === week._id
                    ? theme === "dark"
                      ? "bg-blue-600 text-white border-blue-500"
                      : "bg-blue-50 text-blue-700 border-blue-100"
                    : theme === "dark"
                      ? "hover:bg-white/[0.02] border-white/5"
                      : "hover:bg-slate-50 border-slate-100"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[13px] font-bold leading-tight">
                    Week {week.week_number}
                  </span>
                  {submissions.find(
                    (s) => (s.week_id?._id || s.week_id) === week._id,
                  )?.status === "approved" && (
                    <CheckCircle2
                      size={12}
                      className={
                        activeWeekId === week._id
                          ? "text-white"
                          : "text-emerald-500"
                      }
                    />
                  )}
                </div>
                <div
                  className={`text-[11px] truncate font-medium ${activeWeekId === week._id ? "opacity-80" : "opacity-40"}`}
                >
                  {week.title || "Untitled Challenge"}
                </div>
              </button>
            ))}
          </aside>

          {/* COLUMN 2: DETAIL VIEW (Full width on mobile when shown) */}
          <main
            className={`
            ${showMobileDetails ? "flex" : "hidden md:flex"} 
            flex-1 overflow-y-auto relative 
            ${theme === "dark" ? "bg-[#0a0a0a]" : "bg-white"}
          `}
          >
            <AnimatePresence mode="wait">
              {activeWeek ? (
                <motion.div
                  key={activeWeek._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-3xl mx-auto py-8 md:py-16 px-6 md:px-12 w-full"
                >
                  <header className="mb-10 md:mb-14 text-center">
                    <span className="text-blue-500 text-[10px] font-bold uppercase tracking-[0.3em]">
                      Week {activeWeek.week_number}
                    </span>
                    <h2
                      className={`text-3xl md:text-5xl font-extrabold tracking-tighter mt-2 leading-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                    >
                      title: {activeWeek.title?.toLowerCase() || "unnamed"}
                    </h2>
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[10px] opacity-40 font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5">
                        <Clock size={12} />{" "}
                        {isDeadlinePassed(activeWeek.deadlineDate)
                          ? "Closed"
                          : "Active"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={12} />{" "}
                        {new Date(activeWeek.deadlineDate).toLocaleDateString()}
                      </span>
                    </div>
                  </header>

                  <div className="space-y-10 md:space-y-16">
                    {/* Description */}
                    <section>
                      <h4 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-4">
                        Briefing
                      </h4>
                      <p
                        className={`text-[13px] md:text-[14px] leading-relaxed font-medium ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                      >
                        {activeWeek.description ||
                          "No description provided for this challenge."}
                      </p>
                    </section>

                    {/* Resources */}
                    {activeWeek.resources?.length > 0 && (
                      <section>
                        <h4 className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-4">
                          Files & Links
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeWeek.resources.map((res, i) => (
                            <a
                              key={i}
                              href={res}
                              target="_blank"
                              rel="noreferrer"
                              className={`p-3 rounded border flex items-center justify-between text-[11px] font-bold transition-all ${
                                theme === "dark"
                                  ? "border-white/5 bg-white/[0.03] hover:bg-white/[0.08] text-slate-300"
                                  : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                              }`}
                            >
                              <span className="truncate mr-2">
                                {res.replace(/^https?:\/\//, "")}
                              </span>
                              <ExternalLink size={12} className="opacity-40" />
                            </a>
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Submission / CTA Area */}
                    <section
                      className={`p-6 md:p-10 rounded border text-center ${
                        theme === "dark"
                          ? "bg-[#111] border-white/5 shadow-2xl"
                          : "bg-slate-50 border-slate-200 shadow-sm"
                      }`}
                    >
                      {userSubmission ? (
                        <>
                          <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-extrabold uppercase tracking-[0.1em]">
                            <CheckCircle2 size={10} /> {userSubmission.status}
                          </div>
                          <h3
                            className={`text-lg md:text-xl font-bold mb-6 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                          >
                            Project Received
                          </h3>
                          <div className="flex flex-col sm:flex-row justify-center gap-3">
                            <Link
                              to={`/submit?week=${activeWeek._id}&edit=${userSubmission._id}`}
                              className="px-8 py-3 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest rounded hover:bg-blue-700 transition-all"
                            >
                              Modify Entry
                            </Link>
                            {userSubmission.github_repo_url && (
                              <a
                                href={userSubmission.github_repo_url}
                                target="_blank"
                                rel="noreferrer"
                                className={`px-8 py-3 border text-[11px] font-bold uppercase tracking-widest rounded flex items-center justify-center gap-2 transition-all ${
                                  theme === "dark"
                                    ? "border-white/10 text-white hover:bg-white/5"
                                    : "border-slate-300 text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                <Github size={14} /> Source
                              </a>
                            )}
                          </div>
                        </>
                      ) : (
                        <>
                          <h3
                            className={`text-lg md:text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                          >
                            Submit Project
                          </h3>
                          <p className="text-[11px] opacity-40 mb-8 font-medium">
                            Please ensure all requirements are met before
                            sending.
                          </p>
                          <Link
                            to={
                              isDeadlinePassed(activeWeek.deadlineDate)
                                ? "#"
                                : `/submit?week=${activeWeek._id}`
                            }
                            className={`inline-block w-full sm:w-auto px-12 py-4 text-[11px] font-extrabold uppercase tracking-[0.2em] rounded transition-all ${
                              isDeadlinePassed(activeWeek.deadlineDate)
                                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                : theme === "dark"
                                  ? "bg-white text-black hover:bg-slate-200"
                                  : "bg-slate-900 text-white hover:bg-black"
                            }`}
                          >
                            {isDeadlinePassed(activeWeek.deadlineDate)
                              ? "Deadline Expired"
                              : "Initialize Submission"}
                          </Link>
                        </>
                      )}
                    </section>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center opacity-10">
                  <Inbox size={60} strokeWidth={1} />
                  <span className="text-[10px] uppercase tracking-[0.6em] mt-6 font-bold">
                    Inbox Empty
                  </span>
                </div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Challenges;
