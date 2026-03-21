import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import { fetchActiveWeek } from "../redux/thunks/weeksThunks";
import { fetchMySubmissions } from "../redux/thunks/submissionsThunks";
import { selectActiveWeek } from "../redux/selectors/weeksSelectors";
import {
  selectMySubmissions,
  selectSubmissionsLoading,
} from "../redux/selectors/submissionsSelectors";
import { selectUser } from "../redux/selectors/authSelectors";
import { selectTheme } from "../redux/selectors/themeSelectors";

const Dashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const activeWeek = useSelector(selectActiveWeek);
  const submissions = useSelector(selectMySubmissions);
  const submissionsLoading = useSelector(selectSubmissionsLoading);
  const theme = useSelector(selectTheme);

  useEffect(() => {
    dispatch(fetchMySubmissions());
    dispatch(fetchActiveWeek());
  }, [dispatch]);

  const getStatusBadge = (status) => {
    const badges = {
      pending: { class: "bg-amber-500/15 text-amber-500", text: "Pending" },
      approved: {
        class: "bg-emerald-500/15 text-emerald-500",
        text: "Approved",
      },
      rejected: { class: "bg-red-500/15 text-red-500", text: "Rejected" },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span
        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${badge.class}`}
      >
        {badge.text}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  if (submissionsLoading) {
    return (
      <div
        data-theme={theme}
        className={`min-h-screen font-['Space_Grotesk'] ${theme === "dark" ? "bg-[#0a0514] text-slate-300" : "bg-slate-50 text-slate-700"}`}
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
        <div className="relative z-10 h-[70vh] flex items-center justify-center text-[11px] font-black uppercase tracking-[0.35em] opacity-40">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div
      data-theme={theme}
      className={`min-h-screen font-['Space_Grotesk'] ${theme === "dark" ? "bg-[#0a0514] text-slate-300" : "bg-slate-50 text-slate-700"}`}
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-10 md:pt-12 pb-20 space-y-6">
        <div
          className={`rounded-3xl border p-6 md:p-8 shadow-2xl ${theme === "dark" ? "bg-[#120a21]/85 border-[#2e1a47]" : "bg-white/90 border-slate-200"}`}
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#8b5cf6] mb-2">
                Team Console
              </p>
              <h1
                className={`text-4xl md:text-5xl font-['Fraunces'] font-black tracking-tight mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
              >
                Welcome, {user?.displayName || user?.username}!
              </h1>
              <p className="opacity-70">Manage your weekly submissions</p>
            </div>
            <Link
              to="/settings"
              className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-[#8b5cf6] text-[#8b5cf6] font-black uppercase tracking-wider text-xs bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 transition-all"
            >
              Team Settings
            </Link>
          </div>
        </div>

        {activeWeek && (
          <div
            className={`rounded-3xl border p-6 md:p-8 shadow-2xl ${theme === "dark" ? "bg-[#120a21]/85 border-[#2e1a47]" : "bg-white/90 border-slate-200"}`}
          >
            <div
              className={`mb-5 pb-5 border-b ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}
            >
              <h2
                className={`text-3xl font-['Fraunces'] font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}
              >
                Current Challenge
              </h2>
            </div>
            <h3
              className={`text-xl font-black mb-3 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              Week {activeWeek.week_number}: {activeWeek.title}
            </h3>
            {activeWeek.description && (
              <p className="mb-4 opacity-70">{activeWeek.description}</p>
            )}
            {activeWeek.deadlineDate && (
              <p className="mb-5">
                <strong>Deadline:</strong> {formatDate(activeWeek.deadlineDate)}
              </p>
            )}
            <Link
              to="/submit"
              className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-black uppercase tracking-wider text-xs shadow-xl shadow-[#8b5cf6]/30 transition-all"
            >
              Submit Project
            </Link>
          </div>
        )}

        <div
          className={`rounded-3xl border p-6 md:p-8 shadow-2xl ${theme === "dark" ? "bg-[#120a21]/85 border-[#2e1a47]" : "bg-white/90 border-slate-200"}`}
        >
          <div
            className={`mb-5 pb-5 border-b ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}
          >
            <h2
              className={`text-3xl font-['Fraunces'] font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              Your Submissions
            </h2>
          </div>

          {submissions.length === 0 ? (
            <p className="opacity-70">
              No submissions yet. Start by submitting your first project!
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {submissions.map((submission) => (
                <div
                  key={submission._id}
                  className={`p-5 rounded-2xl border ${theme === "dark" ? "border-[#2e1a47] bg-[#0a0514]/65" : "border-slate-200 bg-slate-50/90"}`}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                    <div>
                      <h3
                        className={`font-black mb-1 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                      >
                        Week {submission.week_id?.week_number || "N/A"}:{" "}
                        {submission.week_id?.title || "Untitled"}
                      </h3>
                      <p className="opacity-60 text-sm">
                        Submitted: {formatDate(submission.created_at)}
                      </p>
                    </div>
                    {getStatusBadge(submission.status)}
                  </div>

                  {submission.description && (
                    <p className="mb-3 opacity-75">{submission.description}</p>
                  )}

                  <div className="flex gap-3 flex-wrap">
                    <a
                      href={submission.github_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-[#8b5cf6] text-[#8b5cf6] text-xs font-black uppercase tracking-wider bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 transition-all"
                    >
                      GitHub Repo
                    </a>
                    {submission.github_live_demo_url && (
                      <a
                        href={submission.github_live_demo_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[#8b5cf6]/20 transition-all"
                      >
                        Live Demo
                      </a>
                    )}
                  </div>

                  {submission.reviewerNotes && (
                    <div className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                      <strong>Reviewer Notes:</strong>{" "}
                      {submission.reviewerNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
