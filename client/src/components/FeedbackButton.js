import React, { useEffect, useRef, useState } from "react";
import { MessageCircleMore, X } from "lucide-react";
import { useSelector } from "react-redux";
import { feedbackApi } from "../config/api";
import { selectTheme } from "../redux/selectors/themeSelectors";

const categories = [
  { value: "bug", label: "Bug" },
  { value: "suggestion", label: "Suggestion" },
  { value: "praise", label: "Praise" },
];

const FeedbackButton = () => {
  const theme = useSelector(selectTheme) || "dark";
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [category, setCategory] = useState("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const dialogRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    previousActiveElement.current = document.activeElement;
    const focusTarget = dialogRef.current?.querySelector(
      "textarea, button, select, input",
    );
    focusTarget?.focus();

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
      if (event.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const elements = Array.from(focusables).filter(
          (element) => !element.hasAttribute("disabled"),
        );
        if (!elements.length) return;

        const first = elements[0];
        const last = elements[elements.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousActiveElement.current?.focus?.();
    };
  }, [isOpen]);

  const resetForm = () => {
    setCategory("bug");
    setMessage("");
    setEmail("");
    setStatus("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setStatus("");

    try {
      await feedbackApi.submitFeedback({
        category,
        message,
        email,
      });
      resetForm();
      setStatus("Thanks for the feedback. It has been sent anonymously.");
    } catch (error) {
      setStatus(
        error.response?.data?.message || "Unable to send feedback right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const shellClass =
    theme === "dark"
      ? "bg-[#120a21] border-[#2e1a47] text-slate-200"
      : "bg-white border-slate-200 text-slate-700";

  return (
    <>
      <button
        type="button"
        className="fixed bottom-5 right-5 z-[90] inline-flex items-center gap-2 rounded-full bg-[#8b5cf6] px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-2xl shadow-[#8b5cf6]/30 transition-all hover:bg-[#7c3aed]"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Send anonymous feedback"
      >
        <MessageCircleMore size={16} />
        Feedback
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-modal-title"
          aria-describedby="feedback-modal-description"
          onClick={() => setIsOpen(false)}
        >
          <div
            ref={dialogRef}
            className={`w-full max-w-lg rounded-3xl border p-5 shadow-2xl ${shellClass}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#8b5cf6]">
                  Anonymous
                </p>
                <h2
                  id="feedback-modal-title"
                  className={`mt-1 text-2xl font-['Fraunces'] font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                >
                  Send Feedback
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full p-2 text-current transition-all hover:bg-black/5"
                aria-label="Close feedback form"
              >
                <X size={18} />
              </button>
            </div>

            <p
              id="feedback-modal-description"
              className="mt-3 text-sm opacity-75"
            >
              Share a bug, suggestion, or praise. No login is required, and your
              submission is stored anonymously.
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest opacity-60">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#8b5cf6] ${theme === "dark" ? "bg-black/40 border-[#2e1a47] text-white" : "bg-white border-slate-200 text-slate-900"}`}
                >
                  {categories.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest opacity-60">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className={`min-h-[120px] w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#8b5cf6] ${theme === "dark" ? "bg-black/40 border-[#2e1a47] text-white" : "bg-white border-slate-200 text-slate-900"}`}
                  placeholder="Tell us what you noticed or what would make the platform better."
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-[10px] font-black uppercase tracking-widest opacity-60">
                  Email <span className="opacity-50">(optional)</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-[#8b5cf6] ${theme === "dark" ? "bg-black/40 border-[#2e1a47] text-white" : "bg-white border-slate-200 text-slate-900"}`}
                  placeholder="you@example.com"
                />
              </div>

              {status && (
                <p className="rounded-xl border border-[#8b5cf6]/20 bg-[#8b5cf6]/10 px-4 py-3 text-sm text-[#8b5cf6]">
                  {status}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={`rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest ${theme === "dark" ? "border-white/10 text-slate-200 hover:bg-white/5" : "border-slate-200 text-slate-600 hover:bg-slate-100"}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#8b5cf6] px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-[#7c3aed] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default FeedbackButton;
