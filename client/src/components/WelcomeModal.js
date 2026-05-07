import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "athena_seen_welcome_v2";

const steps = [
  {
    title: "Start with Challenges",
    text: "Check the weekly prompt, the rules, and the deadline first. This is where every team learns what to build next.",
    route: "/challenges",
    cta: "Open Challenges",
  },
  {
    title: "Review the Gallery",
    text: "Browse published work to see real examples of strong repos, clean screenshots, and concise project summaries.",
    route: "/gallery",
    cta: "Open Gallery",
  },
  {
    title: "Submit Your Work",
    text: "Use Submit when your team is ready to share a repo link, short description, and any supporting media.",
    route: "/submit",
    cta: "Open Submit",
  },
  {
    title: "Track Milestones",
    text: "Milestones show progress, unlocked categories, and the next step your team should focus on.",
    route: "/milestones",
    cta: "Open Milestones",
  },
];

const WelcomeModal = ({ open: propOpen, onClose: propOnClose }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(Boolean(propOpen));
  const [index, setIndex] = useState(0);

  useEffect(() => setOpen(Boolean(propOpen)), [propOpen]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index]);

  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  const handleClose = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore storage failures
    }
    setOpen(false);
    propOnClose?.();
  };

  const handleOpenPage = () => {
    const currentStep = steps[index];
    if (currentStep.route) {
      navigate(currentStep.route);
    }
  };

  if (!open) return null;

  const step = steps[index];
  const isLastStep = index >= steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={step.title}
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-white/20 bg-[#1a0f2e] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.32em] text-violet-200/80">
              New user guide
            </p>
            <h3 className="mt-2 text-sm font-black uppercase tracking-[0.28em] text-white">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              {step.text}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenPage}
          className="mt-4 w-full rounded-xl border border-violet-400/40 bg-violet-500/15 px-4 py-3 text-left text-sm font-semibold text-white transition-all hover:border-violet-300 hover:bg-violet-500/25"
        >
          <span className="block text-[10px] font-black uppercase tracking-[0.28em] text-violet-200/75">
            Jump to page
          </span>
          <span className="mt-1 block">{step.cta}</span>
        </button>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={prev}
              disabled={index === 0}
              className="rounded-xl border border-white/20 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-30"
            >
              Back
            </button>
            <button
              onClick={next}
              disabled={isLastStep}
              className="rounded-xl bg-[#8b5cf6] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-30"
            >
              Next
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="rounded-xl border border-white/30 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white"
            >
              {isLastStep ? "Finish tour" : "Skip tour"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const shouldShowWelcome = () => {
  try {
    return !localStorage.getItem(STORAGE_KEY);
  } catch {
    return true;
  }
};

export default WelcomeModal;
