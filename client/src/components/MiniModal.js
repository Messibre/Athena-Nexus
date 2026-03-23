import React, { useEffect } from "react";

const MiniModal = ({ open, title = "Notice", message, onClose }) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !message) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/55 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-white/20 bg-[#1a0f2e] p-4 text-left shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-sm font-black uppercase tracking-wide text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{message}</p>
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/30 px-4 py-2 text-xs font-black uppercase tracking-wide text-white transition-all hover:bg-white hover:text-black"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default MiniModal;
