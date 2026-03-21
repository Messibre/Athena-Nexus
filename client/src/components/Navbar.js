import React from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { toggleTheme } from "../redux/slices/themeSlice";
import {
  selectUser,
  selectIsAuthenticated,
  selectIsAdmin,
} from "../redux/selectors/authSelectors";
import { selectTheme } from "../redux/selectors/themeSelectors";

const Navbar = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = useSelector(selectIsAdmin);
  const theme = useSelector(selectTheme);

  const handleLogout = () => {
    dispatch(logout());
  };

  // Consistent Bold Silver / High Contrast Link Classes
  const linkClass =
    "text-sm font-black uppercase tracking-widest text-white transition-all hover:text-neutral-300 drop-shadow-md";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/10 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-6 py-5">
        <Link
          to="/"
          className="text-2xl font-black tracking-tighter text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
        >
          Athena{" "}
          <span className="bg-gradient-to-b from-white to-neutral-500 bg-clip-text text-transparent">
            Nexus
          </span>
        </Link>

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

          <button
            onClick={() => dispatch(toggleTheme())}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/50 bg-white/10 text-[10px] font-black uppercase text-white transition-all hover:bg-white hover:text-black"
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="hidden items-center gap-6 md:flex">
                  <Link to="/dashboard" className={linkClass}>
                    Dashboard
                  </Link>
                  {/* Added Admin Tab */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={`${linkClass} text-primary brightness-125`}
                    >
                      Admin
                    </Link>
                  )}
                </div>

                <span className="text-xs font-bold text-neutral-300">
                  {user?.displayName || user?.username}
                </span>

                <button
                  onClick={handleLogout}
                  className="rounded-full border-2 border-white bg-transparent px-6 py-2 text-xs font-black uppercase text-white transition-all hover:bg-white hover:text-black"
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
  );
};

export default Navbar;
