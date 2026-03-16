import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Folder,
  FolderOpen,
  Layers,
  Milestone,
} from "lucide-react";

const MilestoneSidebar = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  levels,
  activeLevelId,
  onSelectLevel,
  levelProgressMap,
  activeChallengeId,
  showChangeChallenge,
  onChangeChallenge,
  loading,
  className,
  onClose,
}) => {
  const getStatusBadge = (status) => {
    if (status === "completed")
      return { className: "badge-success", text: "Completed" };
    if (status === "unlocked")
      return { className: "badge-info", text: "In Progress" };
    return { className: "badge-warning", text: "Not Started" };
  };

  return (
    <div className={className || "pane glass-panel"}>
      <div className="pane-header">
        <span className="pane-title">Navigation</span>
        {onClose && (
          <button onClick={onClose} className="ghost-btn">
            Close
          </button>
        )}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Weekly Challenges</div>
        <Link to="/challenges" className="sidebar-link">
          <CalendarDays size={16} />
          <span>Weekly Inbox</span>
        </Link>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Milestone Path</div>
        <div className="list-stack">
          {categories.map((category) => {
            const isActive = activeCategoryId === category._id;
            return (
              <button
                key={category._id}
                className={`tree-item ${isActive ? "active" : ""}`}
                onClick={() => onSelectCategory(category._id)}
                type="button"
              >
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {isActive ? <FolderOpen size={16} /> : <Folder size={16} />}
                  {category.name}
                </span>
                <span className="tree-subtle">
                  {category.order !== undefined ? `Stage ${category.order + 1}` : "Track"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title">Levels</div>
        {loading ? (
          <div className="tree-subtle">Loading...</div>
        ) : levels.length === 0 ? (
          <p className="tree-subtle">No levels available yet.</p>
        ) : (
          <div className="list-stack">
            {levels.map((level) => {
              const status = levelProgressMap[level._id] || "locked";
              const badge = getStatusBadge(status);
              const isActive = activeLevelId === level._id;
              return (
                <button
                  key={level._id}
                  type="button"
                  onClick={() => onSelectLevel(level._id)}
                  className={`tree-item ${isActive ? "active" : ""}`}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Milestone size={16} />
                    Level {level.levelNumber}: {level.title}
                  </span>
                  <span className={`status-pill ${
                    badge.className === "badge-success" ? "status-success" :
                    badge.className === "badge-info" ? "status-info" :
                    "status-warning"
                  }`}>
                    {badge.text}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {activeChallengeId && showChangeChallenge && onChangeChallenge && (
        <div className="sidebar-section">
          <button
            type="button"
            onClick={onChangeChallenge}
            className="sidebar-link"
          >
            <Layers size={16} />
            Change challenge
          </button>
        </div>
      )}
    </div>
  );
};

export default MilestoneSidebar;
