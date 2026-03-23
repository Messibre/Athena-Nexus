import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Navbar from "../components/Navbar";
import { fetchWeeks } from "../redux/thunks/weeksThunks";
import {
  fetchSubmissionById,
  createSubmission,
  updateSubmission,
} from "../redux/thunks/submissionsThunks";
import { selectWeeks } from "../redux/selectors/weeksSelectors";
import {
  selectCurrentSubmission,
  selectSubmissionsActionLoading,
} from "../redux/selectors/submissionsSelectors";
import { selectTheme } from "../redux/selectors/themeSelectors";
import MiniModal from "../components/MiniModal";

const Submit = () => {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const weeks = useSelector(selectWeeks);
  const currentSubmission = useSelector(selectCurrentSubmission);
  const actionLoading = useSelector(selectSubmissionsActionLoading);
  const theme = useSelector(selectTheme);

  const [selectedWeek, setSelectedWeek] = useState("");
  const [submissionId, setSubmissionId] = useState(null);
  const [githubRepo, setGithubRepo] = useState("");
  const [liveDemo, setLiveDemo] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalState, setModalState] = useState({
    open: false,
    title: "Notice",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const inputClass = `w-full p-4 rounded-xl border outline-none transition-all ${
    theme === "dark"
      ? "bg-black/30 border-[#2e1a47] text-white focus:border-[#8b5cf6]"
      : "bg-white border-slate-200 text-slate-900 focus:border-[#8b5cf6]"
  }`;
  const labelClass =
    "text-[11px] font-black uppercase tracking-widest opacity-60 block mb-2";

  useEffect(() => {
    dispatch(fetchWeeks());
  }, [dispatch]);

  useEffect(() => {
    const weekParam = searchParams.get("week");
    const editParam = searchParams.get("edit");

    if (weekParam && weeks.length > 0) {
      setSelectedWeek(weekParam);
    }

    if (editParam) {
      setSubmissionId(editParam);
      dispatch(fetchSubmissionById(editParam));
    }
  }, [searchParams, weeks, dispatch]);

  useEffect(() => {
    if (currentSubmission && submissionId) {
      const sub = currentSubmission;
      setSelectedWeek(sub.week_id?._id || sub.week_id);
      setGithubRepo(sub.github_repo_url || "");
      setLiveDemo(sub.github_live_demo_url || "");
      setDescription(sub.description || "");
      setTags(sub.tags || []);
    }
  }, [currentSubmission, submissionId]);

  const activeWeekId = useMemo(() => {
    const active = weeks.find((w) => w.isActive);
    return active ? active._id : "";
  }, [weeks]);

  useEffect(() => {
    if (!searchParams.get("week") && activeWeekId && !selectedWeek) {
      setSelectedWeek(activeWeekId);
    }
  }, [activeWeekId, selectedWeek, searchParams]);

  useEffect(() => {
    if (error) {
      setModalState({
        open: true,
        title: "Submission Error",
        message: error,
      });
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      setModalState({
        open: true,
        title: "Submission Success",
        message: success,
      });
    }
  }, [success]);

  const handleTagChange = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!selectedWeek) {
      setError("Please select a week");
      setLoading(false);
      return;
    }

    if (!githubRepo) {
      setError("GitHub repository URL is required");
      setLoading(false);
      return;
    }

    const githubRegex = /^https:\/\/github\.com\/[\w-.]+\/[\w-.]+$/;
    if (!githubRegex.test(githubRepo)) {
      setError(
        "Invalid GitHub URL. Must be in format: https://github.com/owner/repo",
      );
      setLoading(false);
      return;
    }

    if (liveDemo) {
      try {
        new URL(liveDemo);
      } catch {
        setError("Invalid live demo URL");
        setLoading(false);
        return;
      }
    }

    try {
      if (submissionId) {
        await dispatch(
          updateSubmission({
            id: submissionId,
            payload: {
              github_repo_url: githubRepo,
              github_live_demo_url: liveDemo || "",
              description: description.substring(0, 300),
              tags,
            },
          }),
        ).unwrap();
        setSuccess("Submission updated successfully!");
      } else {
        await dispatch(
          createSubmission({
            week_id: selectedWeek,
            github_repo_url: githubRepo,
            github_live_demo_url: liveDemo || "",
            description: description.substring(0, 300),
            tags,
          }),
        ).unwrap();
        setSuccess("Submission created successfully!");
      }

      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch (err) {
      setError(err || "Failed to submit. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="relative z-10 max-w-3xl mx-auto px-4 pt-10 md:pt-12 pb-20">
        <div
          className={`rounded-3xl border p-6 md:p-8 shadow-2xl ${theme === "dark" ? "bg-[#120a21]/85 border-[#2e1a47]" : "bg-white/90 border-slate-200"}`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#8b5cf6] mb-2">
            Weekly Workflow
          </p>
          <h2
            className={`text-4xl md:text-5xl font-['Fraunces'] font-black tracking-tight mb-6 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
          >
            {submissionId ? "Update Your Submission" : "Submit Your Project"}
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className={labelClass}>Week *</label>
              <select
                className={inputClass}
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                required
                disabled={!!submissionId}
              >
                <option value="">Select a week</option>
                {weeks.map((week) => (
                  <option key={week._id} value={week._id}>
                    Week {week.week_number}: {week.title || "Untitled"}
                  </option>
                ))}
              </select>
              {submissionId && (
                <small className="opacity-60 text-xs">
                  Week cannot be changed when updating a submission
                </small>
              )}
            </div>

            <div className="form-group">
              <label className={labelClass}>GitHub Repository URL *</label>
              <input
                type="url"
                className={inputClass}
                value={githubRepo}
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="https://github.com/owner/repo"
                required
              />
              <small className="opacity-60 text-xs">
                Format: https://github.com/owner/repo
              </small>
            </div>

            <div className="form-group">
              <label className={labelClass}>Live Demo URL</label>
              <input
                type="url"
                className={inputClass}
                value={liveDemo}
                onChange={(e) => setLiveDemo(e.target.value)}
                placeholder="https://your-demo.netlify.app"
              />
              <small className="opacity-60 text-xs">
                GitHub Pages, Netlify, Vercel, etc.
              </small>
            </div>

            <div className="form-group">
              <label className={labelClass}>
                Description (max 300 characters)
              </label>
              <textarea
                className={`${inputClass} min-h-[120px]`}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={300}
                placeholder="Brief description of your project..."
              />
              <small className="opacity-60 text-xs">
                {description.length}/300 characters
              </small>
            </div>

            <div className="form-group">
              <label className={labelClass}>Tags</label>
              <div className="flex gap-3 flex-wrap">
                {["web", "mobile", "uiux"].map((tag) => (
                  <label
                    key={tag}
                    className={`flex items-center cursor-pointer px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                      tags.includes(tag)
                        ? "border-[#8b5cf6] bg-[#8b5cf6]/15 text-[#8b5cf6]"
                        : theme === "dark"
                          ? "border-[#2e1a47] bg-black/30 text-slate-300"
                          : "border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={tags.includes(tag)}
                      onChange={() => handleTagChange(tag)}
                      style={{ marginRight: "8px" }}
                    />
                    {tag.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-4 py-4 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#8b5cf6]/30"
              disabled={loading || actionLoading}
            >
              {loading || actionLoading
                ? "Submitting..."
                : submissionId
                  ? "Update Submission"
                  : "Submit Project"}
            </button>
          </form>
        </div>
      </div>

      <MiniModal
        open={modalState.open}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default Submit;
