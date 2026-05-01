import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Github, LogIn, Chrome } from "lucide-react";
import { login } from "../redux/thunks/authThunks";
import Navbar from "../components/Navbar";
import MiniModal from "../components/MiniModal";
import { selectAuthActionLoading } from "../redux/selectors/authSelectors";
import { selectTheme } from "../redux/selectors/themeSelectors";

const LAST_ROUTE_KEY = "lastRoute.v1";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [modalState, setModalState] = useState({
    open: false,
    title: "Error",
    message: "",
  });
  const dispatch = useDispatch();
  const actionLoading = useSelector(selectAuthActionLoading);
  const theme = useSelector(selectTheme);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      setModalState({
        open: true,
        title: "Login Error",
        message: error,
      });
    }
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      await dispatch(login({ username, password })).unwrap();
      const lastRoute = localStorage.getItem(LAST_ROUTE_KEY);
      navigate(lastRoute || "/dashboard");
    } catch (err) {
      setError(err || "Login failed");
    }
  };

  const handleOAuthLogin = async (provider) => {
    setError("");

    const returnTo = localStorage.getItem(LAST_ROUTE_KEY) || "/dashboard";
    const apiBase = process.env.REACT_APP_API_URL || "";
    window.location.href = `${apiBase}/api/auth/oauth/${provider}/start?returnTo=${encodeURIComponent(returnTo)}`;
  };

  return (
    <div
      data-theme={theme}
      className={`min-h-screen font-['Manrope'] ${theme === "dark" ? "bg-[#0a0514] text-slate-300" : "bg-slate-50 text-slate-700"}`}
    >
      <Navbar />

      <div
        className="bg-image-layer"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          backgroundImage: 'url("/pur1.jpg")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: theme === "dark" ? 0.4 : 0.85,
          pointerEvents: "none",
        }}
      />

      <div className="relative z-10 max-w-md mx-auto px-4 pt-20 md:pt-24 pb-20">
        <div
          className={`rounded-3xl border p-8 md:p-10 shadow-2xl ${theme === "dark" ? "bg-[#120a21]/85 border-[#2e1a47]" : "bg-white/90 border-slate-200"}`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#8b5cf6] text-center mb-3">
            Athena Nexus
          </p>
          <h2
            className={`text-center text-3xl md:text-4xl font-['Fraunces'] font-black tracking-tight mb-3 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
          >
            Login
          </h2>
          <p className="text-center opacity-70 mb-6 text-sm">
            Continue your team journey.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={() => handleOAuthLogin("google")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-900 transition-all hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
            >
              <Chrome size={15} /> Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthLogin("github")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-slate-900 transition-all hover:border-[#8b5cf6] hover:text-[#8b5cf6]"
            >
              <Github size={15} /> GitHub
            </button>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-[10px] font-black uppercase tracking-[0.35em] opacity-50">
              or login with username
            </span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="text-[11px] font-black uppercase tracking-widest opacity-60 block mb-2">
                Username
              </label>
              <input
                type="text"
                className={`w-full p-4 rounded-xl border outline-none transition-all ${
                  theme === "dark"
                    ? "bg-black/30 border-[#2e1a47] text-white focus:border-[#8b5cf6]"
                    : "bg-white border-slate-200 text-slate-900 focus:border-[#8b5cf6]"
                }`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Enter your username"
              />
            </div>

            <div className="form-group">
              <label className="text-[11px] font-black uppercase tracking-widest opacity-60 block mb-2">
                Password
              </label>
              <input
                type="password"
                className={`w-full p-4 rounded-xl border outline-none transition-all ${
                  theme === "dark"
                    ? "bg-black/30 border-[#2e1a47] text-white focus:border-[#8b5cf6]"
                    : "bg-white border-slate-200 text-slate-900 focus:border-[#8b5cf6]"
                }`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#8b5cf6]/30 inline-flex items-center justify-center gap-2"
              disabled={actionLoading}
            >
              <LogIn size={15} />
              {actionLoading ? "Logging in..." : "Login"}
            </button>
          </form>

          <div
            className={`mt-6 pt-6 border-t text-center ${theme === "dark" ? "border-[#2e1a47]" : "border-slate-200"}`}
          >
            <p className="opacity-70">
              Don't have an account?{" "}
              <Link to="/signup" className="text-[#8b5cf6] font-bold">
                Register your team
              </Link>
            </p>
            <div className="mt-4 flex items-center justify-center gap-3 text-[11px] opacity-70">
              <Link
                to="/privacy"
                className="hover:text-[#8b5cf6] transition-colors"
              >
                Privacy Policy
              </Link>
              <span aria-hidden="true">•</span>
              <Link
                to="/terms"
                className="hover:text-[#8b5cf6] transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>

      <MiniModal
        open={modalState.open}
        title={modalState.title}
        message={modalState.message}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

export default Login;
