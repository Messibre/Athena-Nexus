import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Inbox,
  ChevronLeft,
  ExternalLink,
  Github,
} from "lucide-react";
import Navbar from "../components/Navbar";
import { fetchWeeks } from "../redux/thunks/weeksThunks";
import { fetchMySubmissions } from "../redux/thunks/submissionsThunks";
import { fetchAdminSubmissions } from "../redux/thunks/adminThunks";
import { selectWeeks } from "../redux/selectors/weeksSelectors";
import {
  selectMySubmissions,
  selectSubmissionsLoading,
} from "../redux/selectors/submissionsSelectors";
import { selectAdminLoading } from "../redux/selectors/adminSelectors";
import {
  selectIsAdmin,
  selectIsAuthenticated,
} from "../redux/selectors/authSelectors";
import "./Challenges.css"; // New style import

export const selectTheme = (state) => state.theme.theme;

const Challenges = () => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme) || "dark";
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const weeks = useSelector(selectWeeks);
  const submissions = useSelector(selectMySubmissions);
  const submissionsLoading = useSelector(selectSubmissionsLoading);
  const adminLoading = useSelector(selectAdminLoading);

  const [loading, setLoading] = useState(true);
  const [activeWeekId, setActiveWeekId] = useState("");
  const [showMobileDetails, setShowMobileDetails] = useState(false);

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

  useEffect(() => {
    const onMobileBack = (event) => {
      if (window.innerWidth >= 768 || !showMobileDetails) {
        return;
      }

      setShowMobileDetails(false);
      event.preventDefault();
    };

    window.addEventListener("app:mobile-back", onMobileBack);
    return () => window.removeEventListener("app:mobile-back", onMobileBack);
  }, [showMobileDetails]);

  const isDeadlinePassed = (date) => date && new Date() > new Date(date);

  if (loading || submissionsLoading || adminLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-[#0a0514]" : "bg-slate-100"}`}
      >
        <div
          className={`text-[11px] uppercase tracking-[0.4em] animate-pulse font-black ${theme === "dark" ? "text-white" : "text-slate-700"}`}
        >
          Synchronizing Systems...
        </div>
      </div>
    );
  }

  return (
    <div className="challenges-page" data-theme={theme}>
      <Navbar />
      <div className="challenges-bg-image-layer" />

      <div className="challenges-layout">
        <header className="challenges-header">
          <div className="container mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showMobileDetails && (
                <button
                  onClick={() => setShowMobileDetails(false)}
                  className={`md:hidden ${theme === "dark" ? "text-white" : "text-slate-800"}`}
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <h1 className="header-title">
                {showMobileDetails
                  ? `Week ${activeWeek?.week_number}`
                  : "Challenge Inbox"}
              </h1>
            </div>
            <Link
              to="/milestones"
              className={`text-[10px] font-black tracking-widest transition-all ${
                theme === "dark"
                  ? "text-white/60 hover:text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              MILESTONES →
            </Link>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="container mx-auto px-6 flex-1 flex overflow-hidden">
            {/* SIDEBAR */}
            <aside
              className={`weeks-sidebar ${showMobileDetails ? "hidden md:block" : "block"}`}
            >
              <div className="p-6">
                <span className="section-label">Chronology</span>
              </div>
              {sortedWeeks.map((week) => (
                <button
                  key={week._id}
                  onClick={() => handleSelectWeek(week._id)}
                  className={`week-item ${activeWeekId === week._id ? "active" : ""}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="week-label uppercase tracking-tighter">
                      Week {week.week_number}
                    </span>
                    {submissions.find(
                      (s) => (s.week_id?._id || s.week_id) === week._id,
                    )?.status === "approved" && (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    )}
                  </div>
                  <div
                    className={`text-[11px] font-bold truncate uppercase ${theme === "dark" ? "text-white/40" : "text-slate-500"}`}
                  >
                    {week.title || "Untitled"}
                  </div>
                </button>
              ))}
            </aside>

            {/* MAIN DETAIL */}
            <main
              className={`challenge-detail ${showMobileDetails ? "flex" : "hidden md:flex"} flex-col`}
            >
              <AnimatePresence mode="wait">
                {activeWeek ? (
                  <motion.div
                    key={activeWeek._id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="max-w-4xl mx-auto w-full"
                  >
                    <header className="mb-12 text-center">
                      <span
                        className={`text-[10px] font-black uppercase tracking-[0.4em] ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}
                      >
                        Assignment Phase {activeWeek.week_number}
                      </span>
                      <h2 className="challenge-title">
                        {activeWeek.title?.toLowerCase() || "unnamed"}
                      </h2>
                      <div
                        className={`mt-6 flex justify-center gap-8 text-[10px] font-black uppercase tracking-widest ${theme === "dark" ? "text-white/40" : "text-slate-500"}`}
                      >
                        <span className="flex items-center gap-2">
                          <Clock size={12} />{" "}
                          {isDeadlinePassed(activeWeek.deadlineDate)
                            ? "Closed"
                            : "Active"}
                        </span>
                        <span className="flex items-center gap-2">
                          <CalendarDays size={12} />{" "}
                          {new Date(
                            activeWeek.deadlineDate,
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </header>

                    <div className="space-y-12">
                      <section>
                        <span className="section-label">
                          Operational Briefing
                        </span>
                        <p
                          className={`text-lg font-bold leading-relaxed italic ${theme === "dark" ? "text-white/80" : "text-slate-700"}`}
                        >
                          {activeWeek.description}
                        </p>
                      </section>

                      {activeWeek.resources?.length > 0 && (
                        <section>
                          <span className="section-label">
                            Intelligence Assets
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {activeWeek.resources.map((res, i) => (
                              <a
                                key={i}
                                href={res}
                                target="_blank"
                                rel="noreferrer"
                                className={`p-4 rounded-xl border transition-all flex items-center justify-between group ${
                                  theme === "dark"
                                    ? "border-white/10 bg-white/5 hover:bg-white/10"
                                    : "border-slate-300 bg-white/85 hover:bg-slate-100"
                                }`}
                              >
                                <span
                                  className={`text-[11px] font-black truncate ${
                                    theme === "dark"
                                      ? "text-white/70 group-hover:text-white"
                                      : "text-slate-700 group-hover:text-slate-900"
                                  }`}
                                >
                                  {res.replace(/^https?:\/\//, "")}
                                </span>
                                <ExternalLink
                                  size={14}
                                  className={
                                    theme === "dark"
                                      ? "text-white/30"
                                      : "text-slate-400"
                                  }
                                />
                              </a>
                            ))}
                          </div>
                        </section>
                      )}

                      <section className="cta-box">
                        {userSubmission ? (
                          <>
                            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                              <CheckCircle2 size={12} /> Transmission{" "}
                              {userSubmission.status}
                            </div>
                            <h3
                              className={`text-2xl font-black mb-8 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                            >
                              Asset Received
                            </h3>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                              <Link
                                to={`/submit?week=${activeWeek._id}&edit=${userSubmission._id}`}
                                className="btn-silver"
                              >
                                Reconfigure Entry
                              </Link>
                              {userSubmission.github_repo_url && (
                                <a
                                  href={userSubmission.github_repo_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="btn-outline flex items-center gap-2"
                                >
                                  <Github size={18} /> Source Code
                                </a>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <h3
                              className={`text-2xl font-black mb-3 uppercase tracking-tighter ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                            >
                              Initialize Deployment
                            </h3>
                            <p
                              className={`text-xs font-bold mb-10 tracking-wide uppercase ${theme === "dark" ? "text-white/40" : "text-slate-500"}`}
                            >
                              Verify requirements before transmission.
                            </p>
                            <Link
                              to={
                                isDeadlinePassed(activeWeek.deadlineDate)
                                  ? "#"
                                  : `/submit?week=${activeWeek._id}`
                              }
                              className={`btn-silver ${isDeadlinePassed(activeWeek.deadlineDate) ? "opacity-20 grayscale cursor-not-allowed" : ""}`}
                            >
                              {isDeadlinePassed(activeWeek.deadlineDate)
                                ? "Window Closed"
                                : "Submit Project"}
                            </Link>
                          </>
                        )}
                      </section>
                    </div>
                  </motion.div>
                ) : (
                  <div
                    className={`h-full w-full flex flex-col items-center justify-center ${theme === "dark" ? "text-white/10" : "text-slate-300"}`}
                  >
                    <Inbox size={80} strokeWidth={1} />
                    <span className="text-xs uppercase tracking-[1em] mt-8 font-black">
                      System Idle
                    </span>
                  </div>
                )}
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Challenges;
