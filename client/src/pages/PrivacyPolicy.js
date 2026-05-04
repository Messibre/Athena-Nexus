import React from "react";
import Navbar from "../components/Navbar";
import { selectTheme } from "./Milestones";
import { useSelector } from "react-redux";

const PrivacyPolicy = () => {
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
          Privacy Policy
        </h1>
        <section className="space-y-4 leading-relaxed">
          <h2 className="text-2xl font-bold">1. Information We Collect</h2>
          <p>
            We store account details, project submission data, and activity logs
            required to operate Athena Nexus.
          </p>
          <h2 className="text-2xl font-bold">2. How We Use Data</h2>
          <p>
            Data is used for authentication, challenge workflows, moderation,
            and platform security.
          </p>
          <h2 className="text-2xl font-bold">3. Cookies</h2>
          <p>
            We use essential cookies for secure sessions and account
            authentication. These cookies are required for login-protected
            features.
          </p>
          <h2 className="text-2xl font-bold">4. Data Protection</h2>
          <p>
            Authentication uses secure httpOnly cookies and server-side
            validation. Access is role-based and logged.
          </p>
          <h2 className="text-2xl font-bold">5. Contact</h2>
          <p>
            If you need account or data support, contact your platform
            administrator.
          </p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
