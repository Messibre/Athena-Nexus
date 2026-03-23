import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const CONSENT_KEY = "cookieConsent.v1";

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const acceptConsent = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[120] mx-auto max-w-4xl rounded-2xl border border-white/20 bg-[#120a21]/95 p-4 text-slate-100 shadow-2xl backdrop-blur-md">
      <p className="text-sm leading-relaxed">
        We use essential cookies to keep login and security features working. By
        continuing, you agree to our{" "}
        <Link to="/privacy" className="font-bold text-[#a78bfa] underline">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link to="/terms" className="font-bold text-[#a78bfa] underline">
          Terms of Service
        </Link>
        .
      </p>
      <div className="mt-3 flex justify-end">
        <button
          onClick={acceptConsent}
          className="rounded-xl bg-[#8b5cf6] px-4 py-2 text-xs font-black uppercase tracking-wider text-white hover:bg-[#7c3aed]"
        >
          Accept
        </button>
      </div>
    </div>
  );
};

export default CookieConsent;
