import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Menu, Moon, SunMedium, X, ArrowLeft } from "lucide-react";
import { logoutSession } from "../redux/thunks/authThunks";
import { toggleTheme } from "../redux/slices/themeSlice";
import {
  selectUser,
  selectIsAuthenticated,
  selectIsAdmin,
} from "../redux/selectors/authSelectors";
import { selectTheme } from "../redux/selectors/themeSelectors";

const Navbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const theme = useSelector(selectTheme);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isHomePage = location.pathname === "/";

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    try {
      await dispatch(logoutSession());
    } finally {
      navigate("/login");
    }
  };

  // Consistent Bold Silver / High Contrast Link Classes
  const linkClass =
    "text-xs font-black uppercase tracking-widest text-white transition-all hover:text-neutral-300 drop-shadow-md";

  const mobileDrawerLinkClass =
    "block w-full rounded-xl px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-100 transition-all hover:bg-white/10 hover:text-white";

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleBack = () => {
    const mobileBackEvent = new Event("app:mobile-back", {
      cancelable: true,
    });
    const wasHandledByPage = !window.dispatchEvent(mobileBackEvent);

    if (wasHandledByPage) {
      return;
    }

    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/");
  };

  return (
    <>
      <nav className="sticky top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/10 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2 md:gap-3">
            {!isHomePage && (
              <button
                onClick={handleBack}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white transition-all hover:bg-white hover:text-black"
                aria-label="Go back"
              >
                <ArrowLeft size={16} />
              </button>
            )}

            <Link
              to="/"
              className="text-xl md:text-2xl font-black tracking-tighter text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
              onClick={closeMobileMenu}
            >
              Athena{" "}
              <span className="bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent">
                Nexus
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-8">
            <div className="hidden items-center gap-8 md:flex">
              <Link to="/" className={linkClass}>
                Home
              </Link>
              <Link to="/challenges" className={linkClass}>
                Challenges
              </Link>
              <Link to="/milestones" className={linkClass}>
                Milestones
              </Link>
              <Link to="/gallery" className={linkClass}>
                Gallery
              </Link>
              <Link to="/about" className={linkClass}>
                About
              </Link>
            </div>

            <div className="h-6 w-[1px] bg-white/20 hidden md:block" />

            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch(toggleTheme())}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white hover:text-black"
                aria-label={
                  theme === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"
                }
              >
                {theme === "light" ? (
                  <Moon size={16} />
                ) : (
                  <SunMedium size={16} />
                )}
              </button>

              <button
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="md:hidden flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white hover:text-black"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>

            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <div className="hidden items-center gap-6 md:flex">
                    <Link to="/dashboard" className={linkClass}>
                      Dashboard
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className={`${linkClass} text-primary brightness-125`}
                      >
                        Admin
                      </Link>
                    )}
                  </div>

                  <span className="hidden sm:inline text-xs font-bold text-neutral-300">
                    {user?.displayName || user?.username}
                  </span>

                  <button
                    onClick={handleLogout}
                    className="hidden md:inline rounded-full bg-gradient-to-b from-white to-neutral-400 px-6 py-2 text-xs font-black uppercase text-black shadow-lg transition-all hover:scale-105"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="rounded-full bg-gradient-to-b from-white to-neutral-400 px-8 py-2.5 text-xs font-black uppercase text-black shadow-lg transition-all hover:scale-105"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[70]">
          <button
            className="absolute inset-0 bg-black/75"
            onClick={closeMobileMenu}
            aria-label="Close menu overlay"
          />

          <aside className="absolute inset-0 bg-[#120a21]/96 backdrop-blur-xl overflow-y-auto px-5 pt-20 pb-8">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8b5cf6]">
                Navigation
              </p>
              <button
                onClick={closeMobileMenu}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 text-white"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            </div>

            <nav className="space-y-2 rounded-2xl border border-white/10 bg-black/25 p-3">
              <Link
                to="/"
                className={mobileDrawerLinkClass}
                onClick={closeMobileMenu}
              >
                Home
              </Link>
              <Link
                to="/challenges"
                className={mobileDrawerLinkClass}
                onClick={closeMobileMenu}
              >
                Challenges
              </Link>
              <Link
                to="/milestones"
                className={mobileDrawerLinkClass}
                onClick={closeMobileMenu}
              >
                Milestones
              </Link>
              <Link
                to="/gallery"
                className={mobileDrawerLinkClass}
                onClick={closeMobileMenu}
              >
                Gallery
              </Link>
              <Link
                to="/about"
                className={mobileDrawerLinkClass}
                onClick={closeMobileMenu}
              >
                About
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    className={mobileDrawerLinkClass}
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/settings"
                    className={mobileDrawerLinkClass}
                    onClick={closeMobileMenu}
                  >
                    Settings
                  </Link>
                  <Link
                    to="/submit"
                    className={mobileDrawerLinkClass}
                    onClick={closeMobileMenu}
                  >
                    Submit
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={mobileDrawerLinkClass}
                      onClick={closeMobileMenu}
                    >
                      Admin
                    </Link>
                  )}
                </>
              )}
            </nav>

            <div className="mt-8 pt-6 border-t border-white/10">
              {isAuthenticated ? (
                <>
                  <p className="text-xs font-bold text-slate-300 mb-3">
                    {user?.displayName || user?.username}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-xl border border-white/40 bg-transparent px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition-all hover:bg-white hover:text-black"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMobileMenu}
                  className="block w-full text-center rounded-xl bg-gradient-to-b from-white to-neutral-400 px-4 py-3 text-xs font-black uppercase text-black shadow-lg"
                >
                  Login
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Navbar;
