import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { selectTheme } from "./Milestones";
import { useSelector } from "react-redux";

const NotFound = () => {
  const theme = useSelector(selectTheme) || "dark";

  return (
    <div
      data-theme={theme}
      className={`min-h-screen ${theme === "dark" ? "bg-[#0a0514] text-slate-300" : "bg-slate-50 text-slate-700"}`}
    >
      <Navbar />
      <main className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <h1 className="text-6xl font-black text-[#8b5cf6]">404</h1>
        <h2 className="mt-4 text-3xl font-black">Page not found</h2>
        <p className="mt-3 opacity-80">
          The page you requested does not exist or may have been moved.
        </p>
        <Link
          to="/"
          className="mt-8 rounded-xl bg-[#8b5cf6] px-6 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-[#7c3aed]"
        >
          Back to Home
        </Link>
      </main>
    </div>
  );
};

export default NotFound;
