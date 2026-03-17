import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Calendar,
  CheckSquare,
  BarChart3,
  Layers,
  Download,
  Trash2,
  Edit3,
  Plus,
  Save,
  X,
  ChevronRight,
  Database,
  ListTree,
  Key,
  Shield,
  Info,
  Link as LinkIcon,
  ChevronDown,
  Search,
} from "lucide-react";
import Navbar from "../components/Navbar";

import {
  fetchAdminWeeks,
  createAdminWeek,
  updateAdminWeek,
  deleteAdminWeek,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetAdminUserPassword,
  deleteAdminUser,
  fetchAdminSubmissions,
  updateAdminSubmissionStatus,
  exportAdminSubmissions,
  fetchAdminStats,
  fetchAdminMilestoneCategories,
  createAdminMilestoneCategory,
  updateAdminMilestoneCategory,
  deleteAdminMilestoneCategory,
  fetchAdminMilestoneLevels,
  createAdminMilestoneLevel,
  updateAdminMilestoneLevel,
  deleteAdminMilestoneLevel,
  fetchAdminMilestoneChallenges,
  createAdminMilestoneChallenge,
  updateAdminMilestoneChallenge,
  deleteAdminMilestoneChallenge,
  fetchAdminMilestoneSubmissions,
  updateAdminMilestoneSubmissionStatus,
} from "../redux/thunks/adminThunks";

import {
  selectAdminWeeks,
  selectAdminUsers,
  selectAdminSubmissions,
  selectAdminStats,
  selectAdminLoading,
  selectAdminActionLoading,
  selectAdminMilestoneCategories,
  selectAdminMilestoneLevels,
  selectAdminMilestoneChallenges,
  selectAdminMilestoneSubmissions,
} from "../redux/selectors/adminSelectors";

const selectTheme = (state) => state.theme.theme;

const AdminPanel = () => {
  const dispatch = useDispatch();
  const theme = useSelector(selectTheme) || "dark";
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "stats";

  const weeks = useSelector(selectAdminWeeks);
  const users = useSelector(selectAdminUsers);
  const submissions = useSelector(selectAdminSubmissions);
  const mSubmissions = useSelector(selectAdminMilestoneSubmissions);
  const categories = useSelector(selectAdminMilestoneCategories);
  const levels = useSelector(selectAdminMilestoneLevels);
  const challenges = useSelector(selectAdminMilestoneChallenges);
  const stats = useSelector(selectAdminStats);
  const loading = useSelector(selectAdminLoading);
  const actionLoading = useSelector(selectAdminActionLoading);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [targetType, setTargetType] = useState("week");
  const [formData, setFormData] = useState({});
  const [milestoneScope, setMilestoneScope] = useState("categories");

  useEffect(() => {
    dispatch(fetchAdminStats());
    dispatch(fetchAdminWeeks());
    dispatch(fetchAdminUsers());
    dispatch(fetchAdminSubmissions());
    dispatch(fetchAdminMilestoneSubmissions());
    dispatch(fetchAdminMilestoneCategories());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab !== "milestones") return;
    if (milestoneScope === "levels") {
      dispatch(fetchAdminMilestoneLevels());
    }
    if (milestoneScope === "challenges") {
      dispatch(fetchAdminMilestoneLevels());
      dispatch(fetchAdminMilestoneChallenges());
    }
  }, [activeTab, milestoneScope, dispatch]);

  const handleTabChange = (tab) => {
    setSearchParams({ tab });
    setIsModalOpen(false);
  };

  const normalizeModalData = (type, data) => {
    if (type === "level") {
      return {
        ...data,
        categoryId: data.categoryId?._id || data.categoryId || "",
      };
    }
    if (type === "challenge") {
      return {
        ...data,
        categoryId: data.categoryId?._id || data.categoryId || "",
        levelId: data.levelId?._id || data.levelId || "",
      };
    }
    if (type === "week") {
      return {
        ...data,
        week_number: data.week_number ?? data.weekNumber ?? "",
        resources: Array.isArray(data.resources)
          ? data.resources.join(", ")
          : data.resources || "",
      };
    }
    if (type === "user") {
      return {
        ...data,
        displayName: data.displayName || data.username || "",
        members: Array.isArray(data.members)
          ? data.members.map((member) => member.name).join(", ")
          : data.members || "",
      };
    }
    return data;
  };

  const openModal = (mode, type, data = {}) => {
    setModalMode(mode);
    setTargetType(type);
    setFormData(normalizeModalData(type, data));
    setIsModalOpen(true);

    if (type === "level" && data.categoryId)
      dispatch(
        fetchAdminMilestoneLevels(data.categoryId?._id || data.categoryId),
      );
    if (type === "challenge" && data.levelId)
      dispatch(
        fetchAdminMilestoneChallenges(data.levelId?._id || data.levelId),
      );
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const id = formData._id;

    const actions = {
      week: modalMode === "create" ? createAdminWeek : updateAdminWeek,
      user: modalMode === "create" ? createAdminUser : updateAdminUser,
      category:
        modalMode === "create"
          ? createAdminMilestoneCategory
          : updateAdminMilestoneCategory,
      level:
        modalMode === "create"
          ? createAdminMilestoneLevel
          : updateAdminMilestoneLevel,
      challenge:
        modalMode === "create"
          ? createAdminMilestoneChallenge
          : updateAdminMilestoneChallenge,
    };

    const action = actions[targetType];
    const parseList = (value) =>
      value
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];

    const normalizePayload = () => {
      if (targetType === "week") {
        return {
          week_number: formData.week_number
            ? parseInt(formData.week_number, 10)
            : undefined,
          title: formData.title || "",
          description: formData.description || "",
          startDate: formData.startDate || null,
          deadlineDate: formData.deadlineDate || null,
          resources: parseList(formData.resources),
          isActive: !!formData.isActive,
        };
      }

      if (targetType === "user") {
        const members = parseList(formData.members).map((name) => ({ name }));
        if (modalMode === "create") {
          return {
            username: formData.username || "",
            password: formData.password || "",
            displayName: formData.displayName || formData.username || "",
            email: formData.email || "",
            contactEmail: formData.contactEmail || formData.email || "",
            members,
          };
        }
        return {
          displayName: formData.displayName || formData.username || "",
          email: formData.email || "",
          contactEmail: formData.contactEmail || formData.email || "",
          members,
        };
      }

      if (targetType === "category") {
        return {
          key: formData.key || "",
          name: formData.name || "",
          description: formData.description || "",
          order: formData.order ? parseInt(formData.order, 10) : 0,
          isActive:
            formData.isActive !== undefined ? !!formData.isActive : true,
        };
      }

      if (targetType === "level") {
        return {
          categoryId: formData.categoryId || "",
          levelNumber: formData.levelNumber
            ? parseInt(formData.levelNumber, 10)
            : undefined,
          title: formData.title || "",
          description: formData.description || "",
          isActive:
            formData.isActive !== undefined ? !!formData.isActive : true,
        };
      }

      return {
        categoryId: formData.categoryId || "",
        levelId: formData.levelId || "",
        title: formData.title || "",
        description: formData.description || "",
        requirements: parseList(formData.requirements),
        resources: parseList(formData.resources),
        tags: parseList(formData.tags),
        difficulty: formData.difficulty || "beginner",
        isActive: formData.isActive !== undefined ? !!formData.isActive : true,
      };
    };

    const payload = normalizePayload();

    if (modalMode === "edit") {
      await dispatch(action({ id, payload }));
    } else {
      await dispatch(action(payload));
    }

    setIsModalOpen(false);
    if (targetType === "week") dispatch(fetchAdminWeeks());
    if (targetType === "user") dispatch(fetchAdminUsers());
    if (targetType === "category") dispatch(fetchAdminMilestoneCategories());
    if (targetType === "level") dispatch(fetchAdminMilestoneLevels());
    if (targetType === "challenge") dispatch(fetchAdminMilestoneChallenges());
    dispatch(fetchAdminStats());
  };

  const styles = {
    bg: theme === "dark" ? "bg-[#0a0a0a]" : "bg-slate-50",
    panel: theme === "dark" ? "bg-[#0f0f0f]" : "bg-white",
    border: theme === "dark" ? "border-white/5" : "border-slate-200",
    textMain: theme === "dark" ? "text-slate-400" : "text-slate-600",
    textHead: theme === "dark" ? "text-white" : "text-slate-900",
    input:
      theme === "dark"
        ? "bg-black border-white/10 text-white placeholder:text-slate-700"
        : "bg-white border-slate-200 text-slate-900",
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 font-sans ${styles.bg} ${styles.textMain}`}
    >
      <Navbar />
      <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row h-full md:h-[calc(100vh-64px)] overflow-hidden">
        <aside
          className={`w-full md:w-72 border-b md:border-b-0 md:border-r ${styles.panel} ${styles.border} flex shrink-0 md:flex-col overflow-x-auto no-scrollbar`}
        >
          <div className="p-8 hidden md:block">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.4em] text-blue-500 italic">
              Command Center
            </h2>
          </div>
          <nav className="flex md:flex-col px-2 md:px-0">
            {[
              { id: "stats", label: "Overview", icon: BarChart3 },
              { id: "submissions", label: "Week Queue", icon: CheckSquare },
              { id: "milestone-subs", label: "Atlas Queue", icon: Layers },
              { id: "weeks", label: "Weekly Map", icon: Calendar },
              { id: "milestones", label: "Atlas Tree", icon: ListTree },
              { id: "users", label: "Identity Directory", icon: Users },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`flex items-center gap-4 px-8 py-5 text-[11px] font-bold transition-all whitespace-nowrap ${activeTab === item.id ? "text-blue-500 bg-blue-500/5 border-l-2 border-blue-500" : "opacity-40 hover:opacity-100 hover:bg-black/5"}`}
              >
                <item.icon size={18} />
                <span className="uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 md:p-12 relative">
          <header className="mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
            <div className="space-y-1">
              <span className="text-blue-500 text-[10px] font-bold uppercase tracking-[0.5em] block">
                System Data Stream
              </span>
              <h1
                className={`text-5xl font-black tracking-tighter ${styles.textHead}`}
              >
                {activeTab.replace("-", " ")}
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              {activeTab.includes("subs") && (
                <button
                  onClick={() => dispatch(exportAdminSubmissions())}
                  className="flex items-center gap-2 px-5 py-2.5 border border-blue-500/20 text-blue-500 text-[11px] font-bold uppercase tracking-widest rounded hover:bg-blue-500/5 transition-all"
                >
                  <Download size={14} /> Export CSV
                </button>
              )}
              {activeTab === "milestones" && (
                <div className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-[0.3em] opacity-50">
                    Scope
                  </span>
                  <select
                    value={milestoneScope}
                    onChange={(e) => setMilestoneScope(e.target.value)}
                    className={`px-4 py-2 rounded border text-[10px] font-black uppercase tracking-widest ${styles.input}`}
                  >
                    <option value="categories">Categories</option>
                    <option value="levels">Levels</option>
                    <option value="challenges">Challenges</option>
                  </select>
                </div>
              )}
              {["weeks", "milestones", "users"].includes(activeTab) && (
                <button
                  onClick={() =>
                    openModal(
                      "create",
                      activeTab === "weeks"
                        ? "week"
                        : activeTab === "users"
                          ? "user"
                          : milestoneScope === "levels"
                            ? "level"
                            : milestoneScope === "challenges"
                              ? "challenge"
                              : "category",
                    )
                  }
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest rounded shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all"
                >
                  <Plus size={14} /> New Record
                </button>
              )}
            </div>
          </header>

          {loading ? (
            <div className="h-96 flex items-center justify-center opacity-20 text-[12px] font-bold uppercase tracking-[0.6em] animate-pulse">
              Syncing with Atlas...
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {activeTab === "stats" && stats && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                    {[
                      {
                        l: "Total Users",
                        v: stats.totalUsers,
                        c: "text-blue-500",
                      },
                      {
                        l: "Total Weeks",
                        v: stats.totalWeeks,
                        c: "text-purple-500",
                      },
                      {
                        l: "Week Subs",
                        v: stats.totalSubmissions,
                        c: "text-emerald-500",
                      },
                      {
                        l: "Atlas Subs",
                        v: mSubmissions.length,
                        c: "text-amber-500",
                      },
                      {
                        l: "Approved",
                        v: stats.approvedSubmissions,
                        c: "text-blue-400",
                      },
                    ].map((s, i) => (
                      <div
                        key={i}
                        className={`p-8 rounded-lg border ${styles.panel} ${styles.border} shadow-sm`}
                      >
                        <p className="text-[10px] font-bold uppercase opacity-30 mb-3 tracking-widest">
                          {s.l}
                        </p>
                        <p className={`text-4xl font-black ${s.c}`}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab !== "stats" && (
                  <div
                    className={`rounded-lg border ${styles.panel} ${styles.border} overflow-hidden shadow-2xl`}
                  >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-black/20 text-[10px] font-bold uppercase opacity-40 border-b border-white/5">
                          <tr>
                            <th className="px-8 py-5">Identification</th>
                            <th className="px-8 py-5">Object Metadata</th>
                            <th className="px-8 py-5 text-center">
                              Status / Access
                            </th>
                            <th className="px-8 py-5 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {(activeTab === "weeks"
                            ? weeks
                            : activeTab === "users"
                              ? users
                              : activeTab === "milestones"
                                ? milestoneScope === "levels"
                                  ? levels
                                  : milestoneScope === "challenges"
                                    ? challenges
                                    : categories
                                : activeTab === "submissions"
                                  ? submissions
                                  : mSubmissions
                          ).map((item) => (
                            <tr
                              key={item._id}
                              className="hover:bg-blue-500/[0.03] transition-colors group"
                            >
                              <td className="px-8 py-5">
                                <div
                                  className={`text-[14px] font-bold ${styles.textHead}`}
                                >
                                  {item.username ||
                                    item.title ||
                                    item.name ||
                                    (item.week_number
                                      ? `Week ${item.week_number}`
                                      : "") ||
                                    (item.levelNumber
                                      ? `Level ${item.levelNumber}`
                                      : "") ||
                                    item.user_id?.username ||
                                    item.userId?.username}
                                </div>
                                <div className="text-[11px] opacity-40 font-mono italic tracking-tighter">
                                  {item.email ||
                                    `SYS-REF: ${item._id.slice(-8)}`}
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <div className="text-[12px] opacity-70 max-w-[300px] truncate">
                                  {item.description ||
                                    (item.levelNumber
                                      ? `Level ${item.levelNumber}`
                                      : "") ||
                                    item.week_id?.title ||
                                    item.challengeId?.title ||
                                    "System Resource Path"}
                                </div>
                                {(item.github_repo_url || item.repoUrl) && (
                                  <a
                                    href={item.github_repo_url || item.repoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-500 text-[10px] font-bold hover:underline flex items-center gap-1.5 mt-2 tracking-widest"
                                  >
                                    <LinkIcon size={12} /> OPEN SOURCE
                                  </a>
                                )}
                              </td>
                              <td className="px-8 py-5 text-center">
                                <span
                                  className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === "approved" || item.role === "admin" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}
                                >
                                  {item.status || item.role || "ACTIVE"}
                                </span>
                              </td>
                              <td className="px-8 py-5 text-right space-x-1">
                                {activeTab.includes("subs") ? (
                                  <div className="flex justify-end gap-2">
                                    <select
                                      value={item.status}
                                      disabled={actionLoading}
                                      onChange={(e) => {
                                        const action =
                                          activeTab === "submissions"
                                            ? updateAdminSubmissionStatus
                                            : updateAdminMilestoneSubmissionStatus;
                                        dispatch(
                                          action({
                                            id: item._id,
                                            payload: { status: e.target.value },
                                          }),
                                        );
                                      }}
                                      className={`text-[10px] font-black p-2 rounded border focus:border-blue-500 outline-none transition-all ${styles.input}`}
                                    >
                                      <option value="pending">PENDING</option>
                                      <option value="approved">APPROVE</option>
                                      <option value="rejected">REJECT</option>
                                    </select>
                                  </div>
                                ) : (
                                  <div className="flex justify-end items-center gap-2">
                                    <button
                                      onClick={() =>
                                        openModal(
                                          "edit",
                                          activeTab === "milestones"
                                            ? milestoneScope === "levels"
                                              ? "level"
                                              : milestoneScope === "challenges"
                                                ? "challenge"
                                                : "category"
                                            : activeTab.slice(0, -1),
                                          item,
                                        )
                                      }
                                      className="p-2.5 text-blue-500 hover:bg-blue-500/10 rounded transition-all"
                                    >
                                      <Edit3 size={16} />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            "IRREVERSIBLE: Delete this record from Atlas?",
                                          )
                                        ) {
                                          if (activeTab === "weeks")
                                            dispatch(deleteAdminWeek(item._id));
                                          if (activeTab === "users")
                                            dispatch(deleteAdminUser(item._id));
                                          if (activeTab === "milestones") {
                                            if (milestoneScope === "levels") {
                                              dispatch(
                                                deleteAdminMilestoneLevel(
                                                  item._id,
                                                ),
                                              );
                                            } else if (
                                              milestoneScope === "challenges"
                                            ) {
                                              dispatch(
                                                deleteAdminMilestoneChallenge(
                                                  item._id,
                                                ),
                                              );
                                            } else {
                                              dispatch(
                                                deleteAdminMilestoneCategory(
                                                  item._id,
                                                ),
                                              );
                                            }
                                          }
                                        }
                                      }}
                                      className="p-2.5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/95 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`relative w-full max-w-xl p-10 rounded-2xl border shadow-2xl ${styles.panel} ${styles.border}`}
            >
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h3 className="text-[14px] font-black uppercase tracking-[0.3em] text-white">
                    {modalMode} {targetType}
                  </h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-all text-white"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-6">
                {targetType === "week" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-1">
                        <label className="text-[10px] font-bold uppercase opacity-30 block mb-2 tracking-widest">
                          Sequence
                        </label>
                        <input
                          type="number"
                          required
                          disabled={modalMode === "edit"}
                          className={`w-full p-4 rounded-xl border text-[15px] font-bold ${styles.input}`}
                          value={formData.week_number || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              week_number: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="text-[10px] font-bold uppercase opacity-30 block mb-2 tracking-widest">
                          Mission Title
                        </label>
                        <input
                          type="text"
                          required
                          className={`w-full p-4 rounded-xl border text-[15px] font-bold ${styles.input}`}
                          value={formData.title || ""}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase opacity-30 block mb-2 tracking-widest">
                        Objective Parameters
                      </label>
                      <textarea
                        rows={5}
                        className={`w-full p-4 rounded-xl border text-[14px] leading-relaxed ${styles.input}`}
                        value={formData.description || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold uppercase opacity-30 block mb-2 tracking-widest">
                          Start Date
                        </label>
                        <input
                          type="datetime-local"
                          className={`w-full p-4 rounded-xl border text-[13px] ${styles.input}`}
                          value={formData.startDate || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              startDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase opacity-30 block mb-2 tracking-widest">
                          Deadline
                        </label>
                        <input
                          type="datetime-local"
                          className={`w-full p-4 rounded-xl border text-[13px] ${styles.input}`}
                          value={formData.deadlineDate || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              deadlineDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase opacity-30 block mb-2 tracking-widest">
                        Resources (comma-separated)
                      </label>
                      <input
                        type="text"
                        className={`w-full p-4 rounded-xl border text-[14px] ${styles.input}`}
                        value={formData.resources || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            resources: e.target.value,
                          })
                        }
                      />
                    </div>
                    <label className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest opacity-60">
                      <input
                        type="checkbox"
                        checked={!!formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                      />
                      Active Week
                    </label>
                  </div>
                )}

                {targetType === "user" && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Identity Handle"
                      required={modalMode === "create"}
                      disabled={modalMode === "edit"}
                      className={`w-full p-4 rounded-xl border text-[15px] ${styles.input}`}
                      value={formData.username || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                    />
                    {modalMode === "create" && (
                      <input
                        type="password"
                        placeholder="Temporary Access Key"
                        required
                        className={`w-full p-4 rounded-xl border text-[15px] ${styles.input}`}
                        value={formData.password || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                      />
                    )}
                    <input
                      type="text"
                      placeholder="Display Name"
                      className={`w-full p-4 rounded-xl border text-[15px] ${styles.input}`}
                      value={formData.displayName || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          displayName: e.target.value,
                        })
                      }
                    />
                    <input
                      type="email"
                      placeholder="Network Address (Email)"
                      className={`w-full p-4 rounded-xl border text-[15px] ${styles.input}`}
                      value={formData.email || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                    <input
                      type="email"
                      placeholder="Contact Email (optional)"
                      className={`w-full p-4 rounded-xl border text-[15px] ${styles.input}`}
                      value={formData.contactEmail || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactEmail: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Members (comma-separated)"
                      className={`w-full p-4 rounded-xl border text-[15px] ${styles.input}`}
                      value={formData.members || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, members: e.target.value })
                      }
                    />
                    {modalMode === "edit" && (
                      <button
                        type="button"
                        onClick={() => {
                          const newPassword = window.prompt(
                            "Enter a new password for this user:",
                          );
                          if (!newPassword) return;
                          dispatch(
                            resetAdminUserPassword({
                              id: formData._id,
                              payload: { newPassword },
                            }),
                          );
                        }}
                        className="w-full py-4 border border-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 hover:bg-amber-500/5 transition-all"
                      >
                        <Key size={16} /> Override Password Hash
                      </button>
                    )}
                  </div>
                )}

                {targetType === "category" && (
                  <div className="space-y-6">
                    <input
                      type="text"
                      placeholder="Category Key (unique)"
                      required
                      className={`w-full p-4 rounded-xl border text-[15px] font-bold ${styles.input}`}
                      value={formData.key || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, key: e.target.value })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Atlas Category Name"
                      required
                      className={`w-full p-4 rounded-xl border text-[15px] font-bold ${styles.input}`}
                      value={formData.name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                    <textarea
                      rows={4}
                      placeholder="Description"
                      className={`w-full p-4 rounded-xl border text-[14px] leading-relaxed ${styles.input}`}
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="number"
                        placeholder="Order"
                        className={`w-full p-4 rounded-xl border text-[14px] ${styles.input}`}
                        value={formData.order || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, order: e.target.value })
                        }
                      />
                      <label className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest opacity-60">
                        <input
                          type="checkbox"
                          checked={
                            formData.isActive !== undefined
                              ? !!formData.isActive
                              : true
                          }
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isActive: e.target.checked,
                            })
                          }
                        />
                        Active
                      </label>
                    </div>
                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
                      <p className="text-[11px] opacity-60 leading-relaxed italic">
                        Categories serve as the root for levels and individual
                        milestone challenges.
                      </p>
                    </div>
                  </div>
                )}

                {targetType === "level" && (
                  <div className="space-y-4">
                    <select>
                      required className=
                      {`w-full p-4 rounded-xl border text-[12px] font-black uppercase tracking-widest ${styles.input}`}
                      value={formData.categoryId || ""}
                      onChange=
                      {(e) =>
                        setFormData({
                          ...formData,
                          categoryId: e.target.value,
                        })
                      }
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Level Number"
                      required
                      className={`w-full p-4 rounded-xl border text-[15px] font-bold ${styles.input}`}
                      value={formData.levelNumber || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          levelNumber: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Level Title"
                      required
                      className={`w-full p-4 rounded-xl border text-[15px] ${styles.input}`}
                      value={formData.title || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                    <textarea
                      rows={4}
                      placeholder="Description"
                      className={`w-full p-4 rounded-xl border text-[14px] leading-relaxed ${styles.input}`}
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                    <label className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest opacity-60">
                      <input
                        type="checkbox"
                        checked={
                          formData.isActive !== undefined
                            ? !!formData.isActive
                            : true
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                      />
                      Active Level
                    </label>
                  </div>
                )}

                {targetType === "challenge" && (
                  <div className="space-y-4">
                    <select>
                      required className=
                      {`w-full p-4 rounded-xl border text-[12px] font-black uppercase tracking-widest ${styles.input}`}
                      value={formData.categoryId || ""}
                      onChange=
                      {(e) =>
                        setFormData({
                          ...formData,
                          categoryId: e.target.value,
                          levelId: "",
                        })
                      }
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <select>
                      required className=
                      {`w-full p-4 rounded-xl border text-[12px] font-black uppercase tracking-widest ${styles.input}`}
                      value={formData.levelId || ""}
                      onChange=
                      {(e) =>
                        setFormData({ ...formData, levelId: e.target.value })
                      }
                      <option value="">Select Level</option>
                      {levels
                        .filter((level) => {
                          const categoryId =
                            level.categoryId?._id || level.categoryId;
                          return formData.categoryId
                            ? categoryId === formData.categoryId
                            : true;
                        })
                        .map((level) => (
                          <option key={level._id} value={level._id}>
                            Level {level.levelNumber}: {level.title}
                          </option>
                        ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Challenge Title"
                      required
                      className={`w-full p-4 rounded-xl border text-[15px] ${styles.input}`}
                      value={formData.title || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                    />
                    <textarea
                      rows={4}
                      placeholder="Description"
                      className={`w-full p-4 rounded-xl border text-[14px] leading-relaxed ${styles.input}`}
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Requirements (comma-separated)"
                      className={`w-full p-4 rounded-xl border text-[14px] ${styles.input}`}
                      value={formData.requirements || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requirements: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Resources (comma-separated)"
                      className={`w-full p-4 rounded-xl border text-[14px] ${styles.input}`}
                      value={formData.resources || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          resources: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Tags (comma-separated)"
                      className={`w-full p-4 rounded-xl border text-[14px] ${styles.input}`}
                      value={formData.tags || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tags: e.target.value,
                        })
                      }
                    />
                    <select
                      className={`w-full p-4 rounded-xl border text-[12px] font-black uppercase tracking-widest ${styles.input}`}
                      value={formData.difficulty || "beginner"}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          difficulty: e.target.value,
                        })
                      }
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                    <label className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest opacity-60">
                      <input
                        type="checkbox"
                        checked={
                          formData.isActive !== undefined
                            ? !!formData.isActive
                            : true
                        }
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                      />
                      Active Challenge
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-5 bg-blue-600 text-white font-black text-[12px] uppercase tracking-[0.3em] rounded-xl shadow-2xl shadow-blue-600/40 hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
                >
                  {actionLoading ? (
                    "COMMITTING..."
                  ) : (
                    <>
                      <Save size={18} /> COMMIT TO ATLAS
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
