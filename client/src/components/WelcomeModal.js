import React, { useEffect, useState } from "react";

const STORAGE_KEY = "athena_seen_welcome_v1";

const steps = [
  {
    title: "Welcome to Athena Nexus",
    text: "Build, submit and review weekly challenges with your team. We’ll guide you through the main areas.",
  },
  {
    title: "Submit Projects",
    text: "Use the Submit page to create final projects or milestone entries. Add a repo link and optional screenshot.",
  },
  {
    title: "Join the Community",
    text: "Browse the Gallery to see community submissions and get inspired. Sign in to submit your own work.",
  },
];

const WelcomeModal = ({ open: propOpen, onClose: propOnClose }) => {
  const [open, setOpen] = useState(Boolean(propOpen));
  const [index, setIndex] = useState(0);
  const [dontShow, setDontShow] = useState(false);

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
  }, [open, index, dontShow]);

  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setIndex((i) => Math.max(i - 1, 0));

  const handleClose = () => {
    if (dontShow) localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
    propOnClose?.();
  };

  if (!open) return null;

  const step = steps[index];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/55 p-4"
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
            <h3 className="text-sm font-black uppercase tracking-[0.28em] text-white">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              {step.text}
            </p>
          </div>
        </div>

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
              disabled={index >= steps.length - 1}
              className="rounded-xl bg-[#8b5cf6] px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white disabled:opacity-30"
            >
              Next
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-[11px] text-slate-200">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(e) => setDontShow(e.target.checked)}
              />
              Don't show again
            </label>

            <button
              onClick={handleClose}
              className="rounded-xl border border-white/30 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const shouldShowWelcome = () => !localStorage.getItem(STORAGE_KEY);

export default WelcomeModal;
