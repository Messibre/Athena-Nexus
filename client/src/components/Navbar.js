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

  const linkClass =
    "text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white";

  return (
    <nav>
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <Link
          to="/"
          className="text-black font-black tracking-tighter  dark:text-white"
        >
          Athena Nexus
        </Link>

        <div className="flex items-center gap-6">
          <div className="hidden items-center gap-6 md:flex">
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

          <button
            onClick={() => dispatch(toggleTheme())}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-xs font-bold uppercase transition-all hover:bg-neutral-100 dark:border-neutral-800 dark:hover:bg-neutral-900"
            title={
              theme === "light" ? "Switch to dark mode" : "Switch to light mode"
            }
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden text-sm font-bold md:block"
                >
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="hidden text-sm font-bold md:block"
                  >
                    Admin
                  </Link>
                )}
                <span className="text-sm font-medium text-neutral-500">
                  {user?.displayName || user?.username}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-bold transition-all hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-bold text-white transition-all hover:bg-black dark:bg-white dark:text-black dark:hover:bg-neutral-200"
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
