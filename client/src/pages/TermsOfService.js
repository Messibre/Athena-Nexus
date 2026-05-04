import React from "react";
import Navbar from "../components/Navbar";
import { selectTheme } from "./Milestones";
import { useSelector } from "react-redux";

const TermsOfService = () => {
  const theme = useSelector(selectTheme) || "dark";

  return (
    <div
      data-theme={theme}
      className={`secondary-page-shell min-h-screen ${theme === "dark" ? "bg-[#0a0514] text-slate-300" : "bg-slate-50 text-slate-700"}`}
    >
      <Navbar />
      <div className="secondary-page-bg-layer" />
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-16 pt-28">
        <h1 className="mb-6 text-4xl font-black text-[#8b5cf6]">
          Terms of Service
        </h1>
        <section className="space-y-4 leading-relaxed">
          <h2 className="text-2xl font-bold">1. Acceptable Use</h2>
          <p>
            Use Athena Nexus for challenge collaboration and submissions only.
            Do not abuse platform APIs or disrupt service.
          </p>
          <h2 className="text-2xl font-bold">2. Accounts</h2>
          <p>
            You are responsible for maintaining account security and truthful
            submission data.
          </p>
          <h2 className="text-2xl font-bold">3. Content Ownership</h2>
          <p>
            Teams retain ownership of submitted project content. Administrators
            may review and moderate submissions.
          </p>
          <h2 className="text-2xl font-bold">4. Suspension</h2>
          <p>
            Accounts may be limited or suspended for abuse, malicious behavior,
            or policy violations.
          </p>
          <h2 className="text-2xl font-bold">5. Service Changes</h2>
          <p>
            Features may change over time to improve security, reliability, and
            learning outcomes.
          </p>
        </section>
      </main>
    </div>
  );
};

export default TermsOfService;
