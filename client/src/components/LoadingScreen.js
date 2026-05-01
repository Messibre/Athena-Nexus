import React from "react";

const LoadingScreen = ({
  title = "Loading Athena Nexus",
  message = "Preparing the next view.",
}) => {
  return (
    <div
      className="loading-screen"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="loading-card">
        <div className="loading-eyebrow" />
        <div className="loading-title" />
        <div className="loading-copy" />
        <div className="loading-grid">
          <div className="loading-panel loading-panel-large" />
          <div className="loading-panel loading-panel-small" />
        </div>
        <p className="loading-message">{title}</p>
        <p className="loading-submessage">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
