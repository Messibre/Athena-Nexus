import React, { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Crown, Medal, Sparkles, Trophy } from "lucide-react";
import Navbar from "../components/Navbar";
import { fetchActiveWeek, fetchLeaderboard } from "../redux/thunks/weeksThunks";
import { fetchMySubmissions } from "../redux/thunks/submissionsThunks";
import {
  selectActiveWeek,
  selectLeaderboard,
} from "../redux/selectors/weeksSelectors";
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
  const leaderboard = useSelector(selectLeaderboard);
  const submissions = useSelector(selectMySubmissions);
  const submissionsLoading = useSelector(selectSubmissionsLoading);
  const theme = useSelector(selectTheme);

  useEffect(() => {
    dispatch(fetchMySubmissions());
    dispatch(fetchActiveWeek());
    dispatch(fetchLeaderboard());
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
        className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${badge.class}`}
      >
        {badge.text}
      </span>
    );
  };

  const formatDate = (date) => new Date(date).toLocaleDateString();

  const _currentSubmission = useMemo(() => {
    if (!activeWeek) return submissions[0] || null;
    return (
      submissions.find(
        (submission) =>
          (submission.week_id?._id || submission.week_id) === activeWeek._id,
      ) ||
      submissions[0] ||
      null
    );
  }, [submissions, activeWeek]);

  const topScore = leaderboard[0]?.points || 0;
  const currentTeam = leaderboard.find(
    (entry) => entry.userId === (user?._id || user?.id),
  );

  const badgeLabel = (badge) => {
    if (badge === "gold") return "Gold";
    if (badge === "silver") return "Silver";
    if (badge === "bronze") return "Bronze";
    return "Top 10";
  };

  if (submissionsLoading) {
    return (
      <div
        data-theme={theme}
        className={`min-h-screen font-['Manrope'] ${theme === "dark" ? "bg-[#0a0514] text-slate-300" : "bg-slate-50 text-slate-700"}`}
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
            opacity: theme === "dark" ? 0.2 : 0.5,
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
      className={`min-h-screen font-['Manrope'] ${theme === "dark" ? "bg-[#0a0514] text-slate-300" : "bg-slate-50 text-slate-700"}`}
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
          className={`rounded-3xl border p-6 md:p-8 shadow-xs ${theme === "dark" ? "bg-[#120a21]/85 border-[#2e1a47]" : "bg-white/90 border-slate-200"}`}
        >
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-[#8b5cf6] mb-2">
                Team Console
              </p>
              <h1
                className={`text-xs md:text-2xl font-['Fraunces'] font-black tracking-tight mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
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

        <div
          className={`rounded-3xl border p-6 md:p-8 shadow-xs ${theme === "dark" ? "bg-[#120a21]/85 border-[#2e1a47]" : "bg-white/90 border-slate-200"}`}
        >
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 pb-6 border-b border-white/10">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.45em] text-[#8b5cf6] mb-2">
                Nexus Leaderboard
              </p>
              <h2
                className={`text-xs md:text-2xl font-['Fraunces'] font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}
              >
                Top teams this cycle
              </h2>
              <p className="mt-2 text-xs opacity-70 max-w-xs">
                Teams earn 10 points per approved weekly or milestone project.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.3em] opacity-80">
              <Sparkles size={14} className="text-[#8b5cf6]" />
              Live rankings
            </div>
          </div>

          {leaderboard.length === 0 ? (
            <p className="opacity-70">No leaderboard entries yet.</p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-5">
              <div
                className={`relative overflow-hidden rounded-3xl border p-6 md:p-7 ${theme === "dark" ? "border-[#3b225d] bg-gradient-to-br from-[#6d28d9] via-[#7c3aed] to-[#4c1d95] text-white" : "border-slate-200 bg-gradient-to-br from-[#8b5cf6] via-[#7c3aed] to-[#5b21b6] text-white"}`}
              >
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.6),_transparent_35%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.25),_transparent_28%)]" />
                <div className="relative flex flex-col h-full">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.35em] text-white/75 mb-2">
                        Current team
                      </p>
                      <h3 className="text-xs md:text-2xl font-black tracking-tight">
                        {currentTeam?.displayName ||
                          user?.displayName ||
                          user?.username}
                      </h3>
                      <p className="mt-1 text-xs text-white/75">
                        {currentTeam
                          ? `Rank #${currentTeam.rank} · ${currentTeam.projectCount} projects`
                          : "Start submitting to appear on the board"}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xs bg-white/15 backdrop-blur-xs border border-white/20">
                      <Crown size={22} />
                    </div>
                  </div>

                  <div className="mt-8 grid grid-cols-1 xs:grid-cols-3 gap-3">
                    <div className="rounded-xs border border-white/15 bg-white/10 backdrop-blur-xs p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                        Team rank
                      </p>
                      <p className="mt-2 text-3xl font-black">
                        {currentTeam?.rank || "--"}
                      </p>
                    </div>
                    <div className="rounded-xs border border-white/15 bg-white/10 backdrop-blur-xs p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                        Total points
                      </p>
                      <p className="mt-2 text-3xl font-black">
                        {currentTeam?.points || 0}
                      </p>
                    </div>
                    <div className="rounded-xs border border-white/15 bg-white/10 backdrop-blur-xs p-4">
                      <p className="text-xs uppercase tracking-[0.35em] text-white/70">
                        Top score
                      </p>
                      <p className="mt-2 text-3xl font-black">{topScore}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
                <div
                  className={`rounded-3xl border p-5 ${theme === "dark" ? "border-[#2e1a47] bg-[#0a0514]/65" : "border-slate-200 bg-white"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xs bg-amber-500/15 text-amber-500">
                      <Trophy size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.35em] opacity-50">
                        #1 Leader
                      </p>
                      <p
                        className={`mt-1 text-lg font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                      >
                        {leaderboard[0]?.displayName || "No leader"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs opacity-70">
                    {leaderboard[0]?.points || 0} points and{" "}
                    {leaderboard[0]?.projectCount || 0} projects.
                  </p>
                </div>

                <div
                  className={`rounded-3xl border p-5 ${theme === "dark" ? "border-[#2e1a47] bg-[#0a0514]/65" : "border-slate-200 bg-white"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xs bg-[#8b5cf6]/15 text-[#8b5cf6]">
                      <Medal size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.35em] opacity-50">
                        Badge tier
                      </p>
                      <p
                        className={`mt-1 text-lg font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                      >
                        {badgeLabel(currentTeam?.badge)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 text-xs opacity-70">
                    Top teams are highlighted automatically with badge labels.
                  </p>
                </div>
              </div>
            </div>
          )}

          {leaderboard.length > 0 && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {leaderboard.slice(0, 5).map((entry) => {
                const progressWidth = topScore
                  ? Math.max(8, Math.round((entry.points / topScore) * 100))
                  : 8;

                return (
                  <div
                    key={entry.userId}
                    className={`rounded-xs border p-4 md:p-5 ${theme === "dark" ? "border-[#2e1a47] bg-[#0a0514]/65" : "border-slate-200 bg-white/95"}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xs bg-[#8b5cf6]/12 text-[#8b5cf6] font-black">
                          #{entry.rank}
                        </div>
                        <div className="min-w-0">
                          <div
                            className={`text-lg font-black truncate ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                          >
                            {entry.displayName}
                          </div>
                          <div className="text-xs opacity-60 mt-1">
                            {entry.projectCount} projects · {entry.points}{" "}
                            points
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black uppercase tracking-[0.35em] text-[#8b5cf6]">
                          {badgeLabel(entry.badge)}
                        </div>
                        <div className="text-xs opacity-60 mt-1">
                          {entry.points === topScore
                            ? "Top score"
                            : `-${topScore - entry.points} pts`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 h-2 rounded-full overflow-hidden bg-black/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] via-[#a78bfa] to-[#ddd6fe]"
                        style={{ width: `${progressWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          className={`rounded-3xl border p-6 md:p-8 shadow-xs ${theme === "dark" ? "bg-[#120a21]/85 border-[#2e1a47]" : "bg-white/90 border-slate-200"}`}
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
                  className={`p-5 rounded-xs border ${theme === "dark" ? "border-[#2e1a47] bg-[#0a0514]/65" : "border-slate-200 bg-slate-50/90"}`}
                >
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-start gap-3 mb-3">
                    <div>
                      <h3
                        className={`font-black mb-1 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                      >
                        Week {submission.week_id?.week_number || "N/A"}:{" "}
                        {submission.week_id?.title || "Untitled"}
                      </h3>
                      <p className="opacity-60 text-xs">
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
