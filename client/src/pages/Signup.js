import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { signup } from "../redux/thunks/authThunks";
import Navbar from "../components/Navbar";
import { selectAuthActionLoading } from "../redux/selectors/authSelectors";
import { selectTheme } from "../redux/selectors/themeSelectors";

const Signup = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    email: "",
    members: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const actionLoading = useSelector(selectAuthActionLoading);
  const theme = useSelector(selectTheme);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    const hasLetter = /[A-Za-z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);
    if (!hasLetter || !hasNumber) {
      setError("Password must contain both letters and numbers");
      return;
    }

    try {
      await dispatch(
        signup({
          username: formData.username,
          password: formData.password,
          displayName: formData.displayName || formData.username,
          email: formData.email,
          members: formData.members,
        }),
      ).unwrap();
      navigate("/dashboard");
    } catch (err) {
      setError(err || "Failed to create account");
    }
  };

  return (
    <div
      data-theme={theme}
      className={`min-h-screen font-['Space_Grotesk'] ${theme === "dark" ? "bg-[#0a0514] text-slate-300" : "bg-slate-50 text-slate-700"}`}
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

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-14 md:pt-16 pb-20">
        <div
          className={`rounded-3xl border p-8 md:p-10 shadow-2xl ${theme === "dark" ? "bg-[#120a21]/85 border-[#2e1a47]" : "bg-white/90 border-slate-200"}`}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#8b5cf6] text-center mb-3">
            Athena Nexus
          </p>
          <h2
            className={`text-4xl md:text-5xl font-['Fraunces'] font-black tracking-tight text-center mb-3 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
          >
            Register Your Team
          </h2>

          <p className="text-center opacity-70 mb-6">
            Create an account for your team of 3 members
          </p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="text-[11px] font-black uppercase tracking-widest opacity-60 block mb-2">
                Group Username *
              </label>
              <input
                type="text"
                name="username"
                className={`w-full p-4 rounded-xl border outline-none transition-all ${
                  theme === "dark"
                    ? "bg-black/30 border-[#2e1a47] text-white focus:border-[#8b5cf6]"
                    : "bg-white border-slate-200 text-slate-900 focus:border-[#8b5cf6]"
                }`}
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Choose a unique username"
              />
              <small className="opacity-60 text-xs">
                This will be your login username
              </small>
            </div>

            <div className="form-group">
              <label className="text-[11px] font-black uppercase tracking-widest opacity-60 block mb-2">
                Display Name
              </label>
              <input
                type="text"
                name="displayName"
                className={`w-full p-4 rounded-xl border outline-none transition-all ${
                  theme === "dark"
                    ? "bg-black/30 border-[#2e1a47] text-white focus:border-[#8b5cf6]"
                    : "bg-white border-slate-200 text-slate-900 focus:border-[#8b5cf6]"
                }`}
                value={formData.displayName}
                onChange={handleChange}
                placeholder="Your team's display name (optional)"
              />
            </div>

            <div className="form-group">
              <label className="text-[11px] font-black uppercase tracking-widest opacity-60 block mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                className={`w-full p-4 rounded-xl border outline-none transition-all ${
                  theme === "dark"
                    ? "bg-black/30 border-[#2e1a47] text-white focus:border-[#8b5cf6]"
                    : "bg-white border-slate-200 text-slate-900 focus:border-[#8b5cf6]"
                }`}
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="At least 8 characters, letters + numbers"
              />
              <small className="opacity-60 text-xs">
                8+ characters, must include letters and numbers
              </small>
            </div>

            <div className="form-group">
              <label className="text-[11px] font-black uppercase tracking-widest opacity-60 block mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                className={`w-full p-4 rounded-xl border outline-none transition-all ${
                  theme === "dark"
                    ? "bg-black/30 border-[#2e1a47] text-white focus:border-[#8b5cf6]"
                    : "bg-white border-slate-200 text-slate-900 focus:border-[#8b5cf6]"
                }`}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Re-enter your password"
              />
            </div>

            <div className="form-group">
              <label className="text-[11px] font-black uppercase tracking-widest opacity-60 block mb-2">
                Contact Email
              </label>
              <input
                type="email"
                name="email"
                className={`w-full p-4 rounded-xl border outline-none transition-all ${
                  theme === "dark"
                    ? "bg-black/30 border-[#2e1a47] text-white focus:border-[#8b5cf6]"
                    : "bg-white border-slate-200 text-slate-900 focus:border-[#8b5cf6]"
                }`}
                value={formData.email}
                onChange={handleChange}
                placeholder="team@example.com (optional)"
              />
            </div>

            <div className="form-group">
              <label className="text-[11px] font-black uppercase tracking-widest opacity-60 block mb-2">
                Team Members
              </label>
              <input
                type="text"
                name="members"
                className={`w-full p-4 rounded-xl border outline-none transition-all ${
                  theme === "dark"
                    ? "bg-black/30 border-[#2e1a47] text-white focus:border-[#8b5cf6]"
                    : "bg-white border-slate-200 text-slate-900 focus:border-[#8b5cf6]"
                }`}
                value={formData.members}
                onChange={handleChange}
                placeholder="Member 1, Member 2, Member 3 (optional)"
              />
              <small className="opacity-60 text-xs">
                Separate names with commas
              </small>
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-black uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#8b5cf6]/30"
              disabled={actionLoading}
            >
              {actionLoading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <div
            className={`mt-6 pt-6 text-center border-t ${theme === "dark" ? "border-[#2e1a47]" : "border-slate-200"}`}
          >
            <p className="opacity-70">
              Already have an account?{" "}
              <Link to="/login" className="text-[#8b5cf6] font-bold">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
